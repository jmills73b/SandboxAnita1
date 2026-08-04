import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken(
    { userId: 1, exp: Math.floor(Date.now() / 1000) + 60 },
    SECRET,
  );
  return `session=${token}`;
}

// Same approach as auth.test.ts: a minimal stand-in for D1, not a real one —
// see that file's comment for why that's the right amount of fake here.
function fakeEnv(options: { listResults?: unknown[]; insertResult?: unknown } = {}): Env {
  const listResults = options.listResults ?? [];
  const insertResult = options.insertResult ?? null;

  return {
    SESSION_SECRET: SECRET,
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async <T,>() => insertResult as T,
        }),
        all: async () => ({ results: listResults, success: true, meta: {} }),
      }),
    } as unknown as D1Database,
  };
}

describe("GET /api/clients", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/clients", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns the client list when signed in", async () => {
    const cookie = await sessionCookie();
    const client = { id: 1, name: "Smith", first_invoice_date: null };
    const res = await app.request(
      "/api/clients",
      { headers: { Cookie: cookie } },
      fakeEnv({ listResults: [client] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([client]);
  });
});

describe("POST /api/clients", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request(
      "/api/clients",
      { method: "POST", body: JSON.stringify({ name: "Smith" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a blank name", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "   " }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates a client and returns it", async () => {
    const cookie = await sessionCookie();
    const created = { id: 5, name: "Smith", first_invoice_date: null };
    const res = await app.request(
      "/api/clients",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Smith" }) },
      fakeEnv({ insertResult: created }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
  });
});
