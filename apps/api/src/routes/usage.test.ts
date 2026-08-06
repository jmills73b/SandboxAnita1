import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

const dummyDb = { prepare: () => ({ bind: () => ({}) }) } as unknown as Env["DB"];

function fakeEnv(options: { cfApiToken?: string; cfAccountId?: string } = {}): Env {
  return {
    SESSION_SECRET: SECRET,
    DB: dummyDb,
    CF_API_TOKEN: options.cfApiToken,
    CF_ACCOUNT_ID: options.cfAccountId,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/usage", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/usage", {}, fakeEnv({ cfApiToken: "t", cfAccountId: "a" }));
    expect(res.status).toBe(401);
  });

  it("reports not configured when the Cloudflare credentials are missing", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/usage", { headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(501);
    expect((await res.json()).error).toMatch(/not.*set up|isn't set up/i);
  });

  it("surfaces a clear error when Cloudflare's GraphQL API rejects the token", async () => {
    const cookie = await sessionCookie();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ errors: [{ message: "Authentication error" }] }), { status: 200 }),
      ),
    );
    const res = await app.request(
      "/api/usage",
      { headers: { Cookie: cookie } },
      fakeEnv({ cfApiToken: "bad-token", cfAccountId: "acct" }),
    );
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/Account Analytics/);
  });

  it("surfaces an error when the GraphQL HTTP call itself fails", async () => {
    const cookie = await sessionCookie();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    const res = await app.request(
      "/api/usage",
      { headers: { Cookie: cookie } },
      fakeEnv({ cfApiToken: "t", cfAccountId: "a" }),
    );
    expect(res.status).toBe(502);
  });

  it("returns usage figures against the known free-tier caps on success", async () => {
    const cookie = await sessionCookie();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/graphql")) {
          return new Response(
            JSON.stringify({
              data: {
                viewer: {
                  accounts: [
                    {
                      workers: [{ sum: { requests: 4200 } }],
                      d1: [{ sum: { rowsRead: 12000, rowsWritten: 300 } }],
                    },
                  ],
                },
              },
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ result: { file_size: 1_500_000 } }), { status: 200 });
      }),
    );
    const res = await app.request(
      "/api/usage",
      { headers: { Cookie: cookie } },
      fakeEnv({ cfApiToken: "t", cfAccountId: "a" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      workersRequests: { used: 4200, cap: 100_000 },
      d1RowsRead: { used: 12000, cap: 5_000_000 },
      d1RowsWritten: { used: 300, cap: 100_000 },
      d1Storage: { used: 1_500_000, cap: 5_000_000_000 },
    });
  });

  it("degrades gracefully to 0 storage if the D1 REST call fails, without failing the whole request", async () => {
    const cookie = await sessionCookie();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/graphql")) {
          return new Response(
            JSON.stringify({
              data: { viewer: { accounts: [{ workers: [{ sum: { requests: 10 } }], d1: [{ sum: { rowsRead: 0, rowsWritten: 0 } }] }] } },
            }),
            { status: 200 },
          );
        }
        return new Response("", { status: 500 });
      }),
    );
    const res = await app.request(
      "/api/usage",
      { headers: { Cookie: cookie } },
      fakeEnv({ cfApiToken: "t", cfAccountId: "a" }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).d1Storage).toEqual({ used: 0, cap: 5_000_000_000 });
  });
});
