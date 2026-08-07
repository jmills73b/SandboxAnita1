-- Rethinks task lifecycle: a one-off task that's been actioned is now its
-- own 'done' state instead of being lumped in with a manually paused
-- recurring task under a single `paused` flag. The UI needs to tell
-- "finished, archive it" apart from "still pending, just silenced" to
-- group tasks correctly (Late/Getting late/Coming soon vs Recently
-- completed vs Historic).
--
-- Also adds `days_of_week`, letting a daily reminder restrict itself to
-- specific weekdays (e.g. weekends only). Weekly/fortnightly/four-weekly
-- "on a specific day" needs no schema change: adding 7/14/28 days always
-- preserves the weekday of the date you started from, so that's purely a
-- smarter starting-date calculation on the client, not a stored rule.
--
-- Same foreign-key-safe rebuild approach as 0015 (defer_foreign_keys,
-- rebuild task_occurrences too so its FK re-anchors on the real `tasks`
-- table before anything old is dropped).

PRAGMA defer_foreign_keys = ON;

ALTER TABLE tasks RENAME TO tasks_old;

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (
    frequency IN ('once', 'daily', 'weekly', 'fortnightly', 'four_weekly', 'monthly', 'quarterly', 'yearly')
  ),
  days_of_week TEXT,
  next_due_date TEXT NOT NULL,
  due_time TEXT NOT NULL DEFAULT '09:30',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done')),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  client_id INTEGER REFERENCES clients(id)
);

INSERT INTO tasks (
  id, title, description, frequency, next_due_date, due_time, status, completed_at, created_at, client_id
)
SELECT
  id, title, description, frequency, next_due_date, due_time,
  CASE
    WHEN paused = 1 AND frequency = 'once' THEN 'done'
    WHEN paused = 1 THEN 'paused'
    ELSE 'active'
  END,
  CASE
    WHEN paused = 1 AND frequency = 'once'
      THEN (SELECT MAX(acted_at) FROM task_occurrences WHERE task_occurrences.task_id = tasks_old.id)
    ELSE NULL
  END,
  created_at, client_id
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
