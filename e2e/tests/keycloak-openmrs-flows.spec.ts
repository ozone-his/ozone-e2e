import { test, expect } from '@playwright/test';
import { O3_URL, KEYCLOAK_URL } from '../utils/configs/globalSetup';
import { Keycloak, randomKeycloakRoleName } from '../utils/functions/keycloak';
import { OpenMRS, delay, randomOpenMRSRoleName } from '../utils/functions/openmrs';

let openmrs: OpenMRS;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);

  await openmrs.login();
  await expect(page.locator('div:nth-child(1)>a')).toHaveText(/home/i);
});

test('Logging out from OpenMRS logs out the user from Keycloak.', async ({ page }) => {
  // setup
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectSessions();
  await expect(page.locator('td:nth-child(1) a').nth(0)).toHaveText(/jdoe/i);

  // replay
  await openmrs.logout();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectSessions();
  await expect(page.locator('h1.pf-c-title:nth-child(2)')).toHaveText(/no sessions/i);
  await expect(page.locator('.pf-c-empty-state__body')).toHaveText(/there are currently no active sessions for this client/i);
  await page.goto(`${O3_URL}/openmrs/spa/home/`);
  await expect(page).toHaveURL(/.*login/);
});
test('Creating an OpenMRS role creates the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);

  // replay
  await openmrs.addRole();

  // verify
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();
  await keycloak.searchOpenMRSRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomOpenMRSRoleName.roleName}`);
  await expect(page.locator('tbody:nth-child(2)  td:nth-child(3)')).toHaveText('OpenMRS role for e2e test');
  await keycloak.navigateToClientAttributes();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Application: Has Super User Privileges')).toBeTruthy();
  await expect(page.getByText('Application: Administers System')).toBeTruthy();
  await openmrs.deleteRole();
  await openmrs.logout();
});

test('Updating a synced OpenMRS role updates the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await openmrs.addRole();
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();
  await keycloak.searchOpenMRSRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomOpenMRSRoleName.roleName}`);
  await expect(page.locator('tbody:nth-child(2)  td:nth-child(3)')).toHaveText('OpenMRS role for e2e test');
  await keycloak.navigateToClientAttributes();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();

  // replay
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await openmrs.updateRole();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();
  await keycloak.searchOpenMRSRole();
  await keycloak.navigateToClientAttributes();
  await expect(page.getByText('Updated role description')).toBeVisible();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Registers Patients')).toBeTruthy();
  await expect(page.getByText('Application: Writes Clinical Notes')).toBeTruthy();
  await openmrs.deleteRole();
  await openmrs.logout();
});

test('Deleting a synced OpenMRS role deletes the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await openmrs.addRole();
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();
  await keycloak.searchOpenMRSRole();
  await expect(page.locator('tbody:nth-child(2) td:nth-child(1) a')).toHaveText(`${randomOpenMRSRoleName.roleName}`);
  await expect(page.locator('tbody:nth-child(2)  td:nth-child(3)')).toHaveText('OpenMRS role for e2e test');
  await keycloak.navigateToClientAttributes();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();

  // replay
  await openmrs.deleteRole();
  await delay(60000);

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();
  await keycloak.searchOpenMRSRole();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).not.toBeVisible();
  await openmrs.logout();
});

test('A (non-synced) role created from within Keycloak gets deleted in the subsequent polling cycle.', async ({ page }) => {
  // setup
  await keycloak.open();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();

  // replay
  await keycloak.createRole();

  // verify
  await page.getByRole('link', { name: 'Client details' }).click();
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).toBeVisible();
  await delay(50000);
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await keycloak.selectOpenMRSId();
  await expect(page.getByPlaceholder('Search role by name')).toBeVisible();
  await page.getByPlaceholder('Search role by name').fill(`${randomKeycloakRoleName.roleName}`);
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).not.toBeVisible();
  await openmrs.logout();
});


test.afterEach(async ({ page }) => {
  await page.close();
});
