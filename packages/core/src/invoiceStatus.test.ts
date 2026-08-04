import { describe, expect, it } from "vitest";
import { INVOICE_STATUSES, isValidInvoiceStatus } from "./invoiceStatus";

describe("isValidInvoiceStatus", () => {
  it("accepts every status in the workflow", () => {
    for (const status of INVOICE_STATUSES) {
      expect(isValidInvoiceStatus(status)).toBe(true);
    }
  });

  it("rejects a status not in the workflow", () => {
    expect(isValidInvoiceStatus("Cancelled")).toBe(false);
  });
});
