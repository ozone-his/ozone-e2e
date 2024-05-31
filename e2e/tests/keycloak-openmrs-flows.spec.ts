import { test, expect } from '@playwright/test';
import { Keycloak, randomKeycloakRoleName } from '../utils/functions/keycloak';
import { OpenMRS, delay, randomOpenMRSRoleName } from '../utils/functions/openmrs';
import { O3_URL, KEYCLOAK_URL } from '../utils/configs/globalSetup';

let openmrs: OpenMRS;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);

  await openmrs.login();
  await expect(page).toHaveURL(/.*home/);
});

test('Creating an OpenMRS role creates the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);

  // replay
  await openmrs.addRole();

  // verify
  await keycloak.open();
  await expect(page).toHaveURL(/.*console/);
  await keycloak.goToClients();
  await keycloak.selectOpenMRSId()
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await keycloak.goToClientAttributes();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Application: Has Super User Privileges')).toBeTruthy();
  await expect(page.getByText('Application: Administers System')).toBeTruthy();
  await openmrs.deleteRole();
});

test('Updating a synced OpenMRS role updates the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await openmrs.addRole();
  await keycloak.open();
  await expect(page).toHaveURL(/.*console/);
  await keycloak.goToClients();
  await keycloak.selectOpenMRSId();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await keycloak.goToClientAttributes();
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
  await keycloak.goToClients();
  await keycloak.selectOpenMRSId();
  await keycloak.goToClientAttributes();
  await expect(page.getByText('Updated role description')).toBeTruthy();
  await page.getByTestId('attributesTab').click();
  await expect(page.getByText('Application: Registers Patients')).toBeTruthy();
  await expect(page.getByText('Application: Writes Clinical Notes')).toBeTruthy();
  await openmrs.deleteRole();
});

test('Deleting a synced OpenMRS role deletes the corresponding Keycloak role.', async ({ page }) => {
  // setup
  await page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
  await openmrs.addRole();
  await keycloak.open();
  await expect(page).toHaveURL(/.*console/);
  await keycloak.goToClients();
  await keycloak.selectOpenMRSId();
  await expect(page.getByText(`${randomOpenMRSRoleName.roleName}`)).toBeVisible();
  await expect(page.getByText('Role for e2e test').first()).toBeVisible();
  await keycloak.goToClientAttributes();
  await expect(page.getByText('Application: Enters Vitals')).toBeTruthy();
  await expect(page.getByText('Application: Edits Existing Encounters')).toBeTruthy();
  await expect(page.getByText('Application: Uses Patient Summary')).toBeTruthy();
  await expect(page.getByText('Organizational: Registration Clerk')).toBeTruthy();
  await expect(page.getByText('Application: Records Allergies')).toBeTruthy();

  // replay
  await openmrs.deleteRole();

  // verify
  await page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  await keycloak.goToClients();
  await keycloak.selectOpenMRSId();
  const roleName = await page.locator('table tbody tr:nth-child(1) td:nth-child(1) a');
  await expect(roleName).not.toHaveText(`${randomOpenMRSRoleName.roleName}`);
});

test('A (non-synced) role created from within Keycloak gets deleted in the subsequent polling cycle.', async ({ page }) => {
  // setup
  await keycloak.open();
  await keycloak.goToClients();
  await keycloak.selectOpenMRSId();

  // replay
  await keycloak.createRole();

  // verify
  await page.getByRole('link', { name: 'Client details' }).click();
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).toBeVisible();
  await delay(30000);
  await page.getByLabel('Manage').getByRole('link', { name: 'Clients' }).click();
  await keycloak.selectOpenMRSId();
  await expect(page.getByText(`${randomKeycloakRoleName.roleName}`)).not.toBeVisible();
});

test.afterEach(async ({ page }) => {
  await page.close();
});
