// How close a task's due date has to be before it moves up a bucket.
// "Getting late" covers today plus this many days out; anything further
// away is just "coming soon" until it crosses into that window.
const GETTING_LATE_WINDOW_DAYS = 3;

export type Urgency = "late" | "gettingLate" | "comingSoon";

export const URGENCY_ORDER: Urgency[] = ["late", "gettingLate", "comingSoon"];

export const URGENCY_LABELS: Record<Urgency, string> = {
  late: "Late",
  gettingLate: "Getting late",
  comingSoon: "Coming soon",
};

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function taskUrgency(nextDueDate: string, today: string): Urgency {
  if (nextDueDate < today) return "late";
  if (nextDueDate <= addDaysIso(today, GETTING_LATE_WINDOW_DAYS)) return "gettingLate";
  return "comingSoon";
}

// "Needs attention" for the header badge — late or getting late, not the
// full active count (which would include things weeks out and make the
// badge meaningless).
export function needsAttention(nextDueDate: string, today: string): boolean {
  return taskUrgency(nextDueDate, today) !== "comingSoon";
}
