import { Page, expect } from '@playwright/test';
import { KEYCLOAK_URL } from '../configs/globalSetup';
import { randomSupersetRoleName } from './superset';
import { delay, randomOpenMRSRoleName } from './openmrs';
import { randomOdooGroupName } from './odoo';

export var randomKeycloakRoleName = {
  roleName : `${(Math.random() + 1).toString(36).substring(2)}`
}

export class Keycloak {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${KEYCLOAK_URL}/admin/master/console`);
    await this.page.getByLabel(/username or email/i).fill(`${process.env.KEYCLOAK_USERNAME}`);
    await this.page.getByLabel(/password/i).fill(`${process.env.KEYCLOAK_PASSWORD}`);
    await this.page.getByRole('button', { name: /sign in/i }).click();
    await expect(this.page).toHaveURL(/.*console/);
    await delay(6000);
  }

  async enterCredentials() {
    await this.page.locator('#username').fill(`${process.env.OZONE_USERNAME}`);
    await this.page.getByRole('button', { name: /continue/i }).click();
    await this.page.locator('#password').fill(`${process.env.OZONE_PASSWORD}`);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }
  
  async createRole() {
    await this.page.getByTestId('create-role').click();
    await this.page.getByLabel('Role name').fill(`${randomKeycloakRoleName.roleName}`);
    await this.page.getByLabel('Description').fill('This is Keycloak test role');
    await this.page.getByTestId(/save/i).click();
    await expect(this.page.getByText(/role created/i)).toBeVisible(), delay(2000);
  }

  async navigateToClients() {
    await this.page.getByTestId('realmSelectorToggle').click();
    await expect(this.page.getByRole('menuitem', { name: 'ozone' })).toBeVisible();
    await this.page.getByRole('menuitem', { name: 'ozone' }).click();
    await this.page.getByRole('link', { name: 'Clients' }).click(), delay(2000);
  }

  async navigateToUsers() {
    await this.page.getByTestId('realmSelectorToggle').click();
    await expect(this.page.getByRole('menuitem', { name: 'ozone' })).toBeVisible();
    await this.page.getByRole('menuitem', { name: 'ozone' }).click();
    await this.page.getByRole('link', { name: 'Users' }).click();
    await delay(2000);
  }

  async searchUser() {
    await expect(this.page.getByPlaceholder('Search user')).toBeVisible();
    await this.page.getByPlaceholder('Search user').fill('jdoe');
    await this.page.getByPlaceholder('Search user').press('Enter');
    await this.page.locator('tr td:nth-child(2) a').click();
    await this.page.getByTestId('role-mapping-tab').click();
  }

  async selectOpenMRSId() {
    await expect(this.page.getByPlaceholder(/search for client/i)).toBeVisible();
    await this.page.getByPlaceholder(/search for client/i).fill('openmrs');
    await this.page.getByRole('button', { name: /search/i }).click();
    await this.page.getByRole('link', { name: 'openmrs', exact: true }).click();
  }

  async selectOdooId() {
    await expect(this.page.getByPlaceholder(/search for client/i)).toBeVisible();
    await this.page.getByPlaceholder(/search for client/i).fill('odoo');
    await this.page.getByRole('button', { name: /search/i }).click();
    await this.page.getByRole('link', { name: 'odoo', exact: true }).click();
  }

  async selectSENAITEId() {
    await expect(this.page.getByPlaceholder(/search for client/i)).toBeVisible();
    await this.page.getByPlaceholder(/search for client/i).fill('senaite');
    await this.page.getByRole('button', { name: /search/i }).click();
    await this.page.getByRole('link', { name: 'senaite', exact: true }).click();
  }

  async selectSupersetId() {
    await expect(this.page.getByPlaceholder(/search for client/i)).toBeVisible();
    await this.page.getByPlaceholder(/search for client/i).fill('superset');
    await this.page.getByRole('button', { name: /search/i }).click();
    await this.page.getByRole('link', { name: 'superset', exact: true  }).click();
  }

  async selectRoles() {
    await this.page.getByTestId('rolesTab').click(), delay(4000);
    await this.page.reload();
  }

  async searchOpenMRSRole() {
    await expect(this.page.getByPlaceholder(/search role by name/i)).toBeVisible();
    await this.page.getByPlaceholder(/search role by name/i).fill(`${randomOpenMRSRoleName.roleName}`);
    await this.page.getByRole('button', { name: 'Search' }).press('Enter');
  }

  async searchSupersetRole() {
    await expect(this.page.getByPlaceholder(/search role by name/i)).toBeVisible();
    await this.page.getByPlaceholder(/search role by name/i).fill(`${randomSupersetRoleName.roleName}`);
    await this.page.getByRole('button', { name: 'Search' }).press('Enter');
  }

  async searchOdooRole() {
    await expect(this.page.getByPlaceholder(/search role by name/i)).toBeVisible();
    await this.page.getByPlaceholder(/search role by name/i).fill(`${randomOdooGroupName.groupName}`);
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
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.roleName}` }).getByLabel(/actions/i).click();
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
