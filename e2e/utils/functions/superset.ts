import { Page, expect } from '@playwright/test';
import { SUPERSET_URL } from '../configs/globalSetup';
import { delay } from './openmrs';

export var randomSupersetRoleName = {
  roleName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
  updatedRoleName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
}

export class Superset {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${SUPERSET_URL}`);
    if ((`${process.env.TEST_PRO}` == 'false')) {
      await this.page.locator('#username').fill(`${process.env.SUPERSET_USERNAME_ON_FOSS}`), delay(500);
      await this.page.locator('#password').fill(`${process.env.SUPERSET_PASSWORD_ON_FOSS}`), delay(500);
      await this.page.locator('input[type="submit"]').click();
    } else {
      await this.page.locator('#btn-signin-keycloak').click();
    }
    await expect(this.page).toHaveURL(/.*superset/);
  }

  async selectDBSchema() {
    await this.page.getByRole('button', { name: 'triangle-down SQL', exact: true }).click();
    await this.page.getByRole('link', { name: 'SQL Lab', exact: true }).click();
    await this.page.getByTitle('public').getByText('public').click(), delay(4000);
  }

  async clearSQLEditor() {
    await this.page.getByRole('textbox').first().clear();
    await this.page.getByRole('textbox').first().fill(''), delay(3000);
  }

  async runSQLQuery() {
    await this.page.getByRole('button', { name: 'Run' }).click(), delay(5000);
  }

  async navigateToUsers() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await expect(this.page.getByText('List Users')).toBeVisible();
    await this.page.getByRole('link', { name: 'List Users' }).click();
  }

  async addRole() {
    await this.page.getByRole('button', { name: /settings/i }).click();
    await expect(this.page.getByText('List Roles')).toBeVisible();
    await this.page.getByRole('link', { name: 'List Roles' }).click();
    await this.page.getByRole('link', { name: 'Add' }).click();
    await this.page.getByPlaceholder('Name').fill(`${randomSupersetRoleName.roleName}`);
    await this.page.getByPlaceholder('Select Value').click();
    await this.page.getByRole('option', { name: 'can read on SavedQuery' }).click();
    await this.page.getByRole('searchbox').click();
    await this.page.getByRole('option', { name: 'can read on Database' }).click();
    await this.page.getByRole('searchbox').click();
    await this.page.getByRole('option', { name: 'can write on Database' }).click();
    await this.page.getByRole('searchbox').click();
    await this.page.getByRole('option', { name: 'can read on Query' }).click();
    await this.page.locator('button[type="submit"]').click(), delay(2000);
    await expect(this.page.getByText(/added row/i)).toBeVisible();
    await expect(this.page.getByText(`${randomSupersetRoleName.roleName}`)).toBeVisible(), delay(50000);
  }

  async updateRole() {
    await this.page.goto(`${SUPERSET_URL}/roles/list/`);
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.roleName}` }).getByRole('link').nth(1).click(), delay(2000);
    await this.page.getByPlaceholder('Name').fill(`${randomSupersetRoleName.updatedRoleName}`);
    await this.page.locator('button[type="submit"]').click(), delay(2000);
    await expect(this.page.getByText(/changed row/i)).toBeVisible();
    await expect(this.page.getByText(`${randomSupersetRoleName.updatedRoleName}`)).toBeVisible(), delay(50000);
  }

  async deleteRole(){
    await this.page.goto(`${SUPERSET_URL}/roles/list`);
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.roleName}` }).getByRole('checkbox').check();
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.roleName}` }).getByRole('link').nth(2).click(), delay(2000);
    await this.page.getByRole('link', { name: 'OK' }).click(), delay(2500);
    await expect(this.page.getByText(/deleted row/i)).toBeVisible();
    await expect(this.page.getByText(`${randomSupersetRoleName.roleName}`)).not.toBeVisible();
  }

  async deleteUpdatedRole(){
    await this.page.goto(`${SUPERSET_URL}/roles/list`);
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.updatedRoleName}` }).getByRole('checkbox').check();
    await this.page.getByRole('row', { name: `${randomSupersetRoleName.updatedRoleName}` }).getByRole('link').nth(2).click(), delay(2000);
    await this.page.getByRole('link', { name: 'OK' }).click(), delay(2500);
    await expect(this.page.getByText(/deleted row/i)).toBeVisible();
    await expect(this.page.getByText(`${randomSupersetRoleName.updatedRoleName}`)).not.toBeVisible();
  }

  async logout() {
    await this.page.goto(`${SUPERSET_URL}`);
    await this.page.getByRole('button', { name: /settings/i }).click();
    await expect(this.page.getByRole('link', { name: /logout/i })).toBeVisible();
    await this.page.getByRole('link', { name: /logout/i }).click();
  }
}
