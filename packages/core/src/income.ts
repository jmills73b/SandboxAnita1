// The old New/Existing split (75% vs 45%) tracked a fixed list of legacy clients
// on the lower rate. Those clients are closed and no longer billed, so every
// invoice now uses a single split rate. It's still configurable (story 8.4) in
// case the arrangement changes again — this just drops the per-client branching.
export const DEFAULT_SPLIT_PERCENTAGE = 0.75;

export function calculateAnitaIncome(
  totalAmount: number,
  splitPercentage: number = DEFAULT_SPLIT_PERCENTAGE,
): number {
  if (totalAmount < 0) {
    throw new Error("totalAmount cannot be negative");
  }
  if (splitPercentage < 0 || splitPercentage > 1) {
    throw new Error("splitPercentage must be between 0 and 1");
  }
  return roundToPence(totalAmount * splitPercentage);
}

function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}
