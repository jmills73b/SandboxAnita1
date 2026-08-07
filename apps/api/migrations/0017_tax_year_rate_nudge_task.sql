-- Seeds the one-off "confirm this year's tax rates" reminder (story 5.5)
-- as a normal yearly-recurring task rather than new banner/dashboard
-- machinery — the recurring-task engine already does everything this
-- needed (due date, badge count, urgency grouping), so this is a single
-- data row, not a schema or code change. Guarded with a WHERE NOT EXISTS
-- so re-running this file (or restoring from a backup that already has
-- it) never creates a duplicate.
INSERT INTO tasks (title, description, frequency, next_due_date, status, client_id)
SELECT
  'Confirm this year''s tax rates',
  'Check HMRC''s published Income Tax, NI and personal allowance figures for the new tax year, then update Admin & Settings → Billing → Tax year rates.',
  'yearly',
  '2027-04-01',
  'active',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Confirm this year''s tax rates' AND frequency = 'yearly'
);
