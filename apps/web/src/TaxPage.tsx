import { useEffect, useState, type FormEvent } from "react";
import {
  calculateTaxAndNi,
  currentTaxYearStartYear,
  recentTaxYearStartYears,
  taxYearLabel,
  taxYearStartDate,
  type TaxAndNiBreakdown,
  type TaxRateSettings,
} from "@sandboxanita1/core";
import {
  getExpenses,
  getInvoices,
  getTaxYearSettings,
  setTaxYearRates,
  type Expense,
  type Invoice,
  type TaxRates,
  type TaxYearSettings,
} from "./api";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });

// TaxRates' fields are nullable (unset until the first save) — this is the
// same shape with every field guaranteed a number, once ratesAreComplete
// has confirmed that's true.
type FilledTaxRates = { [K in keyof TaxRates]: number };

const YEAR_OPTIONS = 6;

function todayISO(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

// Elapsed fraction of the tax year up to today, clamped to [~1 day, 1] — a
// past tax year is always fully elapsed (1); a brand-new one still gets a
// tiny non-zero fraction so an early projection doesn't divide by zero.
function elapsedFraction(startYear: number): number {
  const start = new Date(taxYearStartDate(startYear));
  const end = new Date(taxYearStartDate(startYear + 1));
  const today = new Date(todayISO());
  if (today >= end) return 1;
  if (today <= start) return 1 / 365;
  const elapsedMs = today.getTime() - start.getTime();
  const totalMs = end.getTime() - start.getTime();
  return Math.max(elapsedMs / totalMs, 1 / 365);
}

function ratesAreComplete(rates: TaxRates): rates is FilledTaxRates {
  return Object.values(rates).every((value) => value !== null);
}

// Cash actually received (paid to Anita) is the right basis for a
// cash-basis sole trader's tax estimate, rather than invoiced-but-unpaid
// amounts — matches the "Money paid" mode on the Performance page.
function incomeInYear(invoices: Invoice[], startYear: number): number {
  const start = taxYearStartDate(startYear);
  const end = taxYearStartDate(startYear + 1);
  return invoices
    .filter((inv) => inv.dateSettledFirm && inv.dateSettledFirm >= start && inv.dateSettledFirm < end)
    .reduce((sum, inv) => sum + inv.anitaIncome, 0);
}

function expensesInYear(expenses: Expense[], startYear: number): number {
  const start = taxYearStartDate(startYear);
  const end = taxYearStartDate(startYear + 1);
  return expenses
    .filter((exp) => exp.date >= start && exp.date < end)
    .reduce((sum, exp) => sum + exp.cost, 0);
}

export function TaxPage({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<TaxYearSettings | null>(null);
  const [selectedStartYear, setSelectedStartYear] = useState(() => currentTaxYearStartYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRates, setEditingRates] = useState(false);

  async function refresh(startYear: number) {
    setLoading(true);
    setEditingRates(false);
    try {
      const [invoiceList, expenseList, taxYearSettings] = await Promise.all([
        getInvoices(),
        getExpenses(),
        getTaxYearSettings(startYear),
      ]);
      setInvoices(invoiceList);
      setExpenses(expenseList);
      setSettings(taxYearSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load tax data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(selectedStartYear);
  }, [selectedStartYear]);

  const rates = settings?.rates;
  const complete = rates ? ratesAreComplete(rates) : false;

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Tax &amp; NI Estimate</h1>

      <div className="filters">
        <label className="sr-only" htmlFor="tax-year-select">
          Tax year
        </label>
        <select
          id="tax-year-select"
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

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : !complete || editingRates ? (
        <RatesForm
          startYear={selectedStartYear}
          rates={settings?.rates ?? null}
          onSaved={(updated) => {
            setSettings(updated);
            setEditingRates(false);
          }}
          onCancel={complete ? () => setEditingRates(false) : undefined}
        />
      ) : (
        <TaxSummary
          invoices={invoices}
          expenses={expenses}
          startYear={selectedStartYear}
          taxYear={settings!.taxYear}
          rates={rates as FilledTaxRates}
          ratesConfirmedAt={settings!.ratesConfirmedAt}
          onEditRates={() => setEditingRates(true)}
        />
      )}
    </>
  );
}

const RATE_FIELDS: Array<{ key: keyof TaxRates; label: string; isRate: boolean }> = [
  { key: "personalAllowance", label: "Personal allowance (£)", isRate: false },
  { key: "basicRate", label: "Basic rate (e.g. 0.2 for 20%)", isRate: true },
  { key: "basicRateThreshold", label: "Basic rate threshold (£)", isRate: false },
  { key: "higherRate", label: "Higher rate (e.g. 0.4 for 40%)", isRate: true },
  { key: "higherRateThreshold", label: "Higher rate threshold (£)", isRate: false },
  { key: "additionalRate", label: "Additional rate (e.g. 0.45 for 45%)", isRate: true },
  { key: "niLowerThreshold", label: "NI lower threshold (£)", isRate: false },
  { key: "niUpperThreshold", label: "NI upper threshold (£)", isRate: false },
  { key: "niLowerRate", label: "NI lower rate (e.g. 0.06 for 6%)", isRate: true },
  { key: "niUpperRate", label: "NI upper rate (e.g. 0.02 for 2%)", isRate: true },
  { key: "class2FlatRate", label: "Class 2 flat charge (£/year)", isRate: false },
];

function RatesForm({
  startYear,
  rates,
  onSaved,
  onCancel,
}: {
  startYear: number;
  rates: TaxRates | null;
  onSaved: (settings: TaxYearSettings) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(RATE_FIELDS.map(({ key }) => [key, rates?.[key] != null ? String(rates[key]) : ""])),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed: Record<string, number> = {};
    for (const { key, label } of RATE_FIELDS) {
      const value = Number(form[key]);
      if (!Number.isFinite(value) || value < 0) {
        setFormError(`Enter a valid value for "${label}"`);
        return;
      }
      parsed[key] = value;
    }

    setSubmitting(true);
    try {
      const updated = await setTaxYearRates(startYear, parsed as FilledTaxRates);
      onSaved(updated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save those rates");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="edit-panel">
      <p className="edit-panel-title">
        Tax &amp; NI rates for {taxYearLabel(startYear)}
      </p>
      <p className="hint">
        These come from HMRC's published rates for the tax year — enter them here once, and reuse this page's
        calculations for every future year by updating them again then.
      </p>

      <p className="settings-section-title">Income tax</p>
      <div className="edit-row">
        {RATE_FIELDS.slice(0, 5).map(({ key, label }) => (
          <label className="edit-field" key={key}>
            <span>{label}</span>
            <input
              className="input-compact"
              type="number"
              step="any"
              min="0"
              value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              required
            />
          </label>
        ))}
      </div>

      <p className="settings-section-title">Additional rate</p>
      <div className="edit-row">
        {RATE_FIELDS.slice(5, 6).map(({ key, label }) => (
          <label className="edit-field" key={key}>
            <span>{label}</span>
            <input
              className="input-compact"
              type="number"
              step="any"
              min="0"
              value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              required
            />
          </label>
        ))}
      </div>

      <p className="settings-section-title">National Insurance</p>
      <div className="edit-row">
        {RATE_FIELDS.slice(6).map(({ key, label }) => (
          <label className="edit-field" key={key}>
            <span>{label}</span>
            <input
              className="input-compact"
              type="number"
              step="any"
              min="0"
              value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              required
            />
          </label>
        ))}
      </div>

      {formError && (
        <p className="error" role="alert">
          {formError}
        </p>
      )}

      <div className="row-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save rates"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function TaxSummary({
  invoices,
  expenses,
  startYear,
  taxYear,
  rates,
  ratesConfirmedAt,
  onEditRates,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  startYear: number;
  taxYear: string;
  rates: FilledTaxRates;
  ratesConfirmedAt: string | null;
  onEditRates: () => void;
}) {
  const isCurrentYear = startYear === currentTaxYearStartYear();
  const settings: TaxRateSettings = rates;

  const grossIncomeSoFar = incomeInYear(invoices, startYear);
  const allowableExpensesSoFar = expensesInYear(expenses, startYear);
  const taxableProfitSoFar = Math.max(0, grossIncomeSoFar - allowableExpensesSoFar);
  const soFar = calculateTaxAndNi(taxableProfitSoFar, settings);

  const fraction = elapsedFraction(startYear);
  const projectedGrossIncome = grossIncomeSoFar / fraction;
  const projectedExpenses = allowableExpensesSoFar / fraction;
  const projectedTaxableProfit = Math.max(0, projectedGrossIncome - projectedExpenses);
  const projected = calculateTaxAndNi(projectedTaxableProfit, settings);

  return (
    <>
      <div className="client-header">
        <div className="performance-heading">
          <h2>{taxYear}</h2>
          {ratesConfirmedAt && <span className="target-line">Rates last set {formatDate(ratesConfirmedAt)}</span>}
        </div>
        <button type="button" className="secondary" onClick={onEditRates}>
          Edit rates
        </button>
      </div>

      <p className="mode-caption">
        Based on income actually paid to Anita and expenses logged so far this tax year (6 April {startYear} – 5
        April {startYear + 1}).
      </p>

      <div className="stat-groups">
        <TaxBreakdownCard
          label={isCurrentYear ? "Year to date" : "Full year"}
          grossIncome={grossIncomeSoFar}
          expenses={allowableExpensesSoFar}
          breakdown={soFar}
        />
        {isCurrentYear && (
          <TaxBreakdownCard
            label={`Projected full year (${percent.format(fraction)} elapsed)`}
            grossIncome={projectedGrossIncome}
            expenses={projectedExpenses}
            breakdown={projected}
          />
        )}
      </div>
    </>
  );
}

function TaxBreakdownCard({
  label,
  grossIncome,
  expenses,
  breakdown,
}: {
  label: string;
  grossIncome: number;
  expenses: number;
  breakdown: TaxAndNiBreakdown;
}) {
  return (
    <div className="stat-group tax-breakdown">
      <div className="stat-group-label">{label}</div>
      <dl className="tax-breakdown-lines">
        <div>
          <dt>Gross income</dt>
          <dd>{money.format(grossIncome)}</dd>
        </div>
        <div>
          <dt>Allowable expenses</dt>
          <dd>-{money.format(expenses)}</dd>
        </div>
        <div className="tax-breakdown-subtotal">
          <dt>Taxable profit</dt>
          <dd>{money.format(breakdown.taxableProfit)}</dd>
        </div>
        <div>
          <dt>Income tax</dt>
          <dd>-{money.format(breakdown.incomeTax)}</dd>
        </div>
        <div>
          <dt>Class 4 NI</dt>
          <dd>-{money.format(breakdown.class4NI)}</dd>
        </div>
        <div>
          <dt>Class 2 NI</dt>
          <dd>-{money.format(breakdown.class2NI)}</dd>
        </div>
        <div className="tax-breakdown-total">
          <dt>Net (take-home)</dt>
          <dd>{money.format(breakdown.netIncome)}</dd>
        </div>
      </dl>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
