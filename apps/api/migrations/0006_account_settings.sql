-- Registration was previously permanently closed after the first account
-- (story 8.1: single account only) — this reopens it behind a shared
-- invite code rather than leaving it open to anyone who finds the login
-- URL. The code lives here as a singleton row, admin-editable from within
-- the signed-in app, the same pattern as invoice_settings.

CREATE TABLE account_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  invite_code TEXT NOT NULL DEFAULT ''
);

INSERT INTO account_settings (id) VALUES (1);
