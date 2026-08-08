import { Fragment, useEffect, useState, type FormEvent } from "react";
import { currentTaxYearStartYear, recentTaxYearStartYears, taxMonthKey, taxYearLabel } from "@sandboxanita1/core";
import { getInvoices, getTaxYearSettings, setTaxYearTarget, type Invoice, type TaxYearSettings } from "./api";

// A thin line at low contrast is fine for a background gridline, but a
// *data* line needs to survive being read on its own — only these three
// tokens clear 3:1 against the paper surface in every theme this app
// ships (light, dark, and the violet "Feel Good" variant), so that's the
// hard cap on how many tax years can go on screen at once, not "3-5"
// picked for its own sake. Keyed by years-back-from-current so the
// current year is always full ink regardless of which years happen to
// have data.
const YOY_MAX_YEARS = 3;
const YOY_TONE_BY_YEARS_BACK: Record<number, string> = {
  0: "var(--ink)",
  1: "var(--ink-soft)",
  2: "var(--ink-faint)",
};
const YOY_MONTH_ABBREVS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
// Every date here is built as UTC midnight (Date.UTC(...)) and represents
// a whole month, not a moment — formatting it in the viewer's local time
// zone would roll it back a day (and so a whole displayed month) for
// anyone west of UTC, exactly like the invoice date bug in InvoicesPage.
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const monthAbbrevFmt = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const YEAR_OPTIONS = 6;

// key is always our own "YYYY-MM" (see taxYearMonthKeys/toMonthKey), so
// fixed slicing is simpler and safer here than destructuring a split() array.
function monthLabel(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  return monthFmt.format(new Date(Date.UTC(year, month - 1, 1)));
}

function monthAbbrev(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  return monthAbbrevFmt.format(new Date(Date.UTC(year, month - 1, 1)));
}

function dayLabel(dateStr: string): string {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));
  return dayFmt.format(new Date(Date.UTC(year, month - 1, day)));
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function todayISO(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

// "This month" means the current tax month, same convention as
// taxMonthKey above — otherwise, on the 1st-5th, this would look up a
// bucket that no income settled in those exact days would ever land in.
function currentMonthKey(): string {
  return taxMonthKey(todayISO());
}

// April of startYear through March of startYear + 1. For the current tax
// year this is truncated to "up to this month" — a future month hasn't
// happened yet, so there's nothing meaningful to show for it. A past tax
// year is already complete, so all 12 months are shown.
function taxYearMonthKeys(startYear: number, truncateToCurrentMonth: boolean): string[] {
  const keys: string[] = [];
  for (let i = 0; i < 12; i++) {
    keys.push(toMonthKey(new Date(Date.UTC(startYear, 3 + i, 1))));
  }
  if (!truncateToCurrentMonth) return keys;
  const idx = keys.indexOf(currentMonthKey());
  return idx >= 0 ? keys.slice(0, idx + 1) : keys;
}

type PerformanceMode = "paid" | "all";

// "paid" mode: money actually landing with Anita (dateSettledFirm) — the
// strict view, matching what's really in the bank. "all" mode includes
// every invoice, falling back through whichever date is known: paid to
// Anita, else paid to Newmans, else the invoice date itself — so work
// still shows up before it's fully settled.
function effectiveDateFor(invoice: Invoice, mode: PerformanceMode): string | null {
  return mode === "paid"
    ? invoice.dateSettledFirm
    : (invoice.dateSettledFirm ?? invoice.dateSettledClient ?? invoice.invoiceDate);
}

// Which of the three dates actually decided an invoice's bucket in "all"
// mode — surfaced in the breakdown so "why is this invoice in this month"
// has a visible answer, rather than needing another round of "I don't
// recognise this figure" the way the tax-month bucketing did originally.
function effectiveDateSourceLabel(invoice: Invoice): string {
  if (invoice.dateSettledFirm) return "Paid to Anita";
  if (invoice.dateSettledClient) return "Paid to Newmans";
  return "Invoiced";
}

function invoicesByMonth(invoices: Invoice[], mode: PerformanceMode): Map<string, Invoice[]> {
  const grouped = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    const date = effectiveDateFor(invoice, mode);
    if (!date) continue;
    const key = taxMonthKey(date);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(invoice);
    else grouped.set(key, [invoice]);
  }
  return grouped;
}

