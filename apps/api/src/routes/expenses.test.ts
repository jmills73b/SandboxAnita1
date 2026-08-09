import { describe, expect, it } from "vitest";
import { createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  return `session=${token}`;
}

interface StoredExpense {
  id: number;
  date: string;
  description: string;
  cost: number;
  category_id: number | null;
}

// A small stateful D1 stand-in — real enough to exercise the join-based
// category lookups (categoryExists, fetchExpense) rather than hand-coding
// every SQL branch's response, since expenses.ts now round-trips through
// the database after every write instead of using RETURNING alone.
function fakeEnv(
  options: {
    categories?: Map<number, string>;
    expenses?: StoredExpense[];
    deleteChanges?: number;
  } = {},
): Env {
  const categories = options.categories ?? new Map([[1, "Subscriptions"], [2, "Travel"]]);
  const expensesStore = new Map<number, StoredExpense>((options.expenses ?? []).map((e) => [e.id, e]));
  const deleteChanges = options.deleteChanges ?? 1;
  let nextId = Math.max(0, ...[...expensesStore.keys()]) + 1;

  function withCategoryName(row: StoredExpense) {
    return {
      id: row.id,
      date: row.date,
      description: row.description,
      cost: row.cost,
      category_id: row.category_id,
      category_name: row.category_id !== null ? (categories.get(row.category_id) ?? null) : null,
    };
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
            if (sql.includes("FROM expense_categories WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return categories.has(id) ? ({ id } as T) : null;
            }
            if (sql.includes("INSERT INTO expenses")) {
              const [date, description, cost, categoryId] = boundArgs as [string, string, number, number | null];
              const id = nextId++;
              expensesStore.set(id, { id, date, description, cost, category_id: categoryId });
              return { id } as T;
            }
            if (sql.includes("LEFT JOIN expense_categories") && sql.includes("WHERE expenses.id = ?")) {
              const [id] = boundArgs as [number];
              const row = expensesStore.get(id);
              return (row ? withCategoryName(row) : null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            if (sql.includes("LEFT JOIN expense_categories")) {
              const rows = [...expensesStore.values()]
                .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                .map(withCategoryName);
              return { results: rows as T[], success: true, meta: {} };
            }
            return { results: [] as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE expenses SET")) {
              const [date, description, cost, categoryId, id] = boundArgs as [string, string, number, number | null, number];
              const existing = expensesStore.get(id);
              if (existing) expensesStore.set(id, { ...existing, date, description, cost, category_id: categoryId });
            }
            if (sql.includes("DELETE FROM expenses")) {
              const [id] = boundArgs as [number];
              expensesStore.delete(id);
            }
            return { success: true, meta: { changes: deleteChanges } };
          },
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

  it("lists expenses with their category name resolved", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      { headers: { Cookie: cookie } },
      fakeEnv({ expenses: [{ id: 1, date: "2026-06-01", description: "Printer paper", cost: 12.5, category_id: 2 }] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      { id: 1, date: "2026-06-01", description: "Printer paper", cost: 12.5, categoryId: 2, category: "Travel" },
    ]);
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

  it("rejects a categoryId that doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-06-01", description: "Stamps", cost: 5, categoryId: 999 }),
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
    expect(body).toEqual({ id: 1, date: "2026-06-01", description: "Stamps", cost: 5, categoryId: null, category: null });
  });

  it("creates an expense with a valid category and resolves its name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-06-01", description: "Zoom subscription", cost: 15.99, categoryId: 1 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.categoryId).toBe(1);
    expect(body.category).toBe("Subscriptions");
  });
});

describe("PATCH /api/expenses/:id", () => {
  const EXISTING: StoredExpense = { id: 1, date: "2026-06-01", description: "Stamps", cost: 5, category_id: null };

  it("rejects a request with no session", async () => {
    const res = await app.request("/api/expenses/1", { method: "PATCH" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("404s when the expense doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses/99",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ cost: 10 }) },
      fakeEnv({ expenses: [] }),
    );
    expect(res.status).toBe(404);
  });

  it("updates the cost and category, resolving the new category's name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expenses/1",
      {
        method: "PATCH",
        headers: { Cookie: cookie },
        body: JSON.stringify({ cost: 7.5, categoryId: 2 }),
      },
      fakeEnv({ expenses: [EXISTING] }),
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
    const res = await app.request(
      "/api/expenses/1",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ expenses: [{ id: 1, date: "2026-06-01", description: "Stamps", cost: 5, category_id: null }] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
