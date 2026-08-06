import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

interface StoredTask {
  id: number;
  title: string;
  description: string | null;
  frequency: string;
  next_due_date: string;
  paused: number;
  created_at: string;
}

interface StoredOccurrence {
  id: number;
  task_id: number;
  due_date: string;
  action: string;
  acted_at: string;
}

function fakeEnv(
  options: {
    tasks?: StoredTask[];
    occurrences?: StoredOccurrence[];
  } = {},
): Env {
  const taskStore = new Map<number, StoredTask>((options.tasks ?? []).map((t) => [t.id, t]));
  const occurrenceStore = new Map<number, StoredOccurrence>((options.occurrences ?? []).map((o) => [o.id, o]));
  let nextTaskId = Math.max(0, ...[...taskStore.keys()]) + 1;
  let nextOccurrenceId = Math.max(0, ...[...occurrenceStore.keys()]) + 1;

  return {
    SESSION_SECRET: SECRET,
    DB: {
      prepare: (sql: string) => {
        let boundArgs: unknown[] = [];
        const statement = {
          bind: (...args: unknown[]) => {
            boundArgs = args;
            return statement;
          },
          first: async <T,>() => {
            if (sql.includes("INSERT INTO tasks")) {
              const [title, description, frequency, nextDueDateValue] = boundArgs as [
                string,
                string | null,
                string,
                string,
              ];
              const id = nextTaskId++;
              const row: StoredTask = {
                id,
                title,
                description,
                frequency,
                next_due_date: nextDueDateValue,
                paused: 0,
                created_at: "2026-08-06T00:00:00Z",
              };
              taskStore.set(id, row);
              return row as T;
            }
            if (sql.includes("FROM tasks WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (taskStore.get(id) ?? null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            if (sql.includes("FROM task_occurrences WHERE task_id = ?")) {
              const [taskId] = boundArgs as [number];
              const rows = [...occurrenceStore.values()].filter((o) => o.task_id === taskId).sort((a, b) => b.id - a.id);
              return { results: rows as T[], success: true, meta: {} };
            }
            if (sql.includes("FROM tasks")) {
              const rows = [...taskStore.values()].sort(
                (a, b) => a.paused - b.paused || a.next_due_date.localeCompare(b.next_due_date) || a.id - b.id,
              );
              return { results: rows as T[], success: true, meta: {} };
            }
            return { results: [] as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE tasks SET title = ?")) {
              const [title, description, frequency, nextDueDateValue, paused, id] = boundArgs as [
                string,
                string | null,
                string,
                string,
                number,
                number,
              ];
              const existing = taskStore.get(id);
              if (existing) {
                taskStore.set(id, {
                  ...existing,
                  title,
                  description,
                  frequency,
                  next_due_date: nextDueDateValue,
                  paused,
                });
              }
            } else if (sql.includes("INSERT INTO task_occurrences")) {
              const [taskId, dueDate, action] = boundArgs as [number, string, string];
              const id = nextOccurrenceId++;
              occurrenceStore.set(id, { id, task_id: taskId, due_date: dueDate, action, acted_at: "2026-08-06T00:00:00Z" });
            } else if (sql.includes("UPDATE tasks SET paused = 1")) {
              const [id] = boundArgs as [number];
              const existing = taskStore.get(id);
              if (existing) taskStore.set(id, { ...existing, paused: 1 });
            } else if (sql.includes("UPDATE tasks SET next_due_date = ?")) {
              const [newDueDate, id] = boundArgs as [string, number];
              const existing = taskStore.get(id);
              if (existing) taskStore.set(id, { ...existing, next_due_date: newDueDate });
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/tasks", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/tasks", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists tasks, active ones before paused, soonest due first", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      { headers: { Cookie: cookie } },
      fakeEnv({
        tasks: [
          { id: 1, title: "Paused reminder", description: null, frequency: "monthly", next_due_date: "2026-08-01", paused: 1, created_at: "2026-01-01" },
          { id: 2, title: "Quarterly VAT check", description: null, frequency: "quarterly", next_due_date: "2026-09-01", paused: 0, created_at: "2026-01-01" },
          { id: 3, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((t: { title: string }) => t.title)).toEqual([
      "Weekly timesheet chase",
      "Quarterly VAT check",
      "Paused reminder",
    ]);
    expect(body[0].nextDueDate).toBe("2026-08-10");
    expect(body[2].paused).toBe(true);
  });
});

describe("GET /api/tasks/:id", () => {
  it("404s when the task doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/tasks/99", { headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(404);
  });

  it("returns the task with its occurrence history, newest first", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { headers: { Cookie: cookie } },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" }],
        occurrences: [
          { id: 1, task_id: 1, due_date: "2026-07-27", action: "completed", acted_at: "2026-07-27T00:00:00Z" },
          { id: 2, task_id: 1, due_date: "2026-08-03", action: "skipped", acted_at: "2026-08-03T00:00:00Z" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.occurrences.map((o: { id: number }) => o.id)).toEqual([2, 1]);
  });
});

describe("POST /api/tasks", () => {
  it("rejects a missing frequency or due date", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ title: "Renew insurance" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid frequency", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Renew insurance", frequency: "daily", nextDueDate: "2026-09-01" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates a task", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Renew insurance", frequency: "yearly", nextDueDate: "2027-01-01" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ title: "Renew insurance", frequency: "yearly", nextDueDate: "2027-01-01", paused: false });
    expect(body.occurrences).toEqual([]);
  });
});

describe("PATCH /api/tasks/:id", () => {
  it("404s when the task doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/99",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ paused: true }) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("pauses a task without requiring an action", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ paused: true }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).paused).toBe(true);
  });

  it("manually overrides the next due date", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ nextDueDate: "2026-12-25" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).nextDueDate).toBe("2026-12-25");
  });
});

describe("POST /api/tasks/:id/actions", () => {
  it("404s when the task doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/99/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "completed" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("rejects an invalid action", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "ignored" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("advances next_due_date for a recurring task and logs the occurrence", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "completed" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.nextDueDate).toBe("2026-08-17");
    expect(body.paused).toBe(false);
    expect(body.occurrences).toEqual([{ id: 1, dueDate: "2026-08-10", action: "completed", actedAt: "2026-08-06T00:00:00Z" }]);
  });

  it("treats 'not needed' the same as skipped for scheduling — it still advances", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "not_needed" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Quarterly VAT check", description: null, frequency: "quarterly", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.nextDueDate).toBe("2026-11-10");
    expect(body.paused).toBe(false);
  });

  it("auto-pauses a 'once' task instead of scheduling a next occurrence", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "completed" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Renew insurance", description: null, frequency: "once", next_due_date: "2026-08-10", paused: 0, created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.paused).toBe(true);
    expect(body.nextDueDate).toBe("2026-08-10");
  });
});
