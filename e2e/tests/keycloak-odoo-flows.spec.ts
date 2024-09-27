import { test, expect } from '@playwright/test';
import { Odoo } from '../utils/functions/odoo';
import { OpenMRS } from '../utils/functions/openmrs';
import { Keycloak } from '../utils/functions/keycloak';
import { KEYCLOAK_URL, ODOO_URL } from '../utils/configs/globalSetup';

let odoo: Odoo;
let openmrs: OpenMRS;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  odoo = new Odoo(page);
  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);
});

test('Logging out from Odoo logs out the user from Keycloak.', async ({ page }) => {
  // setup
  await odoo.open();
  await openmrs.enterLoginCredentials();
  await expect(page).toHaveURL(/.*web/);
  await expect(page.locator('li.o_user_menu a span')).toHaveText(/john doe/i);
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectSessions();
  await expect(page.locator('td:nth-child(1) a').nth(0)).toHaveText(/jdoe/i);

  // replay
  await page.goto(`${ODOO_URL}`);
  await expect(page.locator('.o_user_menu>a')).toBeVisible();
  await page.locator('.o_user_menu>a').click();
  await expect(page.getByRole('menuitem', { name: /log out/i })).toBeVisible();
  await page.getByRole('menuitem', { name: /log out/i }).click();
  await keycloak.confirmLogout();
  await expect(page).toHaveURL(/.*login/);

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectSessions();
  await expect(page.locator('h1.pf-c-title:nth-child(2)')).toHaveText(/no sessions/i);
  await expect(page.locator('.pf-c-empty-state__body')).toHaveText(/there are currently no active sessions for this client/i);
  await page.goto(`${ODOO_URL}/web`);
  await expect(page).toHaveURL(/.*login/);
});

test.afterEach(async ({ page }) => {
  await page.close();
});
