import { describe, expect, it } from "vitest";
import { createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  return `session=${token}`;
}

interface CandidateRow {
  id: number;
  status: string;
  batch_id: number | null;
  total_amount: number;
  anita_income: number;
}

const ELIGIBLE_CANDIDATES: CandidateRow[] = [
  { id: 1, status: "Awaiting payment to Anita", batch_id: null, total_amount: 6156, anita_income: 4617 },
  { id: 2, status: "Awaiting payment to Anita", batch_id: null, total_amount: 570, anita_income: 427.5 },
];

const FIRM = {
  id: 1,
  name: "Newmans",
  contact_email: "sbabar@ranewman.co.uk",
  contact_address: "4 Church Street, Reigate, Surrey",
  contact_postcode: "RH2 0AN",
  contact_phone: "01737 221152",
};

const SETTINGS = {
  from_name: "Anita Mills",
  from_email: "anitacmills@gmail.com",
  from_address: "73B Harestone Hill, Caterham",
  from_postcode: "CR3 6DX",
  from_phone: "07702814729",
  bank_account_name: "Anita Mills",
  bank_sort_code: "20 53 33",
  bank_account_number: "70487767",
  reference_prefix: "AMILLS",
  next_reference_number: 63,
};

// A minimal D1 stand-in that branches on distinguishing SQL substrings, in
// order from most to least specific so overlapping table names don't
// collide (e.g. the batch list and batch detail queries both hit
// invoice_batches, but only one has "WHERE id = ?").
function fakeEnv(
  options: {
    candidates?: CandidateRow[] | null;
    firm?: typeof FIRM | null;
    settings?: typeof SETTINGS | null;
    listRows?: unknown[];
    getRow?: unknown | null;
    lineItems?: unknown[];
  } = {},
): Env {
  const candidates = options.candidates ?? ELIGIBLE_CANDIDATES;
  const firm = options.firm === undefined ? FIRM : options.firm;
  const settings = options.settings === undefined ? SETTINGS : options.settings;
  const listRows = options.listRows ?? [];
  const getRow = options.getRow ?? null;
  const lineItems = options.lineItems ?? [];
  let nextReferenceNumber = settings?.next_reference_number ?? 1;

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
          all: async <T>() => {
            if (sql.includes("FROM invoices WHERE id IN")) {
              return { results: candidates as T[] };
            }
            if (sql.includes("JOIN clients") && sql.includes("batch_id = ?")) {
              return { results: lineItems as T[] };
            }
            if (sql.includes("FROM invoice_batches") && sql.includes("ORDER BY invoice_date DESC")) {
              return { results: listRows as T[] };
            }
            return { results: [] as T[] };
          },
          first: async <T>() => {
            if (sql.includes("FROM intermediary_firms WHERE id = ?")) {
              return firm as T;
            }
            if (sql.includes("FROM invoice_settings WHERE id = 1")) {
              return { ...settings, next_reference_number: nextReferenceNumber } as T;
            }
            if (sql.includes("INSERT INTO invoice_batches")) {
              const reference = `${settings!.reference_prefix}${String(nextReferenceNumber).padStart(4, "0")}`;
              return {
                id: 1,
                reference,
                invoice_date: boundArgs[2],
                total_fee: boundArgs[3],
                total_amount_due: boundArgs[4],
                from_name: boundArgs[5],
                from_email: boundArgs[6],
                from_address: boundArgs[7],
                from_postcode: boundArgs[8],
                from_phone: boundArgs[9],
                bill_name: boundArgs[10],
                bill_email: boundArgs[11],
                bill_address: boundArgs[12],
                bill_postcode: boundArgs[13],
                bill_phone: boundArgs[14],
                bank_account_name: boundArgs[15],
                bank_sort_code: boundArgs[16],
                bank_account_number: boundArgs[17],
                created_at: "2026-08-05 12:00:00",
              } as T;
            }
            if (sql.includes("FROM invoice_batches WHERE id = ?")) {
              return getRow as T;
            }
            return null;
          },
          run: async () => {
            if (sql.includes("UPDATE invoice_settings SET next_reference_number")) {
              nextReferenceNumber = boundArgs[0] as number;
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("POST /api/invoice-batches", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/invoice-batches", { method: "POST" }, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("rejects an empty selection", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ invoiceIds: [], firmId: 1, invoiceDate: "2026-07-13" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects when an invoice in the selection is no longer eligible", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ invoiceIds: [1, 2], firmId: 1, invoiceDate: "2026-07-13" }) },
      fakeEnv({ candidates: [{ ...ELIGIBLE_CANDIDATES[0]!, batch_id: 5 }, ELIGIBLE_CANDIDATES[1]!] }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no longer available/);
  });

  it("rejects when a selected id doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ invoiceIds: [1, 2, 3], firmId: 1, invoiceDate: "2026-07-13" }) },
      fakeEnv({ candidates: ELIGIBLE_CANDIDATES }),
    );
    expect(res.status).toBe(400);
  });

  it("generates a batch invoice with the next reference number, correct totals, and snapshotted details", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ invoiceIds: [1, 2], firmId: 1, invoiceDate: "2026-07-13" }) },
      fakeEnv({
        lineItems: [
          { id: 1, invoice_date: "2026-06-09", reference: "5590", matter: "Financial Remedy", client_name: "Clements", total_amount: 6156, anita_income: 4617 },
          { id: 2, invoice_date: "2026-06-17", reference: "5911", matter: "Consent Order", client_name: "Love", total_amount: 570, anita_income: 427.5 },
        ],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.reference).toBe("AMILLS0063");
    expect(body.totalFee).toBe(6726);
    expect(body.totalAmountDue).toBe(5044.5);
    expect(body.from.name).toBe("Anita Mills");
    expect(body.billTo.name).toBe("Newmans");
    expect(body.bank.sortCode).toBe("20 53 33");
    expect(body.lineItems).toHaveLength(2);
    expect(body.lineItems[0]).toMatchObject({ fileNo: "5590", matter: "Financial Remedy", clientName: "Clements" });
  });

  it("404s when the firm doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ invoiceIds: [1, 2], firmId: 99, invoiceDate: "2026-07-13" }) },
      fakeEnv({ firm: null }),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/invoice-batches", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/invoice-batches", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists batches summary fields", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches",
      { headers: { Cookie: cookie } },
      fakeEnv({
        listRows: [
          {
            id: 1,
            reference: "AMILLS0063",
            invoice_date: "2026-07-13",
            total_fee: 6726,
            total_amount_due: 5044.5,
            bill_name: "Newmans",
            created_at: "2026-08-05 12:00:00",
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      {
        id: 1,
        reference: "AMILLS0063",
        invoiceDate: "2026-07-13",
        totalFee: 6726,
        totalAmountDue: 5044.5,
        billToName: "Newmans",
        createdAt: "2026-08-05 12:00:00",
      },
    ]);
  });
});

