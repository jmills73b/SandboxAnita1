import { Hono } from "hono";
import { DEFAULT_SPLIT_PERCENTAGE, taxYearLabel, taxYearStartDate } from "@sandboxanita1/core";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const taxYearSettings = new Hono<AppEnv>();

taxYearSettings.use("*", requireAuth);

interface TaxYearRow {
  tax_year: string;
  start_date: string;
  monthly_target: number | null;
  split_percentage: number | null;
  personal_allowance: number | null;
  basic_rate: number | null;
  basic_rate_threshold: number | null;
  higher_rate: number | null;
  higher_rate_threshold: number | null;
  additional_rate: number | null;
  ni_lower_threshold: number | null;
  ni_upper_threshold: number | null;
  ni_lower_rate: number | null;
  ni_upper_rate: number | null;
  class2_flat_rate: number | null;
  rates_confirmed_at: string | null;
}

const ROW_COLUMNS =
  "tax_year, start_date, monthly_target, split_percentage, personal_allowance, basic_rate, " +
  "basic_rate_threshold, higher_rate, higher_rate_threshold, additional_rate, ni_lower_threshold, " +
  "ni_upper_threshold, ni_lower_rate, ni_upper_rate, class2_flat_rate, rates_confirmed_at";

function toSettings(startYear: number, label: string, startDate: string, row: TaxYearRow | null) {
  return {
    startYear,
    taxYear: label,
    startDate,
    monthlyTarget: row?.monthly_target ?? null,
    splitPercentage: row?.split_percentage ?? null,
    rates: {
      personalAllowance: row?.personal_allowance ?? null,
      basicRate: row?.basic_rate ?? null,
      basicRateThreshold: row?.basic_rate_threshold ?? null,
      higherRate: row?.higher_rate ?? null,
      higherRateThreshold: row?.higher_rate_threshold ?? null,
      additionalRate: row?.additional_rate ?? null,
      niLowerThreshold: row?.ni_lower_threshold ?? null,
      niUpperThreshold: row?.ni_upper_threshold ?? null,
      niLowerRate: row?.ni_lower_rate ?? null,
      niUpperRate: row?.ni_upper_rate ?? null,
      class2FlatRate: row?.class2_flat_rate ?? null,
    },
    ratesConfirmedAt: row?.rates_confirmed_at ?? null,
  };
}

// The URL takes the plain start year ("2026"), not the "2026/27" label —
// a label with a "/" in it doesn't survive as a single path segment.
function parseStartYear(param: string): number | null {
  return /^\d{4}$/.test(param) ? Number(param) : null;
}

// Any tax year, not just the current one — the frontend's year filter needs
// to look at past years too (a follow-up to story 3.1).
taxYearSettings.get("/:startYear", async (c) => {
  const startYear = parseStartYear(c.req.param("startYear"));
  if (startYear === null) {
    return c.json({ error: "Invalid tax year" }, 400);
  }

  const label = taxYearLabel(startYear);
  const row = await c.env.DB.prepare(`SELECT ${ROW_COLUMNS} FROM tax_year_settings WHERE tax_year = ?`)
    .bind(label)
    .first<TaxYearRow>();

  return c.json(toSettings(startYear, label, taxYearStartDate(startYear), row));
});

taxYearSettings.post("/:startYear", async (c) => {
  const startYear = parseStartYear(c.req.param("startYear"));
  if (startYear === null) {
    return c.json({ error: "Invalid tax year" }, 400);
  }

  const { monthlyTarget } = await c.req.json<{ monthlyTarget?: number }>();
  if (typeof monthlyTarget !== "number" || monthlyTarget <= 0) {
    return c.json({ error: "Enter a monthly target greater than £0" }, 400);
  }

  const label = taxYearLabel(startYear);
  const startDate = taxYearStartDate(startYear);

  await c.env.DB.prepare(
    `INSERT INTO tax_year_settings (tax_year, start_date, monthly_target, split_percentage)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(tax_year) DO UPDATE SET monthly_target = excluded.monthly_target`,
  )
    .bind(label, startDate, monthlyTarget, DEFAULT_SPLIT_PERCENTAGE)
    .run();

  const row = await c.env.DB.prepare(`SELECT ${ROW_COLUMNS} FROM tax_year_settings WHERE tax_year = ?`)
    .bind(label)
    .first<TaxYearRow>();

  return c.json(toSettings(startYear, label, startDate, row));
});

