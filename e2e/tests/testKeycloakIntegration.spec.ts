import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { randomOpenMRSRoleName } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.initiateLogin();

  await expect(page).toHaveURL(/.*home/);
});

test('Adding an OpenMRS role syncs the role into Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addOpenMRSRole();

  // replay
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await page.getByRole('link', { name: 'openmrs', exact: true }).click();
  await page.getByTestId('rolesTab').click();

  // verify
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Application: Has Super User Privileges')).toBeTruthy();
  await expect(page.getByText('Application: Administers System')).toBeTruthy();
});

test('Updating a synced OpenMRS role updates the corresponding role in Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addOpenMRSRole();

  // reply
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await page.getByRole('link', { name: 'openmrs', exact: true }).click();
  await page.getByTestId('rolesTab').click();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.updateOpenMRSRole();

  // verify
  await page.goto(`${process.env.E2E_KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await page.getByRole('link', { name: 'openmrs', exact: true }).click();
  await page.getByTestId('rolesTab').click();
  await page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Updated role description')).toBeTruthy();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Registers Patients')).toBeTruthy();
  await expect(page.getByText('Application: Writes Clinical Notes')).toBeTruthy();
});

test('Deleting a synced OpenMRS role deletes the corresponding role in Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addOpenMRSRole();

  // reply
  await homePage.goToKeycloak();
  await expect(page).toHaveURL(/.*console/);
  await homePage.goToClients();
  await page.getByRole('link', { name: 'openmrs', exact: true }).click();
  await page.getByTestId('rolesTab').click();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await homePage.deleteOpenMRSRole();

  // verify
  await page.goto(`${process.env.E2E_KEYCLOAK_URL}/admin/master/console`);
  await homePage.goToClients();
  await page.getByRole('link', { name: 'openmrs', exact: true }).click();
  await page.getByTestId('rolesTab').click();
  const roleName = await page.locator('table tbody tr:nth-child(1) td:nth-child(1) a');
  await expect(roleName).not.toHaveText(`${randomOpenMRSRoleName.roleName}`);
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.addOpenMRSRole();
});

test.afterEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.deleteOpenMRSRole();
  await page.close();
});
