import { describe, expect, it } from "vitest";
import { createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken(
    { userId: 1, exp: Math.floor(Date.now() / 1000) + 60 },
    SECRET,
  );
  return `session=${token}`;
}

// Same hand-written D1 stand-in approach as the other route tests. This one
// covers three distinct statements per POST (firm lookup, invoice insert,
// client name lookup), branched on a snippet of the SQL text.
function fakeEnv(
  options: {
    listRows?: unknown[];
    clientName?: string;
    firmId?: number | null;
    existingInvoice?: Record<string, unknown> | null;
    deleteChanges?: number;
    // tax year label (e.g. "2026/27") -> configured split percentage,
    // for exercising splitPercentageFor's per-year lookup.
    taxYearSplits?: Record<string, number>;
  } = {},
): Env {
  const listRows = options.listRows ?? [];
  const clientName = options.clientName ?? "Smith";
  const firmId = options.firmId === undefined ? 1 : options.firmId;
  const existingInvoice = options.existingInvoice;
  const deleteChanges = options.deleteChanges ?? 1;
  const taxYearSplits = options.taxYearSplits ?? {};

  return {
    SESSION_SECRET: SECRET,
    DB: {
      prepare: (sql: string) => {
        let boundArgs: unknown[] = [];
        const statement = {
          bind: (...args: unknown[]) => {
            boundArgs = args;
            return statement;
          },
          first: async <T,>() => {
            if (sql.includes("SELECT split_percentage FROM tax_year_settings")) {
              const [taxYear] = boundArgs as [string];
              return (taxYear in taxYearSplits ? { split_percentage: taxYearSplits[taxYear] } : null) as T;
            }
            if (sql.includes("FROM intermediary_firms")) {
              return (firmId === null ? null : { id: firmId }) as T;
            }
            if (sql.includes("INSERT INTO invoices")) {
              const [clientId, , invoiceDate, totalAmount, anitaIncome, reference, matter] = boundArgs;
              return {
                id: 1,
                client_id: clientId,
                invoice_date: invoiceDate,
                total_amount: totalAmount,
                anita_income: anitaIncome,
                status: "In progress",
                reference: reference ?? null,
                matter: matter ?? null,
                batch_id: null,
                date_settled_client: null,
                date_settled_firm: null,
              } as T;
            }
            if (sql.startsWith("SELECT id, invoice_date")) {
              return (existingInvoice ?? null) as T;
            }
            if (sql.includes("UPDATE invoices")) {
              const [
                clientId,
                invoiceDate,
                totalAmount,
                anitaIncome,
                reference,
                matter,
                status,
                dateSettledClient,
                dateSettledFirm,
                id,
              ] = boundArgs;
              return {
                id,
                client_id: clientId,
                invoice_date: invoiceDate,
                total_amount: totalAmount,
                anita_income: anitaIncome,
                reference,
                matter,
                batch_id: null,
                status,
                date_settled_client: dateSettledClient,
                date_settled_firm: dateSettledFirm,
              } as T;
            }
            if (sql.includes("SELECT name FROM clients")) return { name: clientName } as T;
            return null;
          },
          all: async <T,>() => ({ results: listRows as T[], success: true, meta: {} }),
          run: async () => ({ success: true, meta: { changes: deleteChanges } }),
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/invoices", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/invoices", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns the ledger with lag days computed", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices",
      { headers: { Cookie: cookie } },
      fakeEnv({
        listRows: [
          {
            id: 1,
            invoice_date: "2026-04-01",
            client_id: 1,
            client_name: "Smith",
            total_amount: 1000,
            anita_income: 750,
            status: "Complete",
            reference: null,
            date_settled_client: "2026-04-05",
            date_settled_firm: "2026-04-15",
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        id: 1,
        invoiceDate: "2026-04-01",
        clientId: 1,
        clientName: "Smith",
        totalAmount: 1000,
        anitaIncome: 750,
        status: "Complete",
        reference: null,
        dateSettledClient: "2026-04-05",
        dateSettledFirm: "2026-04-15",
        lagDays: 14,
      },
    ]);
  });

  it("leaves lagDays null for an invoice not yet settled by the firm", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices",
      { headers: { Cookie: cookie } },
      fakeEnv({
        listRows: [
          {
            id: 2,
            invoice_date: "2026-04-01",
            client_id: 1,
            client_name: "Smith",
            total_amount: 500,
            anita_income: 375,
            status: "In progress",
            reference: null,
            date_settled_client: null,
            date_settled_firm: null,
          },
        ],
      }),
    );
    const [invoice] = await res.json();
    expect(invoice.lagDays).toBeNull();
  });
});

describe("POST /api/invoices", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request(
      "/api/invoices",
      { method: "POST", body: JSON.stringify({ invoiceDate: "2026-04-01", clientId: 1, totalAmount: 100 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a missing field", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ clientId: 1, totalAmount: 100 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a £0 amount", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ invoiceDate: "2026-04-01", clientId: 1, totalAmount: 0 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates an invoice with the income split calculated automatically", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ invoiceDate: "2026-04-01", clientId: 1, totalAmount: 1000 }),
      },
      fakeEnv({ clientName: "Smith" }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.anitaIncome).toBeCloseTo(750, 2);
    expect(body.clientName).toBe("Smith");
    expect(body.status).toBe("In progress");
  });

  it("uses the split percentage configured for the invoice's own tax year", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ invoiceDate: "2026-05-01", clientId: 1, totalAmount: 1000 }),
      },
      fakeEnv({ taxYearSplits: { "2026/27": 0.6 } }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).anitaIncome).toBeCloseTo(600, 2);
  });

  it("falls back to the default split when the invoice's tax year has no configured split", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ invoiceDate: "2025-05-01", clientId: 1, totalAmount: 1000 }),
      },
      fakeEnv({ taxYearSplits: { "2026/27": 0.6 } }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).anitaIncome).toBeCloseTo(750, 2);
  });
});

