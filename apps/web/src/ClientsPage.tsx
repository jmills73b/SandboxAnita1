import { useEffect, useRef, useState, type FormEvent } from "react";
import { CLIENT_CASE_STATUSES, type ClientCaseStatus } from "@sandboxanita1/core";
import {
  addClient,
  deleteClient,
  getClientCategories,
  getClients,
  updateClient,
  type Client,
  type ClientCategory,
} from "./api";
import { ClientDocumentsPage } from "./ClientDocumentsPage";
import { ClientNotesPage } from "./ClientNotesPage";
import { MarkdownToolbar } from "./MarkdownToolbar";

function caseStatusClass(status: string): string {
  return `status-${status.toLowerCase()}`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// A checkbox group rendered as toggle chips rather than a native
// <select multiple> — that control needs ctrl/cmd-click to pick more than
// one option, is barely usable on a touchscreen, and gives no visual
// indication of what's selected without opening it. Chips make the
// current selection visible at a glance and are a plain tap to toggle.
function CategoryChips({
  categories,
  selectedIds,
  onToggle,
}: {
  categories: ClientCategory[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  if (categories.length === 0) {
    return <p className="empty">No categories yet — add some from Admin &amp; Settings.</p>;
  }

  return (
    <div className="chip-group" role="group" aria-label="Client categories">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`chip ${selectedIds.includes(cat.id) ? "active" : ""}`}
          aria-pressed={selectedIds.includes(cat.id)}
          onClick={() => onToggle(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

type Mode =
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; id: number }
  | { kind: "notes"; id: number }
  | { kind: "documents"; id: number };

export function ClientsPage({
  onBack,
  onViewInvoices,
}: {
  onBack: () => void;
  onViewInvoices: (clientId: number) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>({ kind: "list" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [caseStatus, setCaseStatus] = useState<ClientCaseStatus>("Prospective");
  const [submitting, setSubmitting] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<number[]>([]);
  const [editCaseStatus, setEditCaseStatus] = useState<ClientCaseStatus>("Prospective");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const editSummaryRef = useRef<HTMLTextAreaElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [clientList, categoryList] = await Promise.all([getClients(), getClientCategories()]);
      setClients(clientList);
      setCategories(categoryList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function toggleCategory(id: number) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function toggleEditCategory(id: number) {
    setEditCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function startAdd() {
    setName("");
    setEmail("");
    setSummary("");
    setCategoryIds([]);
    setCaseStatus("Prospective");
    setError(null);
    setMode({ kind: "add" });
  }

  function cancelAdd() {
    setError(null);
    setMode({ kind: "list" });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a client name");
      return;
    }

    setSubmitting(true);
    try {
      await addClient({
        name: trimmedName,
        email: email.trim() || null,
        summary: summary.trim() || null,
        categoryIds,
        caseStatus,
      });
      setMode({ kind: "list" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that client");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(client: Client) {
    setEditName(client.name);
    setEditEmail(client.email ?? "");
    setEditSummary(client.summary ?? "");
    setEditCategoryIds(client.categories.map((c) => c.id));
    setEditCaseStatus(client.caseStatus);
    setEditError(null);
    setMode({ kind: "edit", id: client.id });
  }

  function cancelEdit() {
    setEditError(null);
    setMode({ kind: "list" });
  }

  async function saveEdit(id: number) {
    setEditError(null);
    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Enter a client name");
      return;
    }

    setEditSubmitting(true);
    try {
      await updateClient(id, {
        name: trimmedName,
        email: editEmail.trim() || null,
        summary: editSummary.trim() || null,
        categoryIds: editCategoryIds,
        caseStatus: editCaseStatus,
      });
      setMode({ kind: "list" });
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleCaseStatusChange(client: Client, nextStatus: string) {
    try {
      await updateClient(client.id, { caseStatus: nextStatus as ClientCaseStatus });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that client's status");
    }
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`Delete "${client.name}"? This can't be undone.`)) return;
    setError(null);
    try {
      await deleteClient(client.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that client");
    }
  }

  const trimmedSearch = search.trim().toLowerCase();
  const filteredClients = clients.filter(
    (client) =>
      (categoryFilter === "all" || client.categories.some((c) => String(c.id) === categoryFilter)) &&
      (statusFilter === "all" || client.caseStatus === statusFilter) &&
      (client.name.toLowerCase().includes(trimmedSearch) ||
        (client.email ?? "").toLowerCase().includes(trimmedSearch)),
  );

  if (mode.kind === "add") {
    return (
      <>
        <button type="button" className="back-link" onClick={cancelAdd}>
          ← Clients
        </button>
        <h1 className="sr-only">Add client</h1>
        <form onSubmit={handleSubmit} className="edit-panel">
          <p className="edit-panel-title">Add client</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Name</span>
              <input
                className="input-compact"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="edit-field">
              <span>Email</span>
              <input
                type="email"
                className="input-compact"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Case status</span>
              <select
                className="input-compact"
                value={caseStatus}
                onChange={(event) => setCaseStatus(event.target.value as ClientCaseStatus)}
              >
                {CLIENT_CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="edit-field">
            <span>Summary</span>
            <MarkdownToolbar textareaRef={summaryRef} onChange={setSummary} />
            <textarea
              ref={summaryRef}
              className="notes-textarea"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={6}
              placeholder="What should everyone know about this client…"
            />
          </div>
          <div className="edit-field">
            <span>Category</span>
            <CategoryChips categories={categories} selectedIds={categoryIds} onToggle={toggleCategory} />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="row-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Add client"}
            </button>
            <button type="button" onClick={cancelAdd} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </>
    );
  }

  if (mode.kind === "edit") {
    return (
      <>
        <button type="button" className="back-link" onClick={cancelEdit}>
          ← Clients
        </button>
        <h1 className="sr-only">Editing {editName || "client"}</h1>
        <div className="edit-panel">
          <p className="edit-panel-title">Editing "{editName || "…"}"</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Name</span>
              <input className="input-compact" value={editName} onChange={(event) => setEditName(event.target.value)} />
            </label>
            <label className="edit-field">
              <span>Email</span>
              <input
                type="email"
                className="input-compact"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Case status</span>
              <select
                className="input-compact"
                value={editCaseStatus}
                onChange={(event) => setEditCaseStatus(event.target.value as ClientCaseStatus)}
              >
                {CLIENT_CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="edit-field">
            <span>Summary</span>
            <MarkdownToolbar textareaRef={editSummaryRef} onChange={setEditSummary} />
            <textarea
              ref={editSummaryRef}
              className="notes-textarea"
              value={editSummary}
              onChange={(event) => setEditSummary(event.target.value)}
              rows={6}
              placeholder="What should everyone know about this client…"
            />
          </div>
          <div className="edit-field">
            <span>Category</span>
            <CategoryChips categories={categories} selectedIds={editCategoryIds} onToggle={toggleEditCategory} />
          </div>
          {editError && (
            <p className="error" role="alert">
              {editError}
            </p>
          )}
          <div className="row-actions">
            <button type="button" onClick={() => saveEdit(mode.id)} disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  if (mode.kind === "notes") {
    const notesClient = clients.find((c) => c.id === mode.id);
    return (
      <ClientNotesPage
        clientId={mode.id}
        clientName={notesClient?.name ?? "…"}
        onBack={() => setMode({ kind: "list" })}
      />
    );
  }

  if (mode.kind === "documents") {
    const documentsClient = clients.find((c) => c.id === mode.id);
    return (
      <ClientDocumentsPage
        clientId={mode.id}
        clientName={documentsClient?.name ?? "…"}
        onBack={() => setMode({ kind: "list" })}
      />
    );
  }

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Clients</h1>

      <div className="page-primary-action">
        <button type="button" onClick={startAdd}>
          + Add client
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {clients.length > 0 && (
        <div className="filters">
          <label className="sr-only" htmlFor="client-search">
            Search by name or email
          </label>
          <input
            id="client-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
          />
          <label className="sr-only" htmlFor="client-category-filter">
            Filter by category
          </label>
          <select
            id="client-category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="client-status-filter">
            Filter by case status
          </label>
          <select
            id="client-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {CLIENT_CASE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="empty">No clients yet — add the first one above.</p>
      ) : filteredClients.length === 0 ? (
        <p className="empty">No clients match your search.</p>
      ) : (
        <div className="table-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Summary</th>
                <th>Categories</th>
                <th>Case status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.email ?? "—"}</td>
                  <td>{client.summary ? truncate(client.summary, 60) : "—"}</td>
                  <td>
                    {client.categories.length > 0 ? (
                      <div className="chip-group">
                        {client.categories.map((cat) => (
                          <span className="chip" key={cat.id}>
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <select
                      className={`status status-select ${caseStatusClass(client.caseStatus)}`}
                      value={client.caseStatus}
                      onChange={(event) => handleCaseStatusChange(client, event.target.value)}
                    >
                      {CLIENT_CASE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => startEdit(client)}>
                        Edit
                      </button>
                      <button type="button" className="secondary" onClick={() => onViewInvoices(client.id)}>
                        Invoices
                      </button>
                      <button type="button" className="secondary" onClick={() => setMode({ kind: "notes", id: client.id })}>
                        Notes
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setMode({ kind: "documents", id: client.id })}
                      >
                        Documents
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(client)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
