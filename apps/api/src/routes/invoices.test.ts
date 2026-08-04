import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
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
  options: { listRows?: unknown[]; clientName?: string; firmId?: number | null } = {},
): Env {
  const listRows = options.listRows ?? [];
  const clientName = options.clientName ?? "Smith";
  const firmId = options.firmId === undefined ? 1 : options.firmId;

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
            if (sql.includes("FROM intermediary_firms")) {
              return (firmId === null ? null : { id: firmId }) as T;
            }
            if (sql.includes("INSERT INTO invoices")) {
              const [clientId, , invoiceDate, totalAmount, anitaIncome, reference] = boundArgs;
              return {
                id: 1,
                client_id: clientId,
                invoice_date: invoiceDate,
                total_amount: totalAmount,
                anita_income: anitaIncome,
                status: "In progress",
                reference: reference ?? null,
                date_settled_client: null,
                date_settled_firm: null,
              } as T;
            }
            if (sql.includes("SELECT name FROM clients")) return { name: clientName } as T;
            return null;
          },
          all: async <T,>() => ({ results: listRows as T[], success: true, meta: {} }),
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
});
