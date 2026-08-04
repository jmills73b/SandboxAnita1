import { Hono } from "hono";
import { currentTaxYear, DEFAULT_SPLIT_PERCENTAGE } from "@sandboxanita1/core";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const taxYearSettings = new Hono<AppEnv>();

taxYearSettings.use("*", requireAuth);

interface TaxYearRow {
  tax_year: string;
  start_date: string;
  monthly_target: number;
  split_percentage: number;
}

function toSettings(taxYear: string, startDate: string, row: TaxYearRow | null) {
  return {
    taxYear,
    startDate,
    monthlyTarget: row?.monthly_target ?? null,
    splitPercentage: row?.split_percentage ?? null,
  };
}

// The single "current" tax year, resolved from today's date rather than
// taken as input — there's only ever one meaningful "now" to set a target
// for (see story 3.1).
taxYearSettings.get("/current", async (c) => {
  const { label, startDate } = currentTaxYear();

  const row = await c.env.DB.prepare(
    "SELECT tax_year, start_date, monthly_target, split_percentage FROM tax_year_settings WHERE tax_year = ?",
  )
    .bind(label)
    .first<TaxYearRow>();

  return c.json(toSettings(label, startDate, row));
});

taxYearSettings.post("/current", async (c) => {
  const { monthlyTarget } = await c.req.json<{ monthlyTarget?: number }>();

  if (typeof monthlyTarget !== "number" || monthlyTarget <= 0) {
    return c.json({ error: "Enter a monthly target greater than £0" }, 400);
  }

  const { label, startDate } = currentTaxYear();

  await c.env.DB.prepare(
    `INSERT INTO tax_year_settings (tax_year, start_date, monthly_target, split_percentage)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(tax_year) DO UPDATE SET monthly_target = excluded.monthly_target`,
  )
    .bind(label, startDate, monthlyTarget, DEFAULT_SPLIT_PERCENTAGE)
    .run();

  const row = await c.env.DB.prepare(
    "SELECT tax_year, start_date, monthly_target, split_percentage FROM tax_year_settings WHERE tax_year = ?",
  )
    .bind(label)
    .first<TaxYearRow>();

  return c.json(toSettings(label, startDate, row));
});

export default taxYearSettings;
