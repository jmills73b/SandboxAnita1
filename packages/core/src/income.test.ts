import { describe, expect, it } from "vitest";
import { calculateAnitaIncome, splitPercentage } from "./income";

describe("splitPercentage", () => {
  it("is 75% for a New client and 45% for an Existing client", () => {
    expect(splitPercentage("New")).toBe(0.75);
    expect(splitPercentage("Existing")).toBe(0.45);
  });
});

describe("calculateAnitaIncome", () => {
  it("keeps 75% of a New client invoice (matches the original spreadsheet, row 2)", () => {
    // Invoice_Tracking_Main_2026_2027.xlsx, Bills!B2:G2 — Keith-Jopp, £1,681.50 total.
    expect(calculateAnitaIncome(1681.5, "New")).toBeCloseTo(1261.13, 2);
  });

  it("keeps 45% of an Existing client invoice", () => {
    expect(calculateAnitaIncome(1000, "Existing")).toBeCloseTo(450, 2);
  });

  it("returns 0 for a £0 invoice", () => {
    expect(calculateAnitaIncome(0, "New")).toBe(0);
  });

  it("rejects a negative invoice amount", () => {
    expect(() => calculateAnitaIncome(-1, "New")).toThrow();
  });
});
