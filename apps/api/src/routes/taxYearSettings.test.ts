import { describe, expect, it } from "vitest";
import { createSessionToken, DEFAULT_SPLIT_PERCENTAGE } from "@sandboxanita1/core";
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

interface FakeRow {
  tax_year: string;
  start_date: string;
  monthly_target: number;
  split_percentage: number;
}

// A minimal D1 stand-in that actually remembers state across the
// insert-then-reselect the route does, rather than a fixed canned response.
function fakeEnv(options: { existingRow?: FakeRow | null } = {}): Env {
  let storedRow = options.existingRow ?? null;

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
          first: async <T>() => storedRow as T,
          run: async () => {
            if (sql.includes("INSERT INTO tax_year_settings")) {
              const [taxYear, startDate, monthlyTarget, splitPercentage] = boundArgs as [
                string,
                string,
                number,
                number,
              ];
              storedRow =
                storedRow && storedRow.tax_year === taxYear
                  ? { ...storedRow, monthly_target: monthlyTarget }
                  : {
                      tax_year: taxYear,
                      start_date: startDate,
                      monthly_target: monthlyTarget,
                      split_percentage: splitPercentage,
                    };
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/tax-year-settings/:startYear", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/tax-year-settings/2026", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("rejects a malformed start year", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/not-a-year",
      { headers: { Cookie: cookie } },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("returns a null target when no row exists yet for that year", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026",
      { headers: { Cookie: cookie } },
      fakeEnv({ existingRow: null }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      startYear: 2026,
      taxYear: "2026/27",
      startDate: "2026-04-06",
      monthlyTarget: null,
      splitPercentage: null,
    });
  });

  it("returns the stored target for a past tax year", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2024",
      { headers: { Cookie: cookie } },
      fakeEnv({
        existingRow: { tax_year: "2024/25", start_date: "2024-04-06", monthly_target: 2800, split_percentage: 0.75 },
      }),
    );
    const body = await res.json();
    expect(body.taxYear).toBe("2024/25");
    expect(body.monthlyTarget).toBe(2800);
  });
});

describe("POST /api/tax-year-settings/:startYear", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request(
      "/api/tax-year-settings/2026",
      { method: "POST", body: JSON.stringify({ monthlyTarget: 3000 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a malformed start year", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/not-a-year",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ monthlyTarget: 3000 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a £0 target", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ monthlyTarget: 0 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates a target for an arbitrary tax year using the default split", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2025",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ monthlyTarget: 3000 }),
      },
      fakeEnv({ existingRow: null }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.taxYear).toBe("2025/26");
    expect(body.startDate).toBe("2025-04-06");
    expect(body.monthlyTarget).toBe(3000);
    expect(body.splitPercentage).toBe(DEFAULT_SPLIT_PERCENTAGE);
  });

  it("updates the target without disturbing the stored split", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ monthlyTarget: 3500 }),
      },
      fakeEnv({
        existingRow: { tax_year: "2026/27", start_date: "2026-04-06", monthly_target: 3000, split_percentage: 0.75 },
      }),
    );
    const body = await res.json();
    expect(body.monthlyTarget).toBe(3500);
    expect(body.splitPercentage).toBe(0.75);
  });
});
