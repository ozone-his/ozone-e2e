import { test, expect } from '@playwright/test';
import { Odoo, randomOdooGroupName } from '../utils/functions/odoo';
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
  await odoo.logout();
  await keycloak.confirmLogout();
  await expect(page).toHaveURL(/.*login/);

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectSessions();
  await expect(page.locator('h1.pf-c-title:nth-child(2)')).toHaveText(/no sessions/i);
  await expect(page.locator('.pf-c-empty-state__body')).toHaveText(/there are currently no active sessions for this client/i);
  await page.goto(`${ODOO_URL}/web`);
  await expect(page).toHaveURL(/.*login/);
});

test('Coded Odoo groups create corresponding Keycloak roles.', async ({ page }) => {
  // setup
  await page.goto(`${ODOO_URL}`);
  await odoo.enterLoginCredentials();
  await expect(page.locator('li.o_user_menu a span')).toHaveText(/administrator/i);
  await odoo.activateDeveloperMode();

  // replay
  await odoo.navigateToGroups();
  await expect(page.getByText('Administration / Settings')).toBeVisible();
  await expect(page.getByText('Extra Rights / Technical Features')).toBeVisible();
  await expect(page.getByText('Invoicing / Billing Administrator')).toBeVisible();
  await expect(page.getByText('Technical / Discount on lines')).toBeVisible();
  await expect(page.getByText('User types / Portal')).toBeVisible();

  // verify
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await page.getByPlaceholder('Search role by name').fill('Administration / Settings');
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText('Administration	/ Settings')).toBeVisible();
  await page.getByPlaceholder('Search role by name').fill('Extra Rights / Technical Features');
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText('Extra Rights / Technical Features')).toBeVisible();
  await page.getByPlaceholder('Search role by name').fill('Invoicing / Billing Administrator');
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText('Invoicing / Billing Administrator')).toBeVisible();
  await page.getByPlaceholder('Search role by name').fill('Technical / Discount on lines');
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText('Technical / Discount on lines')).toBeVisible();
  await page.getByPlaceholder('Search role by name').fill('User types / Portal');
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText('User types / Portal')).toBeVisible();
});

test('Creating an Odoo group creates the corresponding Keycloak role', async ({ page }) => {
  // setup
  await page.goto(`${ODOO_URL}`);
  await odoo.enterLoginCredentials();
  await expect(page.locator('li.o_user_menu a span')).toHaveText(/administrator/i);
  await odoo.activateDeveloperMode();

  // replay
  await odoo.navigateToGroups();
  await odoo.createGroup();

  // verify
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`Accounting / ${randomOdooGroupName.groupName}`);
});

test('Updating a synced Odoo group updates the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await page.goto(`${ODOO_URL}`);
  await odoo.enterLoginCredentials();
  await expect(page.locator('li.o_user_menu a span')).toHaveText(/administrator/i);
  await odoo.activateDeveloperMode();
  await odoo.navigateToGroups();
  await odoo.createGroup();
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`Accounting / ${randomOdooGroupName.groupName}`);

  // replay
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSettings();
  await odoo.navigateToGroups();
  await odoo.searchGroup();
  await odoo.updateGroup();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.getByText(`Accounting / ${randomOdooGroupName.updatedGroupName}`)).toBeVisible();
});

test.afterEach(async ({ page }) => {
  await page.close();
});
