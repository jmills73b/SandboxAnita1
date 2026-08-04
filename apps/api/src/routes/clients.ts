import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const clients = new Hono<AppEnv>();

clients.use("*", requireAuth);

clients.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, first_invoice_date FROM clients ORDER BY name",
  ).all();
  return c.json(results);
});

clients.post("/", async (c) => {
  const { name } = await c.req.json<{ name?: string }>();
  const trimmed = name?.trim();
  if (!trimmed) {
    return c.json({ error: "Client name is required" }, 400);
  }

  const created = await c.env.DB.prepare(
    "INSERT INTO clients (name) VALUES (?) RETURNING id, name, first_invoice_date",
  )
    .bind(trimmed)
    .first<{ id: number; name: string; first_invoice_date: string | null }>();

  return c.json(created, 201);
});

export default clients;
