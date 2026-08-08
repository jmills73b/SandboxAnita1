import { useEffect, useMemo, useState } from "react";
import { currentTaxYearStartYear, recentTaxYearStartYears, taxYearLabel, taxYearStartDate } from "@sandboxanita1/core";
import {
  createInvoiceBatch,
  deleteInvoiceBatch,
  getFirms,
  getInvoiceBatch,
  getInvoiceBatches,
  getInvoiceSettings,
  getInvoices,
  type Firm,
  type Invoice,
  type InvoiceBatchSummary,
  type InvoiceSettings,
} from "./api";
import { downloadInvoicePdf } from "./invoicePdf";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const YEAR_OPTIONS = 6;

function dayLabel(dateStr: string): string {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));
  return dateFmt.format(new Date(Date.UTC(year, month - 1, day)));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Both sides are plain "YYYY-MM-DD", so this is a lexicographic compare —
// no Date parsing, no timezone to get wrong.
function isInTaxYear(dateStr: string, startYear: number): boolean {
  return dateStr >= taxYearStartDate(startYear) && dateStr < taxYearStartDate(startYear + 1);
}

// Ready to bill: the client has paid Newmans, but Anita hasn't been paid
// yet, and it hasn't already been included in an earlier batch.
function isBillable(invoice: Invoice): boolean {
  return invoice.status === "Awaiting payment to Anita" && invoice.batchId === null;
}

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
  const [selectedStartYear, setSelectedStartYear] = useState(() => currentTaxYearStartYear());

  const [downloadingBatchId, setDownloadingBatchId] = useState<number | null>(null);
  const [deletingBatchId, setDeletingBatchId] = useState<number | null>(null);

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

  const yearBatches = batches.filter((batch) => isInTaxYear(batch.invoiceDate, selectedStartYear));

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

  async function handleDeleteBatch(batch: InvoiceBatchSummary) {
    const confirmed = window.confirm(
      `Delete invoice ${batch.reference}? Its line items go back to "Ready to bill" so you can re-invoice them.`,
    );
    if (!confirmed) return;

    setError(null);
    setDeletingBatchId(batch.id);
    try {
      await deleteInvoiceBatch(batch.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that invoice");
    } finally {
      setDeletingBatchId(null);
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
          <div className="client-header">
            <div className="performance-heading">
              <h2>Invoice Generator</h2>
              {settings?.fromName && (
                <span className="target-line">
                  Next reference{" "}
                  <strong>
                    {settings.referencePrefix}
                    {String(settings.nextReferenceNumber).padStart(4, "0")}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {!settings?.fromName && (
            <p className="empty">Set your invoice details in Admin &amp; Settings before generating an invoice.</p>
          )}

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

          {batches.length > 0 && (
            <div className="filters">
              <label className="sr-only" htmlFor="batch-tax-year">
                Tax year
              </label>
              <select
                id="batch-tax-year"
                value={selectedStartYear}
                onChange={(event) => setSelectedStartYear(Number(event.target.value))}
              >
                {recentTaxYearStartYears(YEAR_OPTIONS).map((year) => (
                  <option key={year} value={year}>
                    {taxYearLabel(year)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {batches.length === 0 ? (
            <p className="empty">No invoices generated yet.</p>
          ) : yearBatches.length === 0 ? (
            <p className="empty">No invoices generated in {taxYearLabel(selectedStartYear)}.</p>
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
                  {yearBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td>{batch.reference}</td>
                      <td>{dayLabel(batch.invoiceDate)}</td>
                      <td>{batch.billToName}</td>
                      <td>{money.format(batch.totalAmountDue)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleRegenerate(batch.id)}
                            disabled={downloadingBatchId === batch.id}
                          >
                            {downloadingBatchId === batch.id ? "Preparing…" : "Download PDF"}
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteBatch(batch)}
                            disabled={deletingBatchId === batch.id}
                          >
                            {deletingBatchId === batch.id ? "Deleting…" : "Delete"}
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
      )}
    </>
  );
}
