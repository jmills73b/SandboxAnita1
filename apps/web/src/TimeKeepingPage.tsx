import { useEffect, useState, type FormEvent } from "react";
import {
  addClient,
  addHourlyRate,
  addTimeCategory,
  addTimeEntry,
  deleteTimeCategory,
  deleteTimeEntry,
  getClients,
  getHourlyRates,
  getTimeCategories,
  getTimeEntries,
  getTimeSettings,
  renameTimeCategory,
  updateTimeEntry,
  updateTimeSettings,
  type Client,
  type HourlyRate,
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

export function TimeKeepingPage({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<TimeCategory[]>([]);
  const [settings, setSettings] = useState<TimeSettings | null>(null);
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showRateManager, setShowRateManager] = useState(false);

  const [date, setDate] = useState(today());
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [clientName, setClientName] = useState("");
  const [matter, setMatter] = useState("");
  const [units, setUnits] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
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
      const [entryList, clientList, categoryList, timeSettings, rateList] = await Promise.all([
        getTimeEntries(),
        getClients(),
        getTimeCategories(),
        getTimeSettings(),
        getHourlyRates(),
      ]);
      setEntries(entryList);
      setClients(clientList);
      setCategories(categoryList);
      setSettings(timeSettings);
      setRates(rateList);
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
      setClientName("");
      setMatter("");
      setUnits("");
      setDescription("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that time entry");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry: TimeEntry) {
    setEditingId(entry.id);
    setEditDate(entry.date);
    setEditClientMode("existing");
    setEditClientName(entry.clientName);
    setEditMatter(entry.matter ?? "");
    setEditUnits(String(entry.units));
    setEditDescription(entry.description);
    setEditCategoryId(entry.categoryId !== null ? String(entry.categoryId) : "");
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
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
      setEditingId(null);
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

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Time Keeping</h1>

      <form onSubmit={handleSubmit} className="quick-add">
        <label className="sr-only" htmlFor="time-date">
          Date
        </label>
        <input id="time-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        <ClientPicker
          clients={clients}
          mode={clientMode}
          onModeChange={setClientMode}
          name={clientName}
          onNameChange={setClientName}
          fieldId="time-client"
        />
        <label className="sr-only" htmlFor="time-matter">
          Matter
        </label>
        <input
          id="time-matter"
          value={matter}
          onChange={(event) => setMatter(event.target.value)}
          placeholder="Matter (optional)"
        />
        <label className="sr-only" htmlFor="time-units">
          Units
        </label>
        <input
          id="time-units"
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          value={units}
          onChange={(event) => setUnits(event.target.value)}
          placeholder={`Units (x ${unitMinutes} min)`}
          required
        />
        <label className="sr-only" htmlFor="time-description">
          Description
        </label>
        <input
          id="time-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          required
        />
        <label className="sr-only" htmlFor="time-category">
          Category
        </label>
        <select id="time-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add time"}
        </button>
        <button type="button" className="secondary" onClick={() => setShowCategoryManager((prev) => !prev)}>
          {showCategoryManager ? "Hide categories" : "Manage categories"}
        </button>
        <button type="button" className="secondary" onClick={() => setShowRateManager((prev) => !prev)}>
          {showRateManager ? "Hide billing settings" : "Billing settings"}
        </button>
      </form>
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

      {showRateManager && settings && (
        <RateManager settings={settings} rates={rates} onChanged={refresh} />
      )}

      {showCategoryManager && (
        <CategoryManager categories={categories} entries={entries} onChanged={refresh} />
      )}

      {editingId !== null && (
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
            <button type="button" onClick={() => saveEdit(editingId)} disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
              Cancel
            </button>
          </div>
        </div>
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
                <tr key={entry.id} className={editingId === entry.id ? "row-editing" : undefined}>
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

// Two independent settings live here: the billing unit size (a single
// current value — how many minutes one "unit" is) and the hourly rate
// history (many rows, since a rate has to be looked up by the date the
// work was done, not just "whatever it is today").
function RateManager({
  settings,
  rates,
  onChanged,
}: {
  settings: TimeSettings;
  rates: HourlyRate[];
  onChanged: () => Promise<void>;
}) {
  const [unitMinutes, setUnitMinutes] = useState(String(settings.unitMinutes));
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);

  const [newRate, setNewRate] = useState("");
  const [newStartDate, setNewStartDate] = useState(today());
  const [addingRate, setAddingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  async function handleSaveUnit(event: FormEvent) {
    event.preventDefault();
    setUnitError(null);
    const value = Number(unitMinutes);
    if (!Number.isInteger(value) || value <= 0) {
      setUnitError("Enter a whole number of minutes greater than 0");
      return;
    }

    setSavingUnit(true);
    try {
      await updateTimeSettings(value);
      await onChanged();
    } catch (err) {
      setUnitError(err instanceof Error ? err.message : "Couldn't save the unit size");
    } finally {
      setSavingUnit(false);
    }
  }

  async function handleAddRate(event: FormEvent) {
    event.preventDefault();
    setRateError(null);
    const value = Number(newRate);
    if (!Number.isFinite(value) || value <= 0) {
      setRateError("Enter an hourly rate greater than £0");
      return;
    }

    setAddingRate(true);
    try {
      await addHourlyRate(value, newStartDate);
      setNewRate("");
      await onChanged();
    } catch (err) {
      setRateError(err instanceof Error ? err.message : "Couldn't save that rate");
    } finally {
      setAddingRate(false);
    }
  }

  return (
    <div className="edit-panel">
      <p className="edit-panel-title">Billing settings</p>

      <p className="settings-section-title">Billing unit size</p>
      <form onSubmit={handleSaveUnit} className="edit-row">
        <label className="edit-field">
          <span>Minutes per unit</span>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            className="input-compact"
            value={unitMinutes}
            onChange={(event) => setUnitMinutes(event.target.value)}
          />
        </label>
        <button type="submit" disabled={savingUnit}>
          {savingUnit ? "Saving…" : "Save"}
        </button>
      </form>
      {unitError && (
        <p className="error" role="alert">
          {unitError}
        </p>
      )}

      <p className="settings-section-title">Hourly rate history</p>
      {rates.length === 0 ? (
        <p className="empty">No rate set yet — add one below.</p>
      ) : (
        <table className="month-detail-table">
          <thead>
            <tr>
              <th>Rate</th>
              <th>From</th>
              <th>To</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td>{money.format(rate.rate)}/hr</td>
                <td>{rate.startDate}</td>
                <td>{rate.endDate ?? "Current"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleAddRate} className="edit-row">
        <label className="edit-field">
          <span>New hourly rate (£)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            className="input-compact"
            value={newRate}
            onChange={(event) => setNewRate(event.target.value)}
          />
        </label>
        <label className="edit-field">
          <span>Effective from</span>
          <input
            type="date"
            className="input-compact"
            value={newStartDate}
            onChange={(event) => setNewStartDate(event.target.value)}
          />
        </label>
        <button type="submit" disabled={addingRate}>
          {addingRate ? "Adding…" : "Add rate"}
        </button>
      </form>
      {rateError && (
        <p className="error" role="alert">
          {rateError}
        </p>
      )}
    </div>
  );
}

function CategoryManager({
  categories,
  entries,
  onChanged,
}: {
  categories: TimeCategory[];
  entries: TimeEntry[];
  onChanged: () => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [busy, setBusy] = useState(false);

  function countFor(categoryId: number): number {
    return entries.filter((entry) => entry.categoryId === categoryId).length;
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Enter a category name");
      return;
    }

    setAdding(true);
    try {
      await addTimeCategory(trimmed);
      setNewName("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that category");
    } finally {
      setAdding(false);
    }
  }

  async function handleRename(id: number, name: string, previousName: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === previousName) return;

    setRenamingId(id);
    setError(null);
    try {
      await renameTimeCategory(id, trimmed);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rename that category");
    } finally {
      setRenamingId(null);
    }
  }

  function startDelete(id: number) {
    setDeletingId(id);
    setReassignTo("");
    setError(null);
  }

  async function confirmDelete(id: number) {
    setError(null);
    setBusy(true);
    try {
      await deleteTimeCategory(id, reassignTo ? Number(reassignTo) : null);
      setDeletingId(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="edit-panel">
      <p className="edit-panel-title">Manage categories</p>
      {categories.map((cat) => {
        const count = countFor(cat.id);
        return (
          <div className="category-row" key={cat.id}>
            {deletingId === cat.id ? (
              <>
                <span className="category-row-label">
                  Move {count} time entr{count === 1 ? "y" : "ies"} tagged "{cat.name}" to:
                </span>
                <select value={reassignTo} onChange={(event) => setReassignTo(event.target.value)}>
                  <option value="">Uncategorised</option>
                  {categories
                    .filter((other) => other.id !== cat.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.name}
                      </option>
                    ))}
                </select>
                <button type="button" className="danger" onClick={() => confirmDelete(cat.id)} disabled={busy}>
                  {busy ? "Deleting…" : "Confirm delete"}
                </button>
                <button type="button" onClick={() => setDeletingId(null)} disabled={busy}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <input
                  className="input-compact"
                  defaultValue={cat.name}
                  disabled={renamingId === cat.id}
                  onBlur={(event) => handleRename(cat.id, event.target.value, cat.name)}
                />
                <span className="category-row-count">
                  {count} time entr{count === 1 ? "y" : "ies"}
                </span>
                <button type="button" className="danger" onClick={() => startDelete(cat.id)}>
                  Delete
                </button>
              </>
            )}
          </div>
        );
      })}

      <form onSubmit={handleAdd} className="quick-add category-add-form">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New category name"
        />
        <button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add category"}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
