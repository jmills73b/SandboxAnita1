import { Hono } from "hono";
import { isValidTaskFrequency, nextDueDate, type TaskFrequency } from "@sandboxanita1/core";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const tasks = new Hono<AppEnv>();

tasks.use("*", requireAuth);

const ACTIONS = ["completed", "skipped", "not_needed"] as const;
type TaskAction = (typeof ACTIONS)[number];

function isValidAction(action: string): action is TaskAction {
  return (ACTIONS as readonly string[]).includes(action);
}

// There's no background notifier in this app — a due time is shown
// alongside the date, not something that triggers anything, so it
// defaults to a sensible time rather than being left blank when nobody
// picks one.
const DEFAULT_DUE_TIME = "09:30";
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTimeOfDay(value: string): boolean {
  return TIME_RE.test(value);
}

interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  frequency: TaskFrequency;
  next_due_date: string;
  due_time: string;
  paused: number;
  created_at: string;
  client_id: number | null;
  client_name: string | null;
}

interface OccurrenceRow {
  id: number;
  task_id: number;
  due_date: string;
  action: TaskAction;
  acted_at: string;
}

function toOccurrence(row: OccurrenceRow) {
  return { id: row.id, dueDate: row.due_date, action: row.action, actedAt: row.acted_at };
}

function toTask(row: TaskRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    frequency: row.frequency,
    nextDueDate: row.next_due_date,
    dueTime: row.due_time,
    paused: row.paused === 1,
    createdAt: row.created_at,
    clientId: row.client_id,
    clientName: row.client_name,
  };
}

const TASK_COLUMNS = `
  tasks.id, tasks.title, tasks.description, tasks.frequency, tasks.next_due_date, tasks.due_time,
  tasks.paused, tasks.created_at, tasks.client_id, clients.name AS client_name
`;

async function fetchTask(db: D1Database, id: number): Promise<TaskRow | null> {
  return db
    .prepare(`SELECT ${TASK_COLUMNS} FROM tasks LEFT JOIN clients ON clients.id = tasks.client_id WHERE tasks.id = ?`)
    .bind(id)
    .first<TaskRow>();
}

async function fetchOccurrences(db: D1Database, taskId: number): Promise<OccurrenceRow[]> {
  const { results } = await db
    .prepare(
      "SELECT id, task_id, due_date, action, acted_at FROM task_occurrences WHERE task_id = ? ORDER BY id DESC",
    )
    .bind(taskId)
    .all<OccurrenceRow>();
  return results;
}