function monthTotal(monthInvoices: Invoice[] | undefined): number {
  return (monthInvoices ?? []).reduce((sum, invoice) => sum + invoice.anitaIncome, 0);
}

function targetStatusClass(actual: number, target: number): string {
  if (actual >= target) return "status-complete";
  if (actual > 0) return "";
  return "status-in-progress";
}

// "yet" only makes sense while the period could still receive income —
// a past month, or a past tax year's "full year" headline, is already
// closed, so "No income" reads as the final word rather than a pending one.
function targetStatusLabel(actual: number, target: number, pending: boolean): string {
  if (actual >= target) return "Target met";
  if (actual > 0) return "Below target";
  return pending ? "No income yet" : "No income";
}

interface YoYSeries {
  startYear: number;
  label: string;
  yearsBack: number;
  // Length 12, index 0 = April .. 11 = March; running total so far that
  // month. null once past this year's known months (future months of the
  // current, still-open tax year), so the line stops rather than
  // flat-lining into months that haven't happened.
  cumulative: (number | null)[];
}

// Cumulative YTD income for the last few tax years, aligned by
// month-of-year rather than absolute month, so April of one year lines up
// under April of another — the whole point of a year-over-year read.
function yearOverYearSeries(invoices: Invoice[], mode: PerformanceMode): YoYSeries[] {
  const current = currentTaxYearStartYear();
  const monthGroups = invoicesByMonth(invoices, mode);

  return recentTaxYearStartYears(YOY_MAX_YEARS)
    .map((startYear) => {
      const isCurrent = startYear === current;
      const monthKeys = taxYearMonthKeys(startYear, isCurrent);
      let running = 0;
      const cumulative: (number | null)[] = [];
      for (const key of monthKeys) {
        running += monthTotal(monthGroups.get(key));
        cumulative.push(running);
      }
      while (cumulative.length < 12) cumulative.push(null);
      return { startYear, label: taxYearLabel(startYear), yearsBack: current - startYear, cumulative };
    })
    // A year with no income at all (before the practice existed, or not
    // started yet) isn't a useful reference line — it'd just be a flat
    // zero clutter the comparison rather than informing it.
    .filter((series) => series.cumulative.some((value) => value !== null && value > 0))
    .reverse(); // oldest first, so the current year draws last (on top)
}

// Rounds a chart's axis ceiling up to a "clean" step (1/2/5 x a power of
// ten) rather than the raw max, so gridlines land on numbers a reader
// would actually round to, not an arbitrary invoice total.
function niceAxisStep(maxValue: number, targetTicks = 4): number {
  if (maxValue <= 0) return 1;
  const raw = maxValue / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const residual = raw / magnitude;
  const niceResidual = residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1;
  return niceResidual * magnitude;
}

function percentOfTarget(actual: number, target: number): number {
  return target > 0 ? (actual / target) * 100 : 0;
}

// How far a month sits from its target, as a signed delta rather than a
// raw percentage — "+20%" or "-35%" reads faster than "120% of target" in
// a table where every row needs scanning at a glance.
function targetDelta(actual: number, target: number): number {
  return target > 0 ? Math.round((actual / target - 1) * 100) : 0;
}

