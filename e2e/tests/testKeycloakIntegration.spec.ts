import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { randomRoleName } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.initiateLogin();

  await expect(page).toHaveURL(/.*home/);
});

test('Creating an OpenMRS role syncs the role into Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addRole();

  // replay
  await homePage.goToKeycloak();
  await homePage.goToRoles();

  // verify
  await expect(page.getByText(`${randomRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await page.getByRole('link', { name: `${randomRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Application: Has Super User Privileges')).toBeTruthy();
  await expect(page.getByText('Application: Administers System')).toBeTruthy();
  await expect(page.getByText('New Patient Created')).toBeVisible();
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.unlinkInheritedRoles();
});

test('Updating a synced OpenMRS role updates the corresponding role in Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addRole();

  // reply
  await homePage.goToKeycloak();
  await homePage.goToRoles();
  await expect(page.getByText(`${randomRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await page.getByRole('link', { name: `${randomRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.updateRole();

  // verify
  await page.goto(`${process.env.E2E_KEYCLOAK_URL}/admin/master/console/`);
  await homePage.goToRoles();
  await page.getByRole('link', { name: `${randomRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Updated role description')).toBeTruthy();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Registers Patients')).toBeTruthy();
  await expect(page.getByText('Application: Writes Clinical Notes')).toBeTruthy();
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.unlinkUpdatedInheritedRoles();
});
/*
test('Deleting a synced OpenMRS role deletes the corresponding role in Keycloak', async ({ page }) => {
  // setup
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  const homePage = new HomePage(page);
  await homePage.addRole();

  // reply
  await homePage.goToKeycloak();
  await homePage.goToRoles();
  await expect(page.getByText(`${randomRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await page.getByRole('link', { name: `${randomRoleName.roleName}` }).click();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.unlinkInheritedRoles();
  await homePage.deleteRole();

  // verify
  await page.goto(`${process.env.E2E_KEYCLOAK_URL}/admin/master/console/`);
  await homePage.goToRoles();
  const roleName = await page.locator('table tbody tr:nth-child(1) td:nth-child(1) a');
  await expect(roleName).not.toHaveText(`${randomRoleName.roleName}`);
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/users/role.list`);
  await homePage.addRole();
});
*/
test.afterEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.deleteRole();
  await page.getByRole('link', { name: 'Log out' }).click();
  await page.close();
});
