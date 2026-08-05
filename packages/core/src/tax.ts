// Self-employed sole trader tax: income tax on trading profit (after the
// personal allowance) plus Class 4 National Insurance on that same profit,
// and the Class 2 flat charge once profit reaches the small-profits
// threshold. Bands are contiguous: basicRateThreshold and higherRateThreshold
// are each the gross-income point where the next band starts (matching how
// HMRC states them, e.g. "40% on income over £50,270"), so the additional
// rate applies above higherRateThreshold without needing its own threshold.
export interface TaxRateSettings {
  personalAllowance: number;
  basicRate: number;
  basicRateThreshold: number;
  higherRate: number;
  higherRateThreshold: number;
  additionalRate: number;
  niLowerThreshold: number;
  niUpperThreshold: number;
  niLowerRate: number;
  niUpperRate: number;
  class2FlatRate: number;
}

function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateIncomeTax(taxableProfit: number, settings: TaxRateSettings): number {
  if (taxableProfit <= 0) return 0;

  const bands: Array<[upperBound: number, rate: number]> = [
    [settings.personalAllowance, 0],
    [settings.basicRateThreshold, settings.basicRate],
    [settings.higherRateThreshold, settings.higherRate],
    [Infinity, settings.additionalRate],
  ];

  let tax = 0;
  let lowerBound = 0;
  for (const [upperBound, rate] of bands) {
    if (taxableProfit <= lowerBound) break;
    tax += (Math.min(taxableProfit, upperBound) - lowerBound) * rate;
    lowerBound = upperBound;
  }
  return roundToPence(tax);
}

export function calculateClass4NI(taxableProfit: number, settings: TaxRateSettings): number {
  if (taxableProfit <= settings.niLowerThreshold) return 0;

  let ni = (Math.min(taxableProfit, settings.niUpperThreshold) - settings.niLowerThreshold) * settings.niLowerRate;
  if (taxableProfit > settings.niUpperThreshold) {
    ni += (taxableProfit - settings.niUpperThreshold) * settings.niUpperRate;
  }
  return roundToPence(ni);
}

// Class 2 becomes payable (in recent years, credited automatically) once
// profit reaches the small-profits threshold — the same figure as Class 4's
// lower threshold, so it's reused rather than stored twice.
export function calculateClass2NI(taxableProfit: number, settings: TaxRateSettings): number {
  return taxableProfit >= settings.niLowerThreshold ? roundToPence(settings.class2FlatRate) : 0;
}

export interface TaxAndNiBreakdown {
  taxableProfit: number;
  incomeTax: number;
  class4NI: number;
  class2NI: number;
  netIncome: number;
}

export function calculateTaxAndNi(taxableProfit: number, settings: TaxRateSettings): TaxAndNiBreakdown {
  const profit = Math.max(0, roundToPence(taxableProfit));
  const incomeTax = calculateIncomeTax(profit, settings);
  const class4NI = calculateClass4NI(profit, settings);
  const class2NI = calculateClass2NI(profit, settings);
  return {
    taxableProfit: profit,
    incomeTax,
    class4NI,
    class2NI,
    netIncome: roundToPence(profit - incomeTax - class4NI - class2NI),
  };
}
