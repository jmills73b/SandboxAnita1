-- Reminders can carry an optional time of day alongside their due date.
-- There's no background notifier in this app (on-demand only, same as
-- everywhere else) so a time doesn't cause anything to fire at that
-- moment — it's shown alongside the date, and "overdue" stays date-level
-- as before. Defaults to 09:30 so every task has a sensible time to show
-- even when nobody picked one.

ALTER TABLE tasks ADD COLUMN due_time TEXT NOT NULL DEFAULT '09:30';
