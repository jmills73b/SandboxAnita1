import { Hono, type Context, type Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "@acm-caseflow/core";
import type { AppEnv } from "../index";

const SESSION_COOKIE = "session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7; // 7 days
const MIN_PASSWORD_LENGTH = 8;

const auth = new Hono<AppEnv>();

// GET, not requireAuth-protected: the frontend needs to ask this before
// anyone can possibly be signed in yet. Reveals only whether an account
// exists, nothing else.
auth.get("/setup/status", async (c) => {
  const existing = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{
    count: number;
  }>();
  return c.json({ completed: (existing?.count ?? 0) > 0 });
});

auth.post("/setup", async (c) => {
  const { email, password, fullName } = await c.req.json<{
    email?: string;
    password?: string;
    fullName?: string;
  }>();
  if (!email || !password || !fullName) {
    return c.json({ error: "Email, password and full name are required" }, 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, 400);
  }

  // Only ever creates the first account — the bootstrap problem means it
  // can't require an invite code (nobody exists yet to have set one).
  // Every account after this one goes through /register instead, which
  // does require one.
  const existing = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{
    count: number;
  }>();
  if (existing && existing.count > 0) {
    return c.json({ error: "Setup has already been completed" }, 403);
  }

  const passwordHash = await hashPassword(password);
  const created = await c.env.DB.prepare(
    "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?) RETURNING id, email, full_name",
  )
    .bind(email, passwordHash, fullName)
    .first<{ id: number; email: string; full_name: string | null }>();

  if (!created) {
    return c.json({ error: "Could not create the account" }, 500);
  }

  // Signed straight in — no separate login step after creating the one
  // account this app will ever have.
  await issueSession(c, created.id);
  return c.json({ email: created.email, fullName: created.full_name }, 201);
});

// Open to anyone, unlike every other route here — there's no session yet
// to require. The invite code is what stands in for auth at this point:
// it's set by an existing signed-in user (see accountSettings.ts) and
// checked against the stored value below, so this can't be used to create
// an account without it, even though the endpoint itself is public.
auth.post("/register", async (c) => {
  const { email, password, inviteCode, fullName } = await c.req.json<{
    email?: string;
    password?: string;
    inviteCode?: string;
    fullName?: string;
  }>();
  if (!email || !password || !inviteCode || !fullName) {
    return c.json({ error: "Email, password, full name and invite code are required" }, 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, 400);
  }

  const settings = await c.env.DB.prepare("SELECT invite_code FROM account_settings WHERE id = 1").first<{
    invite_code: string;
  }>();
  if (!settings?.invite_code || inviteCode !== settings.invite_code) {
    return c.json({ error: "Invalid invite code" }, 403);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return c.json({ error: "That email is already registered — try signing in instead" }, 400);
  }

  const passwordHash = await hashPassword(password);
  const created = await c.env.DB.prepare(
    "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?) RETURNING id, email, full_name",
  )
    .bind(email, passwordHash, fullName)
    .first<{ id: number; email: string; full_name: string | null }>();

  if (!created) {
    return c.json({ error: "Could not create the account" }, 500);
  }

  await issueSession(c, created.id);
  return c.json({ email: created.email, fullName: created.full_name }, 201);
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();
  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash, full_name FROM users WHERE email = ?",
  )
    .bind(email)
    .first<{ id: number; email: string; password_hash: string; full_name: string | null }>();

  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !valid) {
    // Deliberately the same message either way — don't reveal whether the
    // email exists.
    return c.json({ error: "Invalid email or password" }, 401);
  }

  await issueSession(c, user.id);
  return c.json({ email: user.email, fullName: user.full_name });
});

auth.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const user = await c.env.DB.prepare("SELECT email, full_name FROM users WHERE id = ?")
    .bind(userId)
    .first<{ email: string; full_name: string | null }>();
  if (!user) return c.json({ error: "Not signed in" }, 401);
  return c.json({ email: user.email, fullName: user.full_name });
});

// Lets an already-registered user set or change their own display name —
// the only way for an account created before this column existed to get
// one, since /setup and /register only ever run once per account.
auth.patch("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { fullName } = await c.req.json<{ fullName?: string }>();
  if (!fullName || !fullName.trim()) {
    return c.json({ error: "Full name is required" }, 400);
  }

  const updated = await c.env.DB.prepare(
    "UPDATE users SET full_name = ? WHERE id = ? RETURNING email, full_name",
  )
    .bind(fullName.trim(), userId)
    .first<{ email: string; full_name: string | null }>();
  if (!updated) return c.json({ error: "Not signed in" }, 401);
  return c.json({ email: updated.email, fullName: updated.full_name });
});

auth.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: true, sameSite: "Lax" });
  return c.json({ ok: true });
});

async function issueSession(c: Context<AppEnv>, userId: number) {
  const token = await createSessionToken(
    { userId, exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS },
    c.env.SESSION_SECRET,
  );
  // SameSite=Lax, not None: the browser only ever talks to the Pages
  // domain (see apps/web/functions/api/[[path]].ts, which proxies to this
  // Worker server-side), so this cookie is first-party from the browser's
  // point of view. None was needed only when the browser called this
  // Worker's own domain directly, cross-site -- and Safari's cross-site
  // tracking prevention made that unreliable in practice.
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  });
}

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, SESSION_COOKIE);
  const payload = token ? await verifySessionToken(token, c.env.SESSION_SECRET) : null;
  if (!payload) {
    return c.json({ error: "Not signed in" }, 401);
  }
  c.set("userId", payload.userId);
  await next();
}

export default auth;
