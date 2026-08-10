-- Nullable: the existing production account predates this column and can't
-- re-run /setup or /register to backfill it — they set it later via PATCH
-- /api/me instead.
ALTER TABLE users ADD COLUMN full_name TEXT;
