import { describe, expect, it } from "vitest";
import { hashPassword, createSessionToken } from "@sandboxanita1/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

interface FakeUser {
  id: number;
  email: string;
  password_hash: string;
}

// A hand-written stand-in for D1, just capable enough for the handful of
// queries auth.ts actually runs — not a general SQL engine. Route logic is
// what's under test here; the crypto itself is covered in packages/core.
function fakeEnv(options: { userCount?: number; user?: FakeUser } = {}): Env {
  const userCount = options.userCount ?? 0;
  const user = options.user ?? null;

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
            if (sql.includes("COUNT(*)")) return { count: userCount } as T;
            if (sql.includes("INSERT INTO users")) {
              return { id: 1, email: boundArgs[0] } as T;
            }
            if (sql.includes("WHERE email")) return (user as unknown as T) ?? null;
            if (sql.includes("WHERE id")) {
              return (user ? { email: user.email } : null) as T;
            }
            return null;
          },
          run: async () => ({ success: true, meta: {} }),
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

async function fakeUser(password: string): Promise<FakeUser> {
  return { id: 1, email: "anita@example.com", password_hash: await hashPassword(password) };
}

describe("GET /api/setup/status", () => {
  it("reports not completed when no account exists", async () => {
    const res = await app.request("/api/setup/status", {}, fakeEnv({ userCount: 0 }));
    expect(await res.json()).toEqual({ completed: false });
  });

  it("reports completed once an account exists", async () => {
    const res = await app.request("/api/setup/status", {}, fakeEnv({ userCount: 1 }));
    expect(await res.json()).toEqual({ completed: true });
  });
});

describe("POST /api/setup", () => {
  it("creates the first account, signs in, and returns it", async () => {
    const res = await app.request(
      "/api/setup",
      {
        method: "POST",
        body: JSON.stringify({ email: "anita@example.com", password: "correct-password" }),
      },
      fakeEnv({ userCount: 0 }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ email: "anita@example.com" });
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("refuses to create a second account", async () => {
    const res = await app.request(
      "/api/setup",
      { method: "POST", body: JSON.stringify({ email: "someone@example.com", password: "correct-password" }) },
      fakeEnv({ userCount: 1 }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects a missing password", async () => {
    const res = await app.request(
      "/api/setup",
      { method: "POST", body: JSON.stringify({ email: "anita@example.com" }) },
      fakeEnv({ userCount: 0 }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await app.request(
      "/api/setup",
      { method: "POST", body: JSON.stringify({ email: "anita@example.com", password: "short1" }) },
      fakeEnv({ userCount: 0 }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/login", () => {
  it("rejects an unknown email", async () => {
    const res = await app.request(
      "/api/login",
      { method: "POST", body: JSON.stringify({ email: "nobody@example.com", password: "x" }) },
      fakeEnv({ user: undefined }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects the wrong password", async () => {
    const user = await fakeUser("correct-password");
    const res = await app.request(
      "/api/login",
      { method: "POST", body: JSON.stringify({ email: user.email, password: "wrong" }) },
      fakeEnv({ user }),
    );
    expect(res.status).toBe(401);
  });

  it("signs in with the right password and sets a session cookie", async () => {
    const user = await fakeUser("correct-password");
    const res = await app.request(
      "/api/login",
      { method: "POST", body: JSON.stringify({ email: user.email, password: "correct-password" }) },
      fakeEnv({ user }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=");
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
  });
});

describe("GET /api/me", () => {
  it("rejects a request with no session cookie", async () => {
    const res = await app.request("/api/me", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns the signed-in user's email given a valid session cookie", async () => {
    const user = await fakeUser("correct-password");
    const token = await createSessionToken(
      { userId: user.id, exp: Math.floor(Date.now() / 1000) + 60 },
      SECRET,
    );
    const res = await app.request(
      "/api/me",
      { headers: { Cookie: `session=${token}` } },
      fakeEnv({ user }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: user.email });
  });

  it("rejects an expired session cookie", async () => {
    const user = await fakeUser("correct-password");
    const token = await createSessionToken(
      { userId: user.id, exp: Math.floor(Date.now() / 1000) - 60 },
      SECRET,
    );
    const res = await app.request(
      "/api/me",
      { headers: { Cookie: `session=${token}` } },
      fakeEnv({ user }),
    );
    expect(res.status).toBe(401);
  });
});

describe("POST /api/logout", () => {
  it("clears the session cookie", async () => {
    const res = await app.request("/api/logout", { method: "POST" }, fakeEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=;");
  });
});
