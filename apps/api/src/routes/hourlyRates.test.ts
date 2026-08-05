import { describe, expect, it } from "vitest";
import { createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

interface StoredRate {
  id: number;
  rate: number;
  start_date: string;
  end_date: string | null;
}

function fakeEnv(options: { rates?: StoredRate[] } = {}): Env {
  const store = [...(options.rates ?? [])];
  let nextId = Math.max(0, ...store.map((r) => r.id)) + 1;

  function latest(): StoredRate | null {
    if (store.length === 0) return null;
    return [...store].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  }

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
            if (sql.includes("ORDER BY start_date DESC LIMIT 1") && sql.includes("SELECT id, start_date")) {
              const l = latest();
              return (l ? { id: l.id, start_date: l.start_date } : null) as T;
            }
            if (sql.includes("INSERT INTO hourly_rates")) {
              const [rate, startDate] = boundArgs as [number, string];
              const row: StoredRate = { id: nextId++, rate, start_date: startDate, end_date: null };
              store.push(row);
              return row as T;
            }
            return null as T;
          },
          all: async <T,>() => {
            const rows = [...store].sort((a, b) => b.start_date.localeCompare(a.start_date));
            return {
              results: rows.map((r) => ({ id: r.id, rate: r.rate, start_date: r.start_date, end_date: r.end_date })) as T[],
              success: true,
              meta: {},
            };
          },
          run: async () => {
            if (sql.includes("UPDATE hourly_rates SET end_date")) {
              const [endDate, id] = boundArgs as [string, number];
              const row = store.find((r) => r.id === id && r.end_date === null);
              if (row) row.end_date = endDate;
            }
            return { success: true, meta: {} };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/hourly-rates", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/hourly-rates", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists rates newest first", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/hourly-rates",
      { headers: { Cookie: cookie } },
      fakeEnv({
        rates: [
          { id: 1, rate: 150, start_date: "2025-04-06", end_date: "2026-04-05" },
          { id: 2, rate: 160, start_date: "2026-04-06", end_date: null },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: 2, rate: 160, startDate: "2026-04-06", endDate: null },
      { id: 1, rate: 150, startDate: "2025-04-06", endDate: "2026-04-05" },
    ]);
  });
});

describe("POST /api/hourly-rates", () => {
  it("rejects a rate of £0 or less", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/hourly-rates",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ rate: 0, startDate: "2026-04-06" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing start date", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/hourly-rates",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ rate: 150 }) },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("creates the first rate with no previous rate to close off", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/hourly-rates",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ rate: 150, startDate: "2025-04-06" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ id: 1, rate: 150, startDate: "2025-04-06", endDate: null });
  });

  it("rejects a start date at or before the most recent rate's start date", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/hourly-rates",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ rate: 160, startDate: "2025-04-06" }) },
      fakeEnv({ rates: [{ id: 1, rate: 150, start_date: "2025-04-06", end_date: null }] }),
    );
    expect(res.status).toBe(400);
  });

  it("closes off the previous open-ended rate the day before the new one starts", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/hourly-rates",
      { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ rate: 160, startDate: "2026-04-06" }) },
      fakeEnv({ rates: [{ id: 1, rate: 150, start_date: "2025-04-06", end_date: null }] }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).rate).toBe(160);

    const listRes = await app.request(
      "/api/hourly-rates",
      { headers: { Cookie: cookie } },
      fakeEnv({
        rates: [
          { id: 1, rate: 150, start_date: "2025-04-06", end_date: "2026-04-05" },
          { id: 2, rate: 160, start_date: "2026-04-06", end_date: null },
        ],
      }),
    );
    const list = await listRes.json();
    expect(list[1].endDate).toBe("2026-04-05");
  });
});
