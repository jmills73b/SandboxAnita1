import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import clients from "./routes/clients";
import firms from "./routes/firms";
import invoiceBatches from "./routes/invoiceBatches";
import invoiceSettings from "./routes/invoiceSettings";
import invoices from "./routes/invoices";
import taxYearSettings from "./routes/taxYearSettings";

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
}

export type AppEnv = { Bindings: Env; Variables: { userId: number } };

const app = new Hono<AppEnv>();

// The frontend (Pages) and this API (Workers) are on different domains, so
// every /api/* request is cross-origin. Named explicitly rather than "*"
// because credentials (the session cookie) require a specific origin.
app.use(
  "/api/*",
  cors({
    origin: ["https://anita-invoice-tracker.pages.dev", "http://localhost:5173"],
    credentials: true,
  }),
);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api", auth);
app.route("/api/clients", clients);
app.route("/api/firms", firms);
app.route("/api/invoices", invoices);
app.route("/api/invoice-batches", invoiceBatches);
app.route("/api/invoice-settings", invoiceSettings);
app.route("/api/tax-year-settings", taxYearSettings);

export default app;
