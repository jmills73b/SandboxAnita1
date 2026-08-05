-- Time keeping: chargeable time logged against a client, in configurable
-- billing units (e.g. 8-minute units), priced against whichever hourly
-- rate was in effect on the date the work was done. Mirrors patterns
-- already established elsewhere: time_categories is admin-manageable like
-- expense_categories, and each time_entries row snapshots the unit size
-- and rate that applied at creation (rate_at_entry) so a later rate
-- change never retroactively alters a past entry's value — same
-- reasoning as invoice_batches snapshotting invoice_settings.

CREATE TABLE time_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE time_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  unit_minutes INTEGER NOT NULL DEFAULT 8
);

INSERT INTO time_settings (id, unit_minutes) VALUES (1, 8);

-- Multiple rows so a rate history can be kept — end_date is null for the
-- current, still-open rate; adding a new rate closes the previous one off
-- at the day before the new rate's start_date.
CREATE TABLE hourly_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rate REAL NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  matter TEXT,
  date TEXT NOT NULL,
  units INTEGER NOT NULL,
  minutes INTEGER NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER REFERENCES time_categories(id),
  rate_at_entry REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
