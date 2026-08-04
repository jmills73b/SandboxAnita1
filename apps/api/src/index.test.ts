import { describe, expect, it } from "vitest";
import app from "./index";
import type { Env } from "./index";

function fakeEnv(rows: unknown[]): Env {
  return {
    SESSION_SECRET: "test-secret",
    DB: {
      prepare: () => ({
        all: async () => ({ results: rows, success: true, meta: {} }),
      }),
    } as unknown as D1Database,
  };
}

describe("GET /api/health", () => {
  it("returns ok without touching the database", async () => {
    const res = await app.request("/api/health", {}, fakeEnv([]));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /api/clients", () => {
  it("returns the clients the database provides", async () => {
    const res = await app.request("/api/clients", {}, fakeEnv([{ id: 1, name: "Smith" }]));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 1, name: "Smith" }]);
  });

  it("returns an empty list when there are no clients yet", async () => {
    const res = await app.request("/api/clients", {}, fakeEnv([]));
    expect(await res.json()).toEqual([]);
  });
});
