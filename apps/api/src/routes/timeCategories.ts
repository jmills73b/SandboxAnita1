import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const timeCategories = new Hono<AppEnv>();

timeCategories.use("*", requireAuth);

interface CategoryRow {
  id: number;
  name: string;
  sort_order: number;
}

function toCategory(row: CategoryRow) {
  return { id: row.id, name: row.name };
}

timeCategories.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, sort_order FROM time_categories ORDER BY sort_order, name",
  ).all<CategoryRow>();

  return c.json(results.map(toCategory));
});

timeCategories.post("/", async (c) => {
  const { name } = await c.req.json<{ name?: string }>();
  const trimmed = name?.trim();
  if (!trimmed) {
    return c.json({ error: "Enter a category name" }, 400);
  }

  const duplicate = await c.env.DB.prepare("SELECT id FROM time_categories WHERE name = ?").bind(trimmed).first();
  if (duplicate) {
    return c.json({ error: "That category already exists" }, 400);
  }

  const maxOrder = await c.env.DB.prepare("SELECT MAX(sort_order) as maxOrder FROM time_categories").first<{
    maxOrder: number | null;
  }>();
  const nextOrder = (maxOrder?.maxOrder ?? 0) + 1;

  const created = await c.env.DB.prepare(
    "INSERT INTO time_categories (name, sort_order) VALUES (?, ?) RETURNING id, name, sort_order",
  )
    .bind(trimmed, nextOrder)
    .first<CategoryRow>();

  if (!created) {
    return c.json({ error: "Could not save the category" }, 500);
  }

  return c.json(toCategory(created), 201);
});

timeCategories.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid category id" }, 400);
  }

  const { name } = await c.req.json<{ name?: string }>();
  const trimmed = name?.trim();
  if (!trimmed) {
    return c.json({ error: "Enter a category name" }, 400);
  }

  const duplicate = await c.env.DB.prepare("SELECT id FROM time_categories WHERE name = ? AND id != ?")
    .bind(trimmed, id)
    .first();
  if (duplicate) {
    return c.json({ error: "That category already exists" }, 400);
  }

  // A rename is the whole point of the foreign-key model: this one row is
  // the only thing that changes — every time entry already tagged with
  // this category picks up the new name automatically via the join.
  const updated = await c.env.DB.prepare(
    "UPDATE time_categories SET name = ? WHERE id = ? RETURNING id, name, sort_order",
  )
    .bind(trimmed, id)
    .first<CategoryRow>();

  if (!updated) {
    return c.json({ error: "Category not found" }, 404);
  }

  return c.json(toCategory(updated));
});

timeCategories.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid category id" }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM time_categories WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: "Category not found" }, 404);
  }

  const body = await c.req
    .json<{ reassignToId?: number | null }>()
    .catch(() => ({}) as { reassignToId?: number | null });
  const reassignToId = body.reassignToId ?? null;

  if (reassignToId !== null) {
    if (reassignToId === id) {
      return c.json({ error: "Can't reassign a category's time entries to itself" }, 400);
    }
    const target = await c.env.DB.prepare("SELECT id FROM time_categories WHERE id = ?").bind(reassignToId).first();
    if (!target) {
      return c.json({ error: "Reassignment category not found" }, 400);
    }
  }

  // Every time entry tagged with the category being removed is moved to
  // the replacement category (or made uncategorised) before the category
  // itself is deleted — an explicit choice, not a silent default.
  await c.env.DB.prepare("UPDATE time_entries SET category_id = ? WHERE category_id = ?")
    .bind(reassignToId, id)
    .run();

  await c.env.DB.prepare("DELETE FROM time_categories WHERE id = ?").bind(id).run();

  return c.json({ ok: true });
});

export default timeCategories;
