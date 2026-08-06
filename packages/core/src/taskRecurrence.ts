export const TASK_FREQUENCIES = ["once", "weekly", "monthly", "quarterly", "yearly"] as const;

export type TaskFrequency = (typeof TASK_FREQUENCIES)[number];

export function isValidTaskFrequency(frequency: string): frequency is TaskFrequency {
  return (TASK_FREQUENCIES as readonly string[]).includes(frequency);
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

// Computes a recurring task's next due date from its current one, so a
// task stays on a steady cadence (e.g. always due on the 6th) rather than
// drifting based on whichever day it actually got actioned.
export function nextDueDate(dateStr: string, frequency: Exclude<TaskFrequency, "once">): string {
  switch (frequency) {
    case "weekly": {
      const d = new Date(`${dateStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 7);
      return d.toISOString().slice(0, 10);
    }
    case "monthly":
      return addMonths(dateStr, 1);
    case "quarterly":
      return addMonths(dateStr, 3);
    case "yearly":
      return addMonths(dateStr, 12);
  }
}
