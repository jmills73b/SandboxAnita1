import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  deleteDocument,
  documentDownloadUrl,
  getDocumentCategories,
  getDocuments,
  uploadDocument,
  type CaseDocument,
  type DocumentCategory,
  type DocumentDirection,
} from "./api";

const sizeFormat = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

// Solicitors keep every document as either something the client/other side
// sent in, or something Anita sent out -- a fixed pair, unlike Category
// which is admin-configurable, since this distinction never changes shape.
const DIRECTIONS: Array<{ value: DocumentDirection; label: string }> = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
];

export function ClientDocumentsPage({
  clientId,
  clientName,
  onBack,
}: {
  clientId: number;
  clientName: string;
  onBack: () => void;
}) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string>("");
  const [direction, setDirection] = useState<DocumentDirection>("inbound");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [documentList, categoryList] = await Promise.all([getDocuments(clientId), getDocumentCategories()]);
      setDocuments(documentList);
      setCategories(categoryList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [clientId]);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    setUploadError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a file to upload");
      return;
    }

    setUploading(true);
    try {
      await uploadDocument({
        clientId,
        categoryId: categoryId ? Number(categoryId) : null,
        direction,
        file,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setCategoryId("");
      setDirection("inbound");
      await refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't upload that document");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: CaseDocument) {
    const confirmed = window.confirm(`Delete "${doc.filename}"? It can still be recovered from Admin & Settings.`);
    if (!confirmed) return;

    setDeletingId(doc.id);
    setError(null);
    try {
      await deleteDocument(doc.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that document");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Clients
      </button>
      <h1 className="sr-only">Documents for {clientName}</h1>
      <p className="edit-panel-title">Documents for {clientName}</p>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <p className="settings-section-title">Upload a document</p>
      <p className="hint">Accepted: PDF, Word (.doc/.docx) and email (.eml/.msg), up to 25MB.</p>
      <form onSubmit={handleUpload} className="edit-row">
        <label className="edit-field">
          <span>File</span>
          <input
            ref={fileInputRef}
            type="file"
            className="input-compact"
            accept=".pdf,.doc,.docx,.eml,.msg"
          />
        </label>
        <label className="edit-field">
          <span>Category</span>
          <select className="input-compact" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Uncategorised</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="edit-field">
          <span>Direction</span>
          <select
            className="input-compact"
            value={direction}
            onChange={(event) => setDirection(event.target.value as DocumentDirection)}
          >
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>
      {uploadError && (
        <p className="error" role="alert">
          {uploadError}
        </p>
      )}

      <p className="settings-section-title">Documents</p>
      {loading ? (
        <p className="loading">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="empty">No documents yet for this client — upload one above.</p>
      ) : (
        <table className="month-detail-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Category</th>
              <th>Direction</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.filename}</td>
                <td>{doc.categoryName ?? "Uncategorised"}</td>
                <td>{doc.direction === "inbound" ? "Inbound" : "Outbound"}</td>
                <td>{formatSize(doc.size)}</td>
                <td>
                  {formatDate(doc.uploadedAt)} · {doc.uploadedByEmail}
                </td>
                <td>
                  <div className="row-actions">
                    <a
                      className="secondary"
                      href={documentDownloadUrl(doc.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
