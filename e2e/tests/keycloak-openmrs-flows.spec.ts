import { test, expect } from '@playwright/test';
import { Keycloak, randomKeycloakRoleName, user } from '../utils/functions/keycloak';
import { OpenMRS, delay, randomOpenMRSRoleName } from '../utils/functions/openmrs';

let openmrs: OpenMRS;
let keycloak: Keycloak;
let browserContext;
let page;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  keycloak = new Keycloak(page);
  openmrs = new OpenMRS(page);

  await keycloak.open();
  await keycloak.navigateToUsers();
  await keycloak.addUserButton().click();
  await keycloak.createUser();
});

test('Logging out from OpenMRS ends the session in Keycloak and logs out the user.', async ({}) => {
  // setup
  await openmrs.navigateToLoginPage();
  await openmrs.open();
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).toBeVisible();

  // replay
  await openmrs.logout();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).not.toBeVisible();
  await openmrs.goToHomePage();
  await expect(page).toHaveURL(/.*login/);
});

test('OpenMRS role assigned to a user in Keycloak is applied upon login in OpenMRS.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();

  // replay
  await keycloak.navigateToUsers();
  await keycloak.searchUser();
  await expect(page.getByText('Organizational: Doctor')).toBeVisible();

  // verify
  await openmrs.navigateToLoginPage();
  await openmrs.open();
  await openmrs.searchUser();
  await expect(page.getByLabel('Organizational: Doctor')).toBeChecked();
  await openmrs.logout();
});

test('Creating an OpenMRS role creates the corresponding Keycloak role.', async ({}) => {
  // setup
  test.setTimeout(240000);
  await openmrs.login();
  await openmrs.navigateToRoles();

  // replay
  await openmrs.addRole();

  // verify
  await keycloak.navigateToHomePage();
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
});

test('Updating a synced OpenMRS role updates the corresponding Keycloak role.', async ({}) => {
  // setup
  test.setTimeout(240000);
  await keycloak.navigateToHomePage();
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
  await openmrs.navigateToRoles();
  await openmrs.updateRole();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();
  await keycloak.searchOpenMRSRole();
  await keycloak.navigateToClientAttributes();
  await expect(page.getByText('Updated role description')).toBeVisible();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Registers Patients')).toBeTruthy();
  await expect(page.getByText('Application: Writes Clinical Notes')).toBeTruthy();
});

test('Deleting a synced OpenMRS role deletes the corresponding Keycloak role.', async ({}) => {
  // setup
  test.setTimeout(240000);
  await keycloak.navigateToHomePage();
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
  await openmrs.deleteRole(), delay(160000);

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();
  await keycloak.searchOpenMRSRole();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).not.toBeVisible();
});

test('A (non-synced) role created from within Keycloak gets deleted in the subsequent polling cycle.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.selectRoles();

  // replay
  await keycloak.createRole();

  // verify
  await page.getByRole('link', { name: 'Client details' }).click();
  await expect(page.getByPlaceholder('Search role by name')).toBeVisible();
  await page.getByPlaceholder('Search role by name').fill(`${randomKeycloakRoleName.roleName}`);
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).toBeVisible(), delay(120000);
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await keycloak.selectOpenMRSId();
  await expect(page.getByPlaceholder('Search role by name')).toBeVisible();
  await page.getByPlaceholder('Search role by name').fill(`${randomKeycloakRoleName.roleName}`);
  await page.getByRole('button', { name: 'Search' }).press('Enter');
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).not.toBeVisible();
  await openmrs.logout();
});

test.afterAll(async ({}) => {
  await keycloak.deleteUser();
});
