import { test, expect } from '@playwright/test';
import { HomePage, delay, randomKeycloakRoleName } from '../utils/functions/testBase';
import { randomOpenMRSRoleName, randomSupersetRoleName } from '../utils/functions/testBase';
import { E2E_BASE_URL, E2E_KEYCLOAK_URL } from '../utils/configs/globalSetup';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.initiateLogin();

  await expect(page).toHaveURL(/.*home/);
});

test('Adding an OpenMRS role syncs the role into Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addOpenMRSRole();

  // replay
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await homePage.goToOpenMRSClient();

  // verify
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await homePage.goToOpenMRSClientAttributes();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Application: Has Super User Privileges')).toBeTruthy();
  await expect(page.getByText('Application: Administers System')).toBeTruthy();
  await homePage.deleteOpenMRSRole();
});

test('Updating a synced OpenMRS role updates the corresponding role in Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addOpenMRSRole();

  // reply
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await homePage.goToOpenMRSClient();

  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await homePage.goToOpenMRSClientAttributes();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await page.goto(`${E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.updateOpenMRSRole();

  // verify
  await page.goto(`${E2E_KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.goToOpenMRSClient();
  await homePage.goToOpenMRSClientAttributes();
  await expect(page.getByText('Updated role description')).toBeTruthy();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Registers Patients')).toBeTruthy();
  await expect(page.getByText('Application: Writes Clinical Notes')).toBeTruthy();
  await homePage.deleteOpenMRSRole();
});

test('Deleting a synced OpenMRS role deletes the corresponding role in Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addOpenMRSRole();

  // reply
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await homePage.goToOpenMRSClient();

  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await homePage.goToOpenMRSClientAttributes();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await homePage.deleteOpenMRSRole();

  // verify
  await page.goto(`${E2E_KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.goToOpenMRSClient();
  const roleName = await page.locator('table tbody tr:nth-child(1) td:nth-child(1) a');
  await expect(roleName).not.toHaveText(`${randomOpenMRSRoleName.roleName}`);
});

test('Adding a Superset role syncs the role into Keycloak', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToSuperset();

  // reply
  await homePage.addSupersetRole();

  // verify
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.goToSupersetClient();

  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();

  await homePage.deleteSupersetRole();
});

test('Updating a synced Superset role updates the corresponding role in Keycloak', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToSuperset();

  // reply
  await homePage.addSupersetRole();
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.goToSupersetClient();

  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('')).toBeTruthy();

  await homePage.updateSupersetRole();

  // verify
  await page.goto(`${E2E_KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.goToSupersetClient();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  await expect(page.getByText(`${randomSupersetRoleName.updatedRoleName}`)).toBeVisible();

  await homePage.deleteUpdatedSupersetRole();
});

test('Deleting a synced Superset role deletes the corresponding role in Keycloak', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToSuperset();
  await homePage.addSupersetRole();

  // reply
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.goToSupersetClient();

  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();

  await homePage.deleteSupersetRole();
  await delay(30000);

  // verify
  await page.goto(`${E2E_KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await homePage.goToSupersetClient();

  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
});

test('Deleting a synchronized role in Keycloak gets created in the subsequent polling cycle', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToSuperset();

  // reply
  await homePage.addSupersetRole();

  // verify
  await homePage.goToKeycloak();
  await homePage.goToClients();
  await homePage.goToSupersetClient();

  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();
  await homePage.deleteSyncedSupersetRoleInKeycloak();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  await delay(30000);
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await homePage.goToSupersetClient();
  await expect(page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible();

  await homePage.deleteSupersetRole();
});

test('Creating a role in Keycloak automatically gets deleted during the subsequent polling cycle', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToKeycloak();

  // reply
  await homePage.goToClients();
  await homePage.goToOpenMRSClient();
  await homePage.createRoleInKeycloak();
  await page.getByRole('link', { name: 'Client details' }).click();
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).toBeVisible();
  await delay(30000);
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();

  // verify
  await homePage.goToOpenMRSClient();

  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).not.toBeVisible();
});

test.afterEach(async ({ page }) => {
  await page.close();
});