describe("GET /api/invoice-batches/:id", () => {
  it("404s when the batch doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/invoice-batches/999", { headers: { Cookie: cookie } }, fakeEnv({ getRow: null }));
    expect(res.status).toBe(404);
  });

  it("returns the full detail for regenerating the PDF", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches/1",
      { headers: { Cookie: cookie } },
      fakeEnv({
        getRow: {
          id: 1,
          reference: "AMILLS0063",
          invoice_date: "2026-07-13",
          total_fee: 6726,
          total_amount_due: 5044.5,
          from_name: "Anita Mills",
          from_email: "anitacmills@gmail.com",
          from_address: "73B Harestone Hill, Caterham",
          from_postcode: "CR3 6DX",
          from_phone: "07702814729",
          bill_name: "Newmans",
          bill_email: "sbabar@ranewman.co.uk",
          bill_address: "4 Church Street, Reigate, Surrey",
          bill_postcode: "RH2 0AN",
          bill_phone: "01737 221152",
          bank_account_name: "Anita Mills",
          bank_sort_code: "20 53 33",
          bank_account_number: "70487767",
          created_at: "2026-08-05 12:00:00",
        },
        lineItems: [
          { id: 1, invoice_date: "2026-06-09", reference: "5590", matter: "Financial Remedy", client_name: "Clements", total_amount: 6156, anita_income: 4617 },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reference).toBe("AMILLS0063");
    expect(body.lineItems).toHaveLength(1);
  });
});

describe("DELETE /api/invoice-batches/:id", () => {
  it("404s when the batch doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches/999",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ getRow: null }),
    );
    expect(res.status).toBe(404);
  });

  it("deletes the batch and un-bills its line items", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-batches/1",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ getRow: { id: 1, reference: "AMILLS0050" } }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("frees the reference number for reuse when deleting the most recently issued batch", async () => {
    const cookie = await sessionCookie();
    // settings.next_reference_number defaults to 63, so AMILLS0062 was the
    // last one actually issued -- deleting that exact batch should roll
    // the counter back to 62, and the next generated invoice reuses it.
    const env = fakeEnv({ getRow: { id: 1, reference: "AMILLS0062" } });
    const del = await app.request("/api/invoice-batches/1", { method: "DELETE", headers: { Cookie: cookie } }, env);
    expect(del.status).toBe(200);

    const post = await app.request(
      "/api/invoice-batches",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ invoiceIds: [1, 2], firmId: 1, invoiceDate: "2026-07-13" }) },
      env,
    );
    expect(post.status).toBe(201);
    expect((await post.json()).reference).toBe("AMILLS0062");
  });

  it("does not roll back the counter when deleting an earlier, non-most-recent batch", async () => {
    const cookie = await sessionCookie();
    // settings.next_reference_number defaults to 63 (last issued: 62) --
    // deleting a much earlier batch shouldn't touch the counter, so the
    // next generated invoice still continues on from 63.
    const env = fakeEnv({ getRow: { id: 1, reference: "AMILLS0010" } });
    const del = await app.request("/api/invoice-batches/1", { method: "DELETE", headers: { Cookie: cookie } }, env);
    expect(del.status).toBe(200);

    const post = await app.request(
      "/api/invoice-batches",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ invoiceIds: [1, 2], firmId: 1, invoiceDate: "2026-07-13" }) },
      env,
    );
    expect(post.status).toBe(201);
    expect((await post.json()).reference).toBe("AMILLS0063");
  });
});
