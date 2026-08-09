import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { getAccountSettings, updateAccountSettings } from "./api";

// Random, not memorable — this is what stands between the login page's
// "Join now" and a stranger getting full access to the real business data
// behind it, so it should be hard to guess, not easy to type.
function randomCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 10);
}

export function InviteCodePanel({ onClose }: { onClose?: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccountSettings()
      .then((settings) => setCode(settings.inviteCode))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load the invite code"))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(value: string) {
    setCode(value);
    setSaved(false);
  }

  function handleGenerate() {
    handleChange(randomCode());
  }

  async function handleSave() {
    setError(null);
    if (!code.trim()) {
      setError("Enter an invite code");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAccountSettings(code.trim());
      setCode(updated.inviteCode);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the invite code");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="edit-panel">
      <p className="edit-panel-title">Invite code</p>
      <p className="hint">
        Share this with anyone you want to give access to your books. Anyone with it can create their own
        login and see everything — invoices, clients, expenses, and your bank details.
      </p>
      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <>
          <div className="edit-row">
            <label className="edit-field">
              <span>Code</span>
              <input className="input-compact" value={code} onChange={(event) => handleChange(event.target.value)} />
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
            <button type="button" className="secondary" onClick={handleGenerate} disabled={saving}>
              Generate random code
            </button>
            {onClose && (
              <button type="button" onClick={onClose} disabled={saving}>
                Close
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
