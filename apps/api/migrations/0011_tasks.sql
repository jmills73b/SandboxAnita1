-- Task management / reminder service: recurring or one-off things to
-- remember, with a due date and a configurable frequency.
--
-- `tasks` is the reminder's identity and current state (what's next due);
-- `task_occurrences` is a permanent log of every time it was actioned, in
-- the same "identity + append-only history" shape as client_notes /
-- client_note_versions — marking a task done never erases what actually
-- happened, it just advances next_due_date and adds a log row.
--
-- `paused` covers two cases with one flag: a recurring task the user
-- explicitly wants to stop being reminded about, and a one-off ('once')
-- task that's been actioned and has no further occurrence to schedule —
-- both simply stop appearing in the due/notification list.

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_due_date TEXT NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE task_occurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  due_date TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('completed', 'skipped', 'not_needed')),
  acted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
