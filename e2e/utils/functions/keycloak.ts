import { Page, expect } from '@playwright/test';
import { randomOpenMRSRoleName } from '../functions/openmrs';
import { KEYCLOAK_URL } from '../configs/globalSetup';
import { delay } from './openmrs';

export var randomKeycloakRoleName = {
  roleName : `Aa${(Math.random() + 1).toString(36).substring(2)}`
}

export class Keycloack {
  constructor(readonly page: Page) {}

  async goToKeycloak() {
    await this.page.goto(`${KEYCLOAK_URL}/admin/master/console`);
    await this.page.getByLabel('Username or email').fill(`${process.env.KEYCLOAK_USERNAME}`);
    await this.page.getByLabel('Password').fill(`${process.env.KEYCLOAK_PASSWORD}`);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await delay(8000);
  }

  async createRoleInKeycloak() {
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
    await this.page.getByRole('link', { name: 'openmrs', exact: true }).click();
    await this.page.getByTestId('rolesTab').click();
  }

  async goToClientAttributes() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.getByTestId('attributesTab').click();
  }

  async selectSupersetId() {
    if (await this.page. getByRole('link', { name: 'superset', exact: true }).isHidden()) {
      await this.page.getByLabel('Pagination top').getByLabel('Go to next page').click();
    }
    await this.page.getByRole('link', { name: 'superset', exact: true }).click();
    await this.page.getByTestId('rolesTab').click();
  }

}
