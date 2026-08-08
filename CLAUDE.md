# CLAUDE.md

Operational notes for an AI agent working in this repo. See `CONTRIBUTING.md` for
human-facing process (branching, testing, definition of done), `README.md` for what
the app is, and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it's actually
built — data model, every API route, frontend structure, the design system, auth, and
deployment. Read `docs/ARCHITECTURE.md` before touching a part of the app you haven't
worked in this session; it's more likely to be current than your own memory of a
prior session, since nothing carries over between sessions except what's written down
here.

## Before marking a new top-level feature "done"

This app has grown a set of conventions that apply to every top-level feature/tile,
enforced by nothing but habit — there's no lint rule or type that catches a skipped
one. A new dashboard tile or entity has, historically, needed all of the following.
Check each one explicitly rather than relying on remembering it from a previous
feature — several of these have been missed and only caught when the user pointed
them out.

- **Feature toggle**: if the new thing gets a dashboard tile, add its key to *both*
  `apps/web/src/FeatureManager.tsx`'s `FEATURES` array (checkbox UI) *and*
  `apps/api/src/routes/accountSettings.ts`'s `TOGGLEABLE_FEATURES` array (server-side
  validation on `PUT /api/account-settings/features`). These are two independent
  lists — updating only the frontend one means the toggle 400s the moment someone
  tries to save it. `Dashboard.tsx`'s tile filter is already generic and needs no
  change once both lists have the key. `clients` and `admin` are deliberately never
  toggleable — don't add new tiles to that exclusion without a similarly strong
  reason (foundational data, or the only way to re-enable everything).
- **Export**: if the feature adds a new D1 table, add it to `TABLES` in
  `apps/api/src/routes/export.ts` so account data exports stay complete.
- **Soft delete**: deletes on user-entered records should set `deleted_at`/`deleted_by`
  rather than actually removing the row (and, if there's underlying object storage,
  never remove that either) — with a read-only admin screen listing what's been
  deleted, by whom, and when. See `documents.ts` / the "Deleted documents" admin tab
  for the current reference implementation.
- **Optional bindings**: a new required external dependency (API token, encryption
  key, storage bucket) should be an *optional* field on `Env`, checked for presence
  at the point of use and failing with a clear "X is not configured" 500 — not a
  required field that breaks every existing test's `fakeEnv()` helper. See
  `CF_API_TOKEN`/`CF_ACCOUNT_ID` and `DOCUMENT_ENCRYPTION_KEY` for the pattern.
- **Categories/admin management**: list-type entities (expense categories, time
  categories, document categories, note categories, client categories) get their own
  CRUD route and an admin-manageable list under Admin & Settings, rather than a fixed
  enum baked into the schema.
- **Design consistency**: new UI reuses the existing design tokens and component
  classes from `apps/web/src/styles.css` (see the Design System section of
  `docs/ARCHITECTURE.md`) rather than introducing new colors, fonts, or one-off
  layout classes. In particular: use the `--ink`/`--paper`/`--line` tokens rather than
  hardcoded colors (status/meaning is conveyed by fill/outline weight on `--ink`, not
  new hues), reach for an existing class (`.ledger`, `.edit-panel`, `.row-actions`,
  `.chip-group`, `.status`, etc.) before writing new CSS, and check the result in all
  three themes (Light, Dark, Feel Good) — Feel Good's violet button accent and Dark's
  inverted contrast are both easy to break by hardcoding a color instead of a token.

If a new feature doesn't fit one of these patterns, that's fine — but say so
explicitly (in the PR description or to the user) rather than silently skipping it,
so a deliberate exception doesn't read as a missed one later.
