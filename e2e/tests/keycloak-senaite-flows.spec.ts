import { test, expect } from '@playwright/test';
import { KEYCLOAK_URL, SENAITE_URL } from '../utils/configs/globalSetup';
import { Keycloak } from '../utils/functions/keycloak';
import { OpenMRS } from '../utils/functions/openmrs';
import { SENAITE } from '../utils/functions/senaite';

let openmrs: OpenMRS;
let senaite: SENAITE;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  senaite = new SENAITE(page);
  keycloak = new Keycloak(page);
});

test('Logging out from SENAITE ends the session in Keycloak and logs out the user.', async ({ page }) => {
  // setup
  await senaite.open();
  await openmrs.enterLoginCredentials();
  await expect(page).toHaveURL(/.*senaite-dashboard/);
  await expect(page.locator('#navbarUserDropdown')).toHaveText(/john doe/i);
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.locator('td:nth-child(1) a').nth(0)).toHaveText(/jdoe/i);

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

test.afterEach(async ({ page }) => {
  await page.close();
});