// Separate from both the target and rates routes above, and deliberately not
// year-picker driven on the frontend (see Admin & Settings -> Billing ->
// Billing rates) -- the split is a "change it for right now" setting, not
// something Anita ever needs to backdate, so this always writes whichever
// tax year the frontend considers current.
taxYearSettings.post("/:startYear/split", async (c) => {
  const startYear = parseStartYear(c.req.param("startYear"));
  if (startYear === null) {
    return c.json({ error: "Invalid tax year" }, 400);
  }

  const { splitPercentage } = await c.req.json<{ splitPercentage?: number }>();
  if (typeof splitPercentage !== "number" || !Number.isFinite(splitPercentage) || splitPercentage < 0 || splitPercentage > 1) {
    return c.json({ error: "Enter your share as a decimal fraction between 0 and 1 (e.g. 0.75 for 75%)" }, 400);
  }

  const label = taxYearLabel(startYear);
  const startDate = taxYearStartDate(startYear);

  await c.env.DB.prepare(
    `INSERT INTO tax_year_settings (tax_year, start_date, monthly_target, split_percentage)
     VALUES (?, ?, 0, ?)
     ON CONFLICT(tax_year) DO UPDATE SET split_percentage = excluded.split_percentage`,
  )
    .bind(label, startDate, splitPercentage)
    .run();

  const row = await c.env.DB.prepare(`SELECT ${ROW_COLUMNS} FROM tax_year_settings WHERE tax_year = ?`)
    .bind(label)
    .first<TaxYearRow>();

  return c.json(toSettings(startYear, label, startDate, row));
});

interface RatesInput {
  personalAllowance?: number;
  basicRate?: number;
  basicRateThreshold?: number;
  higherRate?: number;
  higherRateThreshold?: number;
  additionalRate?: number;
  niLowerThreshold?: number;
  niUpperThreshold?: number;
  niLowerRate?: number;
  niUpperRate?: number;
  class2FlatRate?: number;
}

function validateRates(input: RatesInput): string | null {
  const {
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
  } = input;

  const values = [
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
  ];
  if (values.some((v) => typeof v !== "number" || !Number.isFinite(v) || v < 0)) {
    return "All rates and thresholds are required and must be zero or more";
  }
  const rates = [basicRate, higherRate, additionalRate, niLowerRate, niUpperRate];
  if (rates.some((r) => (r as number) > 1)) {
    return "Rates should be entered as a decimal fraction (e.g. 0.2 for 20%), not a percentage";
  }
  if ((basicRateThreshold as number) <= (personalAllowance as number)) {
    return "Basic rate threshold must be above the personal allowance";
  }
  if ((higherRateThreshold as number) <= (basicRateThreshold as number)) {
    return "Higher rate threshold must be above the basic rate threshold";
  }
  if ((niUpperThreshold as number) <= (niLowerThreshold as number)) {
    return "NI upper threshold must be above the NI lower threshold";
  }
  return null;
}

// Separate from the plain POST above so the frequent, low-stakes "set this
// month's target" action doesn't require re-submitting the full rate table
// every time — rates only change once a year, if that.
taxYearSettings.put("/:startYear/rates", async (c) => {
  const startYear = parseStartYear(c.req.param("startYear"));
  if (startYear === null) {
    return c.json({ error: "Invalid tax year" }, 400);
  }

  const input = await c.req.json<RatesInput>();
  const validationError = validateRates(input);
  if (validationError) {
    return c.json({ error: validationError }, 400);
  }

  const label = taxYearLabel(startYear);
  const startDate = taxYearStartDate(startYear);

  await c.env.DB.prepare(
    `INSERT INTO tax_year_settings (
       tax_year, start_date, monthly_target,
       personal_allowance, basic_rate, basic_rate_threshold,
       higher_rate, higher_rate_threshold, additional_rate,
       ni_lower_threshold, ni_upper_threshold, ni_lower_rate, ni_upper_rate,
       class2_flat_rate, rates_confirmed_at
     )
     VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(tax_year) DO UPDATE SET
       personal_allowance = excluded.personal_allowance,
       basic_rate = excluded.basic_rate,
       basic_rate_threshold = excluded.basic_rate_threshold,
       higher_rate = excluded.higher_rate,
       higher_rate_threshold = excluded.higher_rate_threshold,
       additional_rate = excluded.additional_rate,
       ni_lower_threshold = excluded.ni_lower_threshold,
       ni_upper_threshold = excluded.ni_upper_threshold,
       ni_lower_rate = excluded.ni_lower_rate,
       ni_upper_rate = excluded.ni_upper_rate,
       class2_flat_rate = excluded.class2_flat_rate,
       rates_confirmed_at = excluded.rates_confirmed_at`,
  )
    .bind(
      label,
      startDate,
      input.personalAllowance,
      input.basicRate,
      input.basicRateThreshold,
      input.higherRate,
      input.higherRateThreshold,
      input.additionalRate,
      input.niLowerThreshold,
      input.niUpperThreshold,
      input.niLowerRate,
      input.niUpperRate,
      input.class2FlatRate,
    )
    .run();

  const row = await c.env.DB.prepare(`SELECT ${ROW_COLUMNS} FROM tax_year_settings WHERE tax_year = ?`)
    .bind(label)
    .first<TaxYearRow>();

  return c.json(toSettings(startYear, label, startDate, row));
});

export default taxYearSettings;
