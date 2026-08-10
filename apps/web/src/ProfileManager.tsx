import { useState } from "react";
import { Icon } from "./icons";
import { updateFullName } from "./api";

export function ProfileManager({
  fullName,
  onFullNameChanged,
}: {
  fullName: string | null;
  onFullNameChanged: (fullName: string) => void;
}) {
  const [name, setName] = useState(fullName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateFullName(name.trim());
      if (updated.fullName) onFullNameChanged(updated.fullName);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your name");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="edit-panel">
      <p className="edit-panel-title">Your name</p>
      <p className="hint">Used for the greeting at the top of the app.</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Full name</span>
          <input
            className="input-compact"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
          />
        </label>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {saved && !error && <p className="hint">Saved.</p>}
      <div className="row-actions">
        <button type="button" onClick={handleSave} disabled={saving}>
          <Icon name="save" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
