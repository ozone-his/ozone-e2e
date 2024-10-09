import { test, expect } from '@playwright/test';
import { Odoo, randomOdooGroupName } from '../utils/functions/odoo';
import { delay, OpenMRS } from '../utils/functions/openmrs';
import { Keycloak } from '../utils/functions/keycloak';
import { KEYCLOAK_URL, ODOO_URL } from '../utils/configs/globalSetup';
import { randomSupersetRoleName } from '../utils/functions/superset';

let odoo: Odoo;
let openmrs: OpenMRS;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  odoo = new Odoo(page);
  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);
});
/*
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
  await keycloak.selectOdooId();
  await keycloak.selectSessions();
  await expect(page.locator('h1.pf-c-title:nth-child(2)')).toHaveText(/no sessions/i);
  await expect(page.locator('.pf-c-empty-state__body')).toHaveText(/there are currently no active sessions for this client/i);
});/
*/
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
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomOdooGroupName.groupName}`);
});
/*
test('Existing Odoo groups are synced as roles in Keycloak.', async ({ page }) => {
  // setup
  await page.goto(`${ODOO_URL}`);
  await odoo.enterLoginCredentials();
  await expect(page.locator('li.o_user_menu a span')).toHaveText(/administrator/i);
  await odoo.activateDeveloperMode();

  // replay
  await odoo.navigateToGroups();
  await expect(page.getByText('A warning can be set on a partner (Account)')).toBeVisible();
  await expect(page.getByText('Billing Administrator')).toBeVisible();
  await expect(page.getByText('Discount on lines')).toBeVisible();
  await expect(page.getByText('Basic pricelists')).toBeVisible();
  await expect(page.getByText('Access to Private Addresses')).toBeVisible();
  await expect(page.getByText('Addresses in sales orders')).toBeVisible();
  await expect(page.getByText('Allow the cash rounding management')).toBeVisible();
  await expect(page.getByText('Access to export feature')).toBeVisible();
  await expect(page.getByText('Advanced Pricelists')).toBeVisible();
  await expect(page.getByText('Display Serial & Lot Number in Delivery Slips')).toBeVisible();
  await expect(page.getByText('A warning can be set on a product or a customer (Sale)')).toBeVisible();
  await expect(page.getByText('Display incoterms on Sales Order and related invoices')).toBeVisible();
  await expect(page.getByText('Display Serial & Lot Number on Invoices')).toBeVisible();
    // add tests for missing existing internal groups

  // verify
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  //assert all the Odoo groups
  //await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomOdooGroupName.groupName}`);
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
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomOdooGroupName.groupName}`);

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
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  await expect(page.getByText(`${randomSupersetRoleName.updatedRoleName}`)).toBeVisible();
});

test('Deleting a synced Odoo group deletes the corresponding Keycloak role.', async ({ page }) => {
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
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomOdooGroupName.groupName}`);

  // replay
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSettings();
  await odoo.navigateToGroups();
  await odoo.searchGroup();
  await odoo.deleteGroup();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
});
*/
test.afterEach(async ({ page }) => {
  await page.close();
});