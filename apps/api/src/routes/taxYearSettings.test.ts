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
  monthly_target: number | null;
  split_percentage: number | null;
  personal_allowance?: number | null;
  basic_rate?: number | null;
  basic_rate_threshold?: number | null;
  higher_rate?: number | null;
  higher_rate_threshold?: number | null;
  additional_rate?: number | null;
  ni_lower_threshold?: number | null;
  ni_upper_threshold?: number | null;
  ni_lower_rate?: number | null;
  ni_upper_rate?: number | null;
  class2_flat_rate?: number | null;
  rates_confirmed_at?: string | null;
}

const RATES_INPUT = {
  personalAllowance: 12570,
  basicRate: 0.2,
  basicRateThreshold: 50270,
  higherRate: 0.4,
  higherRateThreshold: 125140,
  additionalRate: 0.45,
  niLowerThreshold: 12570,
  niUpperThreshold: 50270,
  niLowerRate: 0.06,
  niUpperRate: 0.02,
  class2FlatRate: 179.4,
};

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
            if (sql.includes("personal_allowance = excluded")) {
              const [
                taxYear,
                startDate,
                splitPercentage,
                personalAllowance,
                basicRate,
                basicRateThreshold,
                higherRate,
                higherRateThreshold,
                additionalRate,
                niLowerThreshold,
                niUpperThreshold,
                niLowerRate,
                niUpperRate,
                class2FlatRate,
              ] = boundArgs as number[] | string[];
              storedRow = {
                tax_year: taxYear as string,
                start_date: (storedRow?.start_date ?? startDate) as string,
                monthly_target: storedRow?.monthly_target ?? 0,
                split_percentage: (storedRow?.split_percentage ?? splitPercentage) as number,
                personal_allowance: personalAllowance as number,
                basic_rate: basicRate as number,
                basic_rate_threshold: basicRateThreshold as number,
                higher_rate: higherRate as number,
                higher_rate_threshold: higherRateThreshold as number,
                additional_rate: additionalRate as number,
                ni_lower_threshold: niLowerThreshold as number,
                ni_upper_threshold: niUpperThreshold as number,
                ni_lower_rate: niLowerRate as number,
                ni_upper_rate: niUpperRate as number,
                class2_flat_rate: class2FlatRate as number,
                rates_confirmed_at: "2026-08-05T12:00:00.000Z",
              };
            } else if (sql.includes("INSERT INTO tax_year_settings")) {
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

  it("returns nulls when no row exists yet for that year", async () => {
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
      rates: {
        personalAllowance: null,
        basicRate: null,
        basicRateThreshold: null,
        higherRate: null,
        higherRateThreshold: null,
        additionalRate: null,
        niLowerThreshold: null,
        niUpperThreshold: null,
        niLowerRate: null,
        niUpperRate: null,
        class2FlatRate: null,
      },
      ratesConfirmedAt: null,
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

  it("returns the stored rates alongside the target once both are set", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026",
      { headers: { Cookie: cookie } },
      fakeEnv({
        existingRow: {
          tax_year: "2026/27",
          start_date: "2026-04-06",
          monthly_target: 3000,
          split_percentage: 0.75,
          personal_allowance: 12570,
          basic_rate: 0.2,
          basic_rate_threshold: 50270,
          higher_rate: 0.4,
          higher_rate_threshold: 125140,
          additional_rate: 0.45,
          ni_lower_threshold: 12570,
          ni_upper_threshold: 50270,
          ni_lower_rate: 0.06,
          ni_upper_rate: 0.02,
          class2_flat_rate: 179.4,
          rates_confirmed_at: "2026-08-01T00:00:00.000Z",
        },
      }),
    );
    const body = await res.json();
    expect(body.rates.personalAllowance).toBe(12570);
    expect(body.rates.additionalRate).toBe(0.45);
    expect(body.ratesConfirmedAt).toBe("2026-08-01T00:00:00.000Z");
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

describe("PUT /api/tax-year-settings/:startYear/rates", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request(
      "/api/tax-year-settings/2026/rates",
      { method: "PUT", body: JSON.stringify(RATES_INPUT) },
      fakeEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a malformed start year", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/not-a-year/rates",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify(RATES_INPUT) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing fields", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026/rates",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ personalAllowance: 12570 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a rate entered as a percentage instead of a decimal", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026/rates",
      {
        method: "PUT",
        headers: { Cookie: cookie },
        body: JSON.stringify({ ...RATES_INPUT, basicRate: 20 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/decimal fraction/);
  });

  it("rejects a basic rate threshold at or below the personal allowance", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026/rates",
      {
        method: "PUT",
        headers: { Cookie: cookie },
        body: JSON.stringify({ ...RATES_INPUT, basicRateThreshold: 10000 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a NI upper threshold at or below the NI lower threshold", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026/rates",
      {
        method: "PUT",
        headers: { Cookie: cookie },
        body: JSON.stringify({ ...RATES_INPUT, niUpperThreshold: 5000 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("saves valid rates and stamps rates_confirmed_at", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026/rates",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify(RATES_INPUT) },
      fakeEnv({ existingRow: null }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rates).toEqual(RATES_INPUT);
    expect(body.ratesConfirmedAt).toBeTruthy();
  });

  it("preserves an existing monthly target when saving rates", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/tax-year-settings/2026/rates",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify(RATES_INPUT) },
      fakeEnv({
        existingRow: { tax_year: "2026/27", start_date: "2026-04-06", monthly_target: 3000, split_percentage: 0.75 },
      }),
    );
    const body = await res.json();
    expect(body.monthlyTarget).toBe(3000);
  });
});
