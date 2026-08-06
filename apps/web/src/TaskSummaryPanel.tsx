import { useEffect, useState } from "react";
import { actOnTask, getTasks, type Task, type TaskAction } from "./api";

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

export function TaskSummaryPanel({ onClose }: { onClose: () => void }) {
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
  const due = tasks.filter((t) => !t.paused && t.nextDueDate <= today);

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
    <div className="edit-panel">
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
      ) : due.length === 0 ? (
        <p className="empty">Nothing due — you're all caught up.</p>
      ) : (
        <div className="note-list">
          {due.map((task) => (
            <div className="note-card task-card" key={task.id}>
              <div className="note-card-body">
                <div className="note-card-meta">
                  <span className={`task-due-date ${dueClass(task, today)}`}>
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
    </div>
  );
}
