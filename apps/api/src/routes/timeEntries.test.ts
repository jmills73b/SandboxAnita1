import { describe, expect, it } from "vitest";
import { createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

async function sessionCookie(): Promise<string> {
  return `session=${await createSessionToken({ userId: 1, exp: Math.floor(Date.now() / 1000) + 60 }, SECRET)}`;
}

interface StoredEntry {
  id: number;
  client_id: number;
  matter: string | null;
  date: string;
  units: number;
  minutes: number;
  description: string;
  category_id: number | null;
  rate_at_entry: number | null;
}

interface StoredRate {
  rate: number;
  start_date: string;
  end_date: string | null;
}

function fakeEnv(
  options: {
    clients?: Map<number, string>;
    categories?: Map<number, string>;
    unitMinutes?: number;
    rates?: StoredRate[];
    entries?: StoredEntry[];
    deleteChanges?: number;
  } = {},
): Env {
  const clients = options.clients ?? new Map([[1, "Test Client"]]);
  const categories = options.categories ?? new Map([[1, "Drafting"]]);
  const unitMinutes = options.unitMinutes ?? 8;
  const rates = options.rates ?? [];
  const entryStore = new Map<number, StoredEntry>((options.entries ?? []).map((e) => [e.id, e]));
  const deleteChanges = options.deleteChanges ?? 1;
  let nextId = Math.max(0, ...[...entryStore.keys()]) + 1;

  function withJoins(row: StoredEntry) {
    return {
      id: row.id,
      client_id: row.client_id,
      client_name: clients.get(row.client_id) ?? "Unknown",
      matter: row.matter,
      date: row.date,
      units: row.units,
      minutes: row.minutes,
      description: row.description,
      category_id: row.category_id,
      category_name: row.category_id !== null ? (categories.get(row.category_id) ?? null) : null,
      rate_at_entry: row.rate_at_entry,
    };
  }

  function rateOnDate(date: string): number | null {
    const candidates = rates
      .filter((r) => r.start_date <= date && (r.end_date === null || r.end_date >= date))
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    return candidates[0]?.rate ?? null;
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
            if (sql.includes("SELECT unit_minutes FROM time_settings")) {
              return { unit_minutes: unitMinutes } as T;
            }
            if (sql.includes("SELECT rate FROM hourly_rates")) {
              const [date] = boundArgs as [string];
              const rate = rateOnDate(date);
              return (rate !== null ? { rate } : null) as T;
            }
            if (sql.includes("SELECT id FROM time_categories WHERE id = ?")) {
              const [id] = boundArgs as [number];
              return (categories.has(id) ? { id } : null) as T;
            }
            if (sql.includes("INSERT INTO time_entries")) {
              const [clientId, matter, date, units, minutes, description, categoryId, rate] = boundArgs as [
                number,
                string | null,
                string,
                number,
                number,
                string,
                number | null,
                number | null,
              ];
              const id = nextId++;
              entryStore.set(id, {
                id,
                client_id: clientId,
                matter,
                date,
                units,
                minutes,
                description,
                category_id: categoryId,
                rate_at_entry: rate,
              });
              return { id } as T;
            }
            if (sql.includes("WHERE time_entries.id = ?")) {
              const [id] = boundArgs as [number];
              const row = entryStore.get(id);
              return (row ? withJoins(row) : null) as T;
            }
            return null;
          },
          all: async <T,>() => {
            const rows = [...entryStore.values()]
              .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
              .map(withJoins);
            return { results: rows as T[], success: true, meta: {} };
          },
          run: async () => {
            if (sql.includes("UPDATE time_entries") && sql.includes("SET client_id")) {
              const [clientId, matter, date, units, minutes, description, categoryId, rate, id] = boundArgs as [
                number,
                string | null,
                string,
                number,
                number,
                string,
                number | null,
                number | null,
                number,
              ];
              const existing = entryStore.get(id);
              if (existing) {
                entryStore.set(id, {
                  ...existing,
                  client_id: clientId,
                  matter,
                  date,
                  units,
                  minutes,
                  description,
                  category_id: categoryId,
                  rate_at_entry: rate,
                });
              }
            }
            if (sql.includes("DELETE FROM time_entries")) {
              const [id] = boundArgs as [number];
              entryStore.delete(id);
            }
            return { success: true, meta: { changes: deleteChanges } };
          },
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("GET /api/time-entries", () => {
  it("rejects a request with no session", async () => {
    const res = await app.request("/api/time-entries", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("lists entries with the client and category name, and a computed fee", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries",
      { headers: { Cookie: cookie } },
      fakeEnv({
        entries: [
          {
            id: 1,
            client_id: 1,
            matter: "Financial Remedy",
            date: "2026-05-01",
            units: 15,
            minutes: 120,
            description: "Drafted position statement",
            category_id: 1,
            rate_at_entry: 150,
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      {
        id: 1,
        clientId: 1,
        clientName: "Test Client",
        matter: "Financial Remedy",
        date: "2026-05-01",
        units: 15,
        minutes: 120,
        description: "Drafted position statement",
        categoryId: 1,
        category: "Drafting",
        rateAtEntry: 150,
        feeValue: 300, // 120 minutes = 2 hours * £150/hr
      },
    ]);
  });

  it("shows a null fee when no rate was in effect on the entry's date", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries",
      { headers: { Cookie: cookie } },
      fakeEnv({
        entries: [
          {
            id: 1,
            client_id: 1,
            matter: null,
            date: "2020-01-01",
            units: 1,
            minutes: 8,
            description: "Call",
            category_id: null,
            rate_at_entry: null,
          },
        ],
      }),
    );
    expect((await res.json())[0].feeValue).toBeNull();
  });
});

describe("POST /api/time-entries", () => {
  it("rejects a missing description", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-05-01", clientId: 1, units: 1 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a non-positive number of units", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-05-01", clientId: 1, units: 0, description: "Call" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a fractional number of units", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-05-01", clientId: 1, units: 1.5, description: "Call" }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects an invalid category", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-05-01", clientId: 1, units: 1, description: "Call", categoryId: 99 }),
      },
      fakeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it("computes minutes from the current unit size and snapshots the rate in effect on the entry's date", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries",
      {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ date: "2026-05-01", clientId: 1, units: 5, description: "Drafting", categoryId: 1 }),
      },
      fakeEnv({ unitMinutes: 8, rates: [{ rate: 175, start_date: "2026-04-06", end_date: null }] }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.units).toBe(5);
    expect(body.minutes).toBe(40); // 5 units * 8 minutes
    expect(body.rateAtEntry).toBe(175);
    expect(body.feeValue).toBeCloseTo((40 / 60) * 175, 2);
  });
});

describe("PATCH /api/time-entries/:id", () => {
  it("404s when the entry doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries/99",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ description: "Updated" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it("recomputes minutes when units change, using the current unit size", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ units: 10 }) },
      fakeEnv({
        unitMinutes: 6,
        entries: [
          {
            id: 1,
            client_id: 1,
            matter: null,
            date: "2026-05-01",
            units: 5,
            minutes: 40,
            description: "Drafting",
            category_id: null,
            rate_at_entry: 150,
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.units).toBe(10);
    expect(body.minutes).toBe(60); // 10 units * 6 minutes
  });

  it("recomputes the rate snapshot when the date changes", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries/1",
      { method: "PATCH", headers: { Cookie: cookie }, body: JSON.stringify({ date: "2026-06-01" }) },
      fakeEnv({
        rates: [
          { rate: 150, start_date: "2025-04-06", end_date: "2026-04-05" },
          { rate: 180, start_date: "2026-04-06", end_date: null },
        ],
        entries: [
          {
            id: 1,
            client_id: 1,
            matter: null,
            date: "2026-01-01",
            units: 5,
            minutes: 40,
            description: "Drafting",
            category_id: null,
            rate_at_entry: 150,
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).rateAtEntry).toBe(180);
  });
});

describe("DELETE /api/time-entries/:id", () => {
  it("404s when the entry doesn't exist", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries/99",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({ deleteChanges: 0 }),
    );
    expect(res.status).toBe(404);
  });

  it("deletes an existing entry", async () => {
    const cookie = await sessionCookie();
    const res = await app.request(
      "/api/time-entries/1",
      { method: "DELETE", headers: { Cookie: cookie } },
      fakeEnv({
        entries: [
          {
            id: 1,
            client_id: 1,
            matter: null,
            date: "2026-05-01",
            units: 1,
            minutes: 8,
            description: "Call",
            category_id: null,
            rate_at_entry: null,
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
