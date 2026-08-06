import { useState, type FormEvent } from "react";
import {
  addTimeCategory,
  deleteTimeCategory,
  renameTimeCategory,
  type TimeCategory,
  type TimeEntry,
} from "./api";

export function TimeCategoryManager({
  categories,
  entries,
  onChanged,
}: {
  categories: TimeCategory[];
  entries: TimeEntry[];
  onChanged: () => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [busy, setBusy] = useState(false);

  function countFor(categoryId: number): number {
    return entries.filter((entry) => entry.categoryId === categoryId).length;
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Enter a category name");
      return;
    }

    setAdding(true);
    try {
      await addTimeCategory(trimmed);
      setNewName("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that category");
    } finally {
      setAdding(false);
    }
  }

  async function handleRename(id: number, name: string, previousName: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === previousName) return;

    setRenamingId(id);
    setError(null);
    try {
      await renameTimeCategory(id, trimmed);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rename that category");
    } finally {
      setRenamingId(null);
    }
  }

  function startDelete(id: number) {
    setDeletingId(id);
    setReassignTo("");
    setError(null);
  }

  async function confirmDelete(id: number) {
    setError(null);
    setBusy(true);
    try {
      await deleteTimeCategory(id, reassignTo ? Number(reassignTo) : null);
      setDeletingId(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {categories.map((cat) => {
        const count = countFor(cat.id);
        return (
          <div className="category-row" key={cat.id}>
            {deletingId === cat.id ? (
              <>
                <span className="category-row-label">
                  Move {count} time entr{count === 1 ? "y" : "ies"} tagged "{cat.name}" to:
                </span>
                <select value={reassignTo} onChange={(event) => setReassignTo(event.target.value)}>
                  <option value="">Uncategorised</option>
                  {categories
                    .filter((other) => other.id !== cat.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.name}
                      </option>
                    ))}
                </select>
                <button type="button" className="danger" onClick={() => confirmDelete(cat.id)} disabled={busy}>
                  {busy ? "Deleting…" : "Confirm delete"}
                </button>
                <button type="button" onClick={() => setDeletingId(null)} disabled={busy}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <input
                  className="input-compact"
                  defaultValue={cat.name}
                  disabled={renamingId === cat.id}
                  onBlur={(event) => handleRename(cat.id, event.target.value, cat.name)}
                />
                <span className="category-row-count">
                  {count} time entr{count === 1 ? "y" : "ies"}
                </span>
                <button type="button" className="danger" onClick={() => startDelete(cat.id)}>
                  Delete
                </button>
              </>
            )}
          </div>
        );
      })}

      <form onSubmit={handleAdd} className="quick-add category-add-form">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New category name"
        />
        <button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add category"}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
