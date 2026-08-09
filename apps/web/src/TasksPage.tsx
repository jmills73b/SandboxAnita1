import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "./icons";
import { firstMatchingWeekday } from "@sandboxanita1/core";
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
import { DayOfWeekPicker } from "./DayOfWeekPicker";
import { addDaysIso, taskUrgency, URGENCY_LABELS, URGENCY_ORDER, type Urgency } from "./taskUrgency";

const FREQUENCIES: { value: TaskFrequency; label: string }[] = [
  { value: "once", label: "One-off" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "four_weekly", label: "Every 4 weeks" },
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

// How long a finished one-off task stays in "Recently completed" before
// it ages into the Historic tab.
const RECENT_WINDOW_DAYS = 7;

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

function frequencyLabel(frequency: TaskFrequency): string {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
}

// A daily reminder's days-of-week only means something as a *restriction*
// — none selected, or all seven, both mean "every day," so there's
// nothing worth persisting or asking the API to validate.
function daysOfWeekForSubmit(frequency: TaskFrequency, daysOfWeek: number[]): number[] | null {
  return frequency === "daily" && daysOfWeek.length > 0 && daysOfWeek.length < 7 ? daysOfWeek : null;
}

type Mode = { kind: "list" } | { kind: "add" } | { kind: "edit"; id: number };
type ListTab = "active" | "recent" | "historic";

function ReminderDateFields({
  frequency,
  daysOfWeek,
  onDaysOfWeekChange,
  nextDueDate,
  onNextDueDateChange,
}: {
  frequency: TaskFrequency;
  daysOfWeek: number[];
  onDaysOfWeekChange: (days: number[]) => void;
  nextDueDate: string;
  onNextDueDateChange: (date: string) => void;
}) {
  function pickDays(days: number[]) {
    onDaysOfWeekChange(days);
    if (days.length > 0) {
      onNextDueDateChange(firstMatchingWeekday(nextDueDate || todayISO(), days));
    }
  }

  return (
    <>
      {frequency === "daily" && (
        <label className="edit-field">
          <span>Repeat on (optional — leave blank for every day)</span>
          <DayOfWeekPicker mode="multi" value={daysOfWeek} onChange={pickDays} />
        </label>
      )}
      {(frequency === "weekly" || frequency === "fortnightly" || frequency === "four_weekly") && (
        <label className="edit-field">
          <span>Pin to a weekday (optional)</span>
          <DayOfWeekPicker mode="single" value={daysOfWeek} onChange={pickDays} />
        </label>
      )}
      <label className="edit-field">
        <span>Next due date</span>
        <input
          type="date"
          className="input-compact"
          value={nextDueDate}
          onChange={(event) => onNextDueDateChange(event.target.value)}
          required
        />
      </label>
    </>
  );
}

export function TasksPage({ onBack }: { onBack: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [listTab, setListTab] = useState<ListTab>("active");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("monthly");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [nextDueDate, setNextDueDate] = useState(todayISO());
  const [dueTime, setDueTime] = useState(DEFAULT_DUE_TIME);
  const [submitting, setSubmitting] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyByTask, setHistoryByTask] = useState<Record<number, TaskOccurrence[]>>({});
  const [historyLoadingId, setHistoryLoadingId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFrequency, setEditFrequency] = useState<TaskFrequency>("monthly");
  const [editDaysOfWeek, setEditDaysOfWeek] = useState<number[]>([]);
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

  function startAdd() {
    setTitle("");
    setDescription("");
    setFrequency("monthly");
    setDaysOfWeek([]);
    setNextDueDate(todayISO());
    setDueTime(DEFAULT_DUE_TIME);
    setError(null);
    setMode({ kind: "add" });
  }

  function cancelAdd() {
    setError(null);
    setMode({ kind: "list" });
  }

  function changeFrequency(value: TaskFrequency) {
    setFrequency(value);
    setDaysOfWeek([]);
  }

  function changeEditFrequency(value: TaskFrequency) {
    setEditFrequency(value);
    setEditDaysOfWeek([]);
  }

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
      await addTask({
        title: trimmed,
        description: description.trim() || null,
        frequency,
        daysOfWeek: daysOfWeekForSubmit(frequency, daysOfWeek),
        nextDueDate,
        dueTime,
      });
      setMode({ kind: "list" });
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
      await updateTask(task.id, { status: task.status === "paused" ? "active" : "paused" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that task");
    } finally {
      setActingId(null);
    }
  }

  async function toggleExpand(task: Task) {
    setExpandedId((prev) => (prev === task.id ? null : task.id));
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
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditFrequency(task.frequency);
    setEditDaysOfWeek(task.daysOfWeek ?? []);
    setEditNextDueDate(task.nextDueDate);
    setEditDueTime(task.dueTime);
    setEditError(null);
    setMode({ kind: "edit", id: task.id });
  }

  function cancelEdit() {
    setEditError(null);
    setMode({ kind: "list" });
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
        daysOfWeek: daysOfWeekForSubmit(editFrequency, editDaysOfWeek),
        nextDueDate: editNextDueDate,
        dueTime: editDueTime,
      });
      setMode({ kind: "list" });
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't save those changes");
    } finally {
      setEditSubmitting(false);
    }
  }

  const today = todayISO();
  const recentCutoff = addDaysIso(today, -RECENT_WINDOW_DAYS);

  const activeTasks = tasks.filter((t) => t.status === "active");
  const pausedTasks = tasks.filter((t) => t.status === "paused");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const grouped: Record<Urgency, Task[]> = { late: [], gettingLate: [], comingSoon: [] };
  for (const task of activeTasks) {
    grouped[taskUrgency(task.nextDueDate, today)].push(task);
  }
  for (const urgency of URGENCY_ORDER) {
    grouped[urgency].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }

  const recentlyCompleted = doneTasks
    .filter((t) => (t.completedAt ?? "") >= recentCutoff)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const historic = doneTasks
    .filter((t) => (t.completedAt ?? "") < recentCutoff)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  function renderTaskCard(task: Task, urgency?: Urgency) {
    return (
      <div className={`note-card task-card ${task.status === "paused" ? "task-paused" : ""}`} key={task.id}>
        <button type="button" className="note-card-summary" onClick={() => toggleExpand(task)}>
          <div className="note-card-meta">
            {task.status === "done" ? (
              <span className="task-due-date">
                Completed {task.completedAt ? task.completedAt.slice(0, 10) : "—"}
              </span>
            ) : (
              <span className={`task-due-date ${urgency ? `urgency-${urgency}` : ""}`}>
                {task.nextDueDate} · {formatTime(task.dueTime)}
              </span>
            )}
            <span className="task-title">{task.title}</span>
            <span className="chip">{frequencyLabel(task.frequency)}</span>
            {task.clientName && <span className="chip">{task.clientName}</span>}
            {task.status === "paused" && <span className="note-edited-badge">Paused</span>}
          </div>
          {expandedId !== task.id && task.description && (
            <p className="note-card-preview">{task.description}</p>
          )}
        </button>

        {expandedId === task.id && (
          <div className="note-card-body">
            {task.description && <p className="note-card-preview">{task.description}</p>}
            <div className="row-actions">
              {task.status === "active" && (
                <>
                  <button type="button" onClick={() => handleAction(task.id, "completed")} disabled={actingId === task.id}>
                    <Icon name="done" /> Done
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleAction(task.id, "skipped")}
                    disabled={actingId === task.id}
                  >
                    <Icon name="skip" /> Skip
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleAction(task.id, "not_needed")}
                    disabled={actingId === task.id}
                  >
                    <Icon name="not-needed" /> Not needed
                  </button>
                </>
              )}
              {task.status !== "done" && (
                <>
                  <button type="button" className="secondary" onClick={() => startEdit(task)}>
                    <Icon name="edit" /> Edit
                  </button>
                  <button type="button" className="secondary" onClick={() => togglePause(task)} disabled={actingId === task.id}>
                    <Icon name={task.status === "paused" ? "resume" : "pause"} /> {task.status === "paused" ? "Resume" : "Pause"}
                  </button>
                </>
              )}
              <button type="button" className="secondary" onClick={() => loadHistory(task.id)}>
                <Icon name="history" /> {historyLoadingId === task.id ? "Loading…" : historyByTask[task.id] ? "History" : "Show history"}
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
    );
  }

  if (mode.kind === "add") {
    return (
      <>
        <button type="button" className="back-link" onClick={cancelAdd}>
          <Icon name="back" /> Tasks &amp; Reminders
        </button>
        <h1 className="sr-only">Add reminder</h1>
        <form onSubmit={handleSubmit} className="edit-panel">
          <p className="edit-panel-title">Add reminder</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Title</span>
              <input
                className="input-compact"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="edit-field">
              <span>Frequency</span>
              <select
                className="input-compact"
                value={frequency}
                onChange={(event) => changeFrequency(event.target.value as TaskFrequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <ReminderDateFields
              frequency={frequency}
              daysOfWeek={daysOfWeek}
              onDaysOfWeekChange={setDaysOfWeek}
              nextDueDate={nextDueDate}
              onNextDueDateChange={setNextDueDate}
            />
            <label className="edit-field">
              <span>Time</span>
              <input
                type="time"
                className="input-compact"
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
              />
            </label>
          </div>
          <label className="edit-field">
            <span>Description</span>
            <textarea
              className="notes-textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Optional"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="row-actions">
            <button type="submit" disabled={submitting}>
              <Icon name="add" /> {submitting ? "Saving…" : "Add reminder"}
            </button>
            <button type="button" onClick={cancelAdd} disabled={submitting}>
              <Icon name="cancel" /> Cancel
            </button>
          </div>
        </form>
      </>
    );
  }

  if (mode.kind === "edit") {
    return (
      <>
        <button type="button" className="back-link" onClick={cancelEdit}>
          <Icon name="back" /> Tasks &amp; Reminders
        </button>
        <h1 className="sr-only">Editing {editTitle || "reminder"}</h1>
        <div className="edit-panel">
          <p className="edit-panel-title">Editing "{editTitle || "…"}"</p>
          <div className="edit-row">
            <label className="edit-field">
              <span>Title</span>
              <input className="input-compact" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </label>
            <label className="edit-field">
              <span>Frequency</span>
              <select
                className="input-compact"
                value={editFrequency}
                onChange={(event) => changeEditFrequency(event.target.value as TaskFrequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <ReminderDateFields
              frequency={editFrequency}
              daysOfWeek={editDaysOfWeek}
              onDaysOfWeekChange={setEditDaysOfWeek}
              nextDueDate={editNextDueDate}
              onNextDueDateChange={setEditNextDueDate}
            />
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
          <label className="edit-field">
            <span>Description</span>
            <textarea
              className="notes-textarea"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={4}
            />
          </label>
          {editError && (
            <p className="error" role="alert">
              {editError}
            </p>
          )}
          <div className="row-actions">
            <button type="button" onClick={() => saveEdit(mode.id)} disabled={editSubmitting}>
              <Icon name="save" /> {editSubmitting ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={editSubmitting}>
              <Icon name="cancel" /> Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        <Icon name="back" /> Dashboard
      </button>
      <h1 className="sr-only">Tasks &amp; Reminders</h1>

      <div className="page-primary-action">
        <button type="button" onClick={startAdd}>
          <Icon name="add" /> Add reminder
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {tasks.length > 0 && (
        <div className="subtabs" role="tablist" aria-label="Task view">
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "active"}
            className={`subtab ${listTab === "active" ? "active" : ""}`}
            onClick={() => setListTab("active")}
          >
            Active
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "recent"}
            className={`subtab ${listTab === "recent" ? "active" : ""}`}
            onClick={() => setListTab("recent")}
          >
            Recently completed{recentlyCompleted.length > 0 && ` (${recentlyCompleted.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "historic"}
            className={`subtab ${listTab === "historic" ? "active" : ""}`}
            onClick={() => setListTab("historic")}
          >
            Historic
          </button>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="empty">No reminders yet — add the first one above.</p>
      ) : listTab === "active" ? (
        activeTasks.length === 0 && pausedTasks.length === 0 ? (
          <p className="empty">Nothing active — every reminder is finished or paused.</p>
        ) : (
          <>
            {URGENCY_ORDER.map(
              (urgency) =>
                grouped[urgency].length > 0 && (
                  <section className="task-urgency-group" key={urgency}>
                    <h2 className={`task-urgency-heading urgency-${urgency}`}>
                      {URGENCY_LABELS[urgency]} ({grouped[urgency].length})
                    </h2>
                    <div className="note-list">{grouped[urgency].map((task) => renderTaskCard(task, urgency))}</div>
                  </section>
                ),
            )}
            {pausedTasks.length > 0 && (
              <section className="task-urgency-group">
                <h2 className="task-urgency-heading">Paused ({pausedTasks.length})</h2>
                <div className="note-list">{pausedTasks.map((task) => renderTaskCard(task))}</div>
              </section>
            )}
          </>
        )
      ) : listTab === "recent" ? (
        recentlyCompleted.length === 0 ? (
          <p className="empty">Nothing completed in the last {RECENT_WINDOW_DAYS} days.</p>
        ) : (
          <div className="note-list">{recentlyCompleted.map((task) => renderTaskCard(task))}</div>
        )
      ) : historic.length === 0 ? (
        <p className="empty">Nothing in the historic archive yet.</p>
      ) : (
        <div className="note-list">{historic.map((task) => renderTaskCard(task))}</div>
      )}
    </>
  );
}
