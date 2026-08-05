-- Expense categories move from a hardcoded list into real, admin-editable
-- rows. The old `category` column stored the category name as free text
-- directly on each expense — fine for a fixed list, but it means renaming
-- a category would silently orphan every expense already tagged with the
-- old name (they'd stop matching the new preset list). A foreign key
-- fixes that: renaming is a single-row update, instantly reflected on
-- every expense that references it, and removing a category goes through
-- an explicit reassignment step (in the API) rather than leaving expenses
-- pointing at nothing.

CREATE TABLE expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO expense_categories (name, sort_order) VALUES
  ('Subscriptions', 1),
  ('Stationery & Postage', 2),
  ('Travel', 3),
  ('Software', 4),
  ('Professional Fees', 5),
  ('Bank Charges', 6),
  ('Marketing', 7),
  ('Other', 8);

ALTER TABLE expenses ADD COLUMN category_id INTEGER REFERENCES expense_categories(id);

-- Backfill: match each expense's existing free-text category to the new
-- table by name (a no-op today since the feature only just shipped with
-- no real data yet, but correct regardless of when this runs).
UPDATE expenses
SET category_id = (SELECT id FROM expense_categories WHERE expense_categories.name = expenses.category)
WHERE category IS NOT NULL;

ALTER TABLE expenses DROP COLUMN category;
