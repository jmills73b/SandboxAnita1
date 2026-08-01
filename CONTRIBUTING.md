# Contributing

This is a small, two-person project (one developer, one user) — the practices below are sized for that, not enterprise process for its own sake. They exist because this app calculates real income splits and a real tax estimate, where a silent bug costs more than in most small apps.

## Branching & PRs

- Work happens on a feature branch per story (e.g. `story/1.2-income-split`), never directly on `main`.
- Open a pull request even when working solo — it's the changelog, and the point where CI has to pass before the change lands.
- `main` is protected: a PR can only merge once CI is green.

## Testing

- Any pure calculation touching money, dates, or tax/NI (income split %, tax bands, NI bands, target %, lag time) must have unit tests, including boundary cases (£0 income, exactly on a tax-band edge, a partial month of data).
- One end-to-end test covers the critical path: log in → add an invoice → see it reflected on the dashboard. It is deliberately not meant to grow into full UI coverage — keep it to that one path.
- `.github/workflows/ci.yml` runs lint + tests on every push and pull request. If it isn't green, it doesn't merge.

## Definition of Done

A story is done when, and only when:

1. Code is merged to `main`
2. CI is green (lint + tests)
3. Every acceptance criterion on the story is checked off
4. It's deployed (merging to `main` deploys automatically — see Epic 10 in the requirements doc)

## Commit messages

Plain, descriptive, present tense. No fixed format required for a project this size.
