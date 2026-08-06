import { useEffect, useState, type FormEvent } from "react";
import {
  actOnTask,
  addTask,
  getTask,
  getTasks,
  updateTask,
  type Task,
  type TaskAction,
  type TaskFrequency,
  type TaskOccurrence,
} from "./api";

const FREQUENCIES: { value: TaskFrequency; label: string }[] = [
  { value: "once", label: "One-off" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const ACTION_LABELS: Record<TaskAction, string> = {
  completed: "Done",
  skipped: "Skipped",
  not_needed: "Not needed",
};

const DEFAULT_DUE_TIME = "09:30";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

function dueClass(task: Task, today: string): string {
  if (task.paused) return "";
  if (task.nextDueDate < today) return "overdue";
  if (task.nextDueDate === today) return "due-today";
  return "";
}

function frequencyLabel(frequency: TaskFrequency): string {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
}

export function TasksPage({ onBack }: { onBack: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(todayISO());
  const [dueTime, setDueTime] = useState(DEFAULT_DUE_TIME);
  const [submitting, setSubmitting] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyByTask, setHistoryByTask] = useState<Record<number, TaskOccurrence[]>>({});
  const [historyLoadingId, setHistoryLoadingId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFrequency, setEditFrequency] = useState<TaskFrequency>("monthly");
  const [editNextDueDate, setEditNextDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState(DEFAULT_DUE_TIME);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setTasks(await getTasks());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = title.trim();
    if (!trimmed) {
      setError("Enter a title");
      return;
    }

    setSubmitting(true);
    try {
      await addTask({ title: trimmed, description: description.trim() || null, frequency, nextDueDate, dueTime });
      setTitle("");
      setDescription("");
      setFrequency("monthly");
      setNextDueDate(todayISO());
      setDueTime(DEFAULT_DUE_TIME);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that task");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id: number, action: TaskAction) {
    setActingId(id);
    setError(null);
    try {
      await actOnTask(id, action);
      setHistoryByTask((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that task");
    } finally {
      setActingId(null);
    }
  }

  async function togglePause(task: Task) {
    setActingId(task.id);
    setError(null);
    try {
      await updateTask(task.id, { paused: !task.paused });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that task");
    } finally {
      setActingId(null);
    }
  }

  async function toggleExpand(task: Task) {
    setExpandedId((prev) => (prev === task.id ? null : task.id));
    setEditingId(null);
  }

  async function loadHistory(taskId: number) {
    if (historyByTask[taskId]) return;
    setHistoryLoadingId(taskId);
    try {
      const detail = await getTask(taskId);
      setHistoryByTask((prev) => ({ ...prev, [taskId]: detail.occurrences }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load history");
    } finally {
      setHistoryLoadingId(null);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditFrequency(task.frequency);
    setEditNextDueDate(task.nextDueDate);
    setEditDueTime(task.dueTime);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: number) {
    setEditError(null);
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditError("Enter a title");
      return;
    }

    setEditSubmitting(true);
    try {
      await updateTask(id, {
        title: trimmed,
        description: editDescription.trim() || null,
        frequency: editFrequency,
        nextDueDate: editNextDueDate,
        dueTime: editDueTime,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  const today = todayISO();
  const sortedTasks = [...tasks].sort(
    (a, b) => Number(a.paused) - Number(b.paused) || a.nextDueDate.localeCompare(b.nextDueDate),
  );

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        ← Dashboard
      </button>
      <h1 className="sr-only">Tasks &amp; Reminders</h1>

      <form onSubmit={handleSubmit} className="quick-add">
        <label className="sr-only" htmlFor="task-title">
          Title
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Reminder title"
          required
          autoFocus
        />
        <label className="sr-only" htmlFor="task-description">
          Description
        </label>
        <input
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description (optional)"
        />
        <label className="sr-only" htmlFor="task-frequency">
          Frequency
        </label>
        <select id="task-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as TaskFrequency)}>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="task-due-date">
          Next due date
        </label>
        <input
          id="task-due-date"
          type="date"
          value={nextDueDate}
          onChange={(event) => setNextDueDate(event.target.value)}
          required
        />
        <label className="sr-only" htmlFor="task-due-time">
          Time (optional, defaults to 9:30 AM)
        </label>
        <input id="task-due-time" type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add reminder"}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {editingId !== null && (
        <div className="edit-panel">
          <p className="edit-panel-title">Editing "{editTitle || "…"}"</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Title</span>
              <input className="input-compact" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </label>
            <label className="edit-field">
              <span>Description</span>
              <input
                className="input-compact"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Frequency</span>
              <select
                className="input-compact"
                value={editFrequency}
                onChange={(event) => setEditFrequency(event.target.value as TaskFrequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="edit-field">
              <span>Next due date</span>
              <input
                type="date"
                className="input-compact"
                value={editNextDueDate}
                onChange={(event) => setEditNextDueDate(event.target.value)}
              />
            </label>
            <label className="edit-field">
              <span>Time</span>
              <input
                type="time"
                className="input-compact"
                value={editDueTime}
                onChange={(event) => setEditDueTime(event.target.value)}
              />
            </label>
          </div>
          {editError && (
            <p className="error" role="alert">
              {editError}
            </p>
          )}
          <div className="row-actions">
            <button type="button" onClick={() => saveEdit(editingId)} disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : sortedTasks.length === 0 ? (
        <p className="empty">No reminders yet — add the first one above.</p>
      ) : (
        <div className="note-list">
          {sortedTasks.map((task) => (
            <div className={`note-card task-card ${task.paused ? "task-paused" : ""}`} key={task.id}>
              <button type="button" className="note-card-summary" onClick={() => toggleExpand(task)}>
                <div className="note-card-meta">
                  <span className={`task-due-date ${dueClass(task, today)}`}>
                    {task.nextDueDate} · {formatTime(task.dueTime)}
                  </span>
                  <span className="task-title">{task.title}</span>
                  <span className="chip">{frequencyLabel(task.frequency)}</span>
                  {task.clientName && <span className="chip">{task.clientName}</span>}
                  {task.paused && <span className="note-edited-badge">Paused</span>}
                </div>
                {expandedId !== task.id && task.description && (
                  <p className="note-card-preview">{task.description}</p>
                )}
              </button>

              {expandedId === task.id && (
                <div className="note-card-body">
                  {task.description && <p className="note-card-preview">{task.description}</p>}
                  <div className="row-actions">
                    {!task.paused && (
                      <>
                        <button type="button" onClick={() => handleAction(task.id, "completed")} disabled={actingId === task.id}>
                          Done
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleAction(task.id, "skipped")}
                          disabled={actingId === task.id}
                        >
                          Skip
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleAction(task.id, "not_needed")}
                          disabled={actingId === task.id}
                        >
                          Not needed
                        </button>
                      </>
                    )}
                    <button type="button" className="secondary" onClick={() => startEdit(task)}>
                      Edit
                    </button>
                    <button type="button" className="secondary" onClick={() => togglePause(task)} disabled={actingId === task.id}>
                      {task.paused ? "Resume" : "Pause"}
                    </button>
                    <button type="button" className="secondary" onClick={() => loadHistory(task.id)}>
                      {historyLoadingId === task.id ? "Loading…" : historyByTask[task.id] ? "History" : "Show history"}
                    </button>
                  </div>
                  {historyByTask[task.id] && (
                    <div className="note-history">
                      {(historyByTask[task.id] ?? []).length === 0 ? (
                        <p className="empty">No history yet for this reminder.</p>
                      ) : (
                        (historyByTask[task.id] ?? []).map((occurrence) => (
                          <div className="note-history-item" key={occurrence.id}>
                            <div className="note-card-meta">
                              <span className="task-due-date">{occurrence.dueDate}</span>
                              <span className="chip">{ACTION_LABELS[occurrence.action]}</span>
                              <span className="note-history-label">on {occurrence.actedAt.slice(0, 10)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
