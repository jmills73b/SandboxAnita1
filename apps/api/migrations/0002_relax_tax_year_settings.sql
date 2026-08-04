-- Increment 2 needs to be able to set just a monthly income target for the
-- current tax year, before the tax/NI rate research (Increment 4) has
-- happened. The original schema required every rate field up front, which
-- would block that. No rows exist yet, so this recreates the table rather
-- than trying to alter individual column constraints (SQLite can't drop a
-- NOT NULL in place).

DROP TABLE IF EXISTS tax_year_settings;

CREATE TABLE tax_year_settings (
  tax_year TEXT PRIMARY KEY,          -- e.g. '2026/27'
  start_date TEXT NOT NULL,           -- 6 April that year
  monthly_target REAL NOT NULL,
  split_percentage REAL NOT NULL DEFAULT 0.75,
  personal_allowance REAL,
  basic_rate REAL,
  basic_rate_threshold REAL,
  higher_rate REAL,
  higher_rate_threshold REAL,
  ni_lower_threshold REAL,
  ni_upper_threshold REAL,
  ni_lower_rate REAL,
  ni_upper_rate REAL,
  class2_flat_rate REAL,
  rates_confirmed_at TEXT
);
