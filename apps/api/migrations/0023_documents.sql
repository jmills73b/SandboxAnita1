-- Epic 11.1: store client correspondence and case documents. The file bytes
-- themselves live in R2 (encrypted -- see the api's documents.ts route),
-- not here; this table is just the searchable index and audit trail.
--
-- Deletes are soft: deleted_at/deleted_by are set rather than the row being
-- removed, so a document is never actually gone and an admin can see what
-- was deleted, when, and by whom (see GET /api/documents/deleted).

CREATE TABLE document_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  category_id INTEGER REFERENCES document_categories(id),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  iv TEXT NOT NULL,           -- base64 AES-GCM nonce used to encrypt this file, needed to decrypt it
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  deleted_by INTEGER REFERENCES users(id)
);
