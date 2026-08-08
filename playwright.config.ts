import { defineConfig, devices } from "@playwright/test";

// One critical-path smoke test (story 9.3): log in -> add an invoice ->
// see it reflected. Deliberately not a broad UI suite -- a single browser,
// a single spec file, no cross-browser matrix -- broad coverage isn't
// worth the upkeep at this project's scale (see CONTRIBUTING.md).
//
// Runs against a real build (vite preview, not vite dev) talking to a real
// local Worker (wrangler dev) over a fresh local D1 database, so this
// exercises the same code path production does, not a mock.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    // Port 5173 (not vite preview's usual 4173): the API's CORS allowlist
    // (apps/api/src/index.ts) only permits localhost:5173 and the deployed
    // Pages origin, so the built app has to be served from there for
    // requests to the local Worker to succeed.
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // CI installs its own matching browser via `playwright install`.
        // Locally, reuse the sandbox's pre-fetched Chromium so this doesn't
        // depend on a network path to Playwright's CDN.
        launchOptions: process.env.CI ? undefined : { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" },
      },
    },
  ],
  webServer: [
    {
      command:
        'npx wrangler d1 migrations apply anita-invoice-tracker --local && echo "SESSION_SECRET=e2e-test-secret-not-for-production" > .dev.vars && npm run dev -- --port 8787',
      cwd: "apps/api",
      url: "http://localhost:8787/api/setup/status",
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run build && npm run preview -- --port 5173 --strictPort",
      cwd: "apps/web",
      env: { VITE_API_URL: "http://localhost:8787" },
      port: 5173,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
