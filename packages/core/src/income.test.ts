import { describe, expect, it } from "vitest";
import { calculateAnitaIncome, DEFAULT_SPLIT_PERCENTAGE } from "./income";

describe("calculateAnitaIncome", () => {
  it("defaults to the current 75% split", () => {
    expect(DEFAULT_SPLIT_PERCENTAGE).toBe(0.75);
  });

  it("keeps 75% of an invoice at the default split (matches the original spreadsheet, row 2)", () => {
    // Invoice_Tracking_Main_2026_2027.xlsx, Bills!B2:G2 — Keith-Jopp, £1,681.50 total.
    expect(calculateAnitaIncome(1681.5)).toBeCloseTo(1261.13, 2);
  });

  it("uses a configured split rate when one is passed in (story 8.4)", () => {
    expect(calculateAnitaIncome(1000, 0.6)).toBeCloseTo(600, 2);
  });

  it("returns 0 for a £0 invoice", () => {
    expect(calculateAnitaIncome(0)).toBe(0);
  });

  it("rejects a negative invoice amount", () => {
    expect(() => calculateAnitaIncome(-1)).toThrow();
  });

  it("rejects a split percentage outside 0–1", () => {
    expect(() => calculateAnitaIncome(100, 1.5)).toThrow();
    expect(() => calculateAnitaIncome(100, -0.1)).toThrow();
  });
});
