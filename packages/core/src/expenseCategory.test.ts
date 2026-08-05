import { describe, expect, it } from "vitest";
import { EXPENSE_CATEGORIES, isValidExpenseCategory } from "./expenseCategory";

describe("isValidExpenseCategory", () => {
  it("accepts every preset category", () => {
    for (const category of EXPENSE_CATEGORIES) {
      expect(isValidExpenseCategory(category)).toBe(true);
    }
  });

  it("rejects a category not in the preset list", () => {
    expect(isValidExpenseCategory("Groceries")).toBe(false);
  });
});
