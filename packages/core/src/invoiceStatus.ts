// The invoice lifecycle, in order. Shared between the API (validates
// transitions, stamps settlement dates) and the web app (status dropdown
// options) so there's one definition of the workflow, not three.
export const INVOICE_STATUSES = [
  "In progress",
  "Invoice sent to client",
  "Settled by client",
  "Invoice sent to intermediary firm",
  "Complete",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export function isValidInvoiceStatus(status: string): status is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(status);
}