export function PerformancePage({ onBack }: { onBack: () => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<TaxYearSettings | null>(null);
  const [selectedStartYear, setSelectedStartYear] = useState(() => currentTaxYearStartYear());
  const [mode, setMode] = useState<PerformanceMode>("paid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [targetError, setTargetError] = useState<string | null>(null);
  const [targetSubmitting, setTargetSubmitting] = useState(false);

  async function refresh(startYear: number) {
    setLoading(true);
    setEditingTarget(false);
    try {
      const [invoiceList, taxYearSettings] = await Promise.all([getInvoices(), getTaxYearSettings(startYear)]);
      setInvoices(invoiceList);
      setSettings(taxYearSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load performance data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(selectedStartYear);
  }, [selectedStartYear]);

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
      const updated = await setTaxYearTarget(selectedStartYear, amount);
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

        <div className="mode-toggle" role="group" aria-label="Show">
          <button type="button" className={mode === "paid" ? "active" : ""} onClick={() => setMode("paid")}>
            Money paid
          </button>
          <button type="button" className={mode === "all" ? "active" : ""} onClick={() => setMode("all")}>
            All invoices
          </button>
        </div>
      </div>

      <p className="mode-caption">
        {mode === "paid"
          ? "Only invoices paid to Anita, by the date they landed."
          : "Every invoice, using the date paid to Anita, else paid to Newmans, else the invoice date."}
      </p>

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
            placeholder={`Monthly target for ${taxYearLabel(selectedStartYear)} (£)`}
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
          startYear={selectedStartYear}
          taxYear={settings.taxYear}
          mode={mode}
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

      {!loading && !error && <YearOverYearSection invoices={invoices} mode={mode} />}
    </>
  );
}

// Anchored to the current tax year regardless of the year-picker above —
// "how does this year compare to before" is a fixed question, not one
// scoped by whichever single year happens to be selected for the
// month-by-month breakdown.
function YearOverYearSection({ invoices, mode }: { invoices: Invoice[]; mode: PerformanceMode }) {
  const series = yearOverYearSeries(invoices, mode);

  return (
    <div className="yoy-section">
      <p className="settings-section-title">Year-over-year</p>
      {series.length < 2 ? (
        <p className="empty">Add invoices across more than one tax year to see a comparison.</p>
      ) : (
        <YearOverYearChart series={series} />
      )}
    </div>
  );
}

function PerformanceSummary({
  invoices,
  target,
  startYear,
  taxYear,
  mode,
  onEditTarget,
}: {
  invoices: Invoice[];
  target: number;
  startYear: number;
  taxYear: string;
  mode: PerformanceMode;
  onEditTarget: () => void;
}) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const isCurrentYear = startYear === currentTaxYearStartYear();
  const monthGroups = invoicesByMonth(invoices, mode);
  const monthlyTotals = new Map<string, number>();
  for (const [key, monthInvoices] of monthGroups) {
    monthlyTotals.set(key, monthTotal(monthInvoices));
  }
  const monthKeys = taxYearMonthKeys(startYear, isCurrentYear);
  const amountColumnLabel = mode === "paid" ? "Received" : "Invoiced";

  const yearActual = monthKeys.reduce((sum, key) => sum + (monthlyTotals.get(key) ?? 0), 0);
  const yearTarget = target * monthKeys.length;

  const thisMonthKey = currentMonthKey();
  const thisMonthActual = monthlyTotals.get(thisMonthKey) ?? 0;

  const headlineActual = isCurrentYear ? thisMonthActual : yearActual;
  const headlineTarget = isCurrentYear ? target : yearTarget;

  return (
    <>
      <div className="client-header">
        <div className="performance-heading">
          <h2>{taxYear}</h2>
          <span className={`status ${targetStatusClass(headlineActual, headlineTarget)}`}>
            {targetStatusLabel(headlineActual, headlineTarget, isCurrentYear)}
          </span>
          <span className="target-line">
            Target <strong>{money.format(target)}</strong>/month
          </span>
        </div>
        <button type="button" className="secondary" onClick={onEditTarget}>
          Edit target
        </button>
      </div>

      <div className="stat-groups">
        {isCurrentYear && (
          <StatWithBar
            label={`This month (${monthLabel(thisMonthKey)})`}
            actual={thisMonthActual}
            target={target}
          />
        )}
        <StatWithBar
          label={isCurrentYear ? "Year to date" : "Full year"}
          actual={yearActual}
          target={yearTarget}
        />
      </div>

      <IncomeChart monthKeys={monthKeys} monthlyTotals={monthlyTotals} target={target} />

      <div className="table-scroll">
        <table className="ledger compact-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>{amountColumnLabel}</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {monthKeys
              .slice()
              .reverse()
              .map((key) => {
                const actual = monthlyTotals.get(key) ?? 0;
                const pending = isCurrentYear && key === thisMonthKey;
                const expanded = expandedMonth === key;
                return (
                  <Fragment key={key}>
                    <tr className={expanded ? "month-row expanded" : "month-row"}>
                      <td>
                        <button
                          type="button"
                          className="month-toggle"
                          onClick={() => setExpandedMonth(expanded ? null : key)}
                          aria-expanded={expanded}
                        >
                          <span className="chevron" aria-hidden="true">
                            {expanded ? "▾" : "▸"}
                          </span>
                          {monthLabel(key)}
                        </button>
                      </td>
                      <td>{money.format(actual)}</td>
                      <td>
                        <MonthPerformance actual={actual} target={target} pending={pending} />
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="month-detail-row">
                        <td colSpan={3}>
                          <MonthBreakdown invoices={monthGroups.get(key) ?? []} mode={mode} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// The current, still-running month gets a muted "so far" reading rather
// than a red minus — it hasn't had its full month to hit the target yet,
// so a hard shortfall figure would read as a miss that hasn't happened.
function MonthPerformance({ actual, target, pending }: { actual: number; target: number; pending: boolean }) {
  const delta = targetDelta(actual, target);
  const sign = delta > 0 ? "+" : "";
  const className = pending ? "perf-pending" : delta < 0 ? "perf-negative" : "perf-positive";

  return (
    <span className={`perf ${className}`}>
      {sign}
      {delta}%{pending ? " so far" : ""}
    </span>
  );
}

// The per-invoice list behind a month's total. In "all" mode each row also
// says which date actually put it in this bucket — paid to Anita, paid to
// Newmans, or just invoiced — since that's the exact question this feature
// exists to answer.
function MonthBreakdown({ invoices, mode }: { invoices: Invoice[]; mode: PerformanceMode }) {
  if (invoices.length === 0) {
    return <p className="empty month-detail-empty">No invoices in this period.</p>;
  }

  const sorted = [...invoices].sort((a, b) => {
    const dateA = effectiveDateFor(a, mode) ?? "";
    const dateB = effectiveDateFor(b, mode) ?? "";
    return dateA.localeCompare(dateB);
  });

  return (
    <table className="month-detail-table">
      <thead>
        <tr>
          <th>Client</th>
          <th>Date</th>
          {mode === "all" && <th>Basis</th>}
          <th>Amount</th>
          <th>Your share</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((invoice) => {
          const date = effectiveDateFor(invoice, mode);
          return (
            <tr key={invoice.id}>
              <td>{invoice.clientName}</td>
              <td>{date ? dayLabel(date) : "—"}</td>
              {mode === "all" && <td>{effectiveDateSourceLabel(invoice)}</td>}
              <td>{money.format(invoice.totalAmount)}</td>
              <td>{money.format(invoice.anitaIncome)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StatWithBar({ label, actual, target }: { label: string; actual: number; target: number }) {
  const pct = percentOfTarget(actual, target);

  return (
    <div className="stat-group">
      <div className="stat-group-label">{label}</div>
      <div className="stat-group-figures">
        <span className="stat-actual">{money.format(actual)}</span>
        <span className="stat-of"> of {money.format(target)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="stat-group-pct">{Math.round(pct)}% of target</div>
    </div>
  );
}

function IncomeChart({
  monthKeys,
  monthlyTotals,
  target,
}: {
  monthKeys: string[];
  monthlyTotals: Map<string, number>;
  target: number;
}) {
  const maxValue = Math.max(target, ...monthKeys.map((key) => monthlyTotals.get(key) ?? 0), 1);
  const targetLinePct = Math.min((target / maxValue) * 100, 100);

  return (
    <div className="income-chart-wrap">
      <div className="income-chart">
        <div className="income-chart-target-line" style={{ bottom: `${targetLinePct}%` }} />
        {monthKeys.map((key) => {
          const actual = monthlyTotals.get(key) ?? 0;
          const heightPct = (actual / maxValue) * 100;
          return (
            <div className="income-chart-bar" key={key}>
              <div
                className={`income-chart-bar-fill ${actual >= target ? "met" : ""}`}
                style={{ height: `${heightPct}%` }}
                title={`${monthLabel(key)}: ${money.format(actual)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="income-chart-labels">
        {monthKeys.map((key) => (
          <div className="income-chart-label" key={key}>
            {monthAbbrev(key)}
          </div>
        ))}
      </div>
      <p className="chart-caption">Solid bar = target met that month · dashed line = monthly target</p>
    </div>
  );
}

const YOY_CHART_WIDTH = 640;
const YOY_CHART_HEIGHT = 220;
// A completed prior year's line always reaches the rightmost month (March),
// so its end-label needs room past the plot area on every render, not just
// when the current year happens to be truncated — right padding has to fit
// a tax-year label ("2024/25") plus the leader line, not just breathe.
const YOY_PADDING = { top: 16, right: 76, bottom: 28, left: 56 };
const YOY_PLOT_WIDTH = YOY_CHART_WIDTH - YOY_PADDING.left - YOY_PADDING.right;
const YOY_PLOT_HEIGHT = YOY_CHART_HEIGHT - YOY_PADDING.top - YOY_PADDING.bottom;

function yoyX(monthIndex: number): number {
  return YOY_PADDING.left + (monthIndex / 11) * YOY_PLOT_WIDTH;
}

function yoyY(value: number, axisMax: number): number {
  return YOY_PADDING.top + YOY_PLOT_HEIGHT - (axisMax > 0 ? (value / axisMax) * YOY_PLOT_HEIGHT : 0);
}

// Percentage change vs the same point in the previous year — comparing a
// still-open year's YTD total against a finished prior year's *full* total
// would always read as a shortfall, so this leans on the cumulative
// series already being aligned by month-of-year and reads the prior
// year's value at that same index instead.
function yoyDeltaLabel(delta: number, comparison: number): string {
  const pct = comparison > 0 ? Math.round((delta / comparison) * 100) : null;
  const sign = delta > 0 ? "+" : "";
  return pct === null ? `${sign}${money.format(delta)}` : `${sign}${money.format(delta)} (${sign}${pct}%)`;
}

function YearOverYearChart({ series }: { series: YoYSeries[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const seriesByYearsBack = new Map(series.map((s) => [s.yearsBack, s]));
  const orderedForDisplay = [...series].sort((a, b) => a.yearsBack - b.yearsBack); // current first

  const maxValue = Math.max(1, ...series.flatMap((s) => s.cumulative.filter((v): v is number => v !== null)));
  const axisStep = niceAxisStep(maxValue);
  const axisMax = Math.ceil(maxValue / axisStep) * axisStep;
  const ticks = Array.from({ length: Math.round(axisMax / axisStep) + 1 }, (_, i) => i * axisStep);

  function pointsFor(s: YoYSeries) {
    return s.cumulative
      .map((value, i) => (value === null ? null : { i, x: yoyX(i), y: yoyY(value, axisMax), value }))
      .filter((p): p is { i: number; x: number; y: number; value: number } => p !== null);
  }

  const seriesPoints = orderedForDisplay.map((s) => ({ series: s, points: pointsFor(s) }));

  // Direct end-labels stack when two lines finish close together — nudge
  // the lower ones down rather than letting them overlap illegibly.
  const labelYByYearsBack = new Map<number, number>();
  const sortedByEndY = [...seriesPoints].sort((a, b) => {
    const ay = a.points.at(-1)?.y ?? 0;
    const by = b.points.at(-1)?.y ?? 0;
    return ay - by;
  });
  let previousLabelY = -Infinity;
  for (const { series: s, points } of sortedByEndY) {
    const endY = points.at(-1)?.y ?? 0;
    const y = Math.max(endY, previousLabelY + 14);
    labelYByYearsBack.set(s.yearsBack, y);
    previousLabelY = y;
  }

  return (
    <div className="yoy-chart-wrap">
      <div className="yoy-legend">
        {orderedForDisplay.map((s) => (
          <span className="yoy-legend-item" key={s.startYear}>
            <span className="yoy-legend-swatch" style={{ background: YOY_TONE_BY_YEARS_BACK[s.yearsBack] }} />
            {s.label}
            {s.yearsBack === 0 && " (so far)"}
          </span>
        ))}
      </div>

      <div className="yoy-chart-svg-wrap">
        <svg
          viewBox={`0 0 ${YOY_CHART_WIDTH} ${YOY_CHART_HEIGHT}`}
          className="yoy-chart-svg"
          role="img"
          aria-label="Year-over-year cumulative income by month"
        >
          {ticks.map((tick) => {
            const y = yoyY(tick, axisMax);
            return (
              <g key={tick}>
                <line x1={YOY_PADDING.left} y1={y} x2={YOY_CHART_WIDTH - YOY_PADDING.right} y2={y} className="yoy-gridline" />
                <text x={YOY_PADDING.left - 8} y={y} className="yoy-axis-label" textAnchor="end" dominantBaseline="middle">
                  {tick >= 1000 ? `£${Math.round(tick / 1000)}k` : money.format(tick)}
                </text>
              </g>
            );
          })}

          {YOY_MONTH_ABBREVS.map((label, i) => (
            <text
              key={label}
              x={yoyX(i)}
              y={YOY_CHART_HEIGHT - 8}
              className="yoy-axis-label"
              textAnchor="middle"
            >
              {label}
            </text>
          ))}

          {seriesPoints.map(({ series: s, points }) => {
            const first = points.at(0);
            const last = points.at(-1);
            if (!first || !last) return null;
            const tone = YOY_TONE_BY_YEARS_BACK[s.yearsBack];
            const isCurrent = s.yearsBack === 0;
            const path = points.map((p) => `${p.x},${p.y}`).join(" ");
            const labelY = labelYByYearsBack.get(s.yearsBack) ?? last.y;

            return (
              <g key={s.startYear}>
                {isCurrent && (
                  <polygon
                    className="yoy-area"
                    points={`${first.x},${YOY_PADDING.top + YOY_PLOT_HEIGHT} ${path} ${last.x},${YOY_PADDING.top + YOY_PLOT_HEIGHT}`}
                  />
                )}
                <polyline points={path} fill="none" stroke={tone} strokeWidth={isCurrent ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={last.x} cy={last.y} r={6} className="yoy-dot-ring" />
                <circle cx={last.x} cy={last.y} r={4} fill={tone} />
                <line x1={last.x + 6} y1={labelY} x2={last.x + 14} y2={labelY} stroke={tone} strokeWidth={2} />
                <text x={last.x + 18} y={labelY} className="yoy-end-label" dominantBaseline="middle">
                  {taxYearLabel(s.startYear)}
                </text>
              </g>
            );
          })}

          {hoverIndex !== null && (
            <line
              x1={yoyX(hoverIndex)}
              y1={YOY_PADDING.top}
              x2={yoyX(hoverIndex)}
              y2={YOY_PADDING.top + YOY_PLOT_HEIGHT}
              className="yoy-crosshair"
            />
          )}

          {YOY_MONTH_ABBREVS.map((_, i) => (
            <rect
              key={i}
              x={YOY_PADDING.left + (i / 12) * YOY_PLOT_WIDTH}
              y={YOY_PADDING.top}
              width={YOY_PLOT_WIDTH / 12}
              height={YOY_PLOT_HEIGHT}
              fill="transparent"
              tabIndex={0}
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onBlur={() => setHoverIndex(null)}
            />
          ))}
        </svg>

        {hoverIndex !== null && (
          <div
            className="yoy-tooltip"
            style={{ left: `${(yoyX(hoverIndex) / YOY_CHART_WIDTH) * 100}%` }}
          >
            <p className="yoy-tooltip-month">{YOY_MONTH_ABBREVS[hoverIndex]}</p>
            {orderedForDisplay.map((s) => {
              const value = s.cumulative[hoverIndex];
              if (value == null) return null;
              return (
                <p className="yoy-tooltip-row" key={s.startYear}>
                  <span className="yoy-tooltip-key" style={{ background: YOY_TONE_BY_YEARS_BACK[s.yearsBack] }} />
                  <span className="yoy-tooltip-label">{s.label}</span>
                  <strong className="yoy-tooltip-value">{money.format(value)}</strong>
                </p>
              );
            })}
          </div>
        )}
      </div>

      <div className="table-scroll">
        <table className="month-detail-table yoy-summary-table compact-table">
          <thead>
            <tr>
              <th>Tax year</th>
              <th>Income</th>
              <th>Vs last year</th>
            </tr>
          </thead>
          <tbody>
            {orderedForDisplay.map((s) => {
              const lastIdx = s.cumulative.reduce<number>((last, v, i) => (v !== null ? i : last), -1);
              const value = lastIdx >= 0 ? (s.cumulative[lastIdx] ?? 0) : 0;
              const prior = seriesByYearsBack.get(s.yearsBack + 1);
              const priorValue = prior ? prior.cumulative[lastIdx] : null;
              return (
                <tr key={s.startYear}>
                  <td>
                    {s.label}
                    {s.yearsBack === 0 && " (so far)"}
                  </td>
                  <td>{money.format(value)}</td>
                  <td>{priorValue !== null && priorValue !== undefined ? yoyDeltaLabel(value - priorValue, priorValue) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="chart-caption">"Vs last year" compares at the same point in the tax year, not the full year.</p>
    </div>
  );
}
