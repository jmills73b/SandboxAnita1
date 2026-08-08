import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";
import { decryptDocument, encryptDocument } from "../documentEncryption";

const documents = new Hono<AppEnv>();

documents.use("*", requireAuth);

const DIRECTIONS = ["inbound", "outbound"] as const;
type Direction = (typeof DIRECTIONS)[number];

function isValidDirection(value: unknown): value is Direction {
  return typeof value === "string" && (DIRECTIONS as readonly string[]).includes(value);
}

// Only what a solicitor's case file actually contains -- correspondence
// (email) and formal documents (Word, PDF). Extension AND declared content
// type both have to match, since either alone can be wrong or spoofed (a
// renamed file, a browser guessing "application/octet-stream").
const ALLOWED_TYPES: Array<{ extensions: string[]; contentTypes: string[] }> = [
  { extensions: [".pdf"], contentTypes: ["application/pdf"] },
  { extensions: [".doc"], contentTypes: ["application/msword"] },
  {
    extensions: [".docx"],
    contentTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  { extensions: [".eml"], contentTypes: ["message/rfc822", "text/plain"] },
  { extensions: [".msg"], contentTypes: ["application/vnd.ms-outlook"] },
];

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // Generous for a scanned letter or email chain, not unlimited.

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function isAllowedFile(filename: string, contentType: string): boolean {
  const ext = extensionOf(filename);
  return ALLOWED_TYPES.some((t) => t.extensions.includes(ext) && t.contentTypes.includes(contentType));
}

interface DocumentRow {
  id: number;
  client_id: number;
  category_id: number | null;
  category_name: string | null;
  direction: string;
  filename: string;
  content_type: string;
  size: number;
  uploaded_by_email: string;
  uploaded_at: string;
}

function toDocument(row: DocumentRow) {
  return {
    id: row.id,
    clientId: row.client_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    direction: row.direction,
    filename: row.filename,
    contentType: row.content_type,
    size: row.size,
    uploadedByEmail: row.uploaded_by_email,
    uploadedAt: row.uploaded_at,
  };
}

const LIST_COLUMNS =
  "documents.id, documents.client_id, documents.category_id, document_categories.name AS category_name, " +
  "documents.direction, documents.filename, documents.content_type, documents.size, " +
  "users.email AS uploaded_by_email, documents.uploaded_at";

const LIST_JOIN =
  "FROM documents " +
  "LEFT JOIN document_categories ON document_categories.id = documents.category_id " +
  "JOIN users ON users.id = documents.uploaded_by";

documents.get("/", async (c) => {
  const clientId = Number(c.req.query("clientId"));
  if (!Number.isInteger(clientId)) {
    return c.json({ error: "clientId is required" }, 400);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT ${LIST_COLUMNS} ${LIST_JOIN} WHERE documents.client_id = ? AND documents.deleted_at IS NULL ORDER BY documents.uploaded_at DESC`,
  )
    .bind(clientId)
    .all<DocumentRow>();

  return c.json(results.map(toDocument));
});

// A separate literal path, not a permission-gated "admin" route -- this app
// has no role system, every signed-in user sees the same Admin & Settings
// screens (see InviteCodePanel/UsagePanel). This is the audit trail: every
// soft-deleted document, when, and by whom.
documents.get("/deleted", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${LIST_COLUMNS}, clients.name AS client_name, deleters.email AS deleted_by_email, documents.deleted_at
     ${LIST_JOIN}
     JOIN clients ON clients.id = documents.client_id
     LEFT JOIN users deleters ON deleters.id = documents.deleted_by
     WHERE documents.deleted_at IS NOT NULL
     ORDER BY documents.deleted_at DESC`,
  ).all<DocumentRow & { client_name: string; deleted_by_email: string | null; deleted_at: string }>();

  return c.json(
    results.map((row) => ({
      ...toDocument(row),
      clientName: row.client_name,
      deletedAt: row.deleted_at,
      deletedByEmail: row.deleted_by_email,
    })),
  );
});

documents.post("/", async (c) => {
  if (!c.env.DOCUMENTS || !c.env.DOCUMENT_ENCRYPTION_KEY) {
    return c.json({ error: "Document storage is not configured" }, 500);
  }

  const body = await c.req.parseBody();
  const file = body.file;
  const clientId = Number(body.clientId);
  const categoryIdRaw = body.categoryId;
  const direction = body.direction;

  if (!(file instanceof File)) {
    return c.json({ error: "A file is required" }, 400);
  }
  if (!Number.isInteger(clientId)) {
    return c.json({ error: "A client is required" }, 400);
  }
  if (!isValidDirection(direction)) {
    return c.json({ error: "Direction must be inbound or outbound" }, 400);
  }
  if (file.size === 0) {
    return c.json({ error: "That file is empty" }, 400);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return c.json({ error: "That file is larger than the 25MB limit" }, 400);
  }
  if (!isAllowedFile(file.name, file.type)) {
    return c.json({ error: "Only PDF, Word (.doc/.docx) and email (.eml/.msg) files are accepted" }, 400);
  }

  const client = await c.env.DB.prepare("SELECT id FROM clients WHERE id = ?").bind(clientId).first();
  if (!client) {
    return c.json({ error: "Client not found" }, 404);
  }

  let categoryId: number | null = null;
  if (typeof categoryIdRaw === "string" && categoryIdRaw !== "") {
    categoryId = Number(categoryIdRaw);
    const category = await c.env.DB.prepare("SELECT id FROM document_categories WHERE id = ?")
      .bind(categoryId)
      .first();
    if (!category) {
      return c.json({ error: "Category not found" }, 400);
    }
  }

  const userId = c.get("userId");
  const plaintext = await file.arrayBuffer();
  const { ciphertext, iv } = await encryptDocument(plaintext, c.env.DOCUMENT_ENCRYPTION_KEY);
  const r2Key = `documents/${clientId}/${crypto.randomUUID()}`;

  await c.env.DOCUMENTS.put(r2Key, ciphertext);

  const created = await c.env.DB.prepare(
    `INSERT INTO documents (client_id, category_id, direction, filename, content_type, size, r2_key, iv, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
  )
    .bind(clientId, categoryId, direction, file.name, file.type, file.size, r2Key, iv, userId)
    .first<{ id: number }>();

  if (!created) {
    // Roll back the R2 write so an orphaned encrypted blob doesn't linger
    // with nothing in D1 pointing back at it.
    await c.env.DOCUMENTS.delete(r2Key);
    return c.json({ error: "Could not save the document" }, 500);
  }

  const row = await c.env.DB.prepare(`SELECT ${LIST_COLUMNS} ${LIST_JOIN} WHERE documents.id = ?`)
    .bind(created.id)
    .first<DocumentRow>();

  return c.json(toDocument(row as DocumentRow), 201);
});

documents.get("/:id/download", async (c) => {
  if (!c.env.DOCUMENTS || !c.env.DOCUMENT_ENCRYPTION_KEY) {
    return c.json({ error: "Document storage is not configured" }, 500);
  }

  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid document id" }, 400);
  }

  const doc = await c.env.DB.prepare("SELECT filename, content_type, r2_key, iv FROM documents WHERE id = ?")
    .bind(id)
    .first<{ filename: string; content_type: string; r2_key: string; iv: string }>();
  if (!doc) {
    return c.json({ error: "Document not found" }, 404);
  }

  const object = await c.env.DOCUMENTS.get(doc.r2_key);
  if (!object) {
    return c.json({ error: "Document contents could not be found" }, 500);
  }

  const ciphertext = await object.arrayBuffer();
  const plaintext = await decryptDocument(ciphertext, doc.iv, c.env.DOCUMENT_ENCRYPTION_KEY);

  return new Response(plaintext, {
    headers: {
      "Content-Type": doc.content_type,
      "Content-Disposition": `attachment; filename="${doc.filename.replace(/"/g, "")}"`,
    },
  });
});

documents.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid document id" }, 400);
  }

  const userId = c.get("userId");
  const result = await c.env.DB.prepare(
    "UPDATE documents SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ? AND deleted_at IS NULL",
  )
    .bind(userId, id)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: "Document not found" }, 404);
  }

  return c.json({ ok: true });
});

export default documents;
