-- Clients grow from an implicit, name-only row (auto-created the moment
-- someone's first invoice or time entry is logged) into a proper record:
-- an email, an optional free-text summary, and zero or more category
-- tags. Categories are admin-manageable like expense/time categories, but
-- many-to-many rather than a single FK — a client can be tagged with
-- several types at once (e.g. "Financial Remedy" and "High Net Worth"),
-- and unlike expenses there's no "must have exactly one" requirement, so
-- removing a category just untags whichever clients had it rather than
-- needing an explicit reassignment step.

ALTER TABLE clients ADD COLUMN email TEXT;
ALTER TABLE clients ADD COLUMN summary TEXT;

CREATE TABLE client_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE client_category_links (
  client_id INTEGER NOT NULL REFERENCES clients(id),
  category_id INTEGER NOT NULL REFERENCES client_categories(id),
  PRIMARY KEY (client_id, category_id)
);
