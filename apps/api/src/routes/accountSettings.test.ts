import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  return `session=${token}`;
}

function fakeEnv(options: { inviteCode?: string } = {}): Env {
  let inviteCode = options.inviteCode ?? "";

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
          first: async <T,>() => ({ invite_code: inviteCode }) as T,
          run: async () => {
            const [newCode] = boundArgs as [string];
            inviteCode = newCode;
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/account-settings", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/account-settings", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns the current invite code", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/account-settings",
      { headers: { Cookie: cookie } },
      fakeEnv({ inviteCode: "LETMEIN" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ inviteCode: "LETMEIN" });
  });

  it("returns an empty code when none has been set yet", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/account-settings", { headers: { Cookie: cookie } }, fakeEnv());
    expect(await res.json()).toEqual({ inviteCode: "" });
  });
});

describe("PUT /api/account-settings", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/account-settings", { method: "PUT" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("rejects an empty invite code", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/account-settings",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ inviteCode: "   " }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("saves a new invite code", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/account-settings",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ inviteCode: "NEWCODE123" }) },
      fakeEnv({ inviteCode: "OLDCODE" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ inviteCode: "NEWCODE123" });
  });
});
