-- Invoice generator: batches a set of invoices that are "Awaiting payment
-- to Anita" into one consolidated invoice sent to the intermediary firm,
-- matching the layout of the old spreadsheet's INVOICE tab.

-- Singleton settings row holding Anita's own letterhead details, bank
-- details, and the reference sequence. This is personal/financial data, so
-- it lives in the database as an editable admin setting rather than being
-- hardcoded into source — she asked for exactly this ("admin function to
-- store the ... sequence number ... and changeable. Also the address and
-- phone for Anita").
CREATE TABLE invoice_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  from_name TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL DEFAULT '',
  from_address TEXT NOT NULL DEFAULT '',
  from_postcode TEXT NOT NULL DEFAULT '',
  from_phone TEXT NOT NULL DEFAULT '',
  bank_account_name TEXT NOT NULL DEFAULT '',
  bank_sort_code TEXT NOT NULL DEFAULT '',
  bank_account_number TEXT NOT NULL DEFAULT '',
  reference_prefix TEXT NOT NULL DEFAULT 'AMILLS',
  next_reference_number INTEGER NOT NULL DEFAULT 1
);

INSERT INTO invoice_settings (id) VALUES (1);

-- The "Bill to" side of the letterhead is the intermediary firm's own
-- contact details — that table already exists (and already anticipates a
-- second firm one day), so it gains the address/phone fields rather than
-- duplicating them into invoice_settings.
ALTER TABLE intermediary_firms ADD COLUMN contact_address TEXT;
ALTER TABLE intermediary_firms ADD COLUMN contact_postcode TEXT;
ALTER TABLE intermediary_firms ADD COLUMN contact_phone TEXT;

-- One row per generated batch invoice. The letterhead/bank fields are
-- snapshotted at generation time (copied in, not looked up live) so that
-- regenerating an old invoice always reproduces exactly what was actually
-- sent, even if the settings or firm details change later.
CREATE TABLE invoice_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  firm_id INTEGER REFERENCES intermediary_firms(id),
  invoice_date TEXT NOT NULL,
  total_fee REAL NOT NULL,
  total_amount_due REAL NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_postcode TEXT NOT NULL,
  from_phone TEXT NOT NULL,
  bill_name TEXT NOT NULL,
  bill_email TEXT NOT NULL,
  bill_address TEXT NOT NULL,
  bill_postcode TEXT NOT NULL,
  bill_phone TEXT NOT NULL,
  bank_account_name TEXT NOT NULL,
  bank_sort_code TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Matter (case type, e.g. "Financial Remedy") — separate from the client
-- name, since one client can have more than one matter over time. The
-- existing "reference" column is repurposed as the case file number (the
-- spreadsheet's "File No.") — it already existed but was never surfaced in
-- the UI, so no new column needed for that one.
ALTER TABLE invoices ADD COLUMN matter TEXT;

-- Which batch invoice (if any) this line item has been billed under. Once
-- set, the invoice generator excludes it from the "available to batch"
-- list — an invoice is only ever billed to the firm once.
ALTER TABLE invoices ADD COLUMN batch_id INTEGER REFERENCES invoice_batches(id);
