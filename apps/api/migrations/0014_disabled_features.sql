-- Lets the admin hide whole dashboard tiles (Time Keeping, Tax & NI
-- Estimate, etc.) rather than just their categories — a JSON array of
-- DashboardTile keys on the same singleton row as the invite code,
-- since it's an account-wide preference, not a per-user one.
ALTER TABLE account_settings ADD COLUMN disabled_features TEXT NOT NULL DEFAULT '[]';
