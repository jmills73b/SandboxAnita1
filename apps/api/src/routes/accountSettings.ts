import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const accountSettings = new Hono<AppEnv>();

// Every route here requires an existing session — the invite code that
// gates registration must never be readable by someone who isn't already
// signed in, or it stops gating anything.
accountSettings.use("*", requireAuth);

accountSettings.get("/", async (c) => {
  const row = await c.env.DB.prepare("SELECT invite_code FROM account_settings WHERE id = 1").first<{
    invite_code: string;
  }>();
  return c.json({ inviteCode: row?.invite_code ?? "" });
});

accountSettings.put("/", async (c) => {
  const { inviteCode } = await c.req.json<{ inviteCode?: string }>();
  const trimmed = inviteCode?.trim();
  if (!trimmed) {
    return c.json({ error: "Enter an invite code" }, 400);
  }

  await c.env.DB.prepare("UPDATE account_settings SET invite_code = ? WHERE id = 1").bind(trimmed).run();

  return c.json({ inviteCode: trimmed });
});

export default accountSettings;
