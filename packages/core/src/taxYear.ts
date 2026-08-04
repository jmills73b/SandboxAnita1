// UK tax years run 6 April to 5 April. startYear (a plain number, e.g.
// 2026 for the "2026/27" tax year) is the canonical identifier — a bare
// number avoids the awkwardness of a "/" inside a URL path segment or a
// D1 primary key lookup, which the human-readable "2026/27" label isn't
// safe for. label and startDate are derived from it, never stored apart
// from it.
export function taxYearLabel(startYear: number): string {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function taxYearStartDate(startYear: number): string {
  return `${startYear}-04-06`;
}

export function currentTaxYearStartYear(date: Date = new Date()): number {
  const year = date.getUTCFullYear();
  const boundary = Date.UTC(year, 3, 6); // April 6, this calendar year
  return date.getTime() >= boundary ? year : year - 1;
}

export function currentTaxYear(date: Date = new Date()): {
  startYear: number;
  label: string;
  startDate: string;
} {
  const startYear = currentTaxYearStartYear(date);
  return { startYear, label: taxYearLabel(startYear), startDate: taxYearStartDate(startYear) };
}

// The current tax year's start year, plus `count - 1` before it, most
// recent first — e.g. recentTaxYearStartYears(3) from August 2026 gives
// [2026, 2025, 2024]. Used to populate the tax-year filter.
export function recentTaxYearStartYears(count: number, from: Date = new Date()): number[] {
  const startYear = currentTaxYearStartYear(from);
  return Array.from({ length: count }, (_, i) => startYear - i);
}