const EXISTING_INVOICE = {
  id: 1,
  invoice_date: "2026-04-01",
  client_id: 1,
  total_amount: 1000,
  anita_income: 750,
  status: "In progress",
  reference: null,
  matter: null,
  batch_id: null,
  date_settled_client: null,
  date_settled_firm: null,
};

describe("PATCH /api/invoices/:id", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", body: JSON.stringify({ status: "Complete" }) },
      fakeEnv({ existingInvoice: EXISTING_INVOICE }),
    );
    expect(res.status).toBe(401);
  });

  it("404s for an invoice that doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/999",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "Complete" }) },
      fakeEnv({ existingInvoice: null }),
    );
    expect(res.status).toBe(404);
  });

  it("rejects an invalid status", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "Cancelled" }) },
      fakeEnv({ existingInvoice: EXISTING_INVOICE }),
    );
    expect(res.status).toBe(400);
  });

  it("stamps date_settled_client on reaching Paid to Newmans", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      {
        method: "PATCH",
        headers: { Cookie: cookie },
        body: JSON.stringify({ status: "Paid to Newmans" }),
      },
      fakeEnv({ existingInvoice: EXISTING_INVOICE, clientName: "Smith" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("Paid to Newmans");
    expect(body.dateSettledClient).toBeTruthy();
    expect(body.dateSettledFirm).toBeNull();
  });

  it("stamps date_settled_firm on reaching Complete", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "Complete" }) },
      fakeEnv({
        existingInvoice: { ...EXISTING_INVOICE, status: "Paid to Newmans", date_settled_client: "2026-04-05" },
        clientName: "Smith",
      }),
    );
    const body = await res.json();
    expect(body.dateSettledClient).toBe("2026-04-05");
    expect(body.dateSettledFirm).toBeTruthy();
  });

  it("clears settlement dates when moving status back", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "In progress" }) },
      fakeEnv({
        existingInvoice: {
          ...EXISTING_INVOICE,
          status: "Complete",
          date_settled_client: "2026-04-05",
          date_settled_firm: "2026-04-15",
        },
        clientName: "Smith",
      }),
    );
    const body = await res.json();
    expect(body.dateSettledClient).toBeNull();
    expect(body.dateSettledFirm).toBeNull();
  });

  it("rejects a £0 amount", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ totalAmount: 0 }) },
      fakeEnv({ existingInvoice: EXISTING_INVOICE }),
    );
    expect(res.status).toBe(400);
  });

  it("recalculates anitaIncome when the amount changes", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ totalAmount: 2000 }) },
      fakeEnv({ existingInvoice: EXISTING_INVOICE, clientName: "Smith" }),
    );
    const body = await res.json();
    expect(body.anitaIncome).toBeCloseTo(1500, 2);
  });

  it("recalculates using the split configured for the invoice's own tax year (2026-04-01 falls in 2025/26, before the 6 April cutoff)", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ totalAmount: 2000 }) },
      fakeEnv({
        existingInvoice: EXISTING_INVOICE,
        clientName: "Smith",
        taxYearSplits: { "2025/26": 0.5 },
      }),
    );
    const body = await res.json();
    expect(body.anitaIncome).toBeCloseTo(1000, 2);
  });

  it("does not recalculate anitaIncome (or look up a split) when the amount isn't changing", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ status: "Complete" }) },
      fakeEnv({
        existingInvoice: EXISTING_INVOICE,
        clientName: "Smith",
        taxYearSplits: { "2025/26": 0.1 },
      }),
    );
    const body = await res.json();
    expect(body.anitaIncome).toBeCloseTo(EXISTING_INVOICE.anita_income, 2);
  });

  it("accepts an explicit settlement date, overriding the automatic today-stamp", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      {
        method: "PATCH",
        headers: { Cookie: cookie },
        body: JSON.stringify({ dateSettledClient: "2026-04-02", dateSettledFirm: "2026-04-09" }),
      },
      fakeEnv({
        existingInvoice: { ...EXISTING_INVOICE, status: "Complete" },
        clientName: "Smith",
      }),
    );
    const body = await res.json();
    expect(body.dateSettledClient).toBe("2026-04-02");
    expect(body.dateSettledFirm).toBe("2026-04-09");
  });

  it("accepts clearing a settlement date explicitly", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      {
        method: "PATCH",
        headers: { Cookie: cookie },
        body: JSON.stringify({ dateSettledFirm: null }),
      },
      fakeEnv({
        existingInvoice: {
          ...EXISTING_INVOICE,
          status: "Complete",
          date_settled_client: "2026-04-05",
          date_settled_firm: "2026-04-15",
        },
        clientName: "Smith",
      }),
    );
    const body = await res.json();
    expect(body.dateSettledClient).toBe("2026-04-05");
    expect(body.dateSettledFirm).toBeNull();
  });
});

describe("DELETE /api/invoices/:id", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/invoices/1", { method: "DELETE" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("deletes an invoice", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/1",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ deleteChanges: 1 }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("404s for an invoice that doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoices/999",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ deleteChanges: 0 }),
    );
    expect(res.status).toBe(404);
  });
});
