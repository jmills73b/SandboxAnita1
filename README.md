# Invoice & Performance Tracker

A small web app for Anita's costs-consultancy business, replacing the spreadsheet currently used to log invoices, track income against monthly targets, and estimate UK income tax / National Insurance liability.

## Status

Pre-build. Requirements and the full backlog have been captured:

- **Requirements & user stories (10 epics, 39 stories):** https://claude.ai/code/artifact/47949864-f4bc-4a1c-8cf4-9c72c419eb1f
- **Backlog:** tracked as GitHub Issues in this repo (labelled by epic, increment, and priority) — see the repository's Projects tab for the Kanban board.

## Stack (all free to run)

| Layer | Choice |
|---|---|
| Frontend | Cloudflare Pages |
| API | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| CI | GitHub Actions |
| Auth | Single-user login built into the Worker — no third-party auth product |

Chosen specifically to stay at £0/month indefinitely for a single-user workload, with nothing that sleeps, pauses, or requires a card at this scale.

## Delivery order

Built in seven increments, each one a usable slice that replaces a specific sheet from the original spreadsheet rather than a partial feature waiting on later work to matter. The full table is in the requirements doc linked above.

| # | Increment | Replaces |
|---|---|---|
| 0 | Foundations (CI, hosting, empty app deployed end-to-end) | — |
| 1 | Log invoices | Bills, Existing Clients |
| 2 | See where I stand (history import + targets) | Summary |
| 3 | Full dashboard + expenses | Dashboard, Expenses |
| 4 | Know the tax bill | Tax Liability |
| 5 | Send an invoice | Invoice template |
| 6 | Polish & safety net | — |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching, testing expectations, and the Definition of Done.