tasks.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${TASK_COLUMNS} FROM tasks LEFT JOIN clients ON clients.id = tasks.client_id
     ORDER BY tasks.paused, tasks.next_due_date, tasks.id`,
  ).all<TaskRow>();

  return c.json(results.map(toTask));
});

tasks.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid task id" }, 400);
  }

  const task = await fetchTask(c.env.DB, id);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const occurrences = await fetchOccurrences(c.env.DB, id);
  return c.json({ ...toTask(task), occurrences: occurrences.map(toOccurrence) });
});

tasks.post("/", async (c) => {
  const body = await c.req.json<{
    title?: string;
    description?: string | null;
    frequency?: string;
    nextDueDate?: string;
    dueTime?: string;
    clientId?: number | null;
  }>();

  const title = body.title?.trim();
  if (!title || !body.frequency || !body.nextDueDate) {
    return c.json({ error: "A title, frequency and due date are required" }, 400);
  }
  if (!isValidTaskFrequency(body.frequency)) {
    return c.json({ error: "Invalid frequency" }, 400);
  }
  const trimmedDueTime = body.dueTime?.trim();
  if (trimmedDueTime && !isValidTimeOfDay(trimmedDueTime)) {
    return c.json({ error: "Invalid due time" }, 400);
  }

  const created = await c.env.DB.prepare(
    "INSERT INTO tasks (title, description, frequency, next_due_date, due_time, client_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
  )
    .bind(
      title,
      body.description?.trim() || null,
      body.frequency,
      body.nextDueDate,
      trimmedDueTime || DEFAULT_DUE_TIME,
      body.clientId ?? null,
    )
    .first<{ id: number }>();

  if (!created) {
    return c.json({ error: "Could not save the task" }, 500);
  }

  const task = await fetchTask(c.env.DB, created.id);
  return c.json({ ...toTask(task!), occurrences: [] }, 201);
});

tasks.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid task id" }, 400);
  }

  const existing = await fetchTask(c.env.DB, id);
  if (!existing) {
    return c.json({ error: "Task not found" }, 404);
  }

  const body = await c.req.json<{
    title?: string;
    description?: string | null;
    frequency?: string;
    nextDueDate?: string;
    dueTime?: string;
    paused?: boolean;
    clientId?: number | null;
  }>();

  const trimmedTitle = body.title?.trim();
  if (body.title !== undefined && !trimmedTitle) {
    return c.json({ error: "Enter a title" }, 400);
  }
  if (body.frequency !== undefined && !isValidTaskFrequency(body.frequency)) {
    return c.json({ error: "Invalid frequency" }, 400);
  }
  if (body.dueTime !== undefined && !isValidTimeOfDay(body.dueTime)) {
    return c.json({ error: "Invalid due time" }, 400);
  }

  const title = trimmedTitle ?? existing.title;
  const description = body.description !== undefined ? body.description?.trim() || null : existing.description;
  const frequency = body.frequency ?? existing.frequency;
  const nextDueDateValue = body.nextDueDate ?? existing.next_due_date;
  const dueTime = body.dueTime ?? existing.due_time;
  const paused = body.paused !== undefined ? (body.paused ? 1 : 0) : existing.paused;
  const clientId = body.clientId !== undefined ? body.clientId : existing.client_id;

  await c.env.DB.prepare(
    "UPDATE tasks SET title = ?, description = ?, frequency = ?, next_due_date = ?, due_time = ?, paused = ?, client_id = ? WHERE id = ?",
  )
    .bind(title, description, frequency, nextDueDateValue, dueTime, paused, clientId, id)
    .run();

  const updated = await fetchTask(c.env.DB, id);
  const occurrences = await fetchOccurrences(c.env.DB, id);
  return c.json({ ...toTask(updated!), occurrences: occurrences.map(toOccurrence) });
});

// Recording an action never edits history — it appends an occurrence row
// and, for a recurring task, advances next_due_date from the due date
// that was just actioned (not from today), so a weekly task stays on a
// steady cadence rather than drifting later each time it's done a bit
// late. A "once" task has no next occurrence, so it pauses itself instead
// — the same flag a user would use to manually stop a recurring reminder.
tasks.post("/:id/actions", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid task id" }, 400);
  }

  const task = await fetchTask(c.env.DB, id);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  const body = await c.req.json<{ action?: string }>();
  if (!body.action || !isValidAction(body.action)) {
    return c.json({ error: "Invalid action" }, 400);
  }

  await c.env.DB.prepare("INSERT INTO task_occurrences (task_id, due_date, action) VALUES (?, ?, ?)")
    .bind(id, task.next_due_date, body.action)
    .run();

  if (task.frequency === "once") {
    await c.env.DB.prepare("UPDATE tasks SET paused = 1 WHERE id = ?").bind(id).run();
  } else {
    const newDueDate = nextDueDate(task.next_due_date, task.frequency);
    await c.env.DB.prepare("UPDATE tasks SET next_due_date = ? WHERE id = ?").bind(newDueDate, id).run();
  }

  const updated = await fetchTask(c.env.DB, id);
  const occurrences = await fetchOccurrences(c.env.DB, id);
  return c.json({ ...toTask(updated!), occurrences: occurrences.map(toOccurrence) }, 201);
});

export default tasks;
