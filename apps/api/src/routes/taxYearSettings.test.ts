import { describe, expect, it } from "vitest";
import { createSessionToken, currentTaxYear, DEFAULT_SPLIT_PERCENTAGE } from "@sandboxanita1/core";
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

describe("GET /api/tax-year-settings/current", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/tax-year-settings/current", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns a null target when no tax year row exists yet", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/current",
      { headers: { Cookie: cookie } },
      fakeEnv({ existingRow: null }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    const { label, startDate } = currentTaxYear();
    expect(body).toEqual({ taxYear: label, startDate, monthlyTarget: null, splitPercentage: null });
  });

  it("returns the stored target when a row exists", async () => {
    const cookie = await sessionCookie();
    const { label, startDate } = currentTaxYear();
    const res = await app.request(
      "/api/tax-year-settings/current",
      { headers: { Cookie: cookie } },
      fakeEnv({
        existingRow: {
          tax_year: label,
          start_date: startDate,
          monthly_target: 3000,
          split_percentage: 0.75,
        },
      }),
    );
    const body = await res.json();
    expect(body.monthlyTarget).toBe(3000);
  });
});

describe("POST /api/tax-year-settings/current", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request(
      "/api/tax-year-settings/current",
      { method: "POST", body: JSON.stringify({ monthlyTarget: 3000 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a £0 target", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/current",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ monthlyTarget: 0 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates a target for the current tax year using the default split", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/current",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ monthlyTarget: 3000 }),
      },
      fakeEnv({ existingRow: null }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monthlyTarget).toBe(3000);
    expect(body.splitPercentage).toBe(DEFAULT_SPLIT_PERCENTAGE);
  });

  it("updates the target without disturbing the stored split", async () => {
    const cookie = await sessionCookie();
    const { label, startDate } = currentTaxYear();
    const res = await app.request(
      "/api/tax-year-settings/current",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ monthlyTarget: 3500 }),
      },
      fakeEnv({
        existingRow: {
          tax_year: label,
          start_date: startDate,
          monthly_target: 3000,
          split_percentage: 0.75,
        },
      }),
    );
    const body = await res.json();
    expect(body.monthlyTarget).toBe(3500);
    expect(body.splitPercentage).toBe(0.75);
  });
});
