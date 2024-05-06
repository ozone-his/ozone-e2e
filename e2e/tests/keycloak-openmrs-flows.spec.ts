import { test, expect } from '@playwright/test';
import { HomePage, delay, randomKeycloakRoleName } from '../utils/functions/testBase';
import { randomOpenMRSRoleName, randomSupersetRoleName } from '../utils/functions/testBase';
import { O3_URL, KEYCLOAK_URL } from '../utils/configs/globalSetup';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  homePage = new HomePage(page);
});

test('Creating an OpenMRS role creates the corresponding Keycloak role.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await homePage.addOpenMRSRole();

  // verify
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await homePage.selectOpenMRSId()
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await homePage.goToClientAttributes();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Application: Has Super User Privileges')).toBeTruthy();
  await expect(page.getByText('Application: Administers System')).toBeTruthy();
  await homePage.deleteOpenMRSRole();
});

test('Updating a synced OpenMRS role updates the corresponding Keycloak role.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await homePage.addOpenMRSRole();
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await homePage.selectOpenMRSId();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await homePage.goToClientAttributes();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await homePage.updateOpenMRSRole();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.selectOpenMRSId();
  await homePage.goToClientAttributes();
  await expect(page.getByText('Updated role description')).toBeTruthy();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Registers Patients')).toBeTruthy();
  await expect(page.getByText('Application: Writes Clinical Notes')).toBeTruthy();
  await homePage.deleteOpenMRSRole();
});

test('Deleting a synced OpenMRS role deletes the corresponding Keycloak role.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await homePage.addOpenMRSRole();
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await homePage.selectOpenMRSId();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await homePage.goToClientAttributes();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await homePage.deleteOpenMRSRole();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.selectOpenMRSId();
  const roleName = await page.locator('table tbody tr:nth-child(1) td:nth-child(1) a');
  await expect(roleName).not.toHaveText(`${randomOpenMRSRoleName.roleName}`);
});

test('Creating a Superset role creates the corresponding Keycloak role.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.goToSuperset();
  await homePage.addSupersetRole();

  // verify
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.selectSupersetId();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();
  await homePage.deleteSupersetRole();
});

test('Updating a synced Superset role updates the corresponding Keycloak role.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.goToSuperset();
  await homePage.addSupersetRole();
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.selectSupersetId();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('')).toBeTruthy();
  await homePage.updateSupersetRole();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.selectSupersetId();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  await expect(page.getByText(`${randomSupersetRoleName.updatedRoleName}`)).toBeVisible();
  await homePage.deleteUpdatedSupersetRole();
});

test('Deleting a synced Superset role deletes the corresponding Keycloak role.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.goToSuperset();
  await homePage.addSupersetRole();
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.selectSupersetId();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();
  await homePage.deleteSupersetRole();
  await delay(30000);

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.selectSupersetId();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
});

test('A synced role deleted from within Keycloak gets recreated in the subsequent polling cycle.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.goToSuperset();
  await homePage.addSupersetRole();

  // verify
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.selectSupersetId();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();
  await homePage.deleteSyncedSupersetRoleInKeycloak();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  await delay(30000);
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await homePage.selectSupersetId();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();
  await homePage.deleteSupersetRole();
});

test('A (non-synced) role created from within Keycloak gets deleted in the subsequent polling cycle.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.selectOpenMRSId();
  await homePage.createRoleInKeycloak();

  // verify
  await page.getByRole('link', { name: 'Client details' }).click();
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).toBeVisible();
  await delay(30000);
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await homePage.selectOpenMRSId();
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).not.toBeVisible();
});

test.afterEach(async ({ page }) => {
  await page.close();
});
