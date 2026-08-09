import { describe, expect, it } from "vitest";
import { createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

function fakeEnv(options: { unitMinutes?: number } = {}): Env {
  let unitMinutes = options.unitMinutes ?? 8;

  return {
    SESSION_SECRET: SECRET,
    DB: {
      prepare: () => {
        let boundArgs: unknown[] = [];
        const statement = {
          bind: (...args: unknown[]) => {
            boundArgs = args;
            return statement;
          },
          first: async <T,>() => ({ unit_minutes: unitMinutes }) as T,
          run: async () => {
            const [newValue] = boundArgs as [number];
            unitMinutes = newValue;
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/time-settings", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/time-settings", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns the current unit size", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-settings",
      { headers: { Cookie: cookie } },
      fakeEnv({ unitMinutes: 6 }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ unitMinutes: 6 });
  });
});

describe("PUT /api/time-settings", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/time-settings", { method: "PUT" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("rejects a non-integer value", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-settings",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ unitMinutes: 6.5 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects zero or negative", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-settings",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ unitMinutes: 0 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("saves a new unit size", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-settings",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ unitMinutes: 10 }) },
      fakeEnv({ unitMinutes: 8 }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ unitMinutes: 10 });
  });
});
