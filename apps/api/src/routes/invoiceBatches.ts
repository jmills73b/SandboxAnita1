import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const invoiceBatches = new Hono<AppEnv>();

invoiceBatches.use("*", requireAuth);

interface BatchRow {
  id: number;
  reference: string;
  invoice_date: string;
  total_fee: number;
  total_amount_due: number;
  from_name: string;
  from_email: string;
  from_address: string;
  from_postcode: string;
  from_phone: string;
  bill_name: string;
  bill_email: string;
  bill_address: string;
  bill_postcode: string;
  bill_phone: string;
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
  created_at: string;
}

interface LineItemRow {
  id: number;
  invoice_date: string;
  reference: string | null;
  matter: string | null;
  client_name: string;
  total_amount: number;
  anita_income: number;
}

const BATCH_COLUMNS = `id, reference, invoice_date, total_fee, total_amount_due,
       from_name, from_email, from_address, from_postcode, from_phone,
       bill_name, bill_email, bill_address, bill_postcode, bill_phone,
       bank_account_name, bank_sort_code, bank_account_number, created_at`;

function toLineItem(row: LineItemRow) {
  return {
    id: row.id,
    invoiceDate: row.invoice_date,
    fileNo: row.reference,
    matter: row.matter,
    clientName: row.client_name,
    totalAmount: row.total_amount,
    anitaIncome: row.anita_income,
  };
}

function toBatchDetail(row: BatchRow, lineItems: LineItemRow[]) {
  return {
    id: row.id,
    reference: row.reference,
    invoiceDate: row.invoice_date,
    totalFee: row.total_fee,
    totalAmountDue: row.total_amount_due,
    createdAt: row.created_at,
    from: {
      name: row.from_name,
      email: row.from_email,
      address: row.from_address,
      postcode: row.from_postcode,
      phone: row.from_phone,
    },
    billTo: {
      name: row.bill_name,
      email: row.bill_email,
      address: row.bill_address,
      postcode: row.bill_postcode,
      phone: row.bill_phone,
    },
    bank: {
      accountName: row.bank_account_name,
      sortCode: row.bank_sort_code,
      accountNumber: row.bank_account_number,
    },
    lineItems: lineItems.map(toLineItem),
  };
}

async function fetchLineItems(db: D1Database, batchId: number): Promise<LineItemRow[]> {
  const { results } = await db
    .prepare(
      `SELECT invoices.id, invoices.invoice_date, invoices.reference, invoices.matter,
              clients.name AS client_name, invoices.total_amount, invoices.anita_income
       FROM invoices
       JOIN clients ON clients.id = invoices.client_id
       WHERE invoices.batch_id = ?
       ORDER BY invoices.invoice_date`,
    )
    .bind(batchId)
    .all<LineItemRow>();
  return results;
}

