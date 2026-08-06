import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  actOnTask,
  addClientNote,
  addClientNoteVersion,
  addNoteCategory,
  addTask,
  deleteNoteCategory,
  getClientNote,
  getClientNotes,
  getNoteCategories,
  getTasks,
  renameNoteCategory,
  type ClientNoteSummary,
  type NoteCategory,
  type NoteVersion,
  type Task,
  type TaskAction,
} from "./api";
import { applyBold, applyBulletList, applyNumberedList, renderMarkdown, type TextSelection } from "./markdown";
import { FollowUpPicker } from "./FollowUpPicker";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function dueClass(task: Task, today: string): string {
  if (task.nextDueDate < today) return "overdue";
  if (task.nextDueDate === today) return "due-today";
  return "";
}

function truncate(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed;
}

// A single-select variant of the client-category chips: a note carries at
// most one category, so clicking the active chip clears it rather than
// building up a multi-select set.
function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: NoteCategory[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  if (categories.length === 0) {
    return <p className="empty">No categories yet — add some from "Manage categories" below.</p>;
  }

  return (
    <div className="chip-group" role="group" aria-label="Note category">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`chip ${selectedId === cat.id ? "active" : ""}`}
          aria-pressed={selectedId === cat.id}
          onClick={() => onSelect(selectedId === cat.id ? null : cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

function MarkdownToolbar({ textareaRef, onChange }: { textareaRef: React.RefObject<HTMLTextAreaElement | null>; onChange: (value: string) => void }) {
  function apply(fn: (value: string, sel: TextSelection) => { value: string; selection: TextSelection }) {
    const el = textareaRef.current;
    if (!el) return;
    const sel = { start: el.selectionStart, end: el.selectionEnd };
    const result = fn(el.value, sel);
    onChange(result.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selection.start, result.selection.end);
    });
  }

  return (
    <div className="notes-toolbar" role="toolbar" aria-label="Formatting">
      <button type="button" className="secondary" onClick={() => apply(applyBold)}>
        <strong>B</strong>
      </button>
      <button type="button" className="secondary" onClick={() => apply(applyBulletList)}>
        • List
      </button>
      <button type="button" className="secondary" onClick={() => apply(applyNumberedList)}>
        1. List
      </button>
    </div>
  );
}

function NoteEditor({
  categories,
  date,
  setDate,
  categoryId,
  setCategoryId,
  body,
  setBody,
}: {
  categories: NoteCategory[];
  date: string;
  setDate: (value: string) => void;
  categoryId: number | null;
  setCategoryId: (value: number | null) => void;
  body: string;
  setBody: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <div className="edit-row">
        <label className="edit-field">
          <span>Date</span>
          <input
            type="date"
            className="input-compact"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>
      <div className="edit-field">
        <span>Category</span>
        <CategoryPicker categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
      </div>
      <div className="edit-field">
        <span>Notes</span>
        <MarkdownToolbar textareaRef={textareaRef} onChange={setBody} />
        <textarea
          ref={textareaRef}
          className="notes-textarea"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          placeholder="What was discussed and advised…"
        />
      </div>
    </>
  );
}

export function ClientNotesPanel({
  clientId,
  clientName,
  onClose,
}: {
  clientId: number;
  clientName: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<ClientNoteSummary[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [followUps, setFollowUps] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyByNote, setHistoryByNote] = useState<Record<number, NoteVersion[]>>({});
  const [historyLoadingId, setHistoryLoadingId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [showNewFollowUp, setShowNewFollowUp] = useState(false);
  const [followUpForNoteId, setFollowUpForNoteId] = useState<number | null>(null);
  const [followUpActingId, setFollowUpActingId] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [noteList, categoryList, taskList] = await Promise.all([
        getClientNotes(),
        getNoteCategories(),
        getTasks(),
      ]);
      setNotes(noteList.filter((n) => n.clientId === clientId));
      setCategories(categoryList);
      setFollowUps(
        taskList
          .filter((t) => t.clientId === clientId && !t.paused)
          .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load notes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [clientId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = body.trim();
    if (!trimmed) {
      setError("Enter what was discussed or advised");
      return;
    }

    setSubmitting(true);
    try {
      await addClientNote({ clientId, date, categoryId, body: trimmed });
      setDate(todayISO());
      setCategoryId(null);
      setBody("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that note");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleExpand(note: ClientNoteSummary) {
    if (expandedId === note.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(note.id);
    setEditingId(null);
  }

  async function saveFollowUp(input: { title: string; dueDate: string }) {
    await addTask({ title: input.title, frequency: "once", nextDueDate: input.dueDate, clientId });
    setShowNewFollowUp(false);
    setFollowUpForNoteId(null);
    await refresh();
  }

  async function handleFollowUpAction(id: number, action: TaskAction) {
    setFollowUpActingId(id);
    setError(null);
    try {
      await actOnTask(id, action);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that follow-up");
    } finally {
      setFollowUpActingId(null);
    }
  }

  async function loadHistory(noteId: number) {
    if (historyByNote[noteId]) return;
    setHistoryLoadingId(noteId);
    try {
      const detail = await getClientNote(noteId);
      setHistoryByNote((prev) => ({ ...prev, [noteId]: detail.versions }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load version history");
    } finally {
      setHistoryLoadingId(null);
    }
  }

  function startEdit(note: ClientNoteSummary) {
    setEditingId(note.id);
    setEditDate(note.latest.date);
    setEditCategoryId(note.latest.categoryId);
    setEditBody(note.latest.body);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(noteId: number) {
    setEditError(null);
    const trimmed = editBody.trim();
    if (!trimmed) {
      setEditError("Enter what was discussed or advised");
      return;
    }

    setEditSubmitting(true);
    try {
      await addClientNoteVersion(noteId, { date: editDate, categoryId: editCategoryId, body: trimmed });
      setEditingId(null);
      setHistoryByNote((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  const sortedNotes = [...notes].sort((a, b) => b.latest.date.localeCompare(a.latest.date) || b.id - a.id);

  return (
    <div className="edit-panel notes-panel">
      <div className="notes-panel-header">
        <p className="edit-panel-title">Notes for {clientName}</p>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {followUps.length > 0 && (
        <div className="note-list">
          {followUps.map((task) => (
            <div className="note-card task-card" key={task.id}>
              <div className="note-card-body">
                <div className="note-card-meta">
                  <span className={`task-due-date ${dueClass(task, todayISO())}`}>{task.nextDueDate}</span>
                  <span className="task-title">{task.title}</span>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    onClick={() => handleFollowUpAction(task.id, "completed")}
                    disabled={followUpActingId === task.id}
                  >
                    Done
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleFollowUpAction(task.id, "skipped")}
                    disabled={followUpActingId === task.id}
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleFollowUpAction(task.id, "not_needed")}
                    disabled={followUpActingId === task.id}
                  >
                    Not needed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <NoteEditor
          categories={categories}
          date={date}
          setDate={setDate}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          body={body}
          setBody={setBody}
        />
        <div className="row-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Add note"}
          </button>
          <button type="button" className="secondary" onClick={() => setShowCategoryManager((prev) => !prev)}>
            {showCategoryManager ? "Hide categories" : "Manage categories"}
          </button>
          <button type="button" className="secondary" onClick={() => setShowNewFollowUp((prev) => !prev)}>
            {showNewFollowUp ? "Hide follow-up" : "+ Set a follow-up"}
          </button>
        </div>
      </form>
      {showNewFollowUp && (
        <FollowUpPicker
          defaultTitle={`Follow up with ${clientName}`}
          onSave={saveFollowUp}
          onCancel={() => setShowNewFollowUp(false)}
        />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {showCategoryManager && <NoteCategoryManager categories={categories} notes={notes} onChanged={refresh} />}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : sortedNotes.length === 0 ? (
        <p className="empty">No notes yet for this client — add the first one above.</p>
      ) : (
        <div className="note-list">
          {sortedNotes.map((note) => (
            <div className="note-card" key={note.id}>
              <button type="button" className="note-card-summary" onClick={() => toggleExpand(note)}>
                <div className="note-card-meta">
                  <span className="note-card-date">{note.latest.date}</span>
                  {note.latest.category && <span className="chip">{note.latest.category}</span>}
                  {note.versionCount > 1 && <span className="note-edited-badge">Edited</span>}
                </div>
                {expandedId !== note.id && <p className="note-card-preview">{truncate(note.latest.body, 140)}</p>}
              </button>

              {expandedId === note.id && (
                <div className="note-card-body">
                  {editingId === note.id ? (
                    <>
                      <NoteEditor
                        categories={categories}
                        date={editDate}
                        setDate={setEditDate}
                        categoryId={editCategoryId}
                        setCategoryId={setEditCategoryId}
                        body={editBody}
                        setBody={setEditBody}
                      />
                      {editError && (
                        <p className="error" role="alert">
                          {editError}
                        </p>
                      )}
                      <div className="row-actions">
                        <button type="button" onClick={() => saveEdit(note.id)} disabled={editSubmitting}>
                          {editSubmitting ? "Saving…" : "Save"}
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="note-body"
                        // Content is rendered by our own escaping Markdown renderer
                        // (apps/web/src/markdown.ts), never raw user input.
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(note.latest.body) }}
                      />
                      <div className="row-actions">
                        <button type="button" onClick={() => startEdit(note)}>
                          Edit
                        </button>
                        <button type="button" className="secondary" onClick={() => loadHistory(note.id)}>
                          {historyLoadingId === note.id
                            ? "Loading…"
                            : historyByNote[note.id]
                              ? `History (${note.versionCount})`
                              : `Show history (${note.versionCount})`}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setFollowUpForNoteId((prev) => (prev === note.id ? null : note.id))}
                        >
                          {followUpForNoteId === note.id ? "Hide follow-up" : "Set follow-up"}
                        </button>
                      </div>
                      {followUpForNoteId === note.id && (
                        <FollowUpPicker
                          defaultTitle={`Follow up with ${clientName}`}
                          onSave={saveFollowUp}
                          onCancel={() => setFollowUpForNoteId(null)}
                        />
                      )}
                      {historyByNote[note.id] && (
                        <div className="note-history">
                          {(historyByNote[note.id] ?? []).map((version, index) => (
                            <div className="note-history-item" key={version.id}>
                              <div className="note-card-meta">
                                <span className="note-card-date">{version.date}</span>
                                {version.category && <span className="chip">{version.category}</span>}
                                <span className="note-history-label">
                                  {index === 0 ? "Current" : `Saved ${version.createdAt.slice(0, 10)}`}
                                </span>
                              </div>
                              <div
                                className="note-body"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(version.body) }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCategoryManager({
  categories,
  notes,
  onChanged,
}: {
  categories: NoteCategory[];
  notes: ClientNoteSummary[];
  onChanged: () => Promise<void>;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function countFor(categoryId: number): number {
    return notes.filter((note) => note.latest.categoryId === categoryId).length;
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
      await addNoteCategory(trimmed);
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
      await renameNoteCategory(id, trimmed);
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
        ? `Delete "${name}"? The ${count} note${count === 1 ? "" : "s"} currently tagged with it will become uncategorised.`
        : `Delete "${name}"?`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    try {
      await deleteNoteCategory(id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that category");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="edit-panel">
      <p className="edit-panel-title">Manage note categories</p>
      {categories.map((cat) => (
        <div className="category-row" key={cat.id}>
          <input
            className="input-compact"
            defaultValue={cat.name}
            disabled={renamingId === cat.id}
            onBlur={(event) => handleRename(cat.id, event.target.value, cat.name)}
          />
          <span className="category-row-count">
            {countFor(cat.id)} note{countFor(cat.id) === 1 ? "" : "s"}
          </span>
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
