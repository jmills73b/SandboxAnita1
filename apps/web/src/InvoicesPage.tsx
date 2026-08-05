import { useEffect, useState, type FormEvent } from "react";
import { INVOICE_STATUSES } from "@sandboxanita1/core";
import {
  addClient,
  addInvoice,
  deleteInvoice,
  getClients,
  getInvoices,
  updateInvoice,
  type Client,
  type Invoice,
} from "./api";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
// invoiceDate is a plain "YYYY-MM-DD" — `new Date(...)` parses that as UTC
// midnight, so formatting without pinning the zone rolls it back a day
// for any viewer west of UTC (e.g. Dominican Republic, UTC-4).
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function statusClass(status: string): string {
  return `status-${status.toLowerCase().replace(/[^a-z]+/g, "-")}`;
}

function lagLabel(days: number | null): string {
  return days !== null ? `${days}d` : "—";
}

type View = { kind: "ledger" } | { kind: "client"; clientId: number };

type ClientMode = "existing" | "new";

// Replaces the old free-text input + native <datalist> — datalist looks
// like a bare, unstyled system list (and barely works on iOS Safari at
// all), which is what made the client field feel like "here's every
// client dumped on you" rather than a deliberate choice. A plain toggle
// between an actual dropdown of existing clients and a name field for a
// new one is explicit about which you're doing, and both halves are real,
// reliable form controls.
function ClientPicker({
  clients,
  mode,
  onModeChange,
  name,
  onNameChange,
  fieldId,
  compact,
  autoFocus,
}: {
  clients: Client[];
  mode: ClientMode;
  onModeChange: (mode: ClientMode) => void;
  name: string;
  onNameChange: (name: string) => void;
  fieldId: string;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));
  const fieldClass = compact ? "input-compact" : undefined;

  function switchMode(next: ClientMode) {
    onModeChange(next);
    onNameChange("");
  }

  return (
    <div className="client-picker">
      <div className="mode-toggle mode-toggle-compact" role="group" aria-label="Client type">
        <button type="button" className={mode === "existing" ? "active" : ""} onClick={() => switchMode("existing")}>
          Existing client
        </button>
        <button type="button" className={mode === "new" ? "active" : ""} onClick={() => switchMode("new")}>
          New client
        </button>
      </div>
      <label className="sr-only" htmlFor={fieldId}>
        Client
      </label>
      {mode === "existing" ? (
        <select
          id={fieldId}
          className={fieldClass}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoFocus={autoFocus}
          required
        >
          <option value="" disabled>
            {sortedClients.length === 0 ? "No existing clients yet" : "Select a client…"}
          </option>
          {sortedClients.map((client) => (
            <option key={client.id} value={client.name}>
              {client.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          className={fieldClass}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="New client name"
          autoFocus={autoFocus}
          required
        />
      )}
    </div>
  );
}

export function InvoicesPage({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [clientName, setClientName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ kind: "ledger" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editClientMode, setEditClientMode] = useState<ClientMode>("existing");
  const [editClientName, setEditClientName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editSettledClient, setEditSettledClient] = useState("");
  const [editSettledFirm, setEditSettledFirm] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function refresh() {
    setLoading(true);
    try {
      const [invoiceList, clientList] = await Promise.all([getInvoices(), getClients()]);
      setInvoices(invoiceList);
      setClients(clientList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the ledger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = clientName.trim();
    const amount = Number(totalAmount);

    if (!trimmedName) {
      setError("Enter a client name");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than £0");
      return;
    }

    setSubmitting(true);
    try {
      // A client typed here that doesn't already exist just gets created —
      // no separate "add a client first" step (story 1.7).
      const existing = clients.find((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
      const clientId = existing ? existing.id : (await addClient(trimmedName)).id;

      await addInvoice({ invoiceDate, clientId, totalAmount: amount });

      setClientName("");
      setTotalAmount("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that invoice");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(invoice: Invoice, status: string) {
    try {
      await updateInvoice(invoice.id, { status });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that invoice's status");
    }
  }

  function startEdit(invoice: Invoice) {
    setEditingId(invoice.id);
    setEditDate(invoice.invoiceDate);
    setEditClientMode("existing");
    setEditClientName(invoice.clientName);
    setEditAmount(String(invoice.totalAmount));
    setEditSettledClient(invoice.dateSettledClient ?? "");
    setEditSettledFirm(invoice.dateSettledFirm ?? "");
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: number) {
    setEditError(null);

    const trimmedName = editClientName.trim();
    const amount = Number(editAmount);

    if (!trimmedName) {
      setEditError("Enter a client name");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("Enter an amount greater than £0");
      return;
    }

    setEditSubmitting(true);
    try {
      const existing = clients.find((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
      const clientId = existing ? existing.id : (await addClient(trimmedName)).id;

      await updateInvoice(id, {
        invoiceDate: editDate,
        clientId,
        totalAmount: amount,
        dateSettledClient: editSettledClient || null,
        dateSettledFirm: editSettledFirm || null,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(invoice: Invoice) {
    const confirmed = window.confirm(
      `Delete the ${money.format(invoice.totalAmount)} invoice for ${invoice.clientName}?`,
    );
    if (!confirmed) return;

    try {
      await deleteInvoice(invoice.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that invoice");
    }
  }

  const trimmedSearch = search.trim().toLowerCase();
  const filteredInvoices = invoices.filter(
    (invoice) =>
      (statusFilter === "all" || invoice.status === statusFilter) &&
      invoice.clientName.toLowerCase().includes(trimmedSearch),
  );

  if (view.kind === "client") {
    return (
      <ClientDetail
        clientId={view.clientId}
        invoices={invoices}
        onBack={() => setView({ kind: "ledger" })}
      />
    );
  }

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Invoices</h1>
      <form onSubmit={handleSubmit} className="quick-add">
        <label className="sr-only" htmlFor="invoice-date">
          Invoice date
        </label>
        <input
          id="invoice-date"
          type="date"
          value={invoiceDate}
          onChange={(event) => setInvoiceDate(event.target.value)}
          required
        />
        <ClientPicker
          clients={clients}
          mode={clientMode}
          onModeChange={setClientMode}
          name={clientName}
          onNameChange={setClientName}
          fieldId="invoice-client"
          autoFocus
        />
        <label className="sr-only" htmlFor="invoice-amount">
          Amount
        </label>
        <input
          id="invoice-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={totalAmount}
          onChange={(event) => setTotalAmount(event.target.value)}
          placeholder="Amount (£)"
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add invoice"}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {editingId !== null && (
        <div className="edit-panel">
          <p className="edit-panel-title">Editing invoice for {editClientName || "…"}</p>
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
            <div className="edit-field">
              <span>Client</span>
              <ClientPicker
                clients={clients}
                mode={editClientMode}
                onModeChange={setEditClientMode}
                name={editClientName}
                onNameChange={setEditClientName}
                fieldId="edit-client"
                compact
              />
            </div>
            <label className="edit-field">
              <span>Amount</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className="input-compact"
                value={editAmount}
                onChange={(event) => setEditAmount(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Paid to Newmans</span>
              <input
                type="date"
                className="input-compact"
                value={editSettledClient}
                onChange={(event) => setEditSettledClient(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Paid to Anita</span>
              <input
                type="date"
                className="input-compact"
                value={editSettledFirm}
                onChange={(event) => setEditSettledFirm(event.target.value)}
              />
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

      {invoices.length > 0 && (
        <div className="filters">
          <label className="sr-only" htmlFor="invoice-search">
            Search by client
          </label>
          <input
            id="invoice-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by client…"
          />
          <label className="sr-only" htmlFor="status-filter">
            Filter by status
          </label>
          <select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : invoices.length === 0 ? (
        <p className="empty">No invoices yet — add the first one above.</p>
      ) : filteredInvoices.length === 0 ? (
        <p className="empty">No invoices match your search.</p>
      ) : (
        <div className="table-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Your share</th>
                <th>Status</th>
                <th>Lag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className={editingId === invoice.id ? "row-editing" : undefined}>
                  <td>{dateFmt.format(new Date(invoice.invoiceDate))}</td>
                  <td>
                    <button
                      type="button"
                      className="client-link"
                      onClick={() => setView({ kind: "client", clientId: invoice.clientId })}
                    >
                      {invoice.clientName}
                    </button>
                  </td>
                  <td>{money.format(invoice.totalAmount)}</td>
                  <td>{money.format(invoice.anitaIncome)}</td>
                  <td>
                    <select
                      className={`status status-select ${statusClass(invoice.status)}`}
                      value={invoice.status}
                      onChange={(event) => handleStatusChange(invoice, event.target.value)}
                    >
                      {INVOICE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{lagLabel(invoice.lagDays)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => startEdit(invoice)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(invoice)}>
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

function ClientDetail({
  clientId,
  invoices,
  onBack,
}: {
  clientId: number;
  invoices: Invoice[];
  onBack: () => void;
}) {
  const clientInvoices = invoices.filter((invoice) => invoice.clientId === clientId);
  const clientName = clientInvoices[0]?.clientName ?? "Client";
  const lifetimeBilled = clientInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const lifetimeShare = clientInvoices.reduce((sum, invoice) => sum + invoice.anitaIncome, 0);
  const lagValues = clientInvoices
    .map((invoice) => invoice.lagDays)
    .filter((days): days is number => days !== null);
  const avgLagDays =
    lagValues.length > 0 ? Math.round(lagValues.reduce((sum, days) => sum + days, 0) / lagValues.length) : null;

  return (
    <>
      <h1 className="sr-only">{clientName}</h1>
      <button type="button" className="back-link" onClick={onBack}>
        ← All invoices
      </button>
      <div className="client-header">
        <h2>{clientName}</h2>
      </div>
      <div className="client-stats">
        <div className="client-stat">
          <div className="n">{money.format(lifetimeBilled)}</div>
          <div className="l">Lifetime billed</div>
        </div>
        <div className="client-stat">
          <div className="n">{money.format(lifetimeShare)}</div>
          <div className="l">Lifetime share</div>
        </div>
        <div className="client-stat">
          <div className="n">{clientInvoices.length}</div>
          <div className="l">Invoices</div>
        </div>
        <div className="client-stat">
          <div className="n">{avgLagDays !== null ? `${avgLagDays}d` : "—"}</div>
          <div className="l">Avg. lag</div>
        </div>
      </div>
      {clientInvoices.length === 0 ? (
        <p className="empty">No invoices for this client yet.</p>
      ) : (
        <div className="table-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Your share</th>
                <th>Status</th>
                <th>Lag</th>
              </tr>
            </thead>
            <tbody>
              {clientInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{dateFmt.format(new Date(invoice.invoiceDate))}</td>
                  <td>{money.format(invoice.totalAmount)}</td>
                  <td>{money.format(invoice.anitaIncome)}</td>
                  <td>
                    <span className={`status ${statusClass(invoice.status)}`}>{invoice.status}</span>
                  </td>
                  <td>{lagLabel(invoice.lagDays)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
