import { useEffect, useState, type FormEvent } from "react";
import { currentTaxYearStartYear, recentTaxYearStartYears, taxYearLabel } from "@sandboxanita1/core";
import { getTaxYearSettings, setTaxYearRates, type TaxRates, type TaxYearSettings } from "./api";

// TaxRates' fields are nullable (unset until the first save) — this is the
// same shape with every field guaranteed a number, once the form has
// validated and parsed every input.
type FilledTaxRates = { [K in keyof TaxRates]: number };

const YEAR_OPTIONS = 6;

const RATE_FIELDS: Array<{ key: keyof TaxRates; label: string }> = [
  { key: "personalAllowance", label: "Personal allowance (£)" },
  { key: "basicRate", label: "Basic rate (e.g. 0.2 for 20%)" },
  { key: "basicRateThreshold", label: "Basic rate threshold (£)" },
  { key: "higherRate", label: "Higher rate (e.g. 0.4 for 40%)" },
  { key: "higherRateThreshold", label: "Higher rate threshold (£)" },
  { key: "additionalRate", label: "Additional rate (e.g. 0.45 for 45%)" },
  { key: "niLowerThreshold", label: "NI lower threshold (£)" },
  { key: "niUpperThreshold", label: "NI upper threshold (£)" },
  { key: "niLowerRate", label: "NI lower rate (e.g. 0.06 for 6%)" },
  { key: "niUpperRate", label: "NI upper rate (e.g. 0.02 for 2%)" },
  { key: "class2FlatRate", label: "Class 2 flat charge (£/year)" },
];

export function TaxRatesManager() {
  const [selectedStartYear, setSelectedStartYear] = useState(() => currentTaxYearStartYear());
  const [settings, setSettings] = useState<TaxYearSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(startYear: number) {
    setLoading(true);
    try {
      const taxYearSettings = await getTaxYearSettings(startYear);
      setSettings(taxYearSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load tax year rates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(selectedStartYear);
  }, [selectedStartYear]);

  return (
    <div>
      <div className="filters">
        <label className="sr-only" htmlFor="tax-rates-year-select">
          Tax year
        </label>
        <select
          id="tax-rates-year-select"
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
      ) : (
        <RatesForm
          startYear={selectedStartYear}
          rates={settings?.rates ?? null}
          splitPercentage={settings?.splitPercentage ?? null}
          onSaved={(updated) => setSettings(updated)}
        />
      )}
    </div>
  );
}

function RatesForm({
  startYear,
  rates,
  splitPercentage,
  onSaved,
}: {
  startYear: number;
  rates: TaxRates | null;
  splitPercentage: number | null;
  onSaved: (settings: TaxYearSettings) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(RATE_FIELDS.map(({ key }) => [key, rates?.[key] != null ? String(rates[key]) : ""])),
  );
  const [splitInput, setSplitInput] = useState(splitPercentage != null ? String(splitPercentage) : "");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(Object.fromEntries(RATE_FIELDS.map(({ key }) => [key, rates?.[key] != null ? String(rates[key]) : ""])));
    setSplitInput(splitPercentage != null ? String(splitPercentage) : "");
  }, [startYear, rates, splitPercentage]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const splitValue = Number(splitInput);
    if (!Number.isFinite(splitValue) || splitValue < 0 || splitValue > 1) {
      setFormError('Enter "Your share of each invoice" as a decimal fraction between 0 and 1 (e.g. 0.75 for 75%)');
      return;
    }

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
      const updated = await setTaxYearRates(startYear, { ...(parsed as FilledTaxRates), splitPercentage: splitValue });
      onSaved(updated);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save those rates");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="hint">
        These come from HMRC's published rates for the tax year — enter them here once, and reuse this page's
        calculations for every future year by updating them again then.
      </p>

      <p className="settings-section-title">Income split</p>
      <p className="hint">
        Applies going forward only — invoices already logged keep whatever split was in force when they were raised.
      </p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Your share of each invoice (e.g. 0.75 for 75%)</span>
          <input
            className="input-compact"
            type="number"
            step="any"
            min="0"
            max="1"
            value={splitInput}
            onChange={(event) => setSplitInput(event.target.value)}
            required
          />
        </label>
      </div>

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
      </div>
    </form>
  );
}
