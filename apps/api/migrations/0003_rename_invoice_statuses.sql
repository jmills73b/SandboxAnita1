-- Renames the invoice status labels to match the language already used for
-- the settlement-date fields ("Paid to Newmans" / "Paid to Anita"), and
-- makes the two waiting stages read consistently ("Awaiting ..."):
--   Invoice sent to client             -> Awaiting client payment
--   Settled by client                  -> Paid to Newmans
--   Invoice sent to intermediary firm  -> Awaiting payment to Anita
-- "In progress" and "Complete" are unchanged. SQLite can't alter a CHECK
-- constraint in place, so this recreates the table (same approach as
-- 0002) rather than trying to patch it — no other table has a foreign key
-- into invoices, so that's safe here.

ALTER TABLE invoices RENAME TO invoices_old;

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  firm_id INTEGER REFERENCES intermediary_firms(id),
  invoice_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  anita_income REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'In progress' CHECK (
    status IN (
      'In progress',
      'Awaiting client payment',
      'Paid to Newmans',
      'Awaiting payment to Anita',
      'Complete'
    )
  ),
  reference TEXT,
  date_settled_client TEXT,
  date_settled_firm TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO invoices (
  id, client_id, firm_id, invoice_date, total_amount, anita_income, status,
  reference, date_settled_client, date_settled_firm, created_at
)
SELECT
  id, client_id, firm_id, invoice_date, total_amount, anita_income,
  CASE status
    WHEN 'Invoice sent to client' THEN 'Awaiting client payment'
    WHEN 'Settled by client' THEN 'Paid to Newmans'
    WHEN 'Invoice sent to intermediary firm' THEN 'Awaiting payment to Anita'
    ELSE status
  END,
  reference, date_settled_client, date_settled_firm, created_at
FROM invoices_old;

DROP TABLE invoices_old;

CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_client ON invoices(client_id);
