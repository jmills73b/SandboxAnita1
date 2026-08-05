import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  const token = await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
  return `session=${token}`;
}

interface FirmRow {
  id: number;
  name: string;
  contact_email: string | null;
  contact_address: string | null;
  contact_postcode: string | null;
  contact_phone: string | null;
}

const NEWMANS: FirmRow = {
  id: 1,
  name: "Newmans",
  contact_email: "sbabar@ranewman.co.uk",
  contact_address: null,
  contact_postcode: null,
  contact_phone: null,
};

function fakeEnv(options: { firm?: FirmRow | null; listRows?: FirmRow[] } = {}): Env {
  let storedFirm = options.firm === undefined ? NEWMANS : options.firm;
  const listRows = options.listRows ?? (storedFirm ? [storedFirm] : []);

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
          all: async <T>() => ({ results: listRows as T[] }),
          first: async <T>() => {
            if (sql.includes("UPDATE intermediary_firms")) {
              if (!storedFirm) return null as T;
              const [contactEmail, contactAddress, contactPostcode, contactPhone] = boundArgs as [
                string | null,
                string | null,
                string | null,
                string | null,
              ];
              storedFirm = {
                ...storedFirm,
                contact_email: contactEmail,
                contact_address: contactAddress,
                contact_postcode: contactPostcode,
                contact_phone: contactPhone,
              };
              return storedFirm as T;
            }
            return storedFirm as T;
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/firms", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/firms", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists firms with contact details", async () => {
    const cookie = await sessionCookie();
    const res = await app.request("/api/firms", { headers: { Cookie: cookie } }, fakeEnv());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      { id: 1, name: "Newmans", contactEmail: "sbabar@ranewman.co.uk", contactAddress: null, contactPostcode: null, contactPhone: null },
    ]);
  });
});

describe("PATCH /api/firms/:id", () => {
  it("404s when the firm doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/firms/99",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ contactAddress: "4 Church Street" }) },
      fakeEnv({ firm: null }),
    );
    expect(res.status).toBe(404);
  });

  it("updates the firm's contact details", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/firms/1",
      {
        method: "PATCH",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          contactAddress: "4 Church Street, Reigate, Surrey",
          contactPostcode: "RH2 0AN",
          contactPhone: "01737 221152",
        }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contactAddress).toBe("4 Church Street, Reigate, Surrey");
    expect(body.contactPostcode).toBe("RH2 0AN");
    expect(body.contactPhone).toBe("01737 221152");
    expect(body.contactEmail).toBe("sbabar@ranewman.co.uk");
  });
});
