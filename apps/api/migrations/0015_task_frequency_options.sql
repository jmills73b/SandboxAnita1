-- Adds daily, fortnightly, and four-weekly to the set of recurrence
-- frequencies a task can have, alongside the existing once/weekly/
-- monthly/quarterly/yearly. SQLite can't alter a CHECK constraint in
-- place, so this recreates the table (same approach as 0003). Unlike
-- 0003, task_occurrences.task_id has a live foreign key into this
-- table, which the plain rename-and-rebuild dance doesn't survive:
-- SQLite's RENAME auto-rewrites *other* tables' FK definitions to
-- follow the new name, so the moment "tasks" becomes "tasks_old",
-- task_occurrences silently starts pointing at tasks_old — and stays
-- broken once that table is dropped, even though a table named
-- `tasks` exists again by commit time. `PRAGMA foreign_keys = OFF`
-- can't fix this either, since it's a no-op mid-transaction and D1
-- runs a whole migration file as one transaction.
--
-- The fix is to rebuild task_occurrences too, so its FK re-anchors on
-- the real `tasks` table before anything old gets dropped, with
-- `defer_foreign_keys` (which *can* be toggled mid-transaction)
-- deferring validation to commit time, by which point everything
-- lines up again.

PRAGMA defer_foreign_keys = ON;

ALTER TABLE tasks RENAME TO tasks_old;

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (
    frequency IN ('once', 'daily', 'weekly', 'fortnightly', 'four_weekly', 'monthly', 'quarterly', 'yearly')
  ),
  next_due_date TEXT NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  client_id INTEGER REFERENCES clients(id),
  due_time TEXT NOT NULL DEFAULT '09:30'
);

INSERT INTO tasks (
  id, title, description, frequency, next_due_date, paused, created_at, client_id, due_time
)
SELECT
  id, title, description, frequency, next_due_date, paused, created_at, client_id, due_time
FROM tasks_old;

DROP TABLE tasks_old;

ALTER TABLE task_occurrences RENAME TO task_occurrences_old;

CREATE TABLE task_occurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  due_date TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('completed', 'skipped', 'not_needed')),
  acted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO task_occurrences (id, task_id, due_date, action, acted_at)
SELECT id, task_id, due_date, action, acted_at
FROM task_occurrences_old;

DROP TABLE task_occurrences_old;
