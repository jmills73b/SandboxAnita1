import { Hono } from "hono";
import { isValidClientCaseStatus } from "@sandboxanita1/core";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const clients = new Hono<AppEnv>();

clients.use("*", requireAuth);

interface ClientRow {
  id: number;
  name: string;
  email: string | null;
  summary: string | null;
  first_invoice_date: string | null;
  case_status: string;
}

interface CategoryLinkRow {
  client_id: number;
  category_id: number;
  category_name: string;
}

function toClient(row: ClientRow, categories: { id: number; name: string }[]) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    summary: row.summary,
    first_invoice_date: row.first_invoice_date,
    caseStatus: row.case_status,
    categories,
  };
}

async function fetchCategoryLinks(db: D1Database, clientId?: number): Promise<CategoryLinkRow[]> {
  const query = clientId
    ? db
        .prepare(
          `SELECT client_category_links.client_id, client_categories.id AS category_id, client_categories.name AS category_name
           FROM client_category_links
           JOIN client_categories ON client_categories.id = client_category_links.category_id
           WHERE client_category_links.client_id = ?
           ORDER BY client_categories.sort_order, client_categories.name`,
        )
        .bind(clientId)
    : db.prepare(
        `SELECT client_category_links.client_id, client_categories.id AS category_id, client_categories.name AS category_name
         FROM client_category_links
         JOIN client_categories ON client_categories.id = client_category_links.category_id
         ORDER BY client_categories.sort_order, client_categories.name`,
      );

  const { results } = await query.all<CategoryLinkRow>();
  return results;
}

async function categoriesExist(db: D1Database, categoryIds: number[]): Promise<boolean> {
  if (categoryIds.length === 0) return true;
  const placeholders = categoryIds.map(() => "?").join(",");
  const { results } = await db
    .prepare(`SELECT id FROM client_categories WHERE id IN (${placeholders})`)
    .bind(...categoryIds)
    .all<{ id: number }>();
  return results.length === categoryIds.length;
}

async function setCategoryLinks(db: D1Database, clientId: number, categoryIds: number[]): Promise<void> {
  await db.prepare("DELETE FROM client_category_links WHERE client_id = ?").bind(clientId).run();
  for (const categoryId of categoryIds) {
    await db
      .prepare("INSERT INTO client_category_links (client_id, category_id) VALUES (?, ?)")
      .bind(clientId, categoryId)
      .run();
  }
}

async function fetchClient(db: D1Database, id: number): Promise<ReturnType<typeof toClient> | null> {
  const row = await db
    .prepare("SELECT id, name, email, summary, first_invoice_date, case_status FROM clients WHERE id = ?")
    .bind(id)
    .first<ClientRow>();
  if (!row) return null;

  const links = await fetchCategoryLinks(db, id);
  return toClient(
    row,
    links.map((l) => ({ id: l.category_id, name: l.category_name })),
  );
}

clients.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, email, summary, first_invoice_date, case_status FROM clients ORDER BY name",
  ).all<ClientRow>();

  const links = await fetchCategoryLinks(c.env.DB);
  const categoriesByClient = new Map<number, { id: number; name: string }[]>();
  for (const link of links) {
    const list = categoriesByClient.get(link.client_id) ?? [];
    list.push({ id: link.category_id, name: link.category_name });
    categoriesByClient.set(link.client_id, list);
  }

  return c.json(results.map((row) => toClient(row, categoriesByClient.get(row.id) ?? [])));
});

clients.post("/", async (c) => {
  const body = await c.req.json<{
    name?: string;
    email?: string | null;
    summary?: string | null;
    categoryIds?: number[];
    caseStatus?: string;
  }>();
  const trimmed = body.name?.trim();
  if (!trimmed) {
    return c.json({ error: "Client name is required" }, 400);
  }

  if (body.caseStatus !== undefined && !isValidClientCaseStatus(body.caseStatus)) {
    return c.json({ error: "Invalid case status" }, 400);
  }
  // Contacts created through the app (directly, or auto-created inline
  // while adding an invoice/time entry) start life as a lead, not an
  // already-active engagement -- the ~150 clients already in the
  // database from the historical import predate this field entirely and
  // get 'Active' from the column's own DEFAULT instead (see migration
  // 0021), never through this code path.
  const caseStatus = body.caseStatus ?? "Prospective";

  const categoryIds = body.categoryIds ?? [];
  if (!(await categoriesExist(c.env.DB, categoryIds))) {
    return c.json({ error: "Invalid category" }, 400);
  }

  const created = await c.env.DB.prepare(
    "INSERT INTO clients (name, email, summary, case_status) VALUES (?, ?, ?, ?) RETURNING id",
  )
    .bind(trimmed, body.email?.trim() || null, body.summary?.trim() || null, caseStatus)
    .first<{ id: number }>();

  if (!created) {
    return c.json({ error: "Could not save the client" }, 500);
  }

  if (categoryIds.length > 0) {
    await setCategoryLinks(c.env.DB, created.id, categoryIds);
  }

  const client = await fetchClient(c.env.DB, created.id);
  return c.json(client, 201);
});

clients.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid client id" }, 400);
  }

  const existing = await fetchClient(c.env.DB, id);
  if (!existing) {
    return c.json({ error: "Client not found" }, 404);
  }

  const body = await c.req.json<{
    name?: string;
    email?: string | null;
    summary?: string | null;
    categoryIds?: number[];
    caseStatus?: string;
  }>();

  const trimmedName = body.name?.trim();
  if (body.name !== undefined && !trimmedName) {
    return c.json({ error: "Client name is required" }, 400);
  }
  if (body.categoryIds !== undefined && !(await categoriesExist(c.env.DB, body.categoryIds))) {
    return c.json({ error: "Invalid category" }, 400);
  }
  if (body.caseStatus !== undefined && !isValidClientCaseStatus(body.caseStatus)) {
    return c.json({ error: "Invalid case status" }, 400);
  }

  const name = trimmedName ?? existing.name;
  const email = body.email !== undefined ? body.email?.trim() || null : existing.email;
  const summary = body.summary !== undefined ? body.summary?.trim() || null : existing.summary;
  const caseStatus = body.caseStatus ?? existing.caseStatus;

  await c.env.DB.prepare("UPDATE clients SET name = ?, email = ?, summary = ?, case_status = ? WHERE id = ?")
    .bind(name, email, summary, caseStatus, id)
    .run();

  if (body.categoryIds !== undefined) {
    await setCategoryLinks(c.env.DB, id, body.categoryIds);
  }

  const updated = await fetchClient(c.env.DB, id);
  return c.json(updated);
});

export default clients;
