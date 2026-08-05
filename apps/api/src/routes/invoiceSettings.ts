import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const invoiceSettings = new Hono<AppEnv>();

invoiceSettings.use("*", requireAuth);

interface SettingsRow {
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
}

function toSettings(row: SettingsRow) {
  return {
    fromName: row.from_name,
    fromEmail: row.from_email,
    fromAddress: row.from_address,
    fromPostcode: row.from_postcode,
    fromPhone: row.from_phone,
    bankAccountName: row.bank_account_name,
    bankSortCode: row.bank_sort_code,
    bankAccountNumber: row.bank_account_number,
    referencePrefix: row.reference_prefix,
    nextReferenceNumber: row.next_reference_number,
  };
}

const SETTINGS_COLUMNS = `from_name, from_email, from_address, from_postcode, from_phone,
       bank_account_name, bank_sort_code, bank_account_number, reference_prefix, next_reference_number`;

invoiceSettings.get("/", async (c) => {
  const row = await c.env.DB.prepare(`SELECT ${SETTINGS_COLUMNS} FROM invoice_settings WHERE id = 1`).first<SettingsRow>();
  if (!row) {
    return c.json({ error: "Invoice settings not found" }, 500);
  }
  return c.json(toSettings(row));
});

invoiceSettings.put("/", async (c) => {
  const body = await c.req.json<{
    fromName?: string;
    fromEmail?: string;
    fromAddress?: string;
    fromPostcode?: string;
    fromPhone?: string;
    bankAccountName?: string;
    bankSortCode?: string;
    bankAccountNumber?: string;
    referencePrefix?: string;
    nextReferenceNumber?: number;
  }>();

  if (!body.referencePrefix?.trim()) {
    return c.json({ error: "Enter a reference prefix" }, 400);
  }
  if (!Number.isInteger(body.nextReferenceNumber) || (body.nextReferenceNumber ?? 0) < 1) {
    return c.json({ error: "Enter a next reference number of 1 or more" }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE invoice_settings
     SET from_name = ?, from_email = ?, from_address = ?, from_postcode = ?, from_phone = ?,
         bank_account_name = ?, bank_sort_code = ?, bank_account_number = ?,
         reference_prefix = ?, next_reference_number = ?
     WHERE id = 1`,
  )
    .bind(
      body.fromName ?? "",
      body.fromEmail ?? "",
      body.fromAddress ?? "",
      body.fromPostcode ?? "",
      body.fromPhone ?? "",
      body.bankAccountName ?? "",
      body.bankSortCode ?? "",
      body.bankAccountNumber ?? "",
      body.referencePrefix.trim(),
      body.nextReferenceNumber,
    )
    .run();

  const row = await c.env.DB.prepare(`SELECT ${SETTINGS_COLUMNS} FROM invoice_settings WHERE id = 1`).first<SettingsRow>();
  return c.json(toSettings(row!));
});

export default invoiceSettings;
