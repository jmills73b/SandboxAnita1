import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const clientCategories = new Hono<AppEnv>();

clientCategories.use("*", requireAuth);

interface CategoryRow {
  id: number;
  name: string;
  sort_order: number;
}

function toCategory(row: CategoryRow) {
  return { id: row.id, name: row.name };
}

clientCategories.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, sort_order FROM client_categories ORDER BY sort_order, name",
  ).all<CategoryRow>();

  return c.json(results.map(toCategory));
});

clientCategories.post("/", async (c) => {
  const { name } = await c.req.json<{ name?: string }>();
  const trimmed = name?.trim();
  if (!trimmed) {
    return c.json({ error: "Enter a category name" }, 400);
  }

  const duplicate = await c.env.DB.prepare("SELECT id FROM client_categories WHERE name = ?").bind(trimmed).first();
  if (duplicate) {
    return c.json({ error: "That category already exists" }, 400);
  }

  const maxOrder = await c.env.DB.prepare("SELECT MAX(sort_order) as maxOrder FROM client_categories").first<{
    maxOrder: number | null;
  }>();
  const nextOrder = (maxOrder?.maxOrder ?? 0) + 1;

  const created = await c.env.DB.prepare(
    "INSERT INTO client_categories (name, sort_order) VALUES (?, ?) RETURNING id, name, sort_order",
  )
    .bind(trimmed, nextOrder)
    .first<CategoryRow>();

  if (!created) {
    return c.json({ error: "Could not save the category" }, 500);
  }

  return c.json(toCategory(created), 201);
});

clientCategories.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid category id" }, 400);
  }

  const { name } = await c.req.json<{ name?: string }>();
  const trimmed = name?.trim();
  if (!trimmed) {
    return c.json({ error: "Enter a category name" }, 400);
  }

  const duplicate = await c.env.DB.prepare("SELECT id FROM client_categories WHERE name = ? AND id != ?")
    .bind(trimmed, id)
    .first();
  if (duplicate) {
    return c.json({ error: "That category already exists" }, 400);
  }

  const updated = await c.env.DB.prepare(
    "UPDATE client_categories SET name = ? WHERE id = ? RETURNING id, name, sort_order",
  )
    .bind(trimmed, id)
    .first<CategoryRow>();

  if (!updated) {
    return c.json({ error: "Category not found" }, 404);
  }

  return c.json(toCategory(updated));
});

clientCategories.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid category id" }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM client_categories WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: "Category not found" }, 404);
  }

  // Unlike expense/time categories, there's no "must have exactly one"
  // rule here — a client can carry any number of tags, including none —
  // so removing a category just untags whichever clients had it, with no
  // reassignment step needed.
  await c.env.DB.prepare("DELETE FROM client_category_links WHERE category_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM client_categories WHERE id = ?").bind(id).run();

  return c.json({ ok: true });
});

export default clientCategories;
