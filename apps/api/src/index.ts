import { Hono } from "hono";

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/clients", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, name FROM clients ORDER BY name").all();
  return c.json(results);
});

export default app;
