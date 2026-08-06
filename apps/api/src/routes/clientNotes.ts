import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const clientNotes = new Hono<AppEnv>();

clientNotes.use("*", requireAuth);

interface NoteRow {
  id: number;
  client_id: number;
  client_name: string;
  created_at: string;
}

interface VersionRow {
  id: number;
  note_id: number;
  category_id: number | null;
  category_name: string | null;
  date: string;
  body: string;
  created_at: string;
}

function toVersion(row: VersionRow) {
  return {
    id: row.id,
    date: row.date,
    categoryId: row.category_id,
    category: row.category_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function toNote(note: NoteRow, versions: VersionRow[]) {
  return {
    id: note.id,
    clientId: note.client_id,
    clientName: note.client_name,
    createdAt: note.created_at,
    versions: versions.map(toVersion),
  };
}

const VERSION_COLUMNS = `
  client_note_versions.id, client_note_versions.note_id, client_note_versions.category_id,
  note_categories.name AS category_name, client_note_versions.date, client_note_versions.body,
  client_note_versions.created_at
`;

const NOTE_COLUMNS = `
  client_notes.id, client_notes.client_id, clients.name AS client_name, client_notes.created_at
`;

async function fetchVersions(db: D1Database, noteId: number): Promise<VersionRow[]> {
  const { results } = await db
    .prepare(
      `SELECT ${VERSION_COLUMNS}
       FROM client_note_versions
       LEFT JOIN note_categories ON note_categories.id = client_note_versions.category_id
       WHERE client_note_versions.note_id = ?
       ORDER BY client_note_versions.id DESC`,
    )
    .bind(noteId)
    .all<VersionRow>();
  return results;
}

async function fetchNote(db: D1Database, id: number): Promise<NoteRow | null> {
  return db
    .prepare(
      `SELECT ${NOTE_COLUMNS}
       FROM client_notes
       JOIN clients ON clients.id = client_notes.client_id
       WHERE client_notes.id = ?`,
    )
    .bind(id)
    .first<NoteRow>();
}

async function categoryExists(db: D1Database, categoryId: number): Promise<boolean> {
  const row = await db.prepare("SELECT id FROM note_categories WHERE id = ?").bind(categoryId).first();
  return row !== null;
}

// The list view only needs each note's latest version (for the preview
// row), not its full history — fetching every version up front and taking
// the first one seen per note (rows arrive newest-first) is simpler than a
// correlated subquery, and matches how client categories are joined in JS
// elsewhere in this codebase rather than in SQL.
clientNotes.get("/", async (c) => {
  const { results: noteRows } = await c.env.DB.prepare(
    `SELECT ${NOTE_COLUMNS}
     FROM client_notes
     JOIN clients ON clients.id = client_notes.client_id
     ORDER BY client_notes.id DESC`,
  ).all<NoteRow>();

  const { results: versionRows } = await c.env.DB.prepare(
    `SELECT ${VERSION_COLUMNS}
     FROM client_note_versions
     LEFT JOIN note_categories ON note_categories.id = client_note_versions.category_id
     ORDER BY client_note_versions.id DESC`,
  ).all<VersionRow>();

  const latestByNote = new Map<number, VersionRow>();
  const countByNote = new Map<number, number>();
  for (const row of versionRows) {
    if (!latestByNote.has(row.note_id)) {
      latestByNote.set(row.note_id, row);
    }
    countByNote.set(row.note_id, (countByNote.get(row.note_id) ?? 0) + 1);
  }

  const notes = noteRows.flatMap((row) => {
    const latest = latestByNote.get(row.id);
    if (!latest) return [];
    return [
      {
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        createdAt: row.created_at,
        versionCount: countByNote.get(row.id) ?? 0,
        latest: toVersion(latest),
      },
    ];
  });

  return c.json(notes);
});

clientNotes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid note id" }, 400);
  }

  const note = await fetchNote(c.env.DB, id);
  if (!note) {
    return c.json({ error: "Note not found" }, 404);
  }

  const versions = await fetchVersions(c.env.DB, id);
  return c.json(toNote(note, versions));
});

clientNotes.post("/", async (c) => {
  const body = await c.req.json<{
    clientId?: number;
    date?: string;
    categoryId?: number | null;
    body?: string;
  }>();
  const text = body.body?.trim();
  if (!body.clientId || !body.date || !text) {
    return c.json({ error: "A client, date and note are required" }, 400);
  }
  if (body.categoryId != null && !(await categoryExists(c.env.DB, body.categoryId))) {
    return c.json({ error: "Invalid category" }, 400);
  }

  const created = await c.env.DB.prepare("INSERT INTO client_notes (client_id) VALUES (?) RETURNING id")
    .bind(body.clientId)
    .first<{ id: number }>();
  if (!created) {
    return c.json({ error: "Could not save the note" }, 500);
  }

  await c.env.DB.prepare("INSERT INTO client_note_versions (note_id, category_id, date, body) VALUES (?, ?, ?, ?)")
    .bind(created.id, body.categoryId ?? null, body.date, text)
    .run();

  const note = await fetchNote(c.env.DB, created.id);
  const versions = await fetchVersions(c.env.DB, created.id);
  return c.json(toNote(note!, versions), 201);
});

// Editing never overwrites a version — it appends a new one, so "what was
// actually advised on this date" stays answerable even after a correction.
clientNotes.post("/:id/versions", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid note id" }, 400);
  }

  const note = await fetchNote(c.env.DB, id);
  if (!note) {
    return c.json({ error: "Note not found" }, 404);
  }

  const body = await c.req.json<{ date?: string; categoryId?: number | null; body?: string }>();
  const text = body.body?.trim();
  if (!body.date || !text) {
    return c.json({ error: "A date and note are required" }, 400);
  }
  if (body.categoryId != null && !(await categoryExists(c.env.DB, body.categoryId))) {
    return c.json({ error: "Invalid category" }, 400);
  }

  await c.env.DB.prepare("INSERT INTO client_note_versions (note_id, category_id, date, body) VALUES (?, ?, ?, ?)")
    .bind(id, body.categoryId ?? null, body.date, text)
    .run();

  const versions = await fetchVersions(c.env.DB, id);
  return c.json(toNote(note, versions), 201);
});

export default clientNotes;
