import { describe, expect, it } from "vitest";
import { createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  return `session=${token}`;
}

interface FakeRow {
  from_name: string;
  from_email: string;
  from_address: string;
  from_postcode: string;
  from_phone: string;
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
  reference_prefix: string;
  next_reference_number: number;
}

const BLANK_ROW: FakeRow = {
  from_name: "",
  from_email: "",
  from_address: "",
  from_postcode: "",
  from_phone: "",
  bank_account_name: "",
  bank_sort_code: "",
  bank_account_number: "",
  reference_prefix: "AMILLS",
  next_reference_number: 1,
};

function fakeEnv(options: { row?: FakeRow } = {}): Env {
  let storedRow = options.row ?? BLANK_ROW;

  return {
    SESSION_SECRET: SECRET,
    DB: {
      prepare: () => {
        let boundArgs: unknown[] = [];
        const statement = {
          bind: (...args: unknown[]) => {
            boundArgs = args;
            return statement;
          },
          first: async <T>() => storedRow as T,
          run: async () => {
            const [
              fromName,
              fromEmail,
              fromAddress,
              fromPostcode,
              fromPhone,
              bankAccountName,
              bankSortCode,
              bankAccountNumber,
              referencePrefix,
              nextReferenceNumber,
            ] = boundArgs as [string, string, string, string, string, string, string, string, string, number];
            storedRow = {
              from_name: fromName,
              from_email: fromEmail,
              from_address: fromAddress,
              from_postcode: fromPostcode,
              from_phone: fromPhone,
              bank_account_name: bankAccountName,
              bank_sort_code: bankSortCode,
              bank_account_number: bankAccountNumber,
              reference_prefix: referencePrefix,
              next_reference_number: nextReferenceNumber,
            };
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/invoice-settings", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/invoice-settings", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns the current settings", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/invoice-settings", { headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.referencePrefix).toBe("AMILLS");
    expect(body.nextReferenceNumber).toBe(1);
  });
});

describe("PUT /api/invoice-settings", () => {
  it("rejects a missing reference prefix", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-settings",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ referencePrefix: "", nextReferenceNumber: 63 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a next reference number below 1", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-settings",
      { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ referencePrefix: "AMILLS", nextReferenceNumber: 0 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("saves the admin-editable sequence number and contact details", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/invoice-settings",
      {
        method: "PUT",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          fromName: "Anita Mills",
          fromEmail: "anitacmills@gmail.com",
          fromAddress: "73B Harestone Hill, Caterham",
          fromPostcode: "CR3 6DX",
          fromPhone: "07702814729",
          bankAccountName: "Anita Mills",
          bankSortCode: "20 53 33",
          bankAccountNumber: "70487767",
          referencePrefix: "AMILLS",
          nextReferenceNumber: 63,
        }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fromName).toBe("Anita Mills");
    expect(body.nextReferenceNumber).toBe(63);
  });
});
