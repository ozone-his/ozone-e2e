import { Page, expect } from '@playwright/test';
import { KEYCLOAK_URL } from '../configs/globalSetup';
import { randomSupersetRoleName } from './superset';
import { delay, randomOpenMRSRoleName } from './openmrs';

export var randomKeycloakRoleName = {
  roleName : `${(Math.random() + 1).toString(36).substring(2)}`
}

export class Keycloak {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${KEYCLOAK_URL}/admin/master/console`);
    await this.page.getByLabel('Username or email').fill(`${process.env.KEYCLOAK_USERNAME}`);
    await this.page.getByLabel('Password').fill(`${process.env.KEYCLOAK_PASSWORD}`);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await expect(this.page).toHaveURL(/.*console/);
    await delay(6000);
  }

  async createRole() {
    await this.page.getByTestId('create-role').click();
    await this.page.getByLabel('Role name').fill(`${randomKeycloakRoleName.roleName}`);
    await this.page.getByLabel('Description').fill('This is Keycloak test role');
    await this.page.getByTestId('save').click();
    await expect(this.page.getByText('Role created')).toBeVisible();
    await delay(2000);
  }

  async navigateToClients() {
    await this.page.getByTestId('realmSelectorToggle').click();
    await expect(this.page.getByRole('menuitem', { name: 'ozone' })).toBeVisible();
    await this.page.getByRole('menuitem', { name: 'ozone' }).click();
    await this.page.getByRole('link', { name: 'Clients' }).click();
    await delay(2000);
  }

  async selectOpenMRSId() {
    await expect(this.page.getByPlaceholder('Search for client')).toBeVisible();
    await this.page.getByPlaceholder('Search for client').fill('openmrs');
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByRole('link', { name: 'openmrs', exact: true }).click();
  }

  async selectOdooId() {
    await expect(this.page.getByPlaceholder('Search for client')).toBeVisible();
    await this.page.getByPlaceholder('Search for client').fill('odoo');
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByRole('link', { name: 'odoo', exact: true }).click();
  }

  async selectSENAITEId() {
    await expect(this.page.getByPlaceholder('Search for client')).toBeVisible();
    await this.page.getByPlaceholder('Search for client').fill('senaite');
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByRole('link', { name: 'senaite', exact: true }).click();
  }

  async selectSupersetId() {
    await expect(this.page.getByPlaceholder('Search for client')).toBeVisible();
    await this.page.getByPlaceholder('Search for client').fill('superset');
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByRole('link', { name: 'superset', exact: true  }).click();
  }

  async selectRoles() {
    await this.page.getByTestId('rolesTab').click();
    await delay(4000);
    await this.page.reload();
  }

  async searchOpenMRSRole() {
    await expect(this.page.getByPlaceholder('Search role by name')).toBeVisible();
    await this.page.getByPlaceholder('Search role by name').fill(`${randomOpenMRSRoleName.roleName}`);
    await this.page.getByRole('button', { name: 'Search' }).press('Enter');
  }

  async searchSupersetRole() {
    await expect(this.page.getByPlaceholder('Search role by name')).toBeVisible();
    await this.page.getByPlaceholder('Search role by name').fill(`${randomSupersetRoleName.roleName}`);
    await this.page.getByRole('button', { name: 'Search' }).press('Enter');
  }

  async navigateToClientAttributes() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.getByTestId('attributesTab').click();
  }

  async selectSessions() {
    await this.page.getByTestId('sessionsTab').click();
  }

  async deleteSyncedRole() {
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.roleName}` }).getByLabel('Actions').click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    await this.page.getByTestId('confirm').click();
    await expect(this.page.getByText(`The role has been deleted`)).toBeVisible();
    await expect(this.page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
    await delay(60000);
  }

  async confirmLogout() {
    await expect(this.page.getByText(/do you want to log out?/i)).toBeVisible();
    await expect(this.page.locator('#kc-logout')).toBeVisible();
    await this.page.locator('#kc-logout').click();
  }
}
