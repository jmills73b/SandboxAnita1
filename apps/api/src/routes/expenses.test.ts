import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  return `session=${token}`;
}

interface ExpenseRow {
  id: number;
  date: string;
  description: string;
  cost: number;
  category: string | null;
}

// Same hand-written D1 stand-in approach as the other route tests.
function fakeEnv(
  options: {
    listRows?: ExpenseRow[];
    existingExpense?: ExpenseRow | null;
    deleteChanges?: number;
  } = {},
): Env {
  const listRows = options.listRows ?? [];
  const existingExpense = options.existingExpense;
  const deleteChanges = options.deleteChanges ?? 1;

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
            if (sql.includes("INSERT INTO expenses")) {
              const [date, description, cost, category] = boundArgs;
              return { id: 1, date, description, cost, category: category ?? null } as T;
            }
            if (sql.startsWith("SELECT id, date")) {
              return (existingExpense ?? null) as T;
            }
            if (sql.includes("UPDATE expenses")) {
              const [date, description, cost, category, id] = boundArgs;
              return { id, date, description, cost, category } as T;
            }
            return null;
          },
          all: async <T,>() => ({ results: listRows as T[], success: true, meta: {} }),
          run: async () => ({ success: true, meta: { changes: deleteChanges } }),
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/expenses", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/expenses", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists expenses", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      { headers: { Cookie: cookie } },
      fakeEnv({ listRows: [{ id: 1, date: "2026-06-01", description: "Printer paper", cost: 12.5, category: "Stationery & Postage" }] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 1, date: "2026-06-01", description: "Printer paper", cost: 12.5, category: "Stationery & Postage" }]);
  });
});

describe("POST /api/expenses", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/expenses", { method: "POST" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("rejects a missing description", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ date: "2026-06-01", cost: 10 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a £0 cost", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ date: "2026-06-01", description: "Stamps", cost: 0 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-06-01", description: "Stamps", cost: 5, category: "Groceries" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates an expense without a category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ date: "2026-06-01", description: "Stamps", cost: 5 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ id: 1, date: "2026-06-01", description: "Stamps", cost: 5, category: null });
  });

  it("creates an expense with a preset category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-06-01", description: "Zoom subscription", cost: 15.99, category: "Subscriptions" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.category).toBe("Subscriptions");
  });
});

describe("PATCH /api/expenses/:id", () => {
  const EXISTING: ExpenseRow = { id: 1, date: "2026-06-01", description: "Stamps", cost: 5, category: null };

  it("rejects a request with no session", async () => {
    const res = await app.request("/api/expenses/1", { method: "PATCH" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("404s when the expense doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses/99",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ cost: 10 }) },
      fakeEnv({ existingExpense: null }),
    );
    expect(res.status).toBe(404);
  });

  it("updates the cost and category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses/1",
      {
        method: "PATCH",
        headers: { Cookie: cookie },
        body: JSON.stringify({ cost: 7.5, category: "Travel" }),
      },
      fakeEnv({ existingExpense: EXISTING }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cost).toBe(7.5);
    expect(body.category).toBe("Travel");
    expect(body.description).toBe("Stamps");
  });
});

describe("DELETE /api/expenses/:id", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/expenses/1", { method: "DELETE" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("404s when the expense doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses/1",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ deleteChanges: 0 }),
    );
    expect(res.status).toBe(404);
  });

  it("deletes the expense", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/expenses/1", { method: "DELETE", headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
