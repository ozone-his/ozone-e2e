import { test, expect, Page } from '@playwright/test';
import { SUPERSET_URL } from '../utils/configs/globalSetup';
import { Keycloak, user } from '../utils/functions/keycloak';
import { delay } from '../utils/functions/openmrs';
import { Superset, supersetRoleName} from '../utils/functions/superset';

let keycloak: Keycloak;
let superset: Superset;
let browserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  superset = new Superset(page);
  keycloak = new Keycloak(page);

  await keycloak.open();
  await keycloak.createUser();
});

test('Logging out from Superset ends the session in Keycloak and logs out the user.', async ({}) => {
  // setup
  await superset.open();
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).toBeVisible();

  // replay
  await superset.logout();
  await expect(page).toHaveURL(/.*login/);

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).not.toBeVisible();
  await page.goto(`${SUPERSET_URL}/superset/welcome`);
  await expect(page).toHaveURL(/.*login/);
});

test('Superset role assigned to a user in Keycloak is applied upon login in Superset.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();

  // replay
  await keycloak.navigateToUsers();
  await keycloak.searchAdminUser();
  await expect(page.getByText('Admin')).toBeVisible();

  // verify
  await superset.login();
  await superset.navigateToUsers();
  await page.locator('tr:has-text("jdoe") a[data-original-title="Show record"]').click();
  const roleText = await page.locator('th:has-text("Role") + td span').textContent();
  await expect(roleText).toBe('[Admin]');
});

test('Creating a Superset role creates the corresponding Keycloak role.', async ({}) => {
  // setup
  await superset.navigateToHomePage();

  // replay
  await superset.addRole();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${supersetRoleName.roleName}`);
});
/*
test('Updating a synced Superset role updates the corresponding Keycloak role.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${supersetRoleName.roleName}`);

  // replay
  await superset.updateRole(), delay(50000);

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.getByText(`${supersetRoleName.updatedRoleName}`)).toBeVisible();
});

test('Deleting a synced Superset role deletes the corresponding Keycloak role.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${supersetRoleName.roleName}`);
  
  // replay
  await superset.deleteRole(), delay(60000);

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.getByText(`${supersetRoleName.roleName}`)).not.toBeVisible();
});

test('A synced role deleted from within Keycloak gets recreated in the subsequent polling cycle.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${supersetRoleName.roleName}`);

  // replay
  await keycloak.deleteSyncedRole(), delay(60000);

  // verify
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${supersetRoleName.roleName}`);
  await superset.deleteRole();
  await superset.logout();
});
*/
test.afterAll(async ({}) => {
  await keycloak.deleteUser();
});
