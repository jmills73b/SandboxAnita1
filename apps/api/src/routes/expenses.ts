import { Hono } from "hono";
import { isValidExpenseCategory } from "@sandboxanita1/core";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const expenses = new Hono<AppEnv>();

expenses.use("*", requireAuth);

interface ExpenseRow {
  id: number;
  date: string;
  description: string;
  cost: number;
  category: string | null;
}

function toExpense(row: ExpenseRow) {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    cost: row.cost,
    category: row.category,
  };
}

expenses.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, date, description, cost, category FROM expenses ORDER BY date DESC, id DESC",
  ).all<ExpenseRow>();

  return c.json(results.map(toExpense));
});

expenses.post("/", async (c) => {
  const body = await c.req.json<{
    date?: string;
    description?: string;
    cost?: number;
    category?: string | null;
  }>();
  const { date, cost } = body;
  const description = body.description?.trim();

  if (!date || !description || cost === undefined) {
    return c.json({ error: "A date, description and cost are required" }, 400);
  }
  if (typeof cost !== "number" || cost <= 0) {
    return c.json({ error: "Enter a cost greater than £0" }, 400);
  }
  if (body.category && !isValidExpenseCategory(body.category)) {
    return c.json({ error: "Invalid category" }, 400);
  }

  const created = await c.env.DB.prepare(
    `INSERT INTO expenses (date, description, cost, category)
     VALUES (?, ?, ?, ?)
     RETURNING id, date, description, cost, category`,
  )
    .bind(date, description, cost, body.category ?? null)
    .first<ExpenseRow>();

  if (!created) {
    return c.json({ error: "Could not save the expense" }, 500);
  }

  return c.json(toExpense(created), 201);
});

expenses.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid expense id" }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id, date, description, cost, category FROM expenses WHERE id = ?")
    .bind(id)
    .first<ExpenseRow>();
  if (!existing) {
    return c.json({ error: "Expense not found" }, 404);
  }

  const body = await c.req.json<{
    date?: string;
    description?: string;
    cost?: number;
    category?: string | null;
  }>();

  if (body.cost !== undefined && (typeof body.cost !== "number" || body.cost <= 0)) {
    return c.json({ error: "Enter a cost greater than £0" }, 400);
  }
  if (body.category && !isValidExpenseCategory(body.category)) {
    return c.json({ error: "Invalid category" }, 400);
  }
  const trimmedDescription = body.description?.trim();
  if (body.description !== undefined && !trimmedDescription) {
    return c.json({ error: "Enter a description" }, 400);
  }

  const date = body.date ?? existing.date;
  const description = trimmedDescription ?? existing.description;
  const cost = body.cost ?? existing.cost;
  const category = body.category !== undefined ? body.category : existing.category;

  const updated = await c.env.DB.prepare(
    `UPDATE expenses SET date = ?, description = ?, cost = ?, category = ?
     WHERE id = ?
     RETURNING id, date, description, cost, category`,
  )
    .bind(date, description, cost, category, id)
    .first<ExpenseRow>();

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
