import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createInvoiceBatch,
  getFirms,
  getInvoiceBatch,
  getInvoiceBatches,
  getInvoiceSettings,
  getInvoices,
  updateFirm,
  updateInvoiceSettings,
  type Firm,
  type Invoice,
  type InvoiceBatchSummary,
  type InvoiceSettings,
} from "./api";
import { downloadInvoicePdf } from "./invoicePdf";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function dayLabel(dateStr: string): string {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));
  return dateFmt.format(new Date(Date.UTC(year, month - 1, day)));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Ready to bill: the client has paid Newmans, but Anita hasn't been paid
// yet, and it hasn't already been included in an earlier batch.
function isBillable(invoice: Invoice): boolean {
  return invoice.status === "Awaiting payment to Anita" && invoice.batchId === null;
}

const BLANK_SETTINGS: InvoiceSettings = {
  fromName: "",
  fromEmail: "",
  fromAddress: "",
  fromPostcode: "",
  fromPhone: "",
  bankAccountName: "",
  bankSortCode: "",
  bankAccountNumber: "",
  referencePrefix: "AMILLS",
  nextReferenceNumber: 1,
};

export function InvoiceGeneratorPage({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [batches, setBatches] = useState<InvoiceBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDate, setBatchDate] = useState(today());
  const [generating, setGenerating] = useState(false);

  const [editingSettings, setEditingSettings] = useState(false);
  const [downloadingBatchId, setDownloadingBatchId] = useState<number | null>(null);

  const firm = firms[0] ?? null;

  async function refresh() {
    setLoading(true);
    try {
      const [invoiceList, firmList, invoiceSettings, batchList] = await Promise.all([
        getInvoices(),
        getFirms(),
        getInvoiceSettings(),
        getInvoiceBatches(),
      ]);
      setInvoices(invoiceList);
      setFirms(firmList);
      setSettings(invoiceSettings);
      setBatches(batchList);
      setSelectedIds(new Set());
      // Nothing entered yet (a fresh install) — open the form straight
      // away rather than showing an invoice generator that can't work.
      if (!invoiceSettings.fromName) {
        setEditingSettings(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the invoice generator");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const candidates = useMemo(
    () => invoices.filter(isBillable).sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate)),
    [invoices],
  );

  const selectedInvoices = candidates.filter((invoice) => selectedIds.has(invoice.id));
  const totalFee = selectedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalAmountDue = selectedInvoices.reduce((sum, invoice) => sum + invoice.anitaIncome, 0);

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === candidates.length ? new Set() : new Set(candidates.map((i) => i.id))));
  }

  async function handleGenerate() {
    if (!firm || selectedIds.size === 0) return;
    setError(null);
    setGenerating(true);
    try {
      const batch = await createInvoiceBatch({
        invoiceIds: Array.from(selectedIds),
        firmId: firm.id,
        invoiceDate: batchDate,
      });
      await downloadInvoicePdf(batch);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate that invoice");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate(batchId: number) {
    setError(null);
    setDownloadingBatchId(batchId);
    try {
      const detail = await getInvoiceBatch(batchId);
      await downloadInvoicePdf(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't download that invoice");
    } finally {
      setDownloadingBatchId(null);
    }
  }

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Invoice Generator</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <>
          <SettingsPanel
            settings={settings ?? BLANK_SETTINGS}
            firm={firm}
            editing={editingSettings}
            onOpenEdit={() => setEditingSettings(true)}
            onSaved={(newSettings, newFirm) => {
              setSettings(newSettings);
              setFirms((prev) => (prev.length ? [newFirm, ...prev.slice(1)] : [newFirm]));
              setEditingSettings(false);
            }}
            onCancel={() => setEditingSettings(false)}
          />

          {!editingSettings && (
            <>
              <h2 className="section-heading">Ready to bill</h2>
              {candidates.length === 0 ? (
                <p className="empty">
                  Nothing to bill yet — an invoice shows up here once it's marked "Awaiting payment to Anita".
                </p>
              ) : (
                <>
                  <div className="table-scroll">
                    <table className="ledger">
                      <thead>
                        <tr>
                          <th className="checkbox-cell">
                            <input
                              type="checkbox"
                              checked={selectedIds.size === candidates.length}
                              onChange={toggleSelectAll}
                              aria-label="Select all"
                            />
                          </th>
                          <th>Date</th>
                          <th>File No.</th>
                          <th>Client &amp; Matter</th>
                          <th>Total Fee</th>
                          <th>Amount Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="checkbox-cell">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(invoice.id)}
                                onChange={() => toggleSelected(invoice.id)}
                                aria-label={`Select invoice for ${invoice.clientName}`}
                              />
                            </td>
                            <td>{dayLabel(invoice.invoiceDate)}</td>
                            <td>{invoice.reference ?? "—"}</td>
                            <td>{invoice.matter ? `${invoice.clientName} - ${invoice.matter}` : invoice.clientName}</td>
                            <td>{money.format(invoice.totalAmount)}</td>
                            <td>{money.format(invoice.anitaIncome)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="totals-bar">
                    <div className="totals-bar-figures">
                      <span>
                        {selectedIds.size} selected · Total fee <strong>{money.format(totalFee)}</strong> · Amount due{" "}
                        <strong>{money.format(totalAmountDue)}</strong>
                      </span>
                    </div>
                    <div className="totals-bar-actions">
                      <label className="sr-only" htmlFor="batch-date">
                        Invoice date
                      </label>
                      <input
                        id="batch-date"
                        type="date"
                        value={batchDate}
                        onChange={(event) => setBatchDate(event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={selectedIds.size === 0 || generating || !settings?.fromName}
                      >
                        {generating ? "Generating…" : "Generate invoice"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <h2 className="section-heading">Previously generated</h2>
              {batches.length === 0 ? (
                <p className="empty">No invoices generated yet.</p>
              ) : (
                <div className="table-scroll">
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Date</th>
                        <th>Bill to</th>
                        <th>Amount Due</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((batch) => (
                        <tr key={batch.id}>
                          <td>{batch.reference}</td>
                          <td>{dayLabel(batch.invoiceDate)}</td>
                          <td>{batch.billToName}</td>
                          <td>{money.format(batch.totalAmountDue)}</td>
                          <td>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => handleRegenerate(batch.id)}
                              disabled={downloadingBatchId === batch.id}
                            >
                              {downloadingBatchId === batch.id ? "Preparing…" : "Download PDF"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

function SettingsPanel({
  settings,
  firm,
  editing,
  onOpenEdit,
  onSaved,
  onCancel,
}: {
  settings: InvoiceSettings;
  firm: Firm | null;
  editing: boolean;
  onOpenEdit: () => void;
  onSaved: (settings: InvoiceSettings, firm: Firm) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(settings);
  const [firmForm, setFirmForm] = useState({
    contactEmail: firm?.contactEmail ?? "",
    contactAddress: firm?.contactAddress ?? "",
    contactPostcode: firm?.contactPostcode ?? "",
    contactPhone: firm?.contactPhone ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm(settings);
      setFirmForm({
        contactEmail: firm?.contactEmail ?? "",
        contactAddress: firm?.contactAddress ?? "",
        contactPostcode: firm?.contactPostcode ?? "",
        contactPhone: firm?.contactPhone ?? "",
      });
      setFormError(null);
    }
  }, [editing, settings, firm]);

  function field(key: keyof InvoiceSettings) {
    return {
      value: String(form[key] ?? ""),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: event.target.value })),
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!form.fromName.trim()) {
      setFormError("Enter your name");
      return;
    }
    const nextNumber = Number(form.nextReferenceNumber);
    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      setFormError("Enter a next reference number of 1 or more");
      return;
    }
    if (!firm) {
      setFormError("No firm to bill has been set up yet");
      return;
    }

    setSubmitting(true);
    try {
      const [savedSettings, savedFirm] = await Promise.all([
        updateInvoiceSettings({ ...form, nextReferenceNumber: nextNumber }),
        updateFirm(firm.id, firmForm),
      ]);
      onSaved(savedSettings, savedFirm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save those details");
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <div className="client-header">
        <div className="performance-heading">
          <h2>Invoice Generator</h2>
          <span className="target-line">
            Next reference <strong>{settings.referencePrefix}{String(settings.nextReferenceNumber).padStart(4, "0")}</strong>
          </span>
        </div>
        <button type="button" className="secondary" onClick={onOpenEdit}>
          Edit details
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="edit-panel">
      <p className="edit-panel-title">Invoice details</p>

      <p className="settings-section-title">Your details (From)</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Name</span>
          <input className="input-compact" {...field("fromName")} required />
        </label>
        <label className="edit-field">
          <span>Email</span>
          <input className="input-compact" type="email" {...field("fromEmail")} />
        </label>
        <label className="edit-field">
          <span>Address</span>
          <input className="input-compact" {...field("fromAddress")} />
        </label>
        <label className="edit-field">
          <span>Postcode</span>
          <input className="input-compact" {...field("fromPostcode")} />
        </label>
        <label className="edit-field">
          <span>Phone</span>
          <input className="input-compact" {...field("fromPhone")} />
        </label>
      </div>

      <p className="settings-section-title">{firm?.name ?? "Firm"} details (Bill to)</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Email</span>
          <input
            className="input-compact"
            type="email"
            value={firmForm.contactEmail}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
          />
        </label>
        <label className="edit-field">
          <span>Address</span>
          <input
            className="input-compact"
            value={firmForm.contactAddress}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactAddress: event.target.value }))}
          />
        </label>
        <label className="edit-field">
          <span>Postcode</span>
          <input
            className="input-compact"
            value={firmForm.contactPostcode}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactPostcode: event.target.value }))}
          />
        </label>
        <label className="edit-field">
          <span>Phone</span>
          <input
            className="input-compact"
            value={firmForm.contactPhone}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
          />
        </label>
      </div>

      <p className="settings-section-title">Bank details</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Account name</span>
          <input className="input-compact" {...field("bankAccountName")} />
        </label>
        <label className="edit-field">
          <span>Sort code</span>
          <input className="input-compact" {...field("bankSortCode")} />
        </label>
        <label className="edit-field">
          <span>Account no.</span>
          <input className="input-compact" {...field("bankAccountNumber")} />
        </label>
      </div>

      <p className="settings-section-title">Invoice numbering</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Reference prefix</span>
          <input className="input-compact" {...field("referencePrefix")} required />
        </label>
        <label className="edit-field">
          <span>Next number</span>
          <input className="input-compact" type="number" min="1" step="1" {...field("nextReferenceNumber")} required />
        </label>
      </div>

      {formError && (
        <p className="error" role="alert">
          {formError}
        </p>
      )}

      <div className="row-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
