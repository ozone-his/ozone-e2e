import { test, expect } from '@playwright/test';
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
  await keycloak.createUser();
});

test('Logging out from SENAITE ends the session in Keycloak and logs out the user.', async ({}) => {
  // setup
  await senaite.open();
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).toBeVisible();

  // replay
  await senaite.logout();
  await expect(page.locator('#username')).toBeVisible();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).not.toBeVisible();
  await senaite.navigateToHomePage();
  await expect(page.locator('#username')).toBeVisible();
});

test.afterAll(async ({}) => {
  await keycloak.deleteUser();
});
