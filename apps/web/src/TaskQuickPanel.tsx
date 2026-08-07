import { useEffect, useState } from "react";
import { actOnTask, getTasks, type Task, type TaskAction } from "./api";
import { taskUrgency, needsAttention, URGENCY_ORDER, type Urgency } from "./taskUrgency";

const MAX_SHOWN = 5;

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

export function TaskQuickPanel({ onClose, onViewAll }: { onClose: () => void; onViewAll: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

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

  const today = todayISO();
  // The header badge already tells you the raw count is nonzero — the
  // point of this panel is "what actually needs me right now," so it
  // only ever shows late/getting-late items, sorted most urgent first.
  const urgent = tasks
    .filter((t) => t.status === "active" && needsAttention(t.nextDueDate, today))
    .map((t) => ({ task: t, urgency: taskUrgency(t.nextDueDate, today) as Urgency }))
    .sort(
      (a, b) =>
        URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency) ||
        a.task.nextDueDate.localeCompare(b.task.nextDueDate),
    );
  const shown = urgent.slice(0, MAX_SHOWN);
  const remaining = urgent.length - shown.length;

  async function handleAction(id: number, action: TaskAction) {
    setActingId(id);
    setError(null);
    try {
      await actOnTask(id, action);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that task");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="edit-panel task-quick-panel">
      <div className="notes-panel-header">
        <p className="edit-panel-title">Things to do</p>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading…</p>
      ) : error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : shown.length === 0 ? (
        <p className="empty">Nothing urgent — you're all caught up.</p>
      ) : (
        <div className="note-list">
          {shown.map(({ task, urgency }) => (
            <div className="note-card task-card" key={task.id}>
              <div className="note-card-body">
                <div className="note-card-meta">
                  <span className={`task-due-date urgency-${urgency}`}>
                    {task.nextDueDate} · {formatTime(task.dueTime)}
                  </span>
                  <span className="task-title">{task.title}</span>
                  {task.clientName && <span className="chip">{task.clientName}</span>}
                </div>
                {task.description && <p className="note-card-preview">{task.description}</p>}
                <div className="row-actions">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row-actions">
        <button type="button" className="secondary" onClick={onViewAll}>
          {remaining > 0 ? `+${remaining} more — View all tasks` : "View all tasks"}
        </button>
      </div>
    </div>
  );
}
