import { useEffect, useState } from "react";
import { deleteDocument, documentDownloadUrl, getClients, getDocuments, type CaseDocument, type Client } from "./api";

const sizeFormat = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

// Every non-deleted document across every client, in one place -- for
// finding a document when you know roughly what it is but not which
// client's page it's filed under. Uploading still only ever happens from
// a specific client's own Documents page (see ClientDocumentsPage): a
// document is always tagged to a client at creation, so there's no
// "upload here" action on this view, just search, filter, download, delete.
export function AllDocumentsPage({ onBack }: { onBack: () => void }) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [documentList, clientList] = await Promise.all([getDocuments(), getClients()]);
      setDocuments(documentList);
      setClients(clientList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

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

  const filtered = documents.filter((doc) => {
    if (clientFilter !== "all" && doc.clientId !== Number(clientFilter)) return false;
    if (search.trim() && !doc.filename.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">All Documents</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="filters">
        <label className="sr-only" htmlFor="documents-search">
          Search by filename
        </label>
        <input
          id="documents-search"
          type="search"
          placeholder="Search by filename…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <label className="sr-only" htmlFor="documents-client-filter">
          Client
        </label>
        <select
          id="documents-client-filter"
          value={clientFilter}
          onChange={(event) => setClientFilter(event.target.value)}
        >
          <option value="all">All clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="empty">
          {documents.length === 0 ? "No documents yet — upload one from a client's Documents page." : "No documents match that search."}
        </p>
      ) : (
        <table className="month-detail-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Client</th>
              <th>Category</th>
              <th>Direction</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.filename}</td>
                <td>{doc.clientName}</td>
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
