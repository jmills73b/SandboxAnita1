import { describe, expect, it } from "vitest";
import { hashPassword, createSessionToken } from "@acm-caseflow/core";
import app from "../index";
import type { Env } from "../index";

const SECRET = "test-secret";

interface FakeUser {
  id: number;
  email: string;
  password_hash: string;
  full_name?: string | null;
}

// A hand-written stand-in for D1, just capable enough for the handful of
// queries auth.ts actually runs — not a general SQL engine. Route logic is
// what's under test here; the crypto itself is covered in packages/core.
function fakeEnv(
  options: { userCount?: number; user?: FakeUser; inviteCode?: string; existingEmail?: boolean } = {},
): Env {
  const userCount = options.userCount ?? 0;
  const user = options.user ?? null;
  const inviteCode = options.inviteCode ?? "";
  const existingEmail = options.existingEmail ?? false;

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
            if (sql.includes("invite_code")) return { invite_code: inviteCode } as T;
            if (sql.includes("INSERT INTO users")) {
              return { id: 1, email: boundArgs[0], full_name: boundArgs[2] } as T;
            }
            if (sql.includes("UPDATE users SET full_name")) {
              return (user ? { email: user.email, full_name: boundArgs[0] } : null) as T;
            }
            // Register's duplicate-email check (id only) is a different
            // query from login's full lookup — has to be told apart, or a
            // registration test would accidentally exercise login's path.
            if (sql.includes("SELECT id FROM users WHERE email")) {
              return (existingEmail ? { id: 99 } : null) as T;
            }
            if (sql.includes("WHERE email")) return (user as unknown as T) ?? null;
            if (sql.includes("WHERE id")) {
              return (user ? { email: user.email, full_name: user.full_name ?? null } : null) as T;
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
  return {
    id: 1,
    email: "anita@example.com",
    password_hash: await hashPassword(password),
    full_name: "Anita Costs",
  };
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
        body: JSON.stringify({ email: "anita@example.com", password: "correct-password", fullName: "Anita Costs" }),
      },
      fakeEnv({ userCount: 0 }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ email: "anita@example.com", fullName: "Anita Costs" });
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("refuses to create a second account", async () => {
    const res = await app.request(
      "/api/setup",
      {
        method: "POST",
        body: JSON.stringify({ email: "someone@example.com", password: "correct-password", fullName: "Someone" }),
      },
      fakeEnv({ userCount: 1 }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects a missing password", async () => {
    const res = await app.request(
      "/api/setup",
      { method: "POST", body: JSON.stringify({ email: "anita@example.com", fullName: "Anita Costs" }) },
      fakeEnv({ userCount: 0 }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await app.request(
      "/api/setup",
      {
        method: "POST",
        body: JSON.stringify({ email: "anita@example.com", password: "short1", fullName: "Anita Costs" }),
      },
      fakeEnv({ userCount: 0 }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing full name", async () => {
    const res = await app.request(
      "/api/setup",
      { method: "POST", body: JSON.stringify({ email: "anita@example.com", password: "correct-password" }) },
      fakeEnv({ userCount: 0 }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/register", () => {
  it("rejects a missing invite code", async () => {
    const res = await app.request(
      "/api/register",
      {
        method: "POST",
        body: JSON.stringify({ email: "new@example.com", password: "correct-password", fullName: "New Person" }),
      },
      fakeEnv({ inviteCode: "LETMEIN" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing full name", async () => {
    const res = await app.request(
      "/api/register",
      {
        method: "POST",
        body: JSON.stringify({ email: "new@example.com", password: "correct-password", inviteCode: "LETMEIN" }),
      },
      fakeEnv({ inviteCode: "LETMEIN" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await app.request(
      "/api/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: "new@example.com",
          password: "short1",
          inviteCode: "LETMEIN",
          fullName: "New Person",
        }),
      },
      fakeEnv({ inviteCode: "LETMEIN" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects the wrong invite code", async () => {
    const res = await app.request(
      "/api/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: "new@example.com",
          password: "correct-password",
          inviteCode: "WRONG",
          fullName: "New Person",
        }),
      },
      fakeEnv({ inviteCode: "LETMEIN" }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects registration when no invite code has ever been set", async () => {
    const res = await app.request(
      "/api/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: "new@example.com",
          password: "correct-password",
          inviteCode: "anything",
          fullName: "New Person",
        }),
      },
      fakeEnv({ inviteCode: "" }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects an email that's already registered", async () => {
    const res = await app.request(
      "/api/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: "taken@example.com",
          password: "correct-password",
          inviteCode: "LETMEIN",
          fullName: "New Person",
        }),
      },
      fakeEnv({ inviteCode: "LETMEIN", existingEmail: true }),
    );
    expect(res.status).toBe(400);
  });

  it("creates the account and signs in with a valid invite code", async () => {
    const res = await app.request(
      "/api/register",
      {
        method: "POST",
        body: JSON.stringify({
          email: "new@example.com",
          password: "correct-password",
          inviteCode: "LETMEIN",
          fullName: "New Person",
        }),
      },
      fakeEnv({ inviteCode: "LETMEIN" }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ email: "new@example.com", fullName: "New Person" });
    expect(res.headers.get("set-cookie")).toContain("session=");
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
    expect(await res.json()).toEqual({ email: user.email, fullName: user.full_name });
    expect(res.headers.get("set-cookie")).toContain("session=");
    expect(res.headers.get("set-cookie")).toContain("HttpOnly");
  });
});

describe("GET /api/me", () => {
  it("rejects a request with no session cookie", async () => {
    const res = await app.request("/api/me", {}, fakeEnv());
    expect(res.status).toBe(401);
  });

  it("returns the signed-in user's email and full name given a valid session cookie", async () => {
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
    expect(await res.json()).toEqual({ email: user.email, fullName: user.full_name });
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

describe("PATCH /api/me", () => {
  it("rejects a request with no session cookie", async () => {
    const res = await app.request(
      "/api/me",
      { method: "PATCH", body: JSON.stringify({ fullName: "New Name" }) },
      fakeEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a missing full name", async () => {
    const user = await fakeUser("correct-password");
    const token = await createSessionToken(
      { userId: user.id, exp: Math.floor(Date.now() / 1000) + 60 },
      SECRET,
    );
    const res = await app.request(
      "/api/me",
      { method: "PATCH", headers: { Cookie: `session=${token}` }, body: JSON.stringify({}) },
      fakeEnv({ user }),
    );
    expect(res.status).toBe(400);
  });

  it("updates and returns the signed-in user's full name", async () => {
    const user = await fakeUser("correct-password");
    const token = await createSessionToken(
      { userId: user.id, exp: Math.floor(Date.now() / 1000) + 60 },
      SECRET,
    );
    const res = await app.request(
      "/api/me",
      {
        method: "PATCH",
        headers: { Cookie: `session=${token}` },
        body: JSON.stringify({ fullName: "Updated Name" }),
      },
      fakeEnv({ user }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: user.email, fullName: "Updated Name" });
  });
});

describe("POST /api/logout", () => {
  it("clears the session cookie", async () => {
    const res = await app.request("/api/logout", { method: "POST" }, fakeEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=;");
  });
});
