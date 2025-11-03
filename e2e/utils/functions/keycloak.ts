import { Page, expect } from '@playwright/test';
import { KEYCLOAK_URL } from '../configs/globalSetup';
import { supersetRoleName } from './superset';
import { delay, openmrsRoleName } from './openmrs';
import { odooGroupName } from './odoo';

export var keycloakRoleName = {
  roleName : `${(Math.random() + 1).toString(36).substring(2)}`
}

export var user = {
  userName : '',
  firstName : '',
  lastName : '',
  email : '',
  password: '',
}
export class Keycloak {
  constructor(readonly page: Page) {}

  readonly addUserButton = () => this.page.getByTestId('add-user');

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

  async enterUserCredentials() {
    await this.page.locator('#username').fill(`${user.userName}`);
    await this.page.getByRole('button', { name: /continue/i }).click();
    await this.page.locator('#password').fill(`${user.password}`);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }

  async createRole() {
    await this.page.getByTestId('create-role').click();
    await this.page.getByLabel('Role name').fill(`${keycloakRoleName.roleName}`);
    await this.page.getByLabel('Description').fill('This is Keycloak test role');
    await this.page.getByTestId(/save/i).click();
    await expect(this.page.getByText(/role created/i)).toBeVisible(), delay(2000);
  }

  async navigateToHomePage() {
    await this.page.goto(`${KEYCLOAK_URL}/admin/master/console`);
  }
  
  async navigateToClients() {
    await this.selectOzoneRealm();
    await this.page.getByRole('link', { name: 'Clients' }).click(), delay(2000);
  }

  async navigateToAuthentication() {
    await this.selectOzoneRealm();
    await this.page.getByRole('link', { name: 'Authentication' }).click(), delay(2000);
  }

  async selectOzoneRealm() {
    await this.page.getByTestId('realmSelectorToggle').click();
    await expect(this.page.getByRole('menuitem', { name: 'ozone' })).toBeVisible();
    await this.page.getByRole('menuitem', { name: 'ozone' }).click();
  }

  async activateAutoLogin() {
    await this.page.getByRole('link', { name: 'auto login' }).click();
    await this.page.getByRole('button', { name: 'Action' }).click();
    await this.page.getByText('Bind flow').click();
    await expect(this.page.getByText('Flow successfully updated')).toBeVisible();
  }

  async deactivateAutoLogin() {
    await this.page.getByRole('link', { name: 'browser' }).click();
    await this.page.getByRole('button', { name: 'Action' }).click();
    await this.page.getByText('Bind flow').click();
    await expect(this.page.getByText('Flow successfully updated')).toBeVisible();
  }

  async navigateToUsers() {
    await this.page.getByTestId('realmSelectorToggle').click();
    await expect(this.page.getByRole('menuitem', { name: 'ozone' })).toBeVisible();
    await this.page.getByRole('menuitem', { name: 'ozone' }).click();
    await this.page.getByRole('link', { name: 'Users' }).click(), delay(2000);
  }

  async searchUser() {
    await expect(this.page.getByPlaceholder('Search user')).toBeVisible();
    await this.page.getByPlaceholder('Search user').fill(`${user.userName}`);
    await this.page.getByPlaceholder('Search user').press('Enter');
    await this.page.locator('tr td:nth-child(2) a').click();
    await this.page.getByTestId('role-mapping-tab').click();
  }

  async searchAdminUser() {
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
    await this.page.getByPlaceholder(/search role by name/i).fill(`${openmrsRoleName.roleName}`);
    await this.page.getByRole('button', { name: 'Search' }).press('Enter');
  }

  async searchSupersetRole() {
    await expect(this.page.getByPlaceholder(/search role by name/i)).toBeVisible();
    await this.page.getByPlaceholder(/search role by name/i).fill(`${supersetRoleName.roleName}`);
    await this.page.getByRole('button', { name: 'Search' }).press('Enter');
  }

  async searchOdooRole() {
    await expect(this.page.getByPlaceholder(/search role by name/i)).toBeVisible();
    await this.page.getByPlaceholder(/search role by name/i).fill(`${odooGroupName.groupName}`);
    await this.page.getByRole('button', { name: 'Search' }).press('Enter');
  }

  async navigateToClientAttributes() {
    await this.page.getByRole('link', { name: `${openmrsRoleName.roleName}` }).click();
    await this.page.getByTestId('attributesTab').click();
  }

  async selectSessions() {
    await this.page.getByTestId('sessionsTab').click(), delay(2500);
  }

  async deleteSyncedRole() {
    await this.page.getByRole('row', { name: `${supersetRoleName.roleName}` }).getByLabel(/actions/i).click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    await this.page.getByTestId('confirm').click();
    await expect(this.page.getByText(`The role has been deleted`)).toBeVisible(), delay(5000);
    await expect(this.page.getByText(`${supersetRoleName.roleName}`)).not.toBeVisible();
  }

