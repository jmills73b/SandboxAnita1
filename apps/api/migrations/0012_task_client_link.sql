-- Follow-up reminders: a task can optionally be tied to a client (e.g.
-- "Follow up with Jane Roe" created straight from her notes panel), while
-- most tasks (renewals, admin chores) stay unlinked. Nullable rather than
-- a required FK, since tasks existed before this and most aren't
-- client-specific.

ALTER TABLE tasks ADD COLUMN client_id INTEGER REFERENCES clients(id);
