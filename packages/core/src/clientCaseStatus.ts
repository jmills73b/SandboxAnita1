// A client's engagement lifecycle: a lead who hasn't done business yet, a
// matter actively being worked, or one that's wrapped up. Distinct from
// the invoice-billing "new vs existing" rate tier (packages/core/income.ts),
// which tracks whether this is the client's first invoice, not whether
// they're still a going concern.
export const CLIENT_CASE_STATUSES = ["Prospective", "Active", "Closed"] as const;

export type ClientCaseStatus = (typeof CLIENT_CASE_STATUSES)[number];

export function isValidClientCaseStatus(status: string): status is ClientCaseStatus {
  return (CLIENT_CASE_STATUSES as readonly string[]).includes(status);
}
