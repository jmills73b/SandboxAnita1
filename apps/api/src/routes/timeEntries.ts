import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";
import { rateForDate } from "./hourlyRates";

const timeEntries = new Hono<AppEnv>();

timeEntries.use("*", requireAuth);

interface TimeEntryRow {
  id: number;
  client_id: number;
  client_name: string;
  matter: string | null;
  date: string;
  units: number;
  minutes: number;
  description: string;
  category_id: number | null;
  category_name: string | null;
  rate_at_entry: number | null;
}

function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}

function toTimeEntry(row: TimeEntryRow) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    matter: row.matter,
    date: row.date,
    units: row.units,
    minutes: row.minutes,
    description: row.description,
    categoryId: row.category_id,
    category: row.category_name,
    rateAtEntry: row.rate_at_entry,
    feeValue: row.rate_at_entry != null ? roundToPence((row.minutes / 60) * row.rate_at_entry) : null,
  };
}

const SELECT_COLUMNS = `
  time_entries.id, time_entries.client_id, clients.name AS client_name, time_entries.matter,
  time_entries.date, time_entries.units, time_entries.minutes, time_entries.description,
  time_entries.category_id, time_categories.name AS category_name, time_entries.rate_at_entry
`;

async function fetchTimeEntry(db: D1Database, id: number): Promise<TimeEntryRow | null> {
  return db
    .prepare(
      `SELECT ${SELECT_COLUMNS}
       FROM time_entries
       JOIN clients ON clients.id = time_entries.client_id
       LEFT JOIN time_categories ON time_categories.id = time_entries.category_id
       WHERE time_entries.id = ?`,
    )
    .bind(id)
    .first<TimeEntryRow>();
}

async function categoryExists(db: D1Database, categoryId: number): Promise<boolean> {
  const row = await db.prepare("SELECT id FROM time_categories WHERE id = ?").bind(categoryId).first();
  return row !== null;
}

async function unitMinutes(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT unit_minutes FROM time_settings WHERE id = 1").first<{
    unit_minutes: number;
  }>();
  return row?.unit_minutes ?? 8;
}

timeEntries.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${SELECT_COLUMNS}
     FROM time_entries
     JOIN clients ON clients.id = time_entries.client_id
     LEFT JOIN time_categories ON time_categories.id = time_entries.category_id
     ORDER BY time_entries.date DESC, time_entries.id DESC`,
  ).all<TimeEntryRow>();

  return c.json(results.map(toTimeEntry));
});

timeEntries.post("/", async (c) => {
  const body = await c.req.json<{
    date?: string;
    clientId?: number;
    matter?: string;
    units?: number;
    description?: string;
    categoryId?: number | null;
  }>();
  const { date, clientId, units } = body;
  const description = body.description?.trim();
  const matter = body.matter?.trim() || null;

  if (!date || !clientId || !description || units === undefined) {
    return c.json({ error: "A date, client, description and number of units are required" }, 400);
  }
  if (!Number.isInteger(units) || units <= 0) {
    return c.json({ error: "Enter a whole number of units greater than 0" }, 400);
  }
  if (body.categoryId != null && !(await categoryExists(c.env.DB, body.categoryId))) {
    return c.json({ error: "Invalid category" }, 400);
  }

  const minutes = units * (await unitMinutes(c.env.DB));
  const rate = await rateForDate(c.env.DB, date);

  const created = await c.env.DB.prepare(
    `INSERT INTO time_entries (client_id, matter, date, units, minutes, description, category_id, rate_at_entry)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
  )
    .bind(clientId, matter, date, units, minutes, description, body.categoryId ?? null, rate)
    .first<{ id: number }>();

  if (!created) {
    return c.json({ error: "Could not save the time entry" }, 500);
  }

  const entry = await fetchTimeEntry(c.env.DB, created.id);
  return c.json(toTimeEntry(entry!), 201);
});

timeEntries.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid time entry id" }, 400);
  }

  const existing = await fetchTimeEntry(c.env.DB, id);
  if (!existing) {
    return c.json({ error: "Time entry not found" }, 404);
  }

  const body = await c.req.json<{
    date?: string;
    clientId?: number;
    matter?: string | null;
    units?: number;
    description?: string;
    categoryId?: number | null;
  }>();

  if (body.units !== undefined && (!Number.isInteger(body.units) || body.units <= 0)) {
    return c.json({ error: "Enter a whole number of units greater than 0" }, 400);
  }
  if (body.categoryId != null && !(await categoryExists(c.env.DB, body.categoryId))) {
    return c.json({ error: "Invalid category" }, 400);
  }
  const trimmedDescription = body.description?.trim();
  if (body.description !== undefined && !trimmedDescription) {
    return c.json({ error: "Enter a description" }, 400);
  }

  const date = body.date ?? existing.date;
  const clientId = body.clientId ?? existing.client_id;
  const matter = body.matter !== undefined ? body.matter?.trim() || null : existing.matter;
  const units = body.units ?? existing.units;
  const description = trimmedDescription ?? existing.description;
  const categoryId = body.categoryId !== undefined ? body.categoryId : existing.category_id;

  // Units or the date changing means the minutes/rate snapshot this entry
  // was saved with is stale — recompute both from current settings, same
  // as a fresh entry would get.
  const minutes = body.units !== undefined ? units * (await unitMinutes(c.env.DB)) : existing.minutes;
  const rate = body.date !== undefined ? await rateForDate(c.env.DB, date) : existing.rate_at_entry;

  await c.env.DB.prepare(
    `UPDATE time_entries
     SET client_id = ?, matter = ?, date = ?, units = ?, minutes = ?, description = ?, category_id = ?, rate_at_entry = ?
     WHERE id = ?`,
  )
    .bind(clientId, matter, date, units, minutes, description, categoryId, rate, id)
    .run();

  const updated = await fetchTimeEntry(c.env.DB, id);
  if (!updated) {
    return c.json({ error: "Could not update the time entry" }, 500);
  }

  return c.json(toTimeEntry(updated));
});

timeEntries.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid time entry id" }, 400);
  }

  const result = await c.env.DB.prepare("DELETE FROM time_entries WHERE id = ?").bind(id).run();
  if (result.meta.changes === 0) {
    return c.json({ error: "Time entry not found" }, 404);
  }

  return c.json({ ok: true });
});

export default timeEntries;
