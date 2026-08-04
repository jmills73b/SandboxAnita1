-- Increment 0: initial schema. See the solution design doc's data model
-- (https://claude.ai/code/artifact/feec7f18-c62b-4e3e-880b-8a0c7faca86f) for the
-- entity reference this mirrors.

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  first_invoice_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per firm an invoice can be routed through. Seeded with Newmans, the only
-- one in use today. Anita could work through a second firm in future (confirmed),
-- so this is a real table rather than a hardcoded status string — see the
-- "Newmans decision" in the solution design doc.
CREATE TABLE intermediary_firms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_email TEXT
);

INSERT INTO intermediary_firms (name, contact_email) VALUES ('Newmans', 'sbabar@ranewman.co.uk');

-- One row per UK tax year. rates_confirmed_at backs the story 5.5 nudge banner.
CREATE TABLE tax_year_settings (
  tax_year TEXT PRIMARY KEY,          -- e.g. '2026/27'
  start_date TEXT NOT NULL,           -- 6 April that year
  monthly_target REAL NOT NULL,
  split_percentage REAL NOT NULL,     -- single rate — the old New/Existing split was retired
  personal_allowance REAL NOT NULL,
  basic_rate REAL NOT NULL,
  basic_rate_threshold REAL NOT NULL,
  higher_rate REAL NOT NULL,
  higher_rate_threshold REAL NOT NULL,
  ni_lower_threshold REAL NOT NULL,
  ni_upper_threshold REAL NOT NULL,
  ni_lower_rate REAL NOT NULL,
  ni_upper_rate REAL NOT NULL,
  class2_flat_rate REAL NOT NULL,
  rates_confirmed_at TEXT
);

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
      'Invoice sent to client',
      'Settled by client',
      'Invoice sent to intermediary firm',
      'Complete'
    )
  ),
  reference TEXT,
  date_settled_client TEXT,
  date_settled_firm TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  cost REAL NOT NULL,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_expenses_date ON expenses(date);
