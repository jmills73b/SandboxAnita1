import { Hono } from "hono";
import auth from "./routes/auth";
import clients from "./routes/clients";

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
}

export type AppEnv = { Bindings: Env; Variables: { userId: number } };

const app = new Hono<AppEnv>();

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api", auth);
app.route("/api/clients", clients);

export default app;
