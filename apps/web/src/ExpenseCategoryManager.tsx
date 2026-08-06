import { useState, type FormEvent } from "react";
import {
  addExpenseCategory,
  deleteExpenseCategory,
  renameExpenseCategory,
  type Expense,
  type ExpenseCategory,
} from "./api";

// Categories are admin-managed data, not a fixed list — renaming one is a
// single field edit (every expense using it just picks up the new name),
// but removing one needs an explicit answer to "what happens to the
// expenses that used it", which is why delete surfaces a reassignment
// picker inline rather than just confirming and orphaning them.
export function ExpenseCategoryManager({
  categories,
  expenses,
  onChanged,
}: {
  categories: ExpenseCategory[];
  expenses: Expense[];
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
    return expenses.filter((expense) => expense.categoryId === categoryId).length;
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
      await addExpenseCategory(trimmed);
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
      await renameExpenseCategory(id, trimmed);
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
      await deleteExpenseCategory(id, reassignTo ? Number(reassignTo) : null);
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
                  Move {count} expense{count === 1 ? "" : "s"} tagged "{cat.name}" to:
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
                  {count} expense{count === 1 ? "" : "s"}
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
