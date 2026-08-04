import { Hono } from "hono";
import { calculateAnitaIncome, INVOICE_STATUSES, isValidInvoiceStatus } from "@sandboxanita1/core";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const invoices = new Hono<AppEnv>();

invoices.use("*", requireAuth);

interface InvoiceRow {
  id: number;
  invoice_date: string;
  client_id: number;
  client_name: string;
  total_amount: number;
  anita_income: number;
  status: string;
  reference: string | null;
  date_settled_client: string | null;
  date_settled_firm: string | null;
}

function toInvoice(row: InvoiceRow) {
  return {
    id: row.id,
    invoiceDate: row.invoice_date,
    clientId: row.client_id,
    clientName: row.client_name,
    totalAmount: row.total_amount,
    anitaIncome: row.anita_income,
    status: row.status,
    reference: row.reference,
    dateSettledClient: row.date_settled_client,
    dateSettledFirm: row.date_settled_firm,
    lagDays: lagDays(row.invoice_date, row.date_settled_firm),
  };
}

// Derived, not stored — the gap between invoice date and final settlement
// (story 1.4). null until the firm has actually settled.
function lagDays(invoiceDate: string, dateSettledFirm: string | null): number | null {
  if (!dateSettledFirm) return null;
  const ms = new Date(dateSettledFirm).getTime() - new Date(invoiceDate).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

invoices.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT invoices.id, invoices.invoice_date, invoices.client_id, clients.name AS client_name,
            invoices.total_amount, invoices.anita_income, invoices.status, invoices.reference,
            invoices.date_settled_client, invoices.date_settled_firm
     FROM invoices
     JOIN clients ON clients.id = invoices.client_id
     ORDER BY invoices.invoice_date DESC, invoices.id DESC`,
  ).all<InvoiceRow>();

  return c.json(results.map(toInvoice));
});

invoices.post("/", async (c) => {
  const body = await c.req.json<{
    invoiceDate?: string;
    clientId?: number;
    totalAmount?: number;
    reference?: string;
  }>();
  const { invoiceDate, clientId, totalAmount, reference } = body;

  if (!invoiceDate || !clientId || totalAmount === undefined) {
    return c.json({ error: "A date, client and amount are required" }, 400);
  }
  if (typeof totalAmount !== "number" || totalAmount <= 0) {
    return c.json({ error: "Enter an amount greater than £0" }, 400);
  }

  // There's only ever been one intermediary firm (Newmans) since the
  // New/Existing split was retired — no UI picker for it, just take
  // whichever firm exists. See the "Newmans decision" in the solution
  // design doc for why this stays a real lookup rather than a hardcoded ID.
  const firm = await c.env.DB.prepare("SELECT id FROM intermediary_firms LIMIT 1").first<{
    id: number;
  }>();

  const anitaIncome = calculateAnitaIncome(totalAmount);

  const created = await c.env.DB.prepare(
    `INSERT INTO invoices (client_id, firm_id, invoice_date, total_amount, anita_income, reference)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id, invoice_date, client_id, total_amount, anita_income, status, reference,
               date_settled_client, date_settled_firm`,
  )
    .bind(clientId, firm?.id ?? null, invoiceDate, totalAmount, anitaIncome, reference ?? null)
    .first<Omit<InvoiceRow, "client_name">>();

  if (!created) {
    return c.json({ error: "Could not save the invoice" }, 500);
  }

  const client = await c.env.DB.prepare("SELECT name FROM clients WHERE id = ?")
    .bind(clientId)
    .first<{ name: string }>();

  return c.json(toInvoice({ ...created, client_name: client?.name ?? "" }), 201);
});

invoices.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid invoice id" }, 400);
  }

  const existing = await c.env.DB.prepare(
    `SELECT id, invoice_date, client_id, total_amount, anita_income, status, reference,
            date_settled_client, date_settled_firm
     FROM invoices WHERE id = ?`,
  )
    .bind(id)
    .first<Omit<InvoiceRow, "client_name">>();

  if (!existing) {
    return c.json({ error: "Invoice not found" }, 404);
  }

  const body = await c.req.json<{
    invoiceDate?: string;
    clientId?: number;
    totalAmount?: number;
    reference?: string | null;
    status?: string;
  }>();

  if (body.status !== undefined && !isValidInvoiceStatus(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }
  if (body.totalAmount !== undefined && (typeof body.totalAmount !== "number" || body.totalAmount <= 0)) {
    return c.json({ error: "Enter an amount greater than £0" }, 400);
  }

  const invoiceDate = body.invoiceDate ?? existing.invoice_date;
  const clientId = body.clientId ?? existing.client_id;
  const totalAmount = body.totalAmount ?? existing.total_amount;
  const reference = body.reference !== undefined ? body.reference : existing.reference;
  const status = body.status ?? existing.status;
  const anitaIncome = body.totalAmount !== undefined ? calculateAnitaIncome(totalAmount) : existing.anita_income;

  // Settlement dates track the status rather than being set independently:
  // reaching a stage for the first time stamps it with today, and stepping
  // back below a stage (correcting a mistake) clears its date.
  const reachedIndex = INVOICE_STATUSES.indexOf(status as (typeof INVOICE_STATUSES)[number]);
  const dateSettledClient =
    reachedIndex >= INVOICE_STATUSES.indexOf("Settled by client")
      ? (existing.date_settled_client ?? today())
      : null;
  const dateSettledFirm =
    reachedIndex >= INVOICE_STATUSES.indexOf("Complete") ? (existing.date_settled_firm ?? today()) : null;

  const updated = await c.env.DB.prepare(
    `UPDATE invoices
     SET client_id = ?, invoice_date = ?, total_amount = ?, anita_income = ?, reference = ?,
         status = ?, date_settled_client = ?, date_settled_firm = ?
     WHERE id = ?
     RETURNING id, invoice_date, client_id, total_amount, anita_income, status, reference,
               date_settled_client, date_settled_firm`,
  )
    .bind(clientId, invoiceDate, totalAmount, anitaIncome, reference, status, dateSettledClient, dateSettledFirm, id)
    .first<Omit<InvoiceRow, "client_name">>();

  if (!updated) {
    return c.json({ error: "Could not update the invoice" }, 500);
  }

  const client = await c.env.DB.prepare("SELECT name FROM clients WHERE id = ?")
    .bind(clientId)
    .first<{ name: string }>();

  return c.json(toInvoice({ ...updated, client_name: client?.name ?? "" }));
});

invoices.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid invoice id" }, 400);
  }

  const result = await c.env.DB.prepare("DELETE FROM invoices WHERE id = ?").bind(id).run();
  if (result.meta.changes === 0) {
    return c.json({ error: "Invoice not found" }, 404);
  }

  return c.json({ ok: true });
});

export default invoices;
