import { describe, expect, it } from "vitest";
import {
  firstMatchingWeekday,
  formatDaysOfWeek,
  isValidTaskFrequency,
  nextDueDate,
  parseDaysOfWeek,
} from "./taskRecurrence";

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

  it("without daysOfWeek, daily still just adds a day (unrestricted)", () => {
    expect(nextDueDate("2026-08-08", "daily", null)).toBe("2026-08-09");
  });

  it("restricts a daily reminder to the given weekdays — Saturday to the very next day when it's also selected", () => {
    // 2026-08-08 is a Saturday, 2026-08-09 a Sunday — both selected, so it
    // advances to the very next day.
    expect(nextDueDate("2026-08-08", "daily", [0, 6])).toBe("2026-08-09");
  });

  it("restricts a daily reminder to the given weekdays — skips the weekdays in between", () => {
    // 2026-08-09 is a Sunday; the next Saturday is 2026-08-15, skipping
    // Mon-Fri entirely.
    expect(nextDueDate("2026-08-09", "daily", [0, 6])).toBe("2026-08-15");
  });

  it("ignores an empty daysOfWeek for daily (same as unrestricted)", () => {
    expect(nextDueDate("2026-08-08", "daily", [])).toBe("2026-08-09");
  });
});

describe("firstMatchingWeekday", () => {
  it("returns the same date when it already matches", () => {
    // 2026-08-06 is a Thursday.
    expect(firstMatchingWeekday("2026-08-06", [4])).toBe("2026-08-06");
  });

  it("advances to the next matching weekday otherwise", () => {
    // 2026-08-10 is a Monday; the next Thursday is 2026-08-13.
    expect(firstMatchingWeekday("2026-08-10", [4])).toBe("2026-08-13");
  });
});

describe("parseDaysOfWeek / formatDaysOfWeek", () => {
  it("round-trips a set of days", () => {
    expect(parseDaysOfWeek(formatDaysOfWeek([6, 0]))).toEqual([0, 6]);
  });

  it("parses null/empty as null", () => {
    expect(parseDaysOfWeek(null)).toBeNull();
    expect(parseDaysOfWeek("")).toBeNull();
  });

  it("formats null/empty/undefined as null", () => {
    expect(formatDaysOfWeek(null)).toBeNull();
    expect(formatDaysOfWeek(undefined)).toBeNull();
    expect(formatDaysOfWeek([])).toBeNull();
  });

  it("de-duplicates and sorts when formatting", () => {
    expect(formatDaysOfWeek([3, 1, 3])).toBe("1,3");
  });

  it("drops out-of-range values when parsing", () => {
    expect(parseDaysOfWeek("2,9,-1,5")).toEqual([2, 5]);
  });
});
