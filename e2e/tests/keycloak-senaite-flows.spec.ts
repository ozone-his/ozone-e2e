import { test, expect } from '@playwright/test';
import { KEYCLOAK_URL, SENAITE_URL } from '../utils/configs/globalSetup';
import { Keycloak, user } from '../utils/functions/keycloak';
import { SENAITE } from '../utils/functions/senaite';

let senaite: SENAITE;
let keycloak: Keycloak;
let browserContext;
let page;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  keycloak = new Keycloak(page);
  senaite = new SENAITE(page);

  await keycloak.open();
  await keycloak.navigateToUsers();
  await keycloak.addUserButton().click();
  await keycloak.createUser();
});

test('Logging out from SENAITE ends the session in Keycloak and logs out the user.', async ({}) => {
  // setup
  await senaite.open();
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.locator('td:nth-child(1) a').nth(0)).toHaveText(`${user.userName}`);

  // replay
  await senaite.logout();
  await expect(page.locator('#username')).toBeVisible();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.locator('h1.pf-c-title:nth-child(2)')).toHaveText(/no sessions/i);
  await expect(page.locator('.pf-c-empty-state__body')).toHaveText(/there are currently no active sessions for this client/i);
  await page.goto(`${SENAITE_URL}/senaite-dashboard`);
  await expect(page.locator('#username')).toBeVisible();
});

test.afterAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  keycloak = new Keycloak(page);
  await keycloak.deleteUser();
});
