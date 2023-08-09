import { devices, PlaywrightTestConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

// See https://playwright.dev/docs/test-configuration.
const config: PlaywrightTestConfig = {
  testDir: './e2e/tests',
  timeout: 3 * 60 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['junit', { outputFile: 'results.xml' }], ['html']] : [['html']],
  globalSetup: require.resolve('./e2e/utils/configs/globalSetup'),
  use: {
    baseURL: `${process.env.E2E_BASE_URL}/spa/`,
    storageState: 'e2e/storageState.json',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chromium'],
        viewport: {width: 1920, height: 1080},
        screenshot: 'only-on-failure',
        video: 'on',
        trace: 'retain-on-failure',
      },
    },
  ],
};

export default config;
