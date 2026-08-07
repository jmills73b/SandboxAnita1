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
  days_of_week?: string | null;
  next_due_date: string;
  due_time?: string;
  status: string;
  completed_at?: string | null;
  created_at: string;
  client_id?: number | null;
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
    clients?: Map<number, string>;
  } = {},
): Env {
  const taskStore = new Map<number, StoredTask>(
    (options.tasks ?? []).map((t) => [t.id, { client_id: null, due_time: "09:30", days_of_week: null, completed_at: null, ...t }]),
  );
  const occurrenceStore = new Map<number, StoredOccurrence>((options.occurrences ?? []).map((o) => [o.id, o]));
  const clients = options.clients ?? new Map([[1, "Test Client"]]);
  let nextTaskId = Math.max(0, ...[...taskStore.keys()]) + 1;
  let nextOccurrenceId = Math.max(0, ...[...occurrenceStore.keys()]) + 1;

  function withClientName(task: StoredTask) {
    return { ...task, client_name: task.client_id != null ? (clients.get(task.client_id) ?? null) : null };
  }

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
              const [title, description, frequency, daysOfWeek, nextDueDateValue, dueTime, clientId] = boundArgs as [
                string,
                string | null,
                string,
                string | null,
                string,
                string,
                number | null,
              ];
              const id = nextTaskId++;
              const row: StoredTask = {
                id,
                title,
                description,
                frequency,
                days_of_week: daysOfWeek,
                next_due_date: nextDueDateValue,
                due_time: dueTime,
                status: "active",
                completed_at: null,
                created_at: "2026-08-06T00:00:00Z",
                client_id: clientId,
              };
              taskStore.set(id, row);
              return { id } as T;
            }
            if (sql.includes("WHERE tasks.id = ?")) {
              const [id] = boundArgs as [number];
              const row = taskStore.get(id);
              return (row ? withClientName(row) : null) as T;
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
              const statusOrder: Record<string, number> = { active: 0, paused: 1, done: 2 };
              const rows = [...taskStore.values()]
                .sort(
                  (a, b) =>
                    statusOrder[a.status] - statusOrder[b.status] ||
                    a.next_due_date.localeCompare(b.next_due_date) ||
                    a.id - b.id,
                )
                .map(withClientName);
              return { results: rows as T[], success: true, meta: {} };
            }
            return { results: [] as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE tasks SET title = ?")) {
              const [title, description, frequency, daysOfWeek, nextDueDateValue, dueTime, status, clientId, id] =
                boundArgs as [string, string | null, string, string | null, string, string, string, number | null, number];
              const existing = taskStore.get(id);
              if (existing) {
                taskStore.set(id, {
                  ...existing,
                  title,
                  description,
                  frequency,
                  days_of_week: daysOfWeek,
                  next_due_date: nextDueDateValue,
                  due_time: dueTime,
                  status,
                  client_id: clientId,
                });
              }
            } else if (sql.includes("INSERT INTO task_occurrences")) {
              const [taskId, dueDate, action] = boundArgs as [number, string, string];
              const id = nextOccurrenceId++;
              occurrenceStore.set(id, { id, task_id: taskId, due_date: dueDate, action, acted_at: "2026-08-06T00:00:00Z" });
            } else if (sql.includes("status = 'done'")) {
              const [id] = boundArgs as [number];
              const existing = taskStore.get(id);
              if (existing) taskStore.set(id, { ...existing, status: "done", completed_at: "2026-08-06T00:00:00Z" });
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

  it("lists tasks, active ones before paused before done, soonest due first", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      { headers: { Cookie: cookie } },
      fakeEnv({
        tasks: [
          { id: 1, title: "Paused reminder", description: null, frequency: "monthly", next_due_date: "2026-08-01", status: "paused", created_at: "2026-01-01" },
          { id: 2, title: "Quarterly VAT check", description: null, frequency: "quarterly", next_due_date: "2026-09-01", status: "active", created_at: "2026-01-01" },
          { id: 3, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" },
          { id: 4, title: "Renew insurance", description: null, frequency: "once", next_due_date: "2026-07-01", status: "done", created_at: "2026-01-01" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((t: { title: string }) => t.title)).toEqual([
      "Weekly timesheet chase",
      "Quarterly VAT check",
      "Paused reminder",
      "Renew insurance",
    ]);
    expect(body[0].nextDueDate).toBe("2026-08-10");
    expect(body[2].status).toBe("paused");
    expect(body[3].status).toBe("done");
  });

  it("includes the linked client's name for a client-linked task, and nulls for an unlinked one", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      { headers: { Cookie: cookie } },
      fakeEnv({
        clients: new Map([[1, "Jane Roe"]]),
        tasks: [
          { id: 1, title: "Follow up with Jane Roe", description: null, frequency: "once", next_due_date: "2026-08-13", status: "active", created_at: "2026-01-01", client_id: 1 },
          { id: 2, title: "Renew PI insurance", description: null, frequency: "once", next_due_date: "2026-09-01", status: "active", created_at: "2026-01-01" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.find((t: { id: number }) => t.id === 1)).toMatchObject({ clientId: 1, clientName: "Jane Roe" });
    expect(body.find((t: { id: number }) => t.id === 2)).toMatchObject({ clientId: null, clientName: null });
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
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
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
        body: JSON.stringify({ title: "Renew insurance", frequency: "biweekly", nextDueDate: "2026-09-01" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("accepts the daily, fortnightly, and four_weekly frequencies", async () => {
    const cookie = await sessionCookie();
    for (const frequency of ["daily", "fortnightly", "four_weekly"]) {
      const res = await app.request(
        "/api/tasks",
        {
          method: "POST",
          headers: { Cookie: cookie },
          body: JSON.stringify({ title: "Check something", frequency, nextDueDate: "2026-09-01" }),
        },
        fakeEnv(),
      );
      expect(res.status).toBe(201);
      expect((await res.json()).frequency).toBe(frequency);
    }
  });

  it("creates a task, starting active with no completedAt", async () => {
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
    expect(body).toMatchObject({
      title: "Renew insurance",
      frequency: "yearly",
      nextDueDate: "2027-01-01",
      status: "active",
      completedAt: null,
      daysOfWeek: null,
    });
    expect(body.occurrences).toEqual([]);
  });

  it("accepts daysOfWeek for a daily reminder", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Water the plants", frequency: "daily", daysOfWeek: [6, 0], nextDueDate: "2026-08-08" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).daysOfWeek).toEqual([0, 6]);
  });

  it("rejects daysOfWeek on a non-daily frequency", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Check something", frequency: "weekly", daysOfWeek: [4], nextDueDate: "2026-08-06" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an out-of-range day of week", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Check something", frequency: "daily", daysOfWeek: [7], nextDueDate: "2026-08-06" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("defaults dueTime to 09:30 when none is given", async () => {
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
    expect((await res.json()).dueTime).toBe("09:30");
  });

  it("accepts a custom dueTime", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Renew insurance", frequency: "yearly", nextDueDate: "2027-01-01", dueTime: "14:00" }),
      },
      fakeEnv(),
    );
    expect((await res.json()).dueTime).toBe("14:00");
  });

  it("rejects an invalid dueTime", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Renew insurance", frequency: "yearly", nextDueDate: "2027-01-01", dueTime: "9:30am" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("links a follow-up task to a client and returns the client's name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ title: "Follow up with Jane Roe", frequency: "once", nextDueDate: "2026-08-13", clientId: 1 }),
      },
      fakeEnv({ clients: new Map([[1, "Jane Roe"]]) }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.clientId).toBe(1);
    expect(body.clientName).toBe("Jane Roe");
  });
});

describe("PATCH /api/tasks/:id", () => {
  it("404s when the task doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/99",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "paused" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("pauses a task without requiring an action", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "paused" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("paused");
  });

  it("rejects setting status to 'done' directly — that's only reached via an action", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "done" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("manually overrides the next due date", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ nextDueDate: "2026-12-25" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).nextDueDate).toBe("2026-12-25");
  });

  it("updates the due time", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ dueTime: "16:15" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).dueTime).toBe("16:15");
  });

  it("rejects an invalid due time", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ dueTime: "not-a-time" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("updates daysOfWeek on a daily reminder", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ daysOfWeek: [1, 2, 3, 4, 5] }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Check the post", description: null, frequency: "daily", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).daysOfWeek).toEqual([1, 2, 3, 4, 5]);
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
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
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
        tasks: [{ id: 1, title: "Weekly timesheet chase", description: null, frequency: "weekly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.nextDueDate).toBe("2026-08-17");
    expect(body.dueTime).toBe("09:30");
    expect(body.status).toBe("active");
    expect(body.occurrences).toEqual([{ id: 1, dueDate: "2026-08-10", action: "completed", actedAt: "2026-08-06T00:00:00Z" }]);
  });

  it("advances next_due_date by 14 days for a fortnightly task", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "completed" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Fortnightly stock check", description: null, frequency: "fortnightly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).nextDueDate).toBe("2026-08-24");
  });

  it("skips non-selected weekdays for a weekend-only daily task", async () => {
    const cookie = await sessionCookie();
    // 2026-08-09 is a Sunday; the next Saturday is 2026-08-15.
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "completed" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Water the plants", description: null, frequency: "daily", days_of_week: "0,6", next_due_date: "2026-08-09", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).nextDueDate).toBe("2026-08-15");
  });

  it("treats 'not needed' the same as skipped for scheduling — it still advances", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "not_needed" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Quarterly VAT check", description: null, frequency: "quarterly", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.nextDueDate).toBe("2026-11-10");
    expect(body.status).toBe("active");
  });

  it("marks a 'once' task done (not paused) instead of scheduling a next occurrence", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tasks/1/actions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ action: "completed" }) },
      fakeEnv({
        tasks: [{ id: 1, title: "Renew insurance", description: null, frequency: "once", next_due_date: "2026-08-10", status: "active", created_at: "2026-01-01" }],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("done");
    expect(body.completedAt).not.toBeNull();
    expect(body.nextDueDate).toBe("2026-08-10");
  });
});
