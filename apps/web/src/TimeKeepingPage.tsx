import { useEffect, useState, type FormEvent } from "react";
import {
  addClient,
  addTimeEntry,
  deleteTimeEntry,
  getClients,
  getTimeCategories,
  getTimeEntries,
  getTimeSettings,
  updateTimeEntry,
  type Client,
  type TimeCategory,
  type TimeEntry,
  type TimeSettings,
} from "./api";
import { ClientPicker, type ClientMode } from "./InvoicesPage";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: number };

export function TimeKeepingPage({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<TimeCategory[]>([]);
  const [settings, setSettings] = useState<TimeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>({ kind: "list" });

  const [date, setDate] = useState(today());
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [clientName, setClientName] = useState("");
  const [matter, setMatter] = useState("");
  const [units, setUnits] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editDate, setEditDate] = useState("");
  const [editClientMode, setEditClientMode] = useState<ClientMode>("existing");
  const [editClientName, setEditClientName] = useState("");
  const [editMatter, setEditMatter] = useState("");
  const [editUnits, setEditUnits] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function refresh() {
    setLoading(true);
    try {
      const [entryList, clientList, categoryList, timeSettings] = await Promise.all([
        getTimeEntries(),
        getClients(),
        getTimeCategories(),
        getTimeSettings(),
      ]);
      setEntries(entryList);
      setClients(clientList);
      setCategories(categoryList);
      setSettings(timeSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load time entries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function resolveClientId(name: string): Promise<number> {
    const trimmed = name.trim();
    const existing = clients.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    return existing ? existing.id : (await addClient({ name: trimmed })).id;
  }

  function startAdd() {
    setDate(today());
    setClientMode("existing");
    setClientName("");
    setMatter("");
    setUnits("");
    setDescription("");
    setCategoryId("");
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

    const trimmedName = clientName.trim();
    const trimmedDescription = description.trim();
    const unitCount = Number(units);

    if (!trimmedName) {
      setError("Enter a client name");
      return;
    }
    if (!Number.isInteger(unitCount) || unitCount <= 0) {
      setError("Enter a whole number of units greater than 0");
      return;
    }
    if (!trimmedDescription) {
      setError("Enter a description");
      return;
    }

    setSubmitting(true);
    try {
      const clientId = await resolveClientId(trimmedName);
      await addTimeEntry({
        date,
        clientId,
        matter: matter.trim() || undefined,
        units: unitCount,
        description: trimmedDescription,
        categoryId: categoryId ? Number(categoryId) : null,
      });
      setMode({ kind: "list" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that time entry");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry: TimeEntry) {
    setEditDate(entry.date);
    setEditClientMode("existing");
    setEditClientName(entry.clientName);
    setEditMatter(entry.matter ?? "");
    setEditUnits(String(entry.units));
    setEditDescription(entry.description);
    setEditCategoryId(entry.categoryId !== null ? String(entry.categoryId) : "");
    setEditError(null);
    setMode({ kind: "edit", id: entry.id });
  }

  function cancelEdit() {
    setEditError(null);
    setMode({ kind: "list" });
  }

  async function saveEdit(id: number) {
    setEditError(null);

    const trimmedName = editClientName.trim();
    const trimmedDescription = editDescription.trim();
    const unitCount = Number(editUnits);

    if (!trimmedName) {
      setEditError("Enter a client name");
      return;
    }
    if (!Number.isInteger(unitCount) || unitCount <= 0) {
      setEditError("Enter a whole number of units greater than 0");
      return;
    }
    if (!trimmedDescription) {
      setEditError("Enter a description");
      return;
    }

    setEditSubmitting(true);
    try {
      const clientId = await resolveClientId(trimmedName);
      await updateTimeEntry(id, {
        date: editDate,
        clientId,
        matter: editMatter.trim() || null,
        units: unitCount,
        description: trimmedDescription,
        categoryId: editCategoryId ? Number(editCategoryId) : null,
      });
      setMode({ kind: "list" });
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(entry: TimeEntry) {
    const confirmed = window.confirm(`Delete the ${formatMinutes(entry.minutes)} entry "${entry.description}"?`);
    if (!confirmed) return;

    try {
      await deleteTimeEntry(entry.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that time entry");
    }
  }

  const trimmedSearch = search.trim().toLowerCase();
  const filteredEntries = entries.filter(
    (entry) =>
      (categoryFilter === "all" || String(entry.categoryId ?? "") === categoryFilter) &&
      (entry.description.toLowerCase().includes(trimmedSearch) ||
        entry.clientName.toLowerCase().includes(trimmedSearch)),
  );

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const totalFee = entries.reduce((sum, entry) => sum + (entry.feeValue ?? 0), 0);
  const unitMinutes = settings?.unitMinutes ?? 8;
  const previewUnits = Number(units);
  const showPreview = Number.isInteger(previewUnits) && previewUnits > 0;

  if (mode.kind === "add") {
    return (
      <>
        <button type="button" className="back-link" onClick={cancelAdd}>
          ← Time Keeping
        </button>
        <h1 className="sr-only">Add time entry</h1>
        <form onSubmit={handleSubmit} className="edit-panel">
          <p className="edit-panel-title">Add time entry</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Date</span>
              <input type="date" className="input-compact" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="edit-field">
              <span>Client</span>
              <ClientPicker
                clients={clients}
                mode={clientMode}
                onModeChange={setClientMode}
                name={clientName}
                onNameChange={setClientName}
                fieldId="time-client"
                compact
              />
            </label>
            <label className="edit-field">
              <span>Matter</span>
              <input
                className="input-compact"
                value={matter}
                onChange={(event) => setMatter(event.target.value)}
                placeholder="Optional"
              />
            </label>
            <label className="edit-field">
              <span>Units</span>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                className="input-compact"
                value={units}
                onChange={(event) => setUnits(event.target.value)}
                placeholder={`x ${unitMinutes} min`}
                required
              />
            </label>
            <label className="edit-field">
              <span>Description</span>
              <input
                className="input-compact"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>
            <label className="edit-field">
              <span>Category</span>
              <select className="input-compact" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {showPreview && (
            <p className="hint">
              {previewUnits} unit{previewUnits === 1 ? "" : "s"} × {unitMinutes} minutes = {formatMinutes(previewUnits * unitMinutes)}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="row-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Add time"}
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
          ← Time Keeping
        </button>
        <h1 className="sr-only">Editing {editDescription || "time entry"}</h1>
        <div className="edit-panel">
          <p className="edit-panel-title">Editing "{editDescription || "…"}"</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Date</span>
              <input
                type="date"
                className="input-compact"
                value={editDate}
                onChange={(event) => setEditDate(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Client</span>
              <ClientPicker
                clients={clients}
                mode={editClientMode}
                onModeChange={setEditClientMode}
                name={editClientName}
                onNameChange={setEditClientName}
                fieldId="edit-time-client"
                compact
              />
            </label>
            <label className="edit-field">
              <span>Matter</span>
              <input
                className="input-compact"
                value={editMatter}
                onChange={(event) => setEditMatter(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Units</span>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                className="input-compact"
                value={editUnits}
                onChange={(event) => setEditUnits(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Description</span>
              <input
                className="input-compact"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Category</span>
              <select
                className="input-compact"
                value={editCategoryId}
                onChange={(event) => setEditCategoryId(event.target.value)}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
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

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Time Keeping</h1>

      <div className="row-actions">
        <button type="button" onClick={startAdd}>
          + Add time
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!loading && entries.length > 0 && (
        <div className="client-stats">
          <div className="client-stat">
            <div className="n">{formatMinutes(totalMinutes)}</div>
            <div className="l">Total time logged</div>
          </div>
          <div className="client-stat">
            <div className="n">{money.format(totalFee)}</div>
            <div className="l">Total value</div>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="filters">
          <label className="sr-only" htmlFor="time-search">
            Search by client or description
          </label>
          <input
            id="time-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by client or description…"
          />
          <label className="sr-only" htmlFor="time-category-filter">
            Filter by category
          </label>
          <select
            id="time-category-filter"
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
      ) : entries.length === 0 ? (
        <p className="empty">No time logged yet — add the first entry above.</p>
      ) : filteredEntries.length === 0 ? (
        <p className="empty">No time entries match your search.</p>
      ) : (
        <div className="table-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Matter</th>
                <th>Units</th>
                <th>Time</th>
                <th>Description</th>
                <th>Category</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{dateFmt.format(new Date(entry.date))}</td>
                  <td>{entry.clientName}</td>
                  <td>{entry.matter ?? "—"}</td>
                  <td>{entry.units}</td>
                  <td>{formatMinutes(entry.minutes)}</td>
                  <td>{entry.description}</td>
                  <td>{entry.category ?? "—"}</td>
                  <td>{entry.feeValue !== null ? money.format(entry.feeValue) : "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => startEdit(entry)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(entry)}>
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
