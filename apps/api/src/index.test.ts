import { describe, expect, it } from "vitest";
import app from "./index";
import type { Env } from "./index";

describe("GET /api/health", () => {
  it("returns ok without touching the database", async () => {
    const env = { SESSION_SECRET: "test-secret", DB: {} } as unknown as Env;
    const res = await app.request("/api/health", {}, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
