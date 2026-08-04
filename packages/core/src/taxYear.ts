// UK tax years run 6 April to 5 April. Used to key which
// tax_year_settings row (and monthly target) applies right now.
export function currentTaxYear(date: Date = new Date()): { label: string; startDate: string } {
  const year = date.getUTCFullYear();
  const boundary = Date.UTC(year, 3, 6); // April 6, this calendar year
  const startYear = date.getTime() >= boundary ? year : year - 1;
  const label = `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
  const startDate = `${startYear}-04-06`;
  return { label, startDate };
}
