import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const firms = new Hono<AppEnv>();

firms.use("*", requireAuth);

interface FirmRow {
  id: number;
  name: string;
  contact_email: string | null;
  contact_address: string | null;
  contact_postcode: string | null;
  contact_phone: string | null;
}

function toFirm(row: FirmRow) {
  return {
    id: row.id,
    name: row.name,
    contactEmail: row.contact_email,
    contactAddress: row.contact_address,
    contactPostcode: row.contact_postcode,
    contactPhone: row.contact_phone,
  };
}

// Only ever one row today (Newmans) — see the "Newmans decision" — but a
// list endpoint rather than a singleton keeps this ready for a second firm
// without a shape change later.
firms.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, contact_email, contact_address, contact_postcode, contact_phone FROM intermediary_firms ORDER BY name",
  ).all<FirmRow>();
  return c.json(results.map(toFirm));
});

firms.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid firm id" }, 400);
  }

  const body = await c.req.json<{
    contactEmail?: string | null;
    contactAddress?: string | null;
    contactPostcode?: string | null;
    contactPhone?: string | null;
  }>();

  const existing = await c.env.DB.prepare(
    "SELECT id, name, contact_email, contact_address, contact_postcode, contact_phone FROM intermediary_firms WHERE id = ?",
  )
    .bind(id)
    .first<FirmRow>();
  if (!existing) {
    return c.json({ error: "Firm not found" }, 404);
  }

  const contactEmail = body.contactEmail !== undefined ? body.contactEmail : existing.contact_email;
  const contactAddress = body.contactAddress !== undefined ? body.contactAddress : existing.contact_address;
  const contactPostcode = body.contactPostcode !== undefined ? body.contactPostcode : existing.contact_postcode;
  const contactPhone = body.contactPhone !== undefined ? body.contactPhone : existing.contact_phone;

  const updated = await c.env.DB.prepare(
    `UPDATE intermediary_firms
     SET contact_email = ?, contact_address = ?, contact_postcode = ?, contact_phone = ?
     WHERE id = ?
     RETURNING id, name, contact_email, contact_address, contact_postcode, contact_phone`,
  )
    .bind(contactEmail, contactAddress, contactPostcode, contactPhone, id)
    .first<FirmRow>();

  return c.json(toFirm(updated!));
});

export default firms;
