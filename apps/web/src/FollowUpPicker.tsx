import { useState } from "react";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// A simple "same day next month" add, clamping to the target month's last
// day when it's shorter — good enough for a quick-pick default; the exact
// recurrence clamping lives in packages/core for actual recurring tasks.
function addOneMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + 1);
  if (d.getUTCDate() !== day) {
    d.setUTCDate(0);
  }
  return d.toISOString().slice(0, 10);
}

const DEFAULT_DUE_TIME = "09:30";

export function FollowUpPicker({
  defaultTitle,
  onSave,
  onCancel,
}: {
  defaultTitle: string;
  onSave: (input: { title: string; dueDate: string; dueTime: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const inWeek = addDays(todayISO(), 7);
  const inMonth = addOneMonth(todayISO());

  const [title, setTitle] = useState(defaultTitle);
  const [dueDate, setDueDate] = useState(inWeek);
  const [dueTime, setDueTime] = useState(DEFAULT_DUE_TIME);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Enter a title");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({ title: trimmed, dueDate, dueTime });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the follow-up");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="follow-up-picker">
      <label className="edit-field">
        <span>Follow-up title</span>
        <input className="input-compact" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="edit-field">
        <span>When</span>
        <div className="chip-group">
          <button type="button" className={`chip ${dueDate === inWeek ? "active" : ""}`} onClick={() => setDueDate(inWeek)}>
            In 1 week
          </button>
          <button type="button" className={`chip ${dueDate === inMonth ? "active" : ""}`} onClick={() => setDueDate(inMonth)}>
            In 1 month
          </button>
          <input
            type="date"
            className="input-compact"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <input
            type="time"
            className="input-compact"
            value={dueTime}
            onChange={(event) => setDueTime(event.target.value)}
          />
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row-actions">
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save follow-up"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}
