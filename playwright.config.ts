import { defineConfig, devices } from "@playwright/test";

/**
 * E2E (capa superior de la pirámide): recorre la app como un usuario.
 * No sustituye a Vitest. Úsalo para humo de login/rutas, no para cada regla de negocio.
 *
 * Primera vez: npx playwright install
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --mode e2e --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
