import { Hono } from "hono";
import { cors } from "hono/cors";
import accountSettings from "./routes/accountSettings";
import auth from "./routes/auth";
import clientCategories from "./routes/clientCategories";
import clientNotes from "./routes/clientNotes";
import clients from "./routes/clients";
import dataExport from "./routes/export";
import expenseCategories from "./routes/expenseCategories";
import expenses from "./routes/expenses";
import firms from "./routes/firms";
import hourlyRates from "./routes/hourlyRates";
import invoiceBatches from "./routes/invoiceBatches";
import invoiceSettings from "./routes/invoiceSettings";
import invoices from "./routes/invoices";
import noteCategories from "./routes/noteCategories";
import taxYearSettings from "./routes/taxYearSettings";
import timeCategories from "./routes/timeCategories";
import timeEntries from "./routes/timeEntries";
import timeSettings from "./routes/timeSettings";
import usage from "./routes/usage";

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
  // Both optional: unset in local dev, where usage tracking just reports
  // itself as not configured rather than failing the whole app.
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
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
app.route("/api/account-settings", accountSettings);
app.route("/api/client-categories", clientCategories);
app.route("/api/client-notes", clientNotes);
app.route("/api/clients", clients);
app.route("/api/export", dataExport);
app.route("/api/expenses", expenses);
app.route("/api/expense-categories", expenseCategories);
app.route("/api/firms", firms);
app.route("/api/hourly-rates", hourlyRates);
app.route("/api/invoices", invoices);
app.route("/api/invoice-batches", invoiceBatches);
app.route("/api/invoice-settings", invoiceSettings);
app.route("/api/note-categories", noteCategories);
app.route("/api/tax-year-settings", taxYearSettings);
app.route("/api/time-categories", timeCategories);
app.route("/api/time-entries", timeEntries);
app.route("/api/time-settings", timeSettings);
app.route("/api/usage", usage);

export default app;
