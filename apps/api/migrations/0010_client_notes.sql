-- Initial meeting / advice notes: a long-form, dated, categorised record of
-- what was discussed and advised for a client, kept separate from time
-- entries since it's meant to be read back later rather than billed.
--
-- Edits never overwrite: `client_notes` is just the note's identity, and
-- every save (first write or later edit) adds a row to
-- `client_note_versions`. The most recent version (highest id) is "the
-- note" for display purposes, but every prior version stays readable as
-- history rather than being lost to a correction.

CREATE TABLE note_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE client_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE client_note_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL REFERENCES client_notes(id),
  category_id INTEGER REFERENCES note_categories(id),
  date TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
