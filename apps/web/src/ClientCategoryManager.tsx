import { useState, type FormEvent } from "react";
import { Icon } from "./icons";
import { addClientCategory, deleteClientCategory, renameClientCategory, type Client, type ClientCategory } from "./api";

export function ClientCategoryManager({
  categories,
  clients,
  onChanged,
}: {
  categories: ClientCategory[];
  clients: Client[];
  onChanged: () => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function countFor(categoryId: number): number {
    return clients.filter((client) => client.categories.some((c) => c.id === categoryId)).length;
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
      await addClientCategory(trimmed);
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
      await renameClientCategory(id, trimmed);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rename that category");
    } finally {
      setRenamingId(null);
    }
  }

  async function handleDelete(id: number, name: string) {
    const count = countFor(id);
    const confirmed = window.confirm(
      count > 0
        ? `Delete "${name}"? It will be removed from the ${count} client${count === 1 ? "" : "s"} tagged with it.`
        : `Delete "${name}"?`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    try {
      await deleteClientCategory(id);
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
          <Icon name="tag" />
          <input
            className="input-compact"
            defaultValue={cat.name}
            disabled={renamingId === cat.id}
            onBlur={(event) => handleRename(cat.id, event.target.value, cat.name)}
          />
          <span className="category-row-count">
            {countFor(cat.id)} client{countFor(cat.id) === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="danger"
            onClick={() => handleDelete(cat.id, cat.name)}
            disabled={deletingId === cat.id}
          >
            <Icon name="delete" /> {deletingId === cat.id ? "Deleting…" : "Delete"}
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
          <Icon name="add" /> {adding ? "Adding…" : "Add category"}
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
