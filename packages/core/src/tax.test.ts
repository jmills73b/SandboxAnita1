import { describe, expect, it } from "vitest";
import { calculateClass2NI, calculateClass4NI, calculateIncomeTax, calculateTaxAndNi, type TaxRateSettings } from "./tax";

// Roughly 2024/25 UK figures — exact values don't matter for these tests,
// only that the band/threshold math is correct.
const settings: TaxRateSettings = {
  personalAllowance: 12570,
  basicRate: 0.2,
  basicRateThreshold: 50270,
  higherRate: 0.4,
  higherRateThreshold: 125140,
  additionalRate: 0.45,
  niLowerThreshold: 12570,
  niUpperThreshold: 50270,
  niLowerRate: 0.06,
  niUpperRate: 0.02,
  class2FlatRate: 179.4,
};

describe("calculateIncomeTax", () => {
  it("charges nothing at or below the personal allowance", () => {
    expect(calculateIncomeTax(0, settings)).toBe(0);
    expect(calculateIncomeTax(12570, settings)).toBe(0);
  });

  it("charges basic rate only within the basic band", () => {
    expect(calculateIncomeTax(30000, settings)).toBeCloseTo((30000 - 12570) * 0.2, 2);
  });

  it("blends basic and higher rate once profit crosses into the higher band", () => {
    const expected = (50270 - 12570) * 0.2 + (80000 - 50270) * 0.4;
    expect(calculateIncomeTax(80000, settings)).toBeCloseTo(expected, 2);
  });

  it("adds the additional rate once profit crosses the higher-rate threshold", () => {
    const expected = (50270 - 12570) * 0.2 + (125140 - 50270) * 0.4 + (150000 - 125140) * 0.45;
    expect(calculateIncomeTax(150000, settings)).toBeCloseTo(expected, 2);
  });

  it("treats negative profit as zero tax", () => {
    expect(calculateIncomeTax(-500, settings)).toBe(0);
  });
});

describe("calculateClass4NI", () => {
  it("charges nothing at or below the lower threshold", () => {
    expect(calculateClass4NI(12570, settings)).toBe(0);
  });

  it("charges the lower rate within the lower band", () => {
    expect(calculateClass4NI(30000, settings)).toBeCloseTo((30000 - 12570) * 0.06, 2);
  });

  it("blends lower and upper rate once profit crosses the upper threshold", () => {
    const expected = (50270 - 12570) * 0.06 + (80000 - 50270) * 0.02;
    expect(calculateClass4NI(80000, settings)).toBeCloseTo(expected, 2);
  });
});

describe("calculateClass2NI", () => {
  it("is not charged below the small-profits threshold", () => {
    expect(calculateClass2NI(10000, settings)).toBe(0);
  });

  it("is charged at exactly the threshold and above", () => {
    expect(calculateClass2NI(12570, settings)).toBe(179.4);
    expect(calculateClass2NI(30000, settings)).toBe(179.4);
  });
});

describe("calculateTaxAndNi", () => {
  it("combines income tax, Class 4 and Class 2 into a net income figure", () => {
    const result = calculateTaxAndNi(30000, settings);
    expect(result.taxableProfit).toBe(30000);
    expect(result.incomeTax).toBeCloseTo((30000 - 12570) * 0.2, 2);
    expect(result.class4NI).toBeCloseTo((30000 - 12570) * 0.06, 2);
    expect(result.class2NI).toBe(179.4);
    expect(result.netIncome).toBeCloseTo(
      30000 - result.incomeTax - result.class4NI - result.class2NI,
      2,
    );
  });

  it("floors a negative profit at zero rather than going negative", () => {
    const result = calculateTaxAndNi(-1000, settings);
    expect(result).toEqual({ taxableProfit: 0, incomeTax: 0, class4NI: 0, class2NI: 0, netIncome: 0 });
  });
});
