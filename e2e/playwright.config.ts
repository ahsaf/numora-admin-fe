import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import { LIVE_BASE_URL } from './support/env';

// ----------------------------------------------------------------------

/** Headed by default so you can watch the run; E2E_HEADLESS=1 runs in the background. */
const HEADLESS = process.env.E2E_HEADLESS === '1';

/** E2E_SLOW_MO=500 waits that many ms before each browser action, to follow a run by eye. */
const SLOW_MO = Number(process.env.E2E_SLOW_MO) || 0;

/** "chrome" (installed Google Chrome, nothing to download) or "chromium" (`npx playwright install chromium`). */
const BROWSER = process.env.E2E_BROWSER === 'chromium' ? 'chromium' : 'chrome';

const VIEWPORT = { width: 1440, height: 900 };

/**
 * Regression tests of the whole Numora app: the real web app against the real
 * thesuperappserver and its database. Local only — see e2e/README.md for what must be
 * running first. Every run registers new users and a new company.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  // One long flow per test; its steps depend on each other.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: SLOW_MO ? 30 * 60_000 : 6 * 60_000,
  expect: { timeout: SLOW_MO ? 20_000 : 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
    // Set by the runner: streams structured progress to the admin dashboard's E2E page.
    ...(process.env.E2E_LIVE === '1' ? [['./reporters/live-reporter.ts'] as const] : []),
  ],
  use: {
    baseURL: LIVE_BASE_URL,
    headless: HEADLESS,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    // Fail a stuck step quickly instead of at the end of the long test timeout.
    actionTimeout: SLOW_MO ? 60_000 : 15_000,
    launchOptions: { slowMo: SLOW_MO },
  },
  projects: [
    {
      name: BROWSER,
      use: {
        ...devices['Desktop Chrome'],
        ...(BROWSER === 'chrome' && { channel: 'chrome' }),
        viewport: VIEWPORT,
      },
    },
  ],
});
