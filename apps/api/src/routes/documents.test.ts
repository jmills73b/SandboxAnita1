import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";
// Exactly 32 ASCII chars -> 32 raw bytes once base64-decoded, matching the
// AES-256 key length crypto.subtle.importKey requires.
const TEST_KEY = btoa("01234567890123456789012345678901");

async function sessionCookie(userId = 1): Promise<string> {
  return `session=${await createSessionToken({ userId, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

interface DocRow {
  id: number;
  client_id: number;
  category_id: number | null;
  direction: string;
  filename: string;
  content_type: string;
  size: number;
  r2_key: string;
  iv: string;
  uploaded_by: number;
  uploaded_at: string;
  deleted_at: string | null;
  deleted_by: number | null;
}

function fakeR2() {
  const store = new Map<string, ArrayBuffer>();
  return {
    bucket: {
      put: async (key: string, value: ArrayBuffer) => {
        store.set(key, value);
        return {} as unknown as R2Object;
      },
      get: async (key: string) => {
        const value = store.get(key);
        if (!value) return null;
        return { arrayBuffer: async () => value } as unknown as R2ObjectBody;
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    } as unknown as R2Bucket,
    raw: store,
  };
}

function fakeEnv(
  options: {
    clients?: Array<{ id: number; name: string }>;
    categories?: Array<{ id: number; name: string }>;
    users?: Array<{ id: number; email: string }>;
    documents?: DocRow[];
    unconfiguredStorage?: boolean;
    r2?: ReturnType<typeof fakeR2>;
  } = {},
): Env & { __r2: ReturnType<typeof fakeR2> } {
  const clients = options.clients ?? [{ id: 1, name: "Jane Doe" }];
  const categories = options.categories ?? [{ id: 1, name: "Correspondence" }];
  const users = options.users ?? [{ id: 1, email: "anita@example.com" }];
  const docStore = new Map<number, DocRow>((options.documents ?? []).map((d) => [d.id, d]));
  let nextId = Math.max(0, ...[...docStore.keys()]) + 1;
  const r2 = options.r2 ?? fakeR2();

  function enrich(row: DocRow) {
    return {
      id: row.id,
      client_id: row.client_id,
      category_id: row.category_id,
      category_name: categories.find((c) => c.id === row.category_id)?.name ?? null,
      direction: row.direction,
      filename: row.filename,
      content_type: row.content_type,
      size: row.size,
      uploaded_by_email: users.find((u) => u.id === row.uploaded_by)?.email ?? "",
      uploaded_at: row.uploaded_at,
    };
  }

  const env = {
    SESSION_SECRET: SECRET,
    DOCUMENTS: options.unconfiguredStorage ? undefined : r2.bucket,
    DOCUMENT_ENCRYPTION_KEY: options.unconfiguredStorage ? undefined : TEST_KEY,
    DB: {
      prepare: (sql: string) => {
        let boundArgs: unknown[] = [];
        const statement = {
          bind: (...args: unknown[]) => {
            boundArgs = args;
            return statement;
          },
          first: async <T,>() => {
            if (sql.includes("SUM(size)")) {
              const total = [...docStore.values()].reduce((sum, d) => sum + d.size, 0);
              return { total } as T;
            }
            if (sql.includes("SELECT id FROM clients WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (clients.some((c) => c.id === id) ? { id } : null) as T;
            }
            if (sql.includes("SELECT id FROM document_categories WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (categories.some((c) => c.id === id) ? { id } : null) as T;
            }
            if (sql.includes("SELECT filename, content_type, r2_key, iv")) {
              const [id] = boundArgs as [number];
              const row = docStore.get(id);
              if (!row) return null as T;
              return {
                filename: row.filename,
                content_type: row.content_type,
                r2_key: row.r2_key,
                iv: row.iv,
              } as T;
            }
            if (sql.includes("INSERT INTO documents")) {
              const [clientId, categoryId, direction, filename, contentType, size, r2Key, iv, uploadedBy] =
                boundArgs as [number, number | null, string, string, string, number, string, string, number];
              const id = nextId++;
              docStore.set(id, {
                id,
                client_id: clientId,
                category_id: categoryId,
                direction,
                filename,
                content_type: contentType,
                size,
                r2_key: r2Key,
                iv,
                uploaded_by: uploadedBy,
                uploaded_at: "2026-08-08T12:00:00.000Z",
                deleted_at: null,
                deleted_by: null,
              });
              return { id } as T;
            }
            if (sql.includes("WHERE documents.id = ?")) {
              const [id] = boundArgs as [number];
              const row = docStore.get(id);
              return (row ? enrich(row) : null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            if (sql.includes("documents.deleted_at IS NOT NULL")) {
              const rows = [...docStore.values()]
                .filter((d) => d.deleted_at !== null)
                .sort((a, b) => (b.deleted_at ?? "").localeCompare(a.deleted_at ?? ""))
                .map((row) => ({
                  ...enrich(row),
                  client_name: clients.find((c) => c.id === row.client_id)?.name ?? "",
                  deleted_by_email: users.find((u) => u.id === row.deleted_by)?.email ?? null,
                  deleted_at: row.deleted_at,
                }));
              return { results: rows as T[], success: true, meta: {} };
            }
            if (sql.includes("documents.client_id = ?")) {
              const [clientId] = boundArgs as [number];
              const rows = [...docStore.values()]
                .filter((d) => d.client_id === clientId && d.deleted_at === null)
                .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
                .map(enrich);
              return { results: rows as T[], success: true, meta: {} };
            }
            return { results: [] as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE documents SET deleted_at")) {
              const [deletedBy, id] = boundArgs as [number, number];
              const row = docStore.get(id);
              if (!row || row.deleted_at !== null) {
                return { success: true, meta: { changes: 0 } };
              }
              row.deleted_at = "2026-08-08T13:00:00.000Z";
              row.deleted_by = deletedBy;
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  } as unknown as Env & { __r2: ReturnType<typeof fakeR2> };

  (env as unknown as { __r2: ReturnType<typeof fakeR2> }).__r2 = r2;
  return env;
}

function pdfFile(name = "letter.pdf", contents = "hello world"): File {
  return new File([contents], name, { type: "application/pdf" });
}

describe("POST /api/documents", () => {
  it("rejects a request with no session", async () => {
    const form = new FormData();
    form.set("file", pdfFile());
    form.set("clientId", "1");
    form.set("direction", "inbound");
    const res = await app.request("/api/documents", { method: "POST", body: form }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("reports storage as unconfigured rather than failing", async () => {
    const cookie = await sessionCookie();
    const form = new FormData();
    form.set("file", pdfFile());
    form.set("clientId", "1");
    form.set("direction", "inbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      fakeEnv({ unconfiguredStorage: true }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/not configured/);
  });

  it("rejects a missing file", async () => {
    const cookie = await sessionCookie();
    const form = new FormData();
    form.set("clientId", "1");
    form.set("direction", "inbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid direction", async () => {
    const cookie = await sessionCookie();
    const form = new FormData();
    form.set("file", pdfFile());
    form.set("clientId", "1");
    form.set("direction", "sideways");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a disallowed file type", async () => {
    const cookie = await sessionCookie();
    const form = new FormData();
    form.set("file", new File(["hi"], "notes.txt", { type: "text/plain" }));
    form.set("clientId", "1");
    form.set("direction", "inbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/PDF, Word/);
  });

  it("rejects an unknown client", async () => {
    const cookie = await sessionCookie();
    const form = new FormData();
    form.set("file", pdfFile());
    form.set("clientId", "999");
    form.set("direction", "inbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("rejects an unknown category", async () => {
    const cookie = await sessionCookie();
    const form = new FormData();
    form.set("file", pdfFile());
    form.set("clientId", "1");
    form.set("categoryId", "999");
    form.set("direction", "inbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("uploads and encrypts a valid file, storing ciphertext (not plaintext) in R2", async () => {
    const cookie = await sessionCookie();
    const env = fakeEnv();
    const form = new FormData();
    form.set("file", pdfFile("letter.pdf", "hello world"));
    form.set("clientId", "1");
    form.set("categoryId", "1");
    form.set("direction", "outbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      env,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      clientId: 1,
      categoryId: 1,
      categoryName: "Correspondence",
      direction: "outbound",
      filename: "letter.pdf",
      contentType: "application/pdf",
      uploadedByEmail: "anita@example.com",
    });

    const r2 = (env as unknown as { __r2: ReturnType<typeof fakeR2> }).__r2;
    expect(r2.raw.size).toBe(1);
    const stored = [...r2.raw.values()][0];
    const storedText = new TextDecoder().decode(stored);
    expect(storedText).not.toContain("hello world");
  });

  it("rejects an upload that would cross the 8GB storage ceiling", async () => {
    const cookie = await sessionCookie();
    const eightGB = 8 * 1024 * 1024 * 1024;
    const env = fakeEnv({
      documents: [
        {
          id: 1,
          client_id: 1,
          category_id: null,
          direction: "inbound",
          filename: "existing.pdf",
          content_type: "application/pdf",
          size: eightGB - 5, // just 5 bytes of headroom left
          r2_key: "documents/1/existing",
          iv: "iv-existing",
          uploaded_by: 1,
          uploaded_at: "2026-08-01T00:00:00.000Z",
          deleted_at: null,
          deleted_by: null,
        },
      ],
    });
    const form = new FormData();
    form.set("file", pdfFile("letter.pdf", "hello world")); // well over 5 bytes
    form.set("clientId", "1");
    form.set("direction", "outbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      env,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Storage limit reached/);

    const r2 = (env as unknown as { __r2: ReturnType<typeof fakeR2> }).__r2;
    expect(r2.raw.size).toBe(0);
  });

  it("counts soft-deleted documents toward the storage ceiling, since their R2 object is never removed", async () => {
    const cookie = await sessionCookie();
    const eightGB = 8 * 1024 * 1024 * 1024;
    const env = fakeEnv({
      documents: [
        {
          id: 1,
          client_id: 1,
          category_id: null,
          direction: "inbound",
          filename: "deleted.pdf",
          content_type: "application/pdf",
          size: eightGB - 5,
          r2_key: "documents/1/deleted",
          iv: "iv-deleted",
          uploaded_by: 1,
          uploaded_at: "2026-08-01T00:00:00.000Z",
          deleted_at: "2026-08-02T00:00:00.000Z",
          deleted_by: 1,
        },
      ],
    });
    const form = new FormData();
    form.set("file", pdfFile("letter.pdf", "hello world"));
    form.set("clientId", "1");
    form.set("direction", "outbound");
    const res = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: form },
      env,
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Storage limit reached/);
  });
});

describe("GET /api/documents", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/documents?clientId=1", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("requires a clientId", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/documents", { headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(400);
  });

  it("lists only non-deleted documents for that client", async () => {
    const cookie = await sessionCookie();
    const env = fakeEnv({
      documents: [
        {
          id: 1,
          client_id: 1,
          category_id: 1,
          direction: "inbound",
          filename: "email.eml",
          content_type: "message/rfc822",
          size: 10,
          r2_key: "documents/1/a",
          iv: "iv-a",
          uploaded_by: 1,
          uploaded_at: "2026-08-01T00:00:00.000Z",
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 2,
          client_id: 1,
          category_id: null,
          direction: "outbound",
          filename: "reply.docx",
          content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          size: 20,
          r2_key: "documents/1/b",
          iv: "iv-b",
          uploaded_by: 1,
          uploaded_at: "2026-08-02T00:00:00.000Z",
          deleted_at: "2026-08-03T00:00:00.000Z",
          deleted_by: 1,
        },
        {
          id: 3,
          client_id: 2,
          category_id: null,
          direction: "inbound",
          filename: "other-client.pdf",
          content_type: "application/pdf",
          size: 30,
          r2_key: "documents/2/c",
          iv: "iv-c",
          uploaded_by: 1,
          uploaded_at: "2026-08-01T00:00:00.000Z",
          deleted_at: null,
          deleted_by: null,
        },
      ],
    });
    const res = await app.request("/api/documents?clientId=1", { headers: { Cookie: cookie } }, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].filename).toBe("email.eml");
  });
});

describe("GET /api/documents/:id/download", () => {
  it("decrypts and returns the original file bytes", async () => {
    const cookie = await sessionCookie();
    const env = fakeEnv();
    const uploadForm = new FormData();
    uploadForm.set("file", pdfFile("letter.pdf", "the original contents"));
    uploadForm.set("clientId", "1");
    uploadForm.set("direction", "inbound");
    const uploadRes = await app.request(
      "/api/documents",
      { method: "POST", headers: { Cookie: cookie }, body: uploadForm },
      env,
    );
    const uploaded = await uploadRes.json();

    const downloadRes = await app.request(
      `/api/documents/${uploaded.id}/download`,
      { headers: { Cookie: cookie } },
      env,
    );
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get("Content-Disposition")).toContain("letter.pdf");
    const text = await downloadRes.text();
    expect(text).toBe("the original contents");
  });

  it("404s for an unknown document", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/documents/999/download", { headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/documents/:id", () => {
  it("soft deletes rather than removing the row", async () => {
    const cookie = await sessionCookie(7);
    const env = fakeEnv({
      users: [{ id: 7, email: "assistant@example.com" }],
      documents: [
        {
          id: 1,
          client_id: 1,
          category_id: null,
          direction: "inbound",
          filename: "email.eml",
          content_type: "message/rfc822",
          size: 10,
          r2_key: "documents/1/a",
          iv: "iv-a",
          uploaded_by: 7,
          uploaded_at: "2026-08-01T00:00:00.000Z",
          deleted_at: null,
          deleted_by: null,
        },
      ],
    });

    const deleteRes = await app.request(
      "/api/documents/1",
      { method: "DELETE", headers: { Cookie: cookie } },
      env,
    );
    expect(deleteRes.status).toBe(200);

    const listRes = await app.request("/api/documents?clientId=1", { headers: { Cookie: cookie } }, env);
    expect(await listRes.json()).toEqual([]);

    const deletedRes = await app.request("/api/documents/deleted", { headers: { Cookie: cookie } }, env);
    const deletedBody = await deletedRes.json();
    expect(deletedBody).toHaveLength(1);
    expect(deletedBody[0]).toMatchObject({
      filename: "email.eml",
      clientName: "Jane Doe",
      deletedByEmail: "assistant@example.com",
    });
    expect(deletedBody[0].deletedAt).toBeTruthy();
  });

  it("404s for a document that's already deleted or doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/documents/999", { method: "DELETE", headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(404);
  });
});
