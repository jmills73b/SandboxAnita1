import { Hono } from "hono";
import { DEFAULT_SPLIT_PERCENTAGE, taxYearLabel, taxYearStartDate } from "@sandboxanita1/core";
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

function toSettings(startYear: number, label: string, startDate: string, row: TaxYearRow | null) {
  return {
    startYear,
    taxYear: label,
    startDate,
    monthlyTarget: row?.monthly_target ?? null,
    splitPercentage: row?.split_percentage ?? null,
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
  const row = await c.env.DB.prepare(
    "SELECT tax_year, start_date, monthly_target, split_percentage FROM tax_year_settings WHERE tax_year = ?",
  )
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

  const row = await c.env.DB.prepare(
    "SELECT tax_year, start_date, monthly_target, split_percentage FROM tax_year_settings WHERE tax_year = ?",
  )
    .bind(label)
    .first<TaxYearRow>();

  return c.json(toSettings(startYear, label, startDate, row));
});

export default taxYearSettings;
