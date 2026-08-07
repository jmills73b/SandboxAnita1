import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  actOnTask,
  addClientNote,
  addClientNoteVersion,
  addTask,
  getClientNote,
  getClientNotes,
  getNoteCategories,
  getTasks,
  type ClientNoteSummary,
  type NoteCategory,
  type NoteVersion,
  type Task,
  type TaskAction,
} from "./api";
import { renderMarkdown } from "./markdown";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { FollowUpPicker } from "./FollowUpPicker";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function dueClass(task: Task, today: string): string {
  if (task.nextDueDate < today) return "overdue";
  if (task.nextDueDate === today) return "due-today";
  return "";
}

// "14:00" -> "2:00 PM". There's no notification delivery in this app —
// nothing fires at this time — so it's purely a label alongside the date.
function formatTime(time: string): string {
  const [hoursStr, minutes] = time.split(":");
  const hours = Number(hoursStr);
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${minutes} ${period}`;
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
    return <p className="empty">No categories yet — add some from Admin &amp; Settings.</p>;
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

type NotesTab = "tasks" | "new" | "previous";

const NOTES_TABS: Array<{ key: NotesTab; label: string }> = [
  { key: "tasks", label: "Tasks" },
  { key: "new", label: "New note" },
  { key: "previous", label: "Previous notes" },
];

export function ClientNotesPage({
  clientId,
  clientName,
  onBack,
}: {
  clientId: number;
  clientName: string;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<NotesTab>("tasks");

  const [notes, setNotes] = useState<ClientNoteSummary[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [followUps, setFollowUps] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .filter((t) => t.clientId === clientId && t.status === "active")
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
      setTab("previous");
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

  async function saveFollowUp(input: { title: string; dueDate: string; dueTime: string }) {
    await addTask({
      title: input.title,
      frequency: "once",
      nextDueDate: input.dueDate,
      dueTime: input.dueTime,
      clientId,
    });
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
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Clients
      </button>
      <h1 className="sr-only">Notes for {clientName}</h1>
      <p className="edit-panel-title">Notes for {clientName}</p>

      <div className="subtabs" role="tablist" aria-label="Client notes section">
        {NOTES_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`subtab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {tab === "tasks" && (
        <>
          {loading ? (
            <p className="loading">Loading…</p>
          ) : followUps.length === 0 ? (
            <p className="empty">No follow-ups yet for this client.</p>
          ) : (
            <div className="note-list">
              {followUps.map((task) => (
                <div className="note-card task-card" key={task.id}>
                  <div className="note-card-body">
                    <div className="note-card-meta">
                      <span className={`task-due-date ${dueClass(task, todayISO())}`}>
                        {task.nextDueDate} · {formatTime(task.dueTime)}
                      </span>
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

          <div className="row-actions">
            <button type="button" className="secondary" onClick={() => setShowNewFollowUp((prev) => !prev)}>
              {showNewFollowUp ? "Hide follow-up" : "+ Set a follow-up"}
            </button>
          </div>
          {showNewFollowUp && (
            <FollowUpPicker
              defaultTitle={`Follow up with ${clientName}`}
              onSave={saveFollowUp}
              onCancel={() => setShowNewFollowUp(false)}
            />
          )}
        </>
      )}

      {tab === "new" && (
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
          </div>
        </form>
      )}

      {tab === "previous" &&
        (loading ? (
          <p className="loading">Loading…</p>
        ) : sortedNotes.length === 0 ? (
          <p className="empty">No notes yet for this client — capture one from the "New note" tab.</p>
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
        ))}
    </>
  );
}
