export const TASK_FREQUENCIES = [
  "once",
  "daily",
  "weekly",
  "fortnightly",
  "four_weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type TaskFrequency = (typeof TASK_FREQUENCIES)[number];

export function isValidTaskFrequency(frequency: string): frequency is TaskFrequency {
  return (TASK_FREQUENCIES as readonly string[]).includes(frequency);
}

// 0 = Sunday .. 6 = Saturday, matching Date#getUTCDay().
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// `days_of_week` is stored as a plain comma-separated string ("0,6") rather
// than JSON — it's always a short flat list of small ints, so a dedicated
// column format avoids pulling in JSON parsing for something this simple.
export function parseDaysOfWeek(value: string | null): number[] | null {
  if (!value) return null;
  const days = value
    .split(",")
    .map((part) => Number(part))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return days.length > 0 ? days : null;
}

export function formatDaysOfWeek(days: number[] | null | undefined): string | null {
  if (!days || days.length === 0) return null;
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

// dateStr is "YYYY-MM-DD". Adds the given number of months, clamping the
// day to the target month's last day when it would otherwise overflow —
// 31 Jan + 1 month lands on 28/29 Feb, not 3 Mar, so a task due "on the
// last working day-ish of the month" doesn't drift forward every time a
// shorter month is involved.
function addMonths(dateStr: string, months: number): string {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7)); // 1-indexed
  const day = Number(dateStr.slice(8, 10));

  const targetMonthIndex = month - 1 + months; // 0-indexed; Date handles overflow/underflow
  const daysInTargetMonth = new Date(Date.UTC(year, targetMonthIndex + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);

  return new Date(Date.UTC(year, targetMonthIndex, clampedDay)).toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

// Earliest date >= fromDate whose weekday is one of daysOfWeek — used to
// turn "starting from this date, every Thursday" into an actual first due
// date, and to seed a weekend-only daily reminder on the right day.
export function firstMatchingWeekday(fromDate: string, daysOfWeek: number[]): string {
  let candidate = fromDate;
  for (let i = 0; i < 7; i++) {
    if (daysOfWeek.includes(weekdayOf(candidate))) return candidate;
    candidate = addDays(candidate, 1);
  }
  return fromDate;
}

// Computes a recurring task's next due date from its current one, so a
// task stays on a steady cadence (e.g. always due on the 6th) rather than
// drifting based on whichever day it actually got actioned.
//
// daysOfWeek only changes the math for "daily" (restricting which
// weekdays it actually lands on, e.g. weekends only). The other
// day-based cadences don't need it here: adding 7/14/28 days always
// preserves the weekday of wherever you started, so "weekly on
// Thursdays" stays on Thursdays automatically once the first occurrence
// was seeded correctly (see firstMatchingWeekday) — no extra state to
// keep in sync on every advance.
export function nextDueDate(
  dateStr: string,
  frequency: Exclude<TaskFrequency, "once">,
  daysOfWeek?: number[] | null,
): string {
  if (frequency === "daily" && daysOfWeek && daysOfWeek.length > 0) {
    return firstMatchingWeekday(addDays(dateStr, 1), daysOfWeek);
  }

  switch (frequency) {
    case "daily":
      return addDays(dateStr, 1);
    case "weekly":
      return addDays(dateStr, 7);
    case "fortnightly":
      return addDays(dateStr, 14);
    case "four_weekly":
      return addDays(dateStr, 28);
    case "monthly":
      return addMonths(dateStr, 1);
    case "quarterly":
      return addMonths(dateStr, 3);
    case "yearly":
      return addMonths(dateStr, 12);
  }
}
