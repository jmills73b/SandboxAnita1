import { useState, type FormEvent } from "react";
import { Icon } from "./icons";
import { currentTaxYearStartYear } from "@sandboxanita1/core";
import {
  addHourlyRate,
  setTaxYearSplit,
  updateHourlyRate,
  updateTimeSettings,
  type HourlyRate,
  type TimeSettings,
} from "./api";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Three independent settings live here: the income split (Anita's share of
// each invoice — a single current-tax-year value, changes apply going
// forward only, see story 8.4), the billing unit size (a single current
// value — how many minutes one "unit" is), and the hourly rate history
// (many rows, since a rate has to be looked up by the date the work was
// done, not just "whatever it is today").
export function TimeRateManager({
  settings,
  rates,
  splitPercentage,
  onChanged,
  rateMessage,
  onRateMessage,
}: {
  settings: TimeSettings;
  rates: HourlyRate[];
  splitPercentage: number | null;
  onChanged: () => Promise<void>;
  rateMessage: string | null;
  onRateMessage: (message: string | null) => void;
}) {
  const [splitInput, setSplitInput] = useState(splitPercentage != null ? String(splitPercentage) : "");
  const [savingSplit, setSavingSplit] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);

  const [unitMinutes, setUnitMinutes] = useState(String(settings.unitMinutes));
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);

  async function handleSaveSplit(event: FormEvent) {
    event.preventDefault();
    setSplitError(null);
    const value = Number(splitInput);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      setSplitError("Enter your share as a decimal fraction between 0 and 1 (e.g. 0.75 for 75%)");
      return;
    }

    setSavingSplit(true);
    try {
      await setTaxYearSplit(currentTaxYearStartYear(), value);
      await onChanged();
    } catch (err) {
      setSplitError(err instanceof Error ? err.message : "Couldn't save that split");
    } finally {
      setSavingSplit(false);
    }
  }

  const [newRate, setNewRate] = useState("");
  const [newStartDate, setNewStartDate] = useState(today());
  const [addingRate, setAddingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [editRateValue, setEditRateValue] = useState("");
  const [editRateSaving, setEditRateSaving] = useState(false);
  const [editRateError, setEditRateError] = useState<string | null>(null);

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

  function startEditRate(rate: HourlyRate) {
    setEditingRateId(rate.id);
    setEditRateValue(String(rate.rate));
    setEditRateError(null);
    onRateMessage(null);
  }

  function cancelEditRate() {
    setEditingRateId(null);
    setEditRateError(null);
  }

  async function handleSaveRate(id: number) {
    setEditRateError(null);
    const value = Number(editRateValue);
    if (!Number.isFinite(value) || value <= 0) {
      setEditRateError("Enter an hourly rate greater than £0");
      return;
    }

    setEditRateSaving(true);
    try {
      const result = await updateHourlyRate(id, value);
      setEditingRateId(null);
      onRateMessage(
        result.entriesUpdated > 0
          ? `Rate updated — recalculated ${result.entriesUpdated} time ${result.entriesUpdated === 1 ? "entry" : "entries"}.`
          : "Rate updated.",
      );
      await onChanged();
    } catch (err) {
      setEditRateError(err instanceof Error ? err.message : "Couldn't save that rate");
    } finally {
      setEditRateSaving(false);
    }
  }

  return (
    <div>
      <p className="settings-section-title">Income split</p>
      <p className="hint">
        Applies going forward only — invoices already logged keep whatever split was in force when they were raised.
      </p>
      <form onSubmit={handleSaveSplit} className="edit-row">
        <label className="edit-field">
          <span>Your share of each invoice (e.g. 0.75 for 75%)</span>
          <input
            type="number"
            step="any"
            min="0"
            max="1"
            className="input-compact"
            value={splitInput}
            onChange={(event) => setSplitInput(event.target.value)}
          />
        </label>
        <button type="submit" disabled={savingSplit}>
          <Icon name="save" /> {savingSplit ? "Saving…" : "Save"}
        </button>
      </form>
      {splitError && (
        <p className="error" role="alert">
          {splitError}
        </p>
      )}

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
          <Icon name="save" /> {savingUnit ? "Saving…" : "Save"}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) =>
              editingRateId === rate.id ? (
                <tr key={rate.id}>
                  <td>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      className="input-compact"
                      value={editRateValue}
                      onChange={(event) => setEditRateValue(event.target.value)}
                      autoFocus
                    />
                  </td>
                  <td>{rate.startDate}</td>
                  <td>{rate.endDate ?? "Current"}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => handleSaveRate(rate.id)} disabled={editRateSaving}>
                        <Icon name="save" /> {editRateSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={cancelEditRate}
                        disabled={editRateSaving}
                      >
                        <Icon name="cancel" /> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={rate.id}>
                  <td>{money.format(rate.rate)}/hr</td>
                  <td>{rate.startDate}</td>
                  <td>{rate.endDate ?? "Current"}</td>
                  <td>
                    <button type="button" className="secondary" onClick={() => startEditRate(rate)}>
                      <Icon name="edit" /> Edit
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
      {editRateError && (
        <p className="error" role="alert">
          {editRateError}
        </p>
      )}
      {rateMessage && <p className="hint">{rateMessage}</p>}

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
          <Icon name="add" /> {addingRate ? "Adding…" : "Add rate"}
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
