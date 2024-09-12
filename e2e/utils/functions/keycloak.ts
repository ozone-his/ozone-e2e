import { Page, expect } from '@playwright/test';
import { randomOpenMRSRoleName } from '../functions/openmrs';
import { randomSupersetRoleName } from '../functions/superset';
import { KEYCLOAK_URL } from '../configs/globalSetup';
import { delay } from './openmrs';

export var randomKeycloakRoleName = {
  roleName : `Aa${(Math.random() + 1).toString(36).substring(2)}`
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

  async goToClients() {
    await this.page.getByTestId('realmSelectorToggle').click();
    await this.page.getByRole('menuitem', { name: 'ozone' }).click();
    await this.page.getByRole('link', { name: 'Clients' }).click();
    await delay(2000);
  }

  async selectOpenMRSId() {
    await expect(this.page.getByPlaceholder('Search for client')).toBeVisible();
    await this.page.getByPlaceholder('Search for client').fill('openmrs');
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByRole('link', { name: 'openmrs', exact: true }).click();
    await this.page.getByTestId('rolesTab').click();
    await delay(4000);
    await this.page.reload();
  }

  async selectSupersetId() {
    await expect(this.page.getByPlaceholder('Search for client')).toBeVisible();
    await this.page.getByPlaceholder('Search for client').fill('superset');
    await this.page.getByRole('button', { name: 'Search' }).click();
    await this.page.getByRole('link', { name: 'superset', exact: true  }).click();
    await this.page.getByTestId('rolesTab').click();
    await delay(3000);
    await this.page.reload();
  }

  async goToClientAttributes() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.getByTestId('attributesTab').click();
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

  async deleteSyncedRole() {
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.roleName}` }).getByLabel('Actions').click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    await this.page.getByTestId('confirm').click();
    await expect(this.page.getByText(`The role has been deleted`)).toBeVisible();
    await expect(this.page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
    await delay(60000);
  }
}
