import { Hono, type Context, type Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "@sandboxanita1/core";
import type { AppEnv } from "../index";

const SESSION_COOKIE = "session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7; // 7 days

const auth = new Hono<AppEnv>();

auth.post("/setup", async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();
  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  // This only ever creates the first account. Once one exists, it's a
  // permanent 403 — there's no route to add a second user (story 8.1: single
  // account only).
  const existing = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{
    count: number;
  }>();
  if (existing && existing.count > 0) {
    return c.json({ error: "Setup has already been completed" }, 403);
  }

  const passwordHash = await hashPassword(password);
  await c.env.DB.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .bind(email, passwordHash)
    .run();

  return c.json({ email }, 201);
});

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>();
  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash FROM users WHERE email = ?",
  )
    .bind(email)
    .first<{ id: number; email: string; password_hash: string }>();

  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !valid) {
    // Deliberately the same message either way — don't reveal whether the
    // email exists.
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await createSessionToken(
    { userId: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS },
    c.env.SESSION_SECRET,
  );
  // SameSite=None (not Strict) because the frontend (Pages) and this API
  // (Workers) are on different domains — Strict would silently stop the
  // browser sending the cookie back at all. Secure=true is required for
  // None, and everything here is HTTPS-only anyway.
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  });

  return c.json({ email: user.email });
});

auth.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const user = await c.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ email: string }>();
  if (!user) return c.json({ error: "Not signed in" }, 401);
  return c.json({ email: user.email });
});

auth.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: true, sameSite: "None" });
  return c.json({ ok: true });
});

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
