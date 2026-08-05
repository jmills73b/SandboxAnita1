import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const expenses = new Hono<AppEnv>();

expenses.use("*", requireAuth);

interface ExpenseRow {
  id: number;
  date: string;
  description: string;
  cost: number;
  category_id: number | null;
  category_name: string | null;
}

function toExpense(row: ExpenseRow) {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    cost: row.cost,
    categoryId: row.category_id,
    category: row.category_name,
  };
}

async function categoryExists(db: D1Database, categoryId: number): Promise<boolean> {
  const row = await db.prepare("SELECT id FROM expense_categories WHERE id = ?").bind(categoryId).first();
  return row !== null;
}

async function fetchExpense(db: D1Database, id: number): Promise<ExpenseRow | null> {
  return db
    .prepare(
      `SELECT expenses.id, expenses.date, expenses.description, expenses.cost,
              expenses.category_id, expense_categories.name AS category_name
       FROM expenses
       LEFT JOIN expense_categories ON expense_categories.id = expenses.category_id
       WHERE expenses.id = ?`,
    )
    .bind(id)
    .first<ExpenseRow>();
}

expenses.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT expenses.id, expenses.date, expenses.description, expenses.cost,
            expenses.category_id, expense_categories.name AS category_name
     FROM expenses
     LEFT JOIN expense_categories ON expense_categories.id = expenses.category_id
     ORDER BY expenses.date DESC, expenses.id DESC`,
  ).all<ExpenseRow>();

  return c.json(results.map(toExpense));
});

expenses.post("/", async (c) => {
  const body = await c.req.json<{
    date?: string;
    description?: string;
    cost?: number;
    categoryId?: number | null;
  }>();
  const { date, cost } = body;
  const description = body.description?.trim();

  if (!date || !description || cost === undefined) {
    return c.json({ error: "A date, description and cost are required" }, 400);
  }
  if (typeof cost !== "number" || cost <= 0) {
    return c.json({ error: "Enter a cost greater than £0" }, 400);
  }
  if (body.categoryId != null && !(await categoryExists(c.env.DB, body.categoryId))) {
    return c.json({ error: "Invalid category" }, 400);
  }

  const created = await c.env.DB.prepare(
    `INSERT INTO expenses (date, description, cost, category_id)
     VALUES (?, ?, ?, ?)
     RETURNING id`,
  )
    .bind(date, description, cost, body.categoryId ?? null)
    .first<{ id: number }>();

  if (!created) {
    return c.json({ error: "Could not save the expense" }, 500);
  }

  const expense = await fetchExpense(c.env.DB, created.id);
  return c.json(toExpense(expense!), 201);
});

expenses.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid expense id" }, 400);
  }

  const existing = await fetchExpense(c.env.DB, id);
  if (!existing) {
    return c.json({ error: "Expense not found" }, 404);
  }

  const body = await c.req.json<{
    date?: string;
    description?: string;
    cost?: number;
    categoryId?: number | null;
  }>();

  if (body.cost !== undefined && (typeof body.cost !== "number" || body.cost <= 0)) {
    return c.json({ error: "Enter a cost greater than £0" }, 400);
  }
  if (body.categoryId != null && !(await categoryExists(c.env.DB, body.categoryId))) {
    return c.json({ error: "Invalid category" }, 400);
  }
  const trimmedDescription = body.description?.trim();
  if (body.description !== undefined && !trimmedDescription) {
    return c.json({ error: "Enter a description" }, 400);
  }

  const date = body.date ?? existing.date;
  const description = trimmedDescription ?? existing.description;
  const cost = body.cost ?? existing.cost;
  const categoryId = body.categoryId !== undefined ? body.categoryId : existing.category_id;

  await c.env.DB.prepare("UPDATE expenses SET date = ?, description = ?, cost = ?, category_id = ? WHERE id = ?")
    .bind(date, description, cost, categoryId, id)
    .run();

  const updated = await fetchExpense(c.env.DB, id);
  if (!updated) {
    return c.json({ error: "Could not update the expense" }, 500);
  }

  return c.json(toExpense(updated));
});

expenses.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid expense id" }, 400);
  }

  const result = await c.env.DB.prepare("DELETE FROM expenses WHERE id = ?").bind(id).run();
  if (result.meta.changes === 0) {
    return c.json({ error: "Expense not found" }, 404);
  }

  return c.json({ ok: true });
});

export default expenses;
