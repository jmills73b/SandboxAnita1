import { useState, type FormEvent } from "react";
import { addDocumentCategory, deleteDocumentCategory, renameDocumentCategory, type DocumentCategory } from "./api";

// Unlike ClientCategoryManager/NoteCategoryManager, there's no "N documents"
// count shown per category here -- that would need a list-everything
// endpoint (GET /api/documents is scoped to one client at a time, by
// design, since a solicitor's document list is always viewed per-client),
// and isn't worth adding just for this admin screen.
export function DocumentCategoryManager({
  categories,
  onChanged,
}: {
  categories: DocumentCategory[];
  onChanged: () => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      await addDocumentCategory(trimmed);
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
      await renameDocumentCategory(id, trimmed);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rename that category");
    } finally {
      setRenamingId(null);
    }
  }

  async function handleDelete(id: number, name: string) {
    const confirmed = window.confirm(
      `Delete "${name}"? Any documents tagged with it will become uncategorised.`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    try {
      await deleteDocumentCategory(id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that category");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {categories.map((cat) => (
        <div className="category-row" key={cat.id}>
          <input
            className="input-compact"
            defaultValue={cat.name}
            disabled={renamingId === cat.id}
            onBlur={(event) => handleRename(cat.id, event.target.value, cat.name)}
          />
          <button
            type="button"
            className="danger"
            onClick={() => handleDelete(cat.id, cat.name)}
            disabled={deletingId === cat.id}
          >
            {deletingId === cat.id ? "Deleting…" : "Delete"}
          </button>
        </div>
      ))}

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