// Summary list for the historical batches view — no line items, just
// enough to show what's been sent and let you drill into one.
invoiceBatches.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, reference, invoice_date, total_fee, total_amount_due, bill_name, created_at
     FROM invoice_batches
     ORDER BY invoice_date DESC, id DESC`,
  ).all<{
    id: number;
    reference: string;
    invoice_date: string;
    total_fee: number;
    total_amount_due: number;
    bill_name: string;
    created_at: string;
  }>();

  return c.json(
    results.map((row) => ({
      id: row.id,
      reference: row.reference,
      invoiceDate: row.invoice_date,
      totalFee: row.total_fee,
      totalAmountDue: row.total_amount_due,
      billToName: row.bill_name,
      createdAt: row.created_at,
    })),
  );
});

invoiceBatches.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid batch id" }, 400);
  }

  const row = await c.env.DB.prepare(`SELECT ${BATCH_COLUMNS} FROM invoice_batches WHERE id = ?`)
    .bind(id)
    .first<BatchRow>();
  if (!row) {
    return c.json({ error: "Invoice batch not found" }, 404);
  }

  const lineItems = await fetchLineItems(c.env.DB, id);
  return c.json(toBatchDetail(row, lineItems));
});

invoiceBatches.post("/", async (c) => {
  const body = await c.req.json<{
    invoiceIds?: number[];
    firmId?: number;
    invoiceDate?: string;
  }>();

  const invoiceIds = body.invoiceIds;
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0 || !invoiceIds.every(Number.isInteger)) {
    return c.json({ error: "Select at least one invoice to bill" }, 400);
  }
  if (!Number.isInteger(body.firmId)) {
    return c.json({ error: "A firm to bill is required" }, 400);
  }
  if (!body.invoiceDate) {
    return c.json({ error: "An invoice date is required" }, 400);
  }

  // Every selected invoice must actually be available to bill — already
  // paid by the client, not paid to Anita yet, and not already billed in
  // an earlier batch. Checked as a single set rather than per-row so a
  // stale selection (e.g. someone else already batched one) fails the
  // whole request instead of silently billing a partial, wrong set.
  const placeholders = invoiceIds.map(() => "?").join(", ");
  const { results: candidates } = await c.env.DB.prepare(
    `SELECT id, status, batch_id, total_amount, anita_income
     FROM invoices WHERE id IN (${placeholders})`,
  )
    .bind(...invoiceIds)
    .all<{ id: number; status: string; batch_id: number | null; total_amount: number; anita_income: number }>();

  if (candidates.length !== invoiceIds.length) {
    return c.json({ error: "One or more selected invoices could not be found" }, 400);
  }
  const notEligible = candidates.some(
    (row) => row.status !== "Awaiting payment to Anita" || row.batch_id !== null,
  );
  if (notEligible) {
    return c.json(
      { error: "One or more selected invoices are no longer available to bill — refresh and try again" },
      400,
    );
  }

  const firm = await c.env.DB.prepare(
    "SELECT id, name, contact_email, contact_address, contact_postcode, contact_phone FROM intermediary_firms WHERE id = ?",
  )
    .bind(body.firmId)
    .first<{
      id: number;
      name: string;
      contact_email: string | null;
      contact_address: string | null;
      contact_postcode: string | null;
      contact_phone: string | null;
    }>();
  if (!firm) {
    return c.json({ error: "Firm not found" }, 404);
  }

  const settings = await c.env.DB.prepare(
    `SELECT from_name, from_email, from_address, from_postcode, from_phone,
            bank_account_name, bank_sort_code, bank_account_number,
            reference_prefix, next_reference_number
     FROM invoice_settings WHERE id = 1`,
  ).first<{
    from_name: string;
    from_email: string;
    from_address: string;
    from_postcode: string;
    from_phone: string;
    bank_account_name: string;
    bank_sort_code: string;
    bank_account_number: string;
    reference_prefix: string;
    next_reference_number: number;
  }>();
  if (!settings) {
    return c.json({ error: "Invoice settings haven't been set up yet" }, 500);
  }

  const totalFee = candidates.reduce((sum, row) => sum + row.total_amount, 0);
  const totalAmountDue = candidates.reduce((sum, row) => sum + row.anita_income, 0);
  const reference = `${settings.reference_prefix}${String(settings.next_reference_number).padStart(4, "0")}`;

  const created = await c.env.DB.prepare(
    `INSERT INTO invoice_batches (
       reference, firm_id, invoice_date, total_fee, total_amount_due,
       from_name, from_email, from_address, from_postcode, from_phone,
       bill_name, bill_email, bill_address, bill_postcode, bill_phone,
       bank_account_name, bank_sort_code, bank_account_number
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING ${BATCH_COLUMNS}`,
  )
    .bind(
      reference,
      firm.id,
      body.invoiceDate,
      totalFee,
      totalAmountDue,
      settings.from_name,
      settings.from_email,
      settings.from_address,
      settings.from_postcode,
      settings.from_phone,
      firm.name,
      firm.contact_email ?? "",
      firm.contact_address ?? "",
      firm.contact_postcode ?? "",
      firm.contact_phone ?? "",
      settings.bank_account_name,
      settings.bank_sort_code,
      settings.bank_account_number,
    )
    .first<BatchRow>();

  if (!created) {
    return c.json({ error: "Could not create the invoice" }, 500);
  }

  await c.env.DB.prepare(`UPDATE invoices SET batch_id = ? WHERE id IN (${placeholders})`)
    .bind(created.id, ...invoiceIds)
    .run();

  await c.env.DB.prepare("UPDATE invoice_settings SET next_reference_number = ? WHERE id = 1")
    .bind(settings.next_reference_number + 1)
    .run();

  const lineItems = await fetchLineItems(c.env.DB, created.id);
  return c.json(toBatchDetail(created, lineItems), 201);
});

export default invoiceBatches;
