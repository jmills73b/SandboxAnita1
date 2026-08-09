import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "./icons";
import { updateFirm, updateInvoiceSettings, type Firm, type InvoiceSettings } from "./api";

export function InvoiceSettingsManager({
  settings,
  firm,
  onSaved,
}: {
  settings: InvoiceSettings;
  firm: Firm | null;
  onSaved: (settings: InvoiceSettings, firm: Firm) => void;
}) {
  const [form, setForm] = useState(settings);
  const [firmForm, setFirmForm] = useState({
    contactEmail: firm?.contactEmail ?? "",
    contactAddress: firm?.contactAddress ?? "",
    contactPostcode: firm?.contactPostcode ?? "",
    contactPhone: firm?.contactPhone ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
    setFirmForm({
      contactEmail: firm?.contactEmail ?? "",
      contactAddress: firm?.contactAddress ?? "",
      contactPostcode: firm?.contactPostcode ?? "",
      contactPhone: firm?.contactPhone ?? "",
    });
  }, [settings, firm]);

  function field(key: keyof InvoiceSettings) {
    return {
      value: String(form[key] ?? ""),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: event.target.value })),
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!form.fromName.trim()) {
      setFormError("Enter your name");
      return;
    }
    const nextNumber = Number(form.nextReferenceNumber);
    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      setFormError("Enter a next reference number of 1 or more");
      return;
    }
    if (!firm) {
      setFormError("No firm to bill has been set up yet");
      return;
    }

    setSubmitting(true);
    try {
      const [savedSettings, savedFirm] = await Promise.all([
        updateInvoiceSettings({ ...form, nextReferenceNumber: nextNumber }),
        updateFirm(firm.id, firmForm),
      ]);
      onSaved(savedSettings, savedFirm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save those details");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="settings-section-title">Your details (From)</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Name</span>
          <input className="input-compact" {...field("fromName")} required />
        </label>
        <label className="edit-field">
          <span>Email</span>
          <input className="input-compact" type="email" {...field("fromEmail")} />
        </label>
        <label className="edit-field">
          <span>Address</span>
          <input className="input-compact" {...field("fromAddress")} />
        </label>
        <label className="edit-field">
          <span>Postcode</span>
          <input className="input-compact" {...field("fromPostcode")} />
        </label>
        <label className="edit-field">
          <span>Phone</span>
          <input className="input-compact" {...field("fromPhone")} />
        </label>
      </div>

      <p className="settings-section-title">{firm?.name ?? "Firm"} details (Bill to)</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Email</span>
          <input
            className="input-compact"
            type="email"
            value={firmForm.contactEmail}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
          />
        </label>
        <label className="edit-field">
          <span>Address</span>
          <input
            className="input-compact"
            value={firmForm.contactAddress}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactAddress: event.target.value }))}
          />
        </label>
        <label className="edit-field">
          <span>Postcode</span>
          <input
            className="input-compact"
            value={firmForm.contactPostcode}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactPostcode: event.target.value }))}
          />
        </label>
        <label className="edit-field">
          <span>Phone</span>
          <input
            className="input-compact"
            value={firmForm.contactPhone}
            onChange={(event) => setFirmForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
          />
        </label>
      </div>

      <p className="settings-section-title">Bank details</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Account name</span>
          <input className="input-compact" {...field("bankAccountName")} />
        </label>
        <label className="edit-field">
          <span>Sort code</span>
          <input className="input-compact" {...field("bankSortCode")} />
        </label>
        <label className="edit-field">
          <span>Account no.</span>
          <input className="input-compact" {...field("bankAccountNumber")} />
        </label>
      </div>

      <p className="settings-section-title">Invoice numbering</p>
      <div className="edit-row">
        <label className="edit-field">
          <span>Reference prefix</span>
          <input className="input-compact" {...field("referencePrefix")} required />
        </label>
        <label className="edit-field">
          <span>Next number</span>
          <input className="input-compact" type="number" min="1" step="1" {...field("nextReferenceNumber")} required />
        </label>
      </div>

      {formError && (
        <p className="error" role="alert">
          {formError}
        </p>
      )}

      <div className="row-actions">
        <button type="submit" disabled={submitting}>
          <Icon name="save" /> {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
