import * as dotenv from 'dotenv';
import {
  APIRequestContext,
  Page,
  PlaywrightWorkerArgs,
  WorkerFixture,
  request,
  test as base
}
  from '@playwright/test';

dotenv.config();

export const O3_URL = `${process.env.TEST_ENVIRONMENT}` == 'demo' ? `${process.env.O3_URL_DEMO}` : `${process.env.TEST_ENVIRONMENT}` == 'qa' ? `${process.env.O3_URL_QA}`: `${process.env.O3_URL_DEV}`;
export const ERPNEXT_URL = `${process.env.TEST_ENVIRONMENT}` == 'demo' ? `${process.env.ERPNEXT_URL_DEMO}` : `${process.env.TEST_ENVIRONMENT}` == 'qa' ? `${process.env.ERPNEXT_URL_QA}`: `${process.env.ERPNEXT_URL_DEV}`;
export const ODOO_URL = `${process.env.TEST_ENVIRONMENT}` == 'demo' ? `${process.env.ODOO_URL_DEMO}` : `${process.env.TEST_ENVIRONMENT}` == 'qa' ? `${process.env.ODOO_URL_QA}`: `${process.env.ODOO_URL_DEV}`;
export const ORTHANC_URL = `${process.env.TEST_ENVIRONMENT}` == 'demo' ? `${process.env.ORTHANC_URL_DEMO}` : `${process.env.TEST_ENVIRONMENT}` == 'qa' ? `${process.env.ORTHANC_URL_QA}`: `${process.env.ORTHANC_URL_DEV}`;
export const SENAITE_URL = `${process.env.TEST_ENVIRONMENT}` == 'demo' ? `${process.env.SENAITE_URL_DEMO}` : `${process.env.TEST_ENVIRONMENT}` == 'qa' ? `${process.env.SENAITE_URL_QA}`: `${process.env.SENAITE_URL_DEV}`;
export const KEYCLOAK_URL = `${process.env.TEST_ENVIRONMENT}` == 'demo' ? `${process.env.KEYCLOAK_URL_DEMO}` : `${process.env.TEST_ENVIRONMENT}` == 'qa' ? `${process.env.KEYCLOAK_URL_QA}`: `${process.env.KEYCLOAK_URL_DEV}`;
export const SUPERSET_URL = `${process.env.TEST_ENVIRONMENT}` == 'demo' ? `${process.env.SUPERSET_URL_DEMO}` : `${process.env.TEST_ENVIRONMENT}` == 'qa' ? `${process.env.SUPERSET_URL_QA}`: `${process.env.SUPERSET_URL_DEV}`;

async function globalSetup() {
  const requestContext = await request.newContext();
  const token = Buffer.from(`${process.env.OZONE_USERNAME}:${process.env.OZONE_PASSWORD}`).toString(
    'base64',
  );
  await requestContext.post(`${O3_URL}/ws/rest/v1/session`, {
    data: {
      sessionLocation: '',
      locale: 'en',
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${token}`,
    },
  });
  await requestContext.storageState({ path: 'tests/storageState.json' });
  await requestContext.dispose();
}

export const api: WorkerFixture<APIRequestContext, PlaywrightWorkerArgs> = async ({ playwright }, use) => {
  const ctx = await playwright.request.newContext({
    baseURL: `${O3_URL}/ws/rest/v1/`,
    httpCredentials: {
      username: process.env.OZONE_USERNAME ?? "",
      password: process.env.OZONE_PASSWORD ?? "",
    },
  });

  await use(ctx);
};

export interface CustomTestFixtures {
  loginAsAdmin: Page;
  orthancPage: Page;
}

export interface CustomWorkerFixtures {
  api: APIRequestContext;
}

export const test = base.extend<CustomTestFixtures, CustomWorkerFixtures>({
  api: [api, { scope: 'worker' }],
  orthancPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      httpCredentials: {
        username: process.env.ORTHANC_USERNAME || '',
        password: process.env.ORTHANC_PASSWORD || '',
      },
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export default globalSetup;