  async createUser() {
    await this.navigateToUsers();
    await this.addUserButton().click();
    user = {
      userName : `${Array.from({ length: 5 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      firstName: `${Array.from({ length: 6 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      lastName: `${Array.from({ length: 6 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      email: `${Array.from({ length: 6 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}@gmail.com`,
      password: `${Array.from({ length: 9 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
    }
    await this.page.locator('input[name="username"]').fill(`${user.userName}`);
    await this.page.getByTestId('email-input').fill(`${user.email}`);
    await this.page.locator('label').filter({ hasText: /yes/i }).locator('span').first().click(), delay(1000);
    await this.page.getByTestId('firstName-input').fill(`${user.firstName}`);
    await this.page.getByTestId('lastName-input').fill(`${user.lastName}`);
    await this.saveUser();
    await this.navigateToCredentials();
    await this.enterUserPassword();
    await this.confirmUserPassword();
    await this.navigateToRoles();
    await this.assignRolesToUser();
  }

  async saveUser() {
    await this.page.getByTestId('create-user').click();
    await expect(this.page.getByRole('heading', { name: /the user has been created/i })).toBeVisible(), delay(2000);
  }

  async navigateToCredentials() {
    await this.page.getByTestId('credentials').click();
  }

  async enterUserPassword() {
    await this.page.getByTestId('no-credentials-empty-action').click();
    await this.page.getByTestId('passwordField').fill(`${user.password}`);
    await this.page.getByTestId('passwordConfirmationField').fill(`${user.password}`);
  }

  async confirmUserPassword() {
    await this.page.locator('label').filter({ hasText: /onoff/i }).locator('span').first().click(), delay(1000);
    await this.page.getByTestId('confirm').click(), delay(1500);
    await this.page.getByTestId('confirm').click();
    await expect(this.page.getByRole('heading', { name: /the password has been set successfully/i })).toBeVisible(), delay(3000);
  }

  async navigateToRoles() {
    await this.page.getByTestId('role-mapping-tab').click();
    await this.page.getByTestId('assignRole').click();
    await this.page.getByRole('button', { name: /filter by realm roles/i }).click();
    await this.page.getByTestId('roles').click(), delay(2000);
  }

  async assignRolesToUser() {
    await this.page.getByTestId('clients:rolesinput').getByRole('textbox', { name: 'Search' }).fill('Alpha');;
    await this.page.getByTestId('clients:rolesinput').getByRole('textbox', { name: 'Search' }).press('Enter'), delay(2000);
    const targetSupersetRole = await this.page.locator('tr', { hasText: 'Alpha' });
    await targetSupersetRole.locator('input[type="checkbox"]').check();
    await this.page.getByTestId('assign').click(), delay(5000);

    await this.navigateToRoles();
    await this.page.getByTestId('clients:rolesinput').getByRole('textbox', { name: 'Search' }).fill('Organizational: Doctor');;
    await this.page.getByTestId('clients:rolesinput').getByRole('textbox', { name: 'Search' }).press('Enter'), delay(2000);
    const targetOpenMRSRole = await this.page.locator('tr', { hasText: 'Organizational: Doctor' });
    await targetOpenMRSRole.locator('input[type="checkbox"]').check();
    await this.page.getByTestId('assign').click(), delay(5000);

    await this.navigateToRoles();
    await this.page.getByTestId('clients:rolesinput').getByRole('textbox', { name: 'Search' }).fill('User types / Internal User');
    await this.page.getByTestId('clients:rolesinput').getByRole('textbox', { name: 'Search' }).press('Enter'), delay(2000);
    const targetOdooRole = await this.page.locator('tr', { hasText: 'Internal User' });
    await targetOdooRole.locator('input[type="checkbox"]').check();
    await this.page.getByTestId('assign').click();
    await expect(this.page.getByText(/user role mapping successfully updated/i)).toBeVisible();
  }

  async deleteUser() {
    await this.page.goto(`${KEYCLOAK_URL}/admin/master/console/#/ozone/users`);
    await this.page.getByRole('textbox', { name: 'search' }).fill(`${user.userName}`);
    await this.page.getByRole('textbox', { name: 'search' }).press('Enter'), delay(1500);
    await this.confirmDelete();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /actions/i }).first().click();
    await this.page.getByRole('menuitem', { name: /delete/i }).click();
    await this.page.getByTestId('confirm').click();
    await expect(this.page.getByText(/the user has been deleted/i).first()).toBeVisible();
  }

  async confirmLogout() {
    await expect(this.page.getByText(/do you want to log out?/i)).toBeVisible();
    await expect(this.page.locator('#kc-logout')).toBeVisible();
    await this.page.locator('#kc-logout').click();
  }
}
