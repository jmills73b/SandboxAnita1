import { useEffect, useState, type FormEvent } from "react";
import { addClient, addInvoice, getClients, getInvoices, type Client, type Invoice } from "./api";

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
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
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
