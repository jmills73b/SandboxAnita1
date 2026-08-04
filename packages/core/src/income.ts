export type ClientStatus = "New" | "Existing";

// Defaults from the original spreadsheet. Story 8.4 makes these editable per tax year;
// until that lands, these are the only values in force.
const SPLIT_PERCENTAGE: Record<ClientStatus, number> = {
  New: 0.75,
  Existing: 0.45,
};

export function splitPercentage(clientStatus: ClientStatus): number {
  return SPLIT_PERCENTAGE[clientStatus];
}

export function calculateAnitaIncome(totalAmount: number, clientStatus: ClientStatus): number {
  if (totalAmount < 0) {
    throw new Error("totalAmount cannot be negative");
  }
  return roundToPence(totalAmount * splitPercentage(clientStatus));
}

function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}
