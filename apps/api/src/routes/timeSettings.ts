import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const timeSettings = new Hono<AppEnv>();

timeSettings.use("*", requireAuth);

timeSettings.get("/", async (c) => {
  const row = await c.env.DB.prepare("SELECT unit_minutes FROM time_settings WHERE id = 1").first<{
    unit_minutes: number;
  }>();
  return c.json({ unitMinutes: row?.unit_minutes ?? 8 });
});

timeSettings.put("/", async (c) => {
  const { unitMinutes } = await c.req.json<{ unitMinutes?: number }>();
  if (typeof unitMinutes !== "number" || !Number.isInteger(unitMinutes) || unitMinutes <= 0) {
    return c.json({ error: "Enter a whole number of minutes greater than 0" }, 400);
  }

  await c.env.DB.prepare("UPDATE time_settings SET unit_minutes = ? WHERE id = 1").bind(unitMinutes).run();

  return c.json({ unitMinutes });
});

export default timeSettings;
