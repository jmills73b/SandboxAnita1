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
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function statusClass(status: string): string {
  return `status-${status.toLowerCase().replace(/[^a-z]+/g, "-")}`;
}

type View = { kind: "ledger" } | { kind: "client"; clientId: number };

export function InvoicesPage({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [clientName, setClientName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ kind: "ledger" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

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
    setEditClientName(invoice.clientName);
    setEditAmount(String(invoice.totalAmount));
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

      await updateInvoice(id, { invoiceDate: editDate, clientId, totalAmount: amount });
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
        <label className="sr-only" htmlFor="invoice-client">
          Client name
        </label>
        <input
          id="invoice-client"
          list="client-options"
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Client name"
          required
          autoFocus
        />
        <datalist id="client-options">
          {clients.map((client) => (
            <option key={client.id} value={client.name} />
          ))}
        </datalist>
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

      {loading ? (
        <p>Loading…</p>
      ) : invoices.length === 0 ? (
        <p className="empty">No invoices yet — add the first one above.</p>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) =>
                editingId === invoice.id ? (
                  <tr key={invoice.id}>
                    <td>
                      <input
                        type="date"
                        className="input-compact"
                        value={editDate}
                        onChange={(event) => setEditDate(event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        list="client-options"
                        className="input-compact"
                        value={editClientName}
                        onChange={(event) => setEditClientName(event.target.value)}
                      />
                    </td>
                    <td colSpan={2}>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        className="input-compact"
                        value={editAmount}
                        onChange={(event) => setEditAmount(event.target.value)}
                      />
                      {editError && (
                        <p className="error" role="alert">
                          {editError}
                        </p>
                      )}
                    </td>
                    <td colSpan={2}>
                      <div className="row-actions">
                        <button type="button" onClick={() => saveEdit(invoice.id)} disabled={editSubmitting}>
                          {editSubmitting ? "Saving…" : "Save"}
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={invoice.id}>
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
                ),
              )}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
