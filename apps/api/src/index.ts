import { Hono } from "hono";
import auth from "./routes/auth";

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
}

export type AppEnv = { Bindings: Env; Variables: { userId: number } };

const app = new Hono<AppEnv>();

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api", auth);

app.get("/api/clients", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, name FROM clients ORDER BY name").all();
  return c.json(results);
});

export default app;
