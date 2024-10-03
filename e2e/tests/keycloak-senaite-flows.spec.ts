import { test, expect } from '@playwright/test';
import { Keycloak } from '../utils/functions/keycloak';
import { OpenMRS } from '../utils/functions/openmrs';
import { SENAITE } from '../utils/functions/senaite';
import { KEYCLOAK_URL, SENAITE_URL } from '../utils/configs/globalSetup';

let openmrs: OpenMRS;
let senaite: SENAITE;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  senaite = new SENAITE(page);
  keycloak = new Keycloak(page);
});

test('Logging out from SENAITE logs out the user from Keycloak.', async ({ page }) => {
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
  await page.goto(`${SENAITE_URL}`);
  await expect(page.locator('#navbarUserDropdown')).toBeVisible();
  await page.locator('#navbarUserDropdown').click();
  await expect(page.getByRole('link', { name: /log out/i })).toBeVisible();
  await page.getByRole('link', { name: /log out/i }).click();
  await keycloak.confirmLogout();
  await expect(page.locator('#username')).toBeVisible();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.locator('h1.pf-c-title:nth-child(2)')).toHaveText(/no sessions/i);
  await expect(page.locator('.pf-c-empty-state__body')).toHaveText(/there are currently no active sessions for this client/i);
  await page.goto(`${SENAITE_URL}/senaite-dashboard`);
  await expect(page).toHaveURL(/.*login/);
});

test.afterEach(async ({ page }) => {
  await page.close();
});
