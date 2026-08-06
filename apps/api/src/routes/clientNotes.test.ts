import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

interface StoredNote {
  id: number;
  client_id: number;
  created_at: string;
}

interface StoredVersion {
  id: number;
  note_id: number;
  category_id: number | null;
  date: string;
  body: string;
  created_at: string;
}

function fakeEnv(
  options: {
    clients?: Map<number, string>;
    categories?: Map<number, string>;
    notes?: StoredNote[];
    versions?: StoredVersion[];
  } = {},
): Env {
  const clients = options.clients ?? new Map([[1, "Test Client"]]);
  const categories = options.categories ?? new Map([[1, "Initial Meeting"]]);
  const noteStore = new Map<number, StoredNote>((options.notes ?? []).map((n) => [n.id, n]));
  const versionStore = new Map<number, StoredVersion>((options.versions ?? []).map((v) => [v.id, v]));
  let nextNoteId = Math.max(0, ...[...noteStore.keys()]) + 1;
  let nextVersionId = Math.max(0, ...[...versionStore.keys()]) + 1;

  function noteRow(n: StoredNote) {
    return {
      id: n.id,
      client_id: n.client_id,
      client_name: clients.get(n.client_id) ?? "Unknown",
      created_at: n.created_at,
    };
  }

  function versionRow(v: StoredVersion) {
    return {
      id: v.id,
      note_id: v.note_id,
      category_id: v.category_id,
      category_name: v.category_id !== null ? (categories.get(v.category_id) ?? null) : null,
      date: v.date,
      body: v.body,
      created_at: v.created_at,
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
            if (sql.includes("SELECT id FROM note_categories WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (categories.has(id) ? { id } : null) as T;
            }
            if (sql.includes("INSERT INTO client_notes")) {
              const [clientId] = boundArgs as [number];
              const id = nextNoteId++;
              noteStore.set(id, { id, client_id: clientId, created_at: "2026-08-06T00:00:00Z" });
              return { id } as T;
            }
            if (sql.includes("FROM client_notes") && sql.includes("WHERE client_notes.id = ?")) {
              const [id] = boundArgs as [number];
              const row = noteStore.get(id);
              return (row ? noteRow(row) : null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            if (sql.includes("FROM client_note_versions") && sql.includes("WHERE client_note_versions.note_id = ?")) {
              const [noteId] = boundArgs as [number];
              const rows = [...versionStore.values()]
                .filter((v) => v.note_id === noteId)
                .sort((a, b) => b.id - a.id)
                .map(versionRow);
              return { results: rows as T[], success: true, meta: {} };
            }
            if (sql.includes("FROM client_note_versions")) {
              const rows = [...versionStore.values()].sort((a, b) => b.id - a.id).map(versionRow);
              return { results: rows as T[], success: true, meta: {} };
            }
            if (sql.includes("FROM client_notes")) {
              const rows = [...noteStore.values()].sort((a, b) => b.id - a.id).map(noteRow);
              return { results: rows as T[], success: true, meta: {} };
            }
            return { results: [] as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("INSERT INTO client_note_versions")) {
              const [noteId, categoryId, date, body] = boundArgs as [number, number | null, string, string];
              const id = nextVersionId++;
              versionStore.set(id, {
                id,
                note_id: noteId,
                category_id: categoryId,
                date,
                body,
                created_at: "2026-08-06T00:00:00Z",
              });
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/client-notes", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/client-notes", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists notes with their latest version and a version count", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/client-notes",
      { headers: { Cookie: cookie } },
      fakeEnv({
        notes: [{ id: 1, client_id: 1, created_at: "2026-08-01T00:00:00Z" }],
        versions: [
          { id: 1, note_id: 1, category_id: 1, date: "2026-08-01", body: "First meeting notes", created_at: "2026-08-01T00:00:00Z" },
          { id: 2, note_id: 1, category_id: 1, date: "2026-08-02", body: "Corrected notes", created_at: "2026-08-02T00:00:00Z" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: 1,
        clientId: 1,
        clientName: "Test Client",
        createdAt: "2026-08-01T00:00:00Z",
        versionCount: 2,
        latest: {
          id: 2,
          date: "2026-08-02",
          categoryId: 1,
          category: "Initial Meeting",
          body: "Corrected notes",
          createdAt: "2026-08-02T00:00:00Z",
        },
      },
    ]);
  });
});

describe("GET /api/client-notes/:id", () => {
  it("404s when the note doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/client-notes/99", { headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(404);
  });

  it("returns the full version history, newest first", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/client-notes/1",
      { headers: { Cookie: cookie } },
      fakeEnv({
        notes: [{ id: 1, client_id: 1, created_at: "2026-08-01T00:00:00Z" }],
        versions: [
          { id: 1, note_id: 1, category_id: null, date: "2026-08-01", body: "Draft", created_at: "2026-08-01T00:00:00Z" },
          { id: 2, note_id: 1, category_id: 1, date: "2026-08-01", body: "Final", created_at: "2026-08-02T00:00:00Z" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.versions.map((v: { id: number }) => v.id)).toEqual([2, 1]);
    expect(body.versions[0].body).toBe("Final");
  });
});

describe("POST /api/client-notes", () => {
  it("rejects a missing body", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/client-notes",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ clientId: 1, date: "2026-08-06" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/client-notes",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ clientId: 1, date: "2026-08-06", body: "Notes", categoryId: 99 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates a note with its first version", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/client-notes",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ clientId: 1, date: "2026-08-06", categoryId: 1, body: "Discussed options" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.clientId).toBe(1);
    expect(body.versions).toHaveLength(1);
    expect(body.versions[0]).toMatchObject({ date: "2026-08-06", category: "Initial Meeting", body: "Discussed options" });
  });
});

describe("POST /api/client-notes/:id/versions", () => {
  it("404s when the note doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/client-notes/99/versions",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ date: "2026-08-06", body: "Edit" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("appends a new version rather than overwriting the old one", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/client-notes/1/versions",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-08-07", categoryId: 1, body: "Corrected version" }),
      },
      fakeEnv({
        notes: [{ id: 1, client_id: 1, created_at: "2026-08-01T00:00:00Z" }],
        versions: [
          { id: 1, note_id: 1, category_id: 1, date: "2026-08-01", body: "Original", created_at: "2026-08-01T00:00:00Z" },
        ],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.versions).toHaveLength(2);
    expect(body.versions[0].body).toBe("Corrected version");
    expect(body.versions[1].body).toBe("Original");
  });
});
