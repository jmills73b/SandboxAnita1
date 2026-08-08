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

function fakeEnv(options: { categories?: StoredCategory[] } = {}): Env {
  const categoryStore = new Map<number, StoredCategory>((options.categories ?? []).map((c) => [c.id, c]));
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
            if (sql.includes("INSERT INTO document_categories")) {
              const [name, sortOrder] = boundArgs as [string, number];
              const id = nextId++;
              const row = { id, name, sort_order: sortOrder };
              categoryStore.set(id, row);
              return row as T;
            }
            if (sql.includes("UPDATE document_categories SET name")) {
              const [name, id] = boundArgs as [string, number];
              const existing = categoryStore.get(id);
              if (!existing) return null as T;
              const updated = { ...existing, name };
              categoryStore.set(id, updated);
              return updated as T;
            }
            if (sql.includes("SELECT id FROM document_categories WHERE id = ?")) {
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
            if (sql.includes("DELETE FROM document_categories")) {
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

describe("GET /api/document-categories", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/document-categories", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists categories in sort order", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/document-categories",
      { headers: { Cookie: cookie } },
      fakeEnv({
        categories: [
          { id: 2, name: "Court Orders", sort_order: 2 },
          { id: 1, name: "Correspondence", sort_order: 1 },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 1, name: "Correspondence" },
      { id: 2, name: "Court Orders" },
    ]);
  });
});

describe("POST /api/document-categories", () => {
  it("rejects an empty name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/document-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "  " }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/document-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Correspondence" }) },
      fakeEnv({ categories: [{ id: 1, name: "Correspondence", sort_order: 1 }] }),
    );
    expect(res.status).toBe(400);
  });

  it("creates a new category after the existing ones", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/document-categories",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Court Orders" }) },
      fakeEnv({ categories: [{ id: 1, name: "Correspondence", sort_order: 1 }] }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).name).toBe("Court Orders");
  });
});

describe("PATCH /api/document-categories/:id (rename)", () => {
  it("renames a category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/document-categories/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Client Correspondence" }) },
      fakeEnv({ categories: [{ id: 1, name: "Correspondence", sort_order: 1 }] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, name: "Client Correspondence" });
  });
});

describe("DELETE /api/document-categories/:id", () => {
  it("404s when the category doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/document-categories/99",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("deletes the category with no reassignment needed", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/document-categories/1",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ categories: [{ id: 1, name: "Correspondence", sort_order: 1 }] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
