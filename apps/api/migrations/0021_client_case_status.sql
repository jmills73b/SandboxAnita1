-- A client's engagement lifecycle: Prospective (a lead, not yet doing
-- business) -> Active (currently being worked) -> Closed (matter wrapped
-- up). New clients created through the app default to 'Prospective' at
-- the application layer (see clients.ts) -- this column's own DEFAULT is
-- 'Active' instead, purely so the ~150 clients already in the database
-- from the historical spreadsheet import (all real, already-engaged
-- clients) backfill correctly without a separate UPDATE statement.
ALTER TABLE clients ADD COLUMN case_status TEXT NOT NULL DEFAULT 'Active'
  CHECK (case_status IN ('Prospective', 'Active', 'Closed'));
