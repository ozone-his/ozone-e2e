import { test, expect } from '@playwright/test';
import { Keycloak, user } from '../utils/functions/keycloak';
import { Odoo, odooGroupName } from '../utils/functions/odoo';

let odoo: Odoo;
let keycloak: Keycloak;
let browserContext;
let page;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  keycloak = new Keycloak(page);
  odoo = new Odoo(page);

  await keycloak.open();
  await keycloak.createUser();
});

test('Logging out from Odoo ends the session in Keycloak and logs out the user.', async ({}) => {
  // setup
  await odoo.login();
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).toBeVisible();

  // replay
  await odoo.logout();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).not.toBeVisible();
  await odoo.navigateToHomePage();
  await expect(page.locator('#username')).toBeVisible();
});

test('Odoo role assigned to a user in Keycloak is applied upon login in Odoo.', async ({}) => {
 // setup
  await keycloak.navigateToHomePage();

  // replay
  await keycloak.navigateToUsers();
  await keycloak.searchUser();
  await expect(page.getByText('User types / Internal User')).toBeVisible();

  // verify
  await odoo.loginAsAdmin();
  await odoo.activateDeveloperMode();
  await odoo.navigateToUsers();
  await odoo.searchUser();
  await expect(page.locator('input[type="radio"][data-value="1"]')).toBeChecked();
});

test('Coded Odoo groups create corresponding Keycloak roles.', async ({}) => {
  // setup
  await odoo.open();

  // replay
  await odoo.navigateToGroups();
  await expect(page.getByText('Administration / Settings')).toBeVisible();
  await expect(page.getByText('Extra Rights / Technical Features')).toBeVisible();
  await expect(page.getByText('Invoicing / Billing Administrator')).toBeVisible();
  await expect(page.getByText('Technical / Discount on lines')).toBeVisible();
  await expect(page.getByText('User types / Portal')).toBeVisible();

  // verify
  await keycloak.navigateToHomePage();
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

test('Creating an Odoo group creates the corresponding Keycloak role', async ({}) => {
  // setup
  await odoo.open();

  // replay
  await odoo.navigateToGroups();
  await odoo.createGroup();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`Accounting / ${odooGroupName.groupName}`);
});

test('Updating a synced Odoo group updates the corresponding Keycloak role.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`Accounting / ${odooGroupName.groupName}`);

  // replay
  await odoo.open();
  await odoo.navigateToSettings();
  await odoo.navigateToGroups();
  await odoo.searchGroup();
  await odoo.updateGroup();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.getByText(`Accounting / ${odooGroupName.updatedGroupName}`)).toBeVisible();
});

test('Deleting a synced Odoo group deletes the corresponding Keycloak role.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`Accounting / ${odooGroupName.groupName}`);

  // replay
  await odoo.open();
  await odoo.navigateToSettings();
  await odoo.navigateToGroups();
  await odoo.searchGroup();
  await odoo.deleteGroup();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOdooId();
  await keycloak.selectRoles();
  await keycloak.searchOdooRole();
  await expect(page.getByText(`Accounting / ${odooGroupName.groupName}`)).not.toBeVisible();
});

test.afterAll(async ({}) => {
  await keycloak.deleteUser();
});
