import { describe, expect, it } from "vitest";
import { isValidTaskFrequency, nextDueDate } from "./taskRecurrence";

describe("isValidTaskFrequency", () => {
  it("accepts the known frequencies", () => {
    expect(isValidTaskFrequency("once")).toBe(true);
    expect(isValidTaskFrequency("daily")).toBe(true);
    expect(isValidTaskFrequency("weekly")).toBe(true);
    expect(isValidTaskFrequency("fortnightly")).toBe(true);
    expect(isValidTaskFrequency("four_weekly")).toBe(true);
    expect(isValidTaskFrequency("monthly")).toBe(true);
    expect(isValidTaskFrequency("quarterly")).toBe(true);
    expect(isValidTaskFrequency("yearly")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidTaskFrequency("biweekly")).toBe(false);
    expect(isValidTaskFrequency("")).toBe(false);
  });
});

describe("nextDueDate", () => {
  it("adds 1 day for daily", () => {
    expect(nextDueDate("2026-08-06", "daily")).toBe("2026-08-07");
  });

  it("adds 7 days for weekly", () => {
    expect(nextDueDate("2026-08-06", "weekly")).toBe("2026-08-13");
  });

  it("adds 14 days for fortnightly", () => {
    expect(nextDueDate("2026-08-06", "fortnightly")).toBe("2026-08-20");
  });

  it("adds 28 days for four_weekly", () => {
    expect(nextDueDate("2026-08-06", "four_weekly")).toBe("2026-09-03");
  });

  it("adds a calendar month for monthly", () => {
    expect(nextDueDate("2026-08-15", "monthly")).toBe("2026-09-15");
  });

  it("clamps the day when the target month is shorter (31 Jan -> 28 Feb in a non-leap year)", () => {
    expect(nextDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
  });

  it("clamps to 29 Feb in a leap year", () => {
    expect(nextDueDate("2028-01-31", "monthly")).toBe("2028-02-29");
  });

  it("adds 3 months for quarterly, crossing a year boundary", () => {
    expect(nextDueDate("2026-11-30", "quarterly")).toBe("2027-02-28");
  });

  it("adds 12 months for yearly", () => {
    expect(nextDueDate("2026-02-28", "yearly")).toBe("2027-02-28");
  });

  it("clamps a leap-day yearly task in a non-leap target year", () => {
    expect(nextDueDate("2028-02-29", "yearly")).toBe("2029-02-28");
  });
});
