import { useState, type FormEvent } from "react";
import { addHourlyRate, updateTimeSettings, type HourlyRate, type TimeSettings } from "./api";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Two independent settings live here: the billing unit size (a single
// current value — how many minutes one "unit" is) and the hourly rate
// history (many rows, since a rate has to be looked up by the date the
// work was done, not just "whatever it is today").
export function TimeRateManager({
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
    <div>
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
