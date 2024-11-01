import { test, expect } from '@playwright/test';
import { KEYCLOAK_URL, SUPERSET_URL } from '../utils/configs/globalSetup';
import { Keycloak } from '../utils/functions/keycloak';
import { OpenMRS, delay } from '../utils/functions/openmrs';
import { Superset, randomSupersetRoleName} from '../utils/functions/superset';

let openmrs: OpenMRS;
let keycloak: Keycloak;
let superset: Superset;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);
  superset = new Superset(page);
});

test('Creating a Superset role creates the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await openmrs.login();
  await superset.open();

  // replay
  await superset.addRole();

  // verify
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomSupersetRoleName.roleName}`);
  await superset.deleteRole();
  await superset.logout();
});

test('Updating a synced Superset role updates the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await openmrs.login();
  await superset.open();
  await superset.addRole();
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomSupersetRoleName.roleName}`);

  // replay
  await superset.updateRole();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  await expect(page.getByText(`${randomSupersetRoleName.updatedRoleName}`)).toBeVisible();
  await superset.deleteUpdatedRole();
  await superset.logout();
});

test('Deleting a synced Superset role deletes the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await openmrs.login();
  await superset.open();
  await superset.addRole();
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomSupersetRoleName.roleName}`);
  
  // replay
  await superset.deleteRole();
  await delay(60000);

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  await superset.logout();
});

test('A synced role deleted from within Keycloak gets recreated in the subsequent polling cycle.', async ({ page }) => {
  // setup
  await openmrs.login();
  await superset.open();
  await superset.addRole();
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomSupersetRoleName.roleName}`);

  // replay
  await keycloak.deleteSyncedRole();

  // verify
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await keycloak.selectSupersetId();
  await keycloak.selectRoles();
  await keycloak.searchSupersetRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomSupersetRoleName.roleName}`);
  await superset.deleteRole();
  await superset.logout();
});

test('Logging out from Superset logs out the user from Keycloak.', async ({ page }) => {
  // setup
  await superset.open();
  await openmrs.enterLoginCredentials();
  await expect(page).toHaveURL(/.*superset/);
  await expect(page.locator('#app div.header')).toHaveText(/home/i);
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectSessions();
  await expect(page.locator('td:nth-child(1) a').nth(0)).toHaveText(/jdoe/i);

  // replay
  await superset.logout();
  await keycloak.confirmLogout();
  await expect(page).toHaveURL(/.*login/);

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectSupersetId();
  await keycloak.selectSessions();
  await expect(page.locator('h1.pf-c-title:nth-child(2)')).toHaveText(/no sessions/i);
  await expect(page.locator('.pf-c-empty-state__body')).toHaveText(/there are currently no active sessions for this client/i);
  await page.goto(`${SUPERSET_URL}/superset/welcome`);
  await expect(page).toHaveURL(/.*login/);
});

test.afterEach(async ({ page }) => {
  await page.close();
});
