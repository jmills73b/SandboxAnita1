import { useEffect, useState, type FormEvent } from "react";
import {
  getCurrentTaxYearSettings,
  getInvoices,
  setMonthlyTarget,
  type Invoice,
  type TaxYearSettings,
} from "./api";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

const TREND_MONTHS = 6;

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

// key is always our own "YYYY-MM" (see recentMonthKeys/monthKey), so fixed
// slicing is simpler and safer here than destructuring a split() array.
function monthLabel(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  return monthFmt.format(new Date(Date.UTC(year, month - 1, 1)));
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function currentMonthKey(): string {
  return toMonthKey(new Date());
}

// The last N months including the current one, oldest first — always
// generated fresh rather than derived from the invoices, so a month with
// no settled income yet still shows up as "£0 so far" instead of vanishing.
function recentMonthKeys(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(toMonthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}

// Money actually landing with Anita (dateSettledFirm), not the invoice
// date or when the client paid — see the "which paid date" discussion.
function incomeByMonth(invoices: Invoice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const invoice of invoices) {
    if (!invoice.dateSettledFirm) continue;
    const key = monthKey(invoice.dateSettledFirm);
    totals.set(key, (totals.get(key) ?? 0) + invoice.anitaIncome);
  }
  return totals;
}

function targetStatusClass(actual: number, target: number): string {
  if (actual >= target) return "status-complete";
  if (actual > 0) return "";
  return "status-in-progress";
}

function targetStatusLabel(actual: number, target: number): string {
  if (actual >= target) return "Target met";
  if (actual > 0) return "Below target";
  return "No income yet";
}

export function PerformancePage({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<TaxYearSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [targetSubmitting, setTargetSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [invoiceList, taxYearSettings] = await Promise.all([getInvoices(), getCurrentTaxYearSettings()]);
      setInvoices(invoiceList);
      setSettings(taxYearSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load performance data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSetTarget(event: FormEvent) {
    event.preventDefault();
    setTargetError(null);

    const amount = Number(targetInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTargetError("Enter a target greater than £0");
      return;
    }

    setTargetSubmitting(true);
    try {
      const updated = await setMonthlyTarget(amount);
      setSettings(updated);
      setEditingTarget(false);
      setTargetInput("");
    } catch (err) {
      setTargetError(err instanceof Error ? err.message : "Couldn't save that target");
    } finally {
      setTargetSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Performance &amp; Targets</h1>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : !settings?.monthlyTarget || editingTarget ? (
        <form onSubmit={handleSetTarget} className="quick-add">
          <label className="sr-only" htmlFor="monthly-target">
            Monthly target
          </label>
          <input
            id="monthly-target"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={targetInput}
            onChange={(event) => setTargetInput(event.target.value)}
            placeholder="Monthly target (£)"
            required
            autoFocus
          />
          <button type="submit" disabled={targetSubmitting}>
            {targetSubmitting ? "Saving…" : "Save target"}
          </button>
          {editingTarget && (
            <button type="button" className="secondary" onClick={() => setEditingTarget(false)}>
              Cancel
            </button>
          )}
        </form>
      ) : (
        <PerformanceSummary
          invoices={invoices}
          target={settings.monthlyTarget}
          taxYear={settings.taxYear}
          onEditTarget={() => {
            setTargetInput(String(settings.monthlyTarget));
            setEditingTarget(true);
          }}
        />
      )}

      {targetError && (
        <p className="error" role="alert">
          {targetError}
        </p>
      )}
    </>
  );
}

function PerformanceSummary({
  invoices,
  target,
  taxYear,
  onEditTarget,
}: {
  invoices: Invoice[];
  target: number;
  taxYear: string;
  onEditTarget: () => void;
}) {
  const monthlyTotals = incomeByMonth(invoices);
  const months = recentMonthKeys(TREND_MONTHS);
  const thisMonthKey = currentMonthKey();
  const thisMonthActual = monthlyTotals.get(thisMonthKey) ?? 0;

  return (
    <>
      <div className="client-header">
        <div className="performance-heading">
          <h2>{monthLabel(thisMonthKey)}</h2>
          <span className={`status ${targetStatusClass(thisMonthActual, target)}`}>
            {targetStatusLabel(thisMonthActual, target)}
          </span>
        </div>
        <button type="button" className="secondary" onClick={onEditTarget}>
          Edit target
        </button>
      </div>

      <div className="client-stats">
        <div className="client-stat">
          <div className="n">{money.format(thisMonthActual)}</div>
          <div className="l">Received this month</div>
        </div>
        <div className="client-stat">
          <div className="n">{money.format(target)}</div>
          <div className="l">Monthly target ({taxYear})</div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="ledger">
          <thead>
            <tr>
              <th>Month</th>
              <th>Received</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {months
              .slice()
              .reverse()
              .map((key) => {
                const actual = monthlyTotals.get(key) ?? 0;
                return (
                  <tr key={key}>
                    <td>{monthLabel(key)}</td>
                    <td>{money.format(actual)}</td>
                    <td>{money.format(target)}</td>
                    <td>
                      <span className={`status ${targetStatusClass(actual, target)}`}>
                        {targetStatusLabel(actual, target)}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}
