import { describe, expect, it } from "vitest";
import { currentTaxYear } from "./taxYear";

describe("currentTaxYear", () => {
  it("returns the same tax year the day before the April boundary", () => {
    expect(currentTaxYear(new Date("2026-04-05T12:00:00Z"))).toEqual({
      label: "2025/26",
      startDate: "2025-04-06",
    });
  });

  it("rolls over to the new tax year on 6 April", () => {
    expect(currentTaxYear(new Date("2026-04-06T00:00:00Z"))).toEqual({
      label: "2026/27",
      startDate: "2026-04-06",
    });
  });

  it("stays in the same tax year mid-year", () => {
    expect(currentTaxYear(new Date("2026-08-04T00:00:00Z"))).toEqual({
      label: "2026/27",
      startDate: "2026-04-06",
    });
  });

  it("handles the century rollover in the label", () => {
    expect(currentTaxYear(new Date("2099-05-01T00:00:00Z")).label).toBe("2099/00");
  });
});
