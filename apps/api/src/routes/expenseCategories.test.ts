import { describe, expect, it } from "vitest";
import { createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  return `session=${token}`;
}

interface StoredCategory {
  id: number;
  name: string;
  sort_order: number;
}

// Stateful stand-in covering categories AND the expenses they can be
// reassigned onto when deleted, since the delete flow's whole point is
// to mutate expense rows, not just the category table.
function fakeEnv(
  options: {
    categories?: StoredCategory[];
    expenseCategoryIds?: Record<number, number | null>; // expenseId -> categoryId
  } = {},
): Env {
  const categoryStore = new Map<number, StoredCategory>((options.categories ?? []).map((c) => [c.id, c]));
  const expenseCategoryIds = new Map<number, number | null>(
    Object.entries(options.expenseCategoryIds ?? {}).map(([k, v]) => [Number(k), v]),
  );
  let nextId = Math.max(0, ...[...categoryStore.keys()]) + 1;

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
            if (sql.includes("MAX(sort_order)")) {
              const max = Math.max(0, ...[...categoryStore.values()].map((c) => c.sort_order));
              return { maxOrder: categoryStore.size ? max : null } as T;
            }
            if (sql.includes("WHERE name = ? AND id != ?")) {
              const [name, id] = boundArgs as [string, number];
              const dup = [...categoryStore.values()].find((c) => c.name === name && c.id !== id);
              return (dup ? { id: dup.id } : null) as T;
            }
            if (sql.includes("WHERE name = ?")) {
              const [name] = boundArgs as [string];
              const dup = [...categoryStore.values()].find((c) => c.name === name);
              return (dup ? { id: dup.id } : null) as T;
            }
            if (sql.includes("INSERT INTO expense_categories")) {
              const [name, sortOrder] = boundArgs as [string, number];
              const id = nextId++;
              const row = { id, name, sort_order: sortOrder };
              categoryStore.set(id, row);
              return row as T;
            }
            if (sql.includes("UPDATE expense_categories SET name")) {
              const [name, id] = boundArgs as [string, number];
              const existing = categoryStore.get(id);
              if (!existing) return null as T;
              const updated = { ...existing, name };
              categoryStore.set(id, updated);
              return updated as T;
            }
            if (sql.includes("SELECT id FROM expense_categories WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (categoryStore.has(id) ? { id } : null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            const rows = [...categoryStore.values()].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
            return { results: rows as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE expenses SET category_id")) {
              const [reassignTo, deletedId] = boundArgs as [number | null, number];
              for (const [expenseId, categoryId] of expenseCategoryIds) {
                if (categoryId === deletedId) expenseCategoryIds.set(expenseId, reassignTo);
              }
            }
            if (sql.includes("DELETE FROM expense_categories")) {
              const [id] = boundArgs as [number];
              categoryStore.delete(id);
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/expense-categories", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/expense-categories", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists categories in sort order", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories",
      { headers: { Cookie: cookie } },
      fakeEnv({ categories: [{ id: 2, name: "Travel", sort_order: 2 }, { id: 1, name: "Subscriptions", sort_order: 1 }] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 1, name: "Subscriptions" }, { id: 2, name: "Travel" }]);
  });
});

describe("POST /api/expense-categories", () => {
  it("rejects an empty name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "  " }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Travel" }) },
      fakeEnv({ categories: [{ id: 1, name: "Travel", sort_order: 1 }] }),
    );
    expect(res.status).toBe(400);
  });

  it("creates a new category after the existing ones", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Insurance" }) },
      fakeEnv({ categories: [{ id: 1, name: "Travel", sort_order: 1 }] }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Insurance");
  });
});

describe("PATCH /api/expense-categories/:id (rename)", () => {
  it("renames a category without touching individual expenses", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Client Travel" }) },
      fakeEnv({ categories: [{ id: 1, name: "Travel", sort_order: 1 }] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: 1, name: "Client Travel" });
  });

  it("rejects renaming to a name that's already used", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Subscriptions" }) },
      fakeEnv({
        categories: [
          { id: 1, name: "Travel", sort_order: 1 },
          { id: 2, name: "Subscriptions", sort_order: 2 },
        ],
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/expense-categories/:id", () => {
  it("404s when the category doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories/99",
      { method: "DELETE", headers: { Cookie: cookie }, body: JSON.stringify({}) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("rejects reassigning a category's expenses to itself", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories/1",
      { method: "DELETE", headers: { Cookie: cookie }, body: JSON.stringify({ reassignToId: 1 }) },
      fakeEnv({ categories: [{ id: 1, name: "Travel", sort_order: 1 }] }),
    );
    expect(res.status).toBe(400);
  });

  it("deletes the category and reassigns its expenses to the chosen replacement", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories/1",
      { method: "DELETE", headers: { Cookie: cookie }, body: JSON.stringify({ reassignToId: 2 }) },
      fakeEnv({
        categories: [
          { id: 1, name: "Travel", sort_order: 1 },
          { id: 2, name: "Transport", sort_order: 2 },
        ],
        expenseCategoryIds: { 10: 1, 11: 1, 12: 2 },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("deletes the category and makes its expenses uncategorised when no replacement is given", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/expense-categories/1",
      { method: "DELETE", headers: { Cookie: cookie }, body: JSON.stringify({}) },
      fakeEnv({ categories: [{ id: 1, name: "Travel", sort_order: 1 }], expenseCategoryIds: { 10: 1 } }),
    );
    expect(res.status).toBe(200);
  });
});
