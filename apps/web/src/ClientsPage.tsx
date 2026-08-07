import { useEffect, useState, type FormEvent } from "react";
import { addClient, getClientCategories, getClients, updateClient, type Client, type ClientCategory } from "./api";
import { ClientNotesPanel } from "./ClientNotesPanel";

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

export function ClientsPage({ onBack }: { onBack: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategoryIds, setEditCategoryIds] = useState<number[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [notesClient, setNotesClient] = useState<Client | null>(null);

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
      });
      setName("");
      setEmail("");
      setSummary("");
      setCategoryIds([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that client");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditName(client.name);
    setEditEmail(client.email ?? "");
    setEditSummary(client.summary ?? "");
    setEditCategoryIds(client.categories.map((c) => c.id));
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
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
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  const trimmedSearch = search.trim().toLowerCase();
  const filteredClients = clients.filter(
    (client) =>
      (categoryFilter === "all" || client.categories.some((c) => String(c.id) === categoryFilter)) &&
      (client.name.toLowerCase().includes(trimmedSearch) ||
        (client.email ?? "").toLowerCase().includes(trimmedSearch)),
  );

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Clients</h1>

      <form onSubmit={handleSubmit} className="quick-add">
        <label className="sr-only" htmlFor="client-name">
          Name
        </label>
        <input
          id="client-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Client name"
          required
          autoFocus
        />
        <label className="sr-only" htmlFor="client-email">
          Email
        </label>
        <input
          id="client-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email (optional)"
        />
        <label className="sr-only" htmlFor="client-summary">
          Summary
        </label>
        <input
          id="client-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Summary (optional)"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add client"}
        </button>
      </form>
      <div className="edit-field quick-add-category">
        <span>Category</span>
        <CategoryChips categories={categories} selectedIds={categoryIds} onToggle={toggleCategory} />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {notesClient && (
        <ClientNotesPanel
          clientId={notesClient.id}
          clientName={notesClient.name}
          onClose={() => setNotesClient(null)}
        />
      )}

      {editingId !== null && (
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
              <span>Summary</span>
              <input
                className="input-compact"
                value={editSummary}
                onChange={(event) => setEditSummary(event.target.value)}
              />
            </label>
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
            <button type="button" onClick={() => saveEdit(editingId)} disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
              Cancel
            </button>
          </div>
        </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className={editingId === client.id ? "row-editing" : undefined}>
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
                    <div className="row-actions">
                      <button type="button" onClick={() => startEdit(client)}>
                        Edit
                      </button>
                      <button type="button" className="secondary" onClick={() => setNotesClient(client)}>
                        Notes
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

