import { devices, PlaywrightTestConfig } from '@playwright/test';
import { O3_URL } from './e2e/utils/configs/globalSetup';
import * as dotenv from 'dotenv';
dotenv.config();

const config: PlaywrightTestConfig = {
  testDir: './e2e/tests',
  timeout: 3 * 60 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : 1,
  retries: 0,
  reporter: process.env.CI ? [['junit', { outputFile: 'results.xml' }], ['html']] : [['html']],
  globalSetup: require.resolve('./e2e/utils/configs/globalSetup'),
  use: {
    baseURL: `${O3_URL}/spa/`,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chromium'],
        viewport: { width: 1920, height: 1080 },
        storageState: undefined
      },  
    },
  ],
};

export default config;
