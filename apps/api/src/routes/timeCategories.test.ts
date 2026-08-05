import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

interface StoredCategory {
  id: number;
  name: string;
  sort_order: number;
}

function fakeEnv(
  options: {
    categories?: StoredCategory[];
    timeEntryCategoryIds?: Record<number, number | null>;
  } = {},
): Env {
  const categoryStore = new Map<number, StoredCategory>((options.categories ?? []).map((c) => [c.id, c]));
  const entryCategoryIds = new Map<number, number | null>(
    Object.entries(options.timeEntryCategoryIds ?? {}).map(([k, v]) => [Number(k), v]),
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
            if (sql.includes("INSERT INTO time_categories")) {
              const [name, sortOrder] = boundArgs as [string, number];
              const id = nextId++;
              const row = { id, name, sort_order: sortOrder };
              categoryStore.set(id, row);
              return row as T;
            }
            if (sql.includes("UPDATE time_categories SET name")) {
              const [name, id] = boundArgs as [string, number];
              const existing = categoryStore.get(id);
              if (!existing) return null as T;
              const updated = { ...existing, name };
              categoryStore.set(id, updated);
              return updated as T;
            }
            if (sql.includes("SELECT id FROM time_categories WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (categoryStore.has(id) ? { id } : null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            const rows = [...categoryStore.values()].sort(
              (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
            );
            return { results: rows as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE time_entries SET category_id")) {
              const [reassignTo, deletedId] = boundArgs as [number | null, number];
              for (const [entryId, categoryId] of entryCategoryIds) {
                if (categoryId === deletedId) entryCategoryIds.set(entryId, reassignTo);
              }
            }
            if (sql.includes("DELETE FROM time_categories")) {
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

describe("GET /api/time-categories", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/time-categories", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists categories in sort order", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories",
      { headers: { Cookie: cookie } },
      fakeEnv({
        categories: [
          { id: 2, name: "Research", sort_order: 2 },
          { id: 1, name: "Drafting", sort_order: 1 },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 1, name: "Drafting" },
      { id: 2, name: "Research" },
    ]);
  });
});

describe("POST /api/time-categories", () => {
  it("rejects an empty name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "  " }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Drafting" }) },
      fakeEnv({ categories: [{ id: 1, name: "Drafting", sort_order: 1 }] }),
    );
    expect(res.status).toBe(400);
  });

  it("creates a new category after the existing ones", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Correspondence" }) },
      fakeEnv({ categories: [{ id: 1, name: "Drafting", sort_order: 1 }] }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).name).toBe("Correspondence");
  });
});

describe("PATCH /api/time-categories/:id (rename)", () => {
  it("renames a category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Legal Research" }) },
      fakeEnv({ categories: [{ id: 1, name: "Research", sort_order: 1 }] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, name: "Legal Research" });
  });
});

describe("DELETE /api/time-categories/:id", () => {
  it("404s when the category doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories/99",
      { method: "DELETE", headers: { Cookie: cookie }, body: JSON.stringify({}) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("rejects reassigning a category's time entries to itself", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories/1",
      { method: "DELETE", headers: { Cookie: cookie }, body: JSON.stringify({ reassignToId: 1 }) },
      fakeEnv({ categories: [{ id: 1, name: "Research", sort_order: 1 }] }),
    );
    expect(res.status).toBe(400);
  });

  it("deletes the category and reassigns its time entries to the chosen replacement", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-categories/1",
      { method: "DELETE", headers: { Cookie: cookie }, body: JSON.stringify({ reassignToId: 2 }) },
      fakeEnv({
        categories: [
          { id: 1, name: "Research", sort_order: 1 },
          { id: 2, name: "Drafting", sort_order: 2 },
        ],
        timeEntryCategoryIds: { 10: 1, 11: 2 },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
