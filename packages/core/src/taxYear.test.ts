import { describe, expect, it } from "vitest";
import {
  currentTaxYear,
  currentTaxYearStartYear,
  recentTaxYearStartYears,
  taxYearLabel,
  taxYearStartDate,
} from "./taxYear";

describe("currentTaxYearStartYear / currentTaxYear", () => {
  it("returns the same tax year the day before the April boundary", () => {
    expect(currentTaxYear(new Date("2026-04-05T12:00:00Z"))).toEqual({
      startYear: 2025,
      label: "2025/26",
      startDate: "2025-04-06",
    });
  });

  it("rolls over to the new tax year on 6 April", () => {
    expect(currentTaxYearStartYear(new Date("2026-04-06T00:00:00Z"))).toBe(2026);
  });

  it("stays in the same tax year mid-year", () => {
    expect(currentTaxYearStartYear(new Date("2026-08-04T00:00:00Z"))).toBe(2026);
  });
});

describe("taxYearLabel", () => {
  it("formats a normal year", () => {
    expect(taxYearLabel(2025)).toBe("2025/26");
  });

  it("handles the century rollover", () => {
    expect(taxYearLabel(2099)).toBe("2099/00");
  });
});

describe("taxYearStartDate", () => {
  it("returns 6 April of the given start year", () => {
    expect(taxYearStartDate(2025)).toBe("2025-04-06");
  });
});

describe("recentTaxYearStartYears", () => {
  it("returns the current year plus the requested number before it, newest first", () => {
    expect(recentTaxYearStartYears(3, new Date("2026-08-04T00:00:00Z"))).toEqual([2026, 2025, 2024]);
  });

  it("uses the pre-boundary tax year when asked for just one", () => {
    expect(recentTaxYearStartYears(1, new Date("2026-04-05T00:00:00Z"))).toEqual([2025]);
  });
});
