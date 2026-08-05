// Preset categories for expense tagging (story 4.2) — shared between the
// API's validation and the web app's dropdown, same pattern as
// INVOICE_STATUSES. "Other" is a real category, not an escape hatch to
// free text, so every expense still lands in exactly one bucket for the
// category breakdown.
export const EXPENSE_CATEGORIES = [
  "Subscriptions",
  "Stationery & Postage",
  "Travel",
  "Software",
  "Professional Fees",
  "Bank Charges",
  "Marketing",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export function isValidExpenseCategory(category: string): category is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(category);
}
