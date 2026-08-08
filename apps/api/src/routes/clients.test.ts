import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

interface StoredClient {
  id: number;
  name: string;
  email: string | null;
  summary: string | null;
  first_invoice_date: string | null;
  case_status?: string;
}

function fakeEnv(
  options: {
    clients?: StoredClient[];
    categories?: Map<number, string>;
    links?: Record<number, number[]>; // clientId -> categoryIds
  } = {},
): Env {
  const clientStore = new Map<number, StoredClient>((options.clients ?? []).map((c) => [c.id, c]));
  const categories = options.categories ?? new Map([[1, "Financial Remedy"], [2, "High Net Worth"]]);
  const linkStore = new Map<number, Set<number>>(
    Object.entries(options.links ?? {}).map(([k, v]) => [Number(k), new Set(v)]),
  );
  let nextId = Math.max(0, ...[...clientStore.keys()]) + 1;

  function linksFor(clientId: number) {
    return [...(linkStore.get(clientId) ?? [])]
      .filter((catId) => categories.has(catId))
      .map((catId) => ({ client_id: clientId, category_id: catId, category_name: categories.get(catId)! }));
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
            if (sql.includes("INSERT INTO clients")) {
              const [name, email, summary, caseStatus] = boundArgs as [string, string | null, string | null, string];
              const id = nextId++;
              clientStore.set(id, { id, name, email, summary, first_invoice_date: null, case_status: caseStatus });
              return { id } as T;
            }
            if (sql.includes("SELECT id, name, email, summary, first_invoice_date, case_status FROM clients WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (clientStore.get(id) ?? null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            if (sql.includes("SELECT id, name, email, summary, first_invoice_date, case_status FROM clients ORDER BY name")) {
              const rows = [...clientStore.values()].sort((a, b) => a.name.localeCompare(b.name));
              return { results: rows as T[], success: true, meta: {} };
            }
            if (sql.includes("FROM client_categories WHERE id IN")) {
              const ids = boundArgs as number[];
              const rows = ids.filter((id) => categories.has(id)).map((id) => ({ id }));
              return { results: rows as T[], success: true, meta: {} };
            }
            if (sql.includes("client_category_links.client_id, client_categories.id AS category_id")) {
              if (sql.includes("WHERE client_category_links.client_id = ?")) {
                const [clientId] = boundArgs as [number];
                return { results: linksFor(clientId) as T[], success: true, meta: {} };
              }
              const rows = [...clientStore.keys()].flatMap((id) => linksFor(id));
              return { results: rows as T[], success: true, meta: {} };
            }
            return { results: [] as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE clients SET name")) {
              const [name, email, summary, caseStatus, id] = boundArgs as [
                string,
                string | null,
                string | null,
                string,
                number,
              ];
              const existing = clientStore.get(id);
              if (existing) clientStore.set(id, { ...existing, name, email, summary, case_status: caseStatus });
            }
            if (sql.includes("DELETE FROM client_category_links WHERE client_id = ?")) {
              const [clientId] = boundArgs as [number];
              linkStore.set(clientId, new Set());
            }
            if (sql.includes("INSERT INTO client_category_links")) {
              const [clientId, categoryId] = boundArgs as [number, number];
              const set = linkStore.get(clientId) ?? new Set<number>();
              set.add(categoryId);
              linkStore.set(clientId, set);
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/clients", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/clients", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns clients with their categories", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { headers: { Cookie: cookie } },
      fakeEnv({
        clients: [{ id: 1, name: "Smith", email: "smith@example.com", summary: "Ongoing matter", first_invoice_date: null }],
        links: { 1: [1, 2] },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: 1,
        name: "Smith",
        email: "smith@example.com",
        summary: "Ongoing matter",
        first_invoice_date: null,
        categories: [
          { id: 1, name: "Financial Remedy" },
          { id: 2, name: "High Net Worth" },
        ],
      },
    ]);
  });

  it("returns an empty categories array for an untagged client", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { headers: { Cookie: cookie } },
      fakeEnv({ clients: [{ id: 1, name: "Smith", email: null, summary: null, first_invoice_date: null }] }),
    );
    expect((await res.json())[0].categories).toEqual([]);
  });
});

describe("POST /api/clients", () => {
  it("rejects a blank name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "   " }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid category id", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Smith", categoryIds: [99] }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates a client with just a name (the auto-create-on-invoice path)", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Smith" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({
      id: 1,
      name: "Smith",
      email: null,
      summary: null,
      first_invoice_date: null,
      caseStatus: "Prospective",
      categories: [],
    });
  });

  it("creates a client with email, summary and categories", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          name: "Jones",
          email: "jones@example.com",
          summary: "High-conflict matter",
          categoryIds: [1, 2],
        }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe("jones@example.com");
    expect(body.summary).toBe("High-conflict matter");
    expect(body.categories).toEqual([
      { id: 1, name: "Financial Remedy" },
      { id: 2, name: "High Net Worth" },
    ]);
  });

  it("defaults case status to Prospective when not specified", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Smith" }) },
      fakeEnv(),
    );
    expect((await res.json()).caseStatus).toBe("Prospective");
  });

  it("accepts an explicit valid case status", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Smith", caseStatus: "Active" }) },
      fakeEnv(),
    );
    expect((await res.json()).caseStatus).toBe("Active");
  });

  it("rejects an invalid case status", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Smith", caseStatus: "Retired" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/clients/:id", () => {
  it("404s when the client doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients/99",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Updated" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("updates fields and replaces the category set", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients/1",
      {
        method: "PATCH",
        headers: { Cookie: cookie },
        body: JSON.stringify({ email: "new@example.com", categoryIds: [2] }),
      },
      fakeEnv({
        clients: [{ id: 1, name: "Smith", email: "old@example.com", summary: null, first_invoice_date: null }],
        links: { 1: [1] },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("new@example.com");
    expect(body.categories).toEqual([{ id: 2, name: "High Net Worth" }]);
  });

  it("leaves categories untouched when categoryIds isn't provided", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Renamed" }) },
      fakeEnv({
        clients: [{ id: 1, name: "Smith", email: null, summary: null, first_invoice_date: null }],
        links: { 1: [1] },
      }),
    );
    const body = await res.json();
    expect(body.name).toBe("Renamed");
    expect(body.categories).toEqual([{ id: 1, name: "Financial Remedy" }]);
  });

  it("updates case status", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ caseStatus: "Closed" }) },
      fakeEnv({
        clients: [
          { id: 1, name: "Smith", email: null, summary: null, first_invoice_date: null, case_status: "Active" },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).caseStatus).toBe("Closed");
  });

  it("rejects an invalid case status", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ caseStatus: "Retired" }) },
      fakeEnv({
        clients: [
          { id: 1, name: "Smith", email: null, summary: null, first_invoice_date: null, case_status: "Active" },
        ],
      }),
    );
    expect(res.status).toBe(400);
  });
});
