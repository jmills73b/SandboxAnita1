import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const hourlyRates = new Hono<AppEnv>();

hourlyRates.use("*", requireAuth);

interface RateRow {
  id: number;
  rate: number;
  start_date: string;
  end_date: string | null;
}

function toRate(row: RateRow) {
  return { id: row.id, rate: row.rate, startDate: row.start_date, endDate: row.end_date };
}

// One day before a "YYYY-MM-DD" date string, for closing off the previous
// rate the day a new one takes effect.
function dayBefore(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// The rate in effect on a given date — used when a time entry is saved, so
// its value reflects the rate that actually applied on the day the work
// was done, not whatever rate is current when it happens to be entered.
export async function rateForDate(db: D1Database, date: string): Promise<number | null> {
  const row = await db
    .prepare(
      `SELECT rate FROM hourly_rates
       WHERE start_date <= ? AND (end_date IS NULL OR end_date >= ?)
       ORDER BY start_date DESC LIMIT 1`,
    )
    .bind(date, date)
    .first<{ rate: number }>();
  return row?.rate ?? null;
}

hourlyRates.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, rate, start_date, end_date FROM hourly_rates ORDER BY start_date DESC",
  ).all<RateRow>();

  return c.json(results.map(toRate));
});

hourlyRates.post("/", async (c) => {
  const { rate, startDate } = await c.req.json<{ rate?: number; startDate?: string }>();

  if (typeof rate !== "number" || rate <= 0) {
    return c.json({ error: "Enter an hourly rate greater than £0" }, 400);
  }
  if (!startDate) {
    return c.json({ error: "Enter a start date" }, 400);
  }

  const latest = await c.env.DB.prepare("SELECT id, start_date FROM hourly_rates ORDER BY start_date DESC LIMIT 1")
    .first<{ id: number; start_date: string }>();

  if (latest && startDate <= latest.start_date) {
    return c.json({ error: "A new rate's start date must be after the most recent rate's start date" }, 400);
  }

  if (latest) {
    // Close off the previously open-ended rate the day before this one
    // starts, so the two never overlap.
    await c.env.DB.prepare("UPDATE hourly_rates SET end_date = ? WHERE id = ? AND end_date IS NULL")
      .bind(dayBefore(startDate), latest.id)
      .run();
  }

  const created = await c.env.DB.prepare(
    "INSERT INTO hourly_rates (rate, start_date, end_date) VALUES (?, ?, NULL) RETURNING id, rate, start_date, end_date",
  )
    .bind(rate, startDate)
    .first<RateRow>();

  if (!created) {
    return c.json({ error: "Could not save the rate" }, 500);
  }

  return c.json(toRate(created), 201);
});

export default hourlyRates;
