import { expect, test } from "@playwright/test";

// Story 9.3's critical path: log in -> add an invoice -> see it reflected.
// Runs against a fresh local D1 database (see playwright.config.ts), so
// this always hits the account-bootstrap flow (SetupPage), not the normal
// login form -- there is no existing user for it to sign in as.
test("create account, add an invoice, see it on the ledger", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;
  const password = "e2e-test-password";
  const clientName = `E2E Test Client ${Date.now()}`;

  await page.goto("/");

  await page.getByLabel("Full name").fill("E2E Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByRole("button", { name: "Invoice Management" }).click();
  await page.getByRole("button", { name: "Add invoice" }).click();

  await page.getByRole("button", { name: "New client" }).click();
  await page.getByPlaceholder("New client name").fill(clientName);
  await page.getByLabel("Amount").fill("123.45");
  await page.getByRole("button", { name: "Add invoice" }).click();

  const row = page.locator("table.ledger tbody tr", { hasText: clientName });
  await expect(row).toBeVisible();
  await expect(row).toContainText("£123.45");

  await page.getByRole("button", { name: "Dashboard" }).click();
  await expect(page.getByRole("button", { name: "Invoice Management" })).toBeVisible();
});
