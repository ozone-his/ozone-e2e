import { expect, Page } from '@playwright/test';
import { ODOO_URL } from '../configs/globalSetup';
import { delay, patientName } from './openmrs';
import { Keycloak, user } from './keycloak';

export var randomOdooGroupName = {
  groupName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
  updatedGroupName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
}

export class Odoo {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${ODOO_URL}`);
    await expect(this.page).toHaveURL(/.*web/);
  }

  async login() {
    await this.page.goto(`${ODOO_URL}`);
    await this.page.getByRole('link', { name: /login with single sign-on/i }).click(), delay(4000);
    if(await this.page.locator('#username').isVisible()) {
      const keycloak = new Keycloak(this.page);
      await keycloak.enterUserCredentials();
    }
    await expect(this.page).toHaveURL(/.*web/);
  }
  async enterAdminCredentials() {
    await this.page.locator('#login').fill(`${process.env.ODOO_USERNAME}`);
    await this.page.locator('#password').fill(`${process.env.ODOO_PASSWORD}`);
    await this.page.locator('button[type="submit"]').click();
  }

  async searchCustomer() {
    await this.page.getByRole('button', { name: /remove/i }).click(), delay(2000);
    await expect(this.page.locator('.o_searchview_input')).toBeVisible();
    await this.page.locator('.o_searchview_input').fill(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.locator('.o_searchview_input').press('Enter');
    await delay(2000);
  }

  async navigateToSales() {
    await this.page.locator('button[title="Home Menu"]').click(), delay(1500);
    await this.page.getByRole('menuitem', { name: /sales/i }).first().click();
    await expect(this.page.locator('span:has-text("Quotations")')).toBeVisible();
  }

  async createSaleOrderLine() {
    await this.page.getByRole('button', { name: /new/i }).click();
    await this.page.getByLabel('Customer', { exact: true }).type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByText(`${patientName.firstName + ' ' + patientName.givenName}`).first().click();
    await this.page.getByRole('button', { name: 'Add a product' }).click();
    await this.page.locator('td.o_data_cell:nth-child(2) div:nth-child(1) input').fill('Acétaminophene Co 500mg');
    await this.page.getByText('Acétaminophene Co 500mg').first().click();
    await this.page.locator('input[inputmode="decimal"]').nth(0).fill('8');
    await this.page.locator('input[inputmode="decimal"]').nth(1).fill('2.00'), delay(1500);
    await this.page.locator('.o_readonly_modifier.text-muted').click(), delay(2000);
    await expect(this.page.locator('.o_readonly_modifier.text-muted')).toHaveText('$ 16.00');
    await this.page.getByRole('button', { name: /confirm/i }).click(), delay(3000);
    await expect(this.page.locator('td[name="product_template_id"] span')).toHaveText('Acétaminophene Co 500mg');
    await expect(this.page.locator('td.o_data_cell:nth-child(4)')).toHaveText('8');
    await expect(this.page.locator('td.o_data_cell:nth-child(9)')).toHaveText('2.00');
    await expect(this.page.locator('td.o_data_cell:nth-child(11)')).toHaveText('$ 16.00');
  }

  async createQuotationLine() {
    await this.page.getByRole('button', { name: /create/i }).click();
    await expect(this.page.locator('li.breadcrumb-item:nth-child(2)')).toHaveText(/new/i);
    await this.page.getByLabel('Customer', { exact: true }).type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByText(`${patientName.firstName + ' ' + patientName.givenName}`).first().click();
    await this.page.getByRole('button', { name: 'Add a product' }).click();
    await this.page.locator('td.o_data_cell:nth-child(2) div:nth-child(1) input').fill('Acyclovir Sirop 200mg');
    await this.page.getByText('Acyclovir Sirop 200mg').first().click();
    await this.page.locator('input[inputmode="decimal"]').nth(0).fill('6');
    await this.page.locator('input[inputmode="decimal"]').nth(1).fill('2.00');
    await this.page.locator('.o_readonly_modifier.text-muted').click(), delay(2000);
    await expect(this.page.locator('.o_readonly_modifier.text-muted')).toHaveText('$ 12.00');
    await this.page.getByRole('button', { name: /save/i }).click(), delay(3000);
    await expect(this.page.locator('td[name="product_template_id"] span')).toHaveText('Acyclovir Sirop 200mg');
  }

  async modifySaleOrderLine() {
    await this.page.getByRole('button', { name: /edit/i }).click();
    await this.page.getByText(/acétaminophene co 500mg/i).nth(1).click();
    await this.page.locator('input[inputmode="decimal"]').nth(0).fill('10');
    await this.page.locator('input[inputmode="decimal"]').nth(1).fill('3');
    await this.page.locator('.o_readonly_modifier.text-muted').click(), delay(2000);
    await expect(this.page.locator('.o_readonly_modifier.text-muted')).toHaveText('$ 30.00');
    await this.page.getByRole('button', { name: /save/i }).click(), delay(3000);
  }

  async voidSaleOrderLine() {
    await this.page.getByRole('button', { name: /edit/i }).click();
    await this.page.getByText(/acétaminophene co 500mg/i).nth(1).click();
    await this.page.locator('input[inputmode="decimal"]').nth(0).fill('0');
    await this.page.getByRole('button', { name: /save/i }).click(), delay(1000);
    await this.page.getByRole('button', { name: 'Ok' }).click(), delay(3000);
  }

  async deleteQuotationLine() {
    await this.page.getByRole('button', { name: /edit/i }).click();
    await this.page.getByRole('cell', { name: /delete row/i }).click();
    await this.page.getByRole('button', { name: /save/i }).click(), delay(3000);
  }

  async activateDeveloperMode() {
    await this.navigateToSettings();
    await expect(this.page.locator('#developer_tool a:nth-child(1)')).toBeVisible();
    await this.page.locator('#developer_tool a:nth-child(1)').click();
  }

  async navigateToUsers() {
    await this.navigateToSettings();
    await expect(this.page.locator('button:has-text("Users & Companies")')).toBeVisible();
    await this.page.locator('button:has-text("Users & Companies")').click(), delay(1500);
    await expect(this.page.getByRole('menuitem', { name: /users/i })).toBeVisible();
    await this.page.getByRole('menuitem', { name: /users/i }).click();
  }

  async navigateToGroups() {
    await this.navigateToSettings();
    await expect(this.page.locator('button:has-text("Users & Companies")')).toBeVisible();
    await this.page.locator('button:has-text("Users & Companies")').click(), delay(1500);
    await expect(this.page.getByRole('menuitem', { name: /groups/i })).toBeVisible();
    await this.page.getByRole('menuitem', { name: /groups/i }).click();
  }

  async navigateToSettings() {
    await this.page.locator('button[title="Home Menu"]').click(), delay(1500);
    await this.page.getByRole('menuitem', { name: /settings/i }).first().click();
  }

  async createGroup() {
    await this.page.getByRole('button', { name: /new/i }).click();
    await this.page.getByLabel(/application/i).click();
    await expect(this.page.getByText(/accounting/i)).toBeVisible();
    await this.page.getByText(/accounting/i).click();
    await this.page.getByLabel(/name/i).fill(`${randomOdooGroupName.groupName}`);
    await this.page.getByRole('button', { name: /save/i }).click(), delay(10000);
  }

  async searchUser() {
    await this.page.getByRole('button', { name: /remove/i }).click();
    await expect(this.page.getByRole('searchbox', { name: /search/i })).toBeVisible();
    await this.page.getByRole('searchbox', { name: /search/i }).type(`${user.email}`);
    await this.page.getByRole('searchbox', { name: /search/i }).press('Enter');
    await this.page.getByRole('cell', { name: `${user.email}` }).click(), delay(3000)
  }

  async searchGroup() {
    await this.page.getByLabel(/remove/i).click();
    await expect(this.page.getByRole('searchbox', { name: /search/i })).toBeVisible();
    await this.page.getByRole('searchbox', { name: /search/i }).type(`${randomOdooGroupName.groupName}`);
    await this.page.locator('div>div>input').press('Enter');
    await this.page.getByRole('cell', { name: `${randomOdooGroupName.groupName}` }).click(), delay(4000)
  }

  async updateGroup() {
    await this.page.getByLabel(/name/i).fill(`${randomOdooGroupName.updatedGroupName}`);
    await this.page.getByRole('button', { name: /save/i }).click();
    randomOdooGroupName.groupName = `${randomOdooGroupName.updatedGroupName}`, delay(10000);
  }

  async deleteGroup() {
    const actionsButton = this.page.locator('button:has(i[data-tooltip="Actions"])');
    await actionsButton.waitFor({ state: 'visible' });
    await actionsButton.click();
    await this.page.getByRole('menuitem', { name: /delete/i }).click(), delay(1500);
    await this.page.getByRole('button', { name: /delete/i }).click(), delay(10000);
  }

  async logout() {
    await this.page.goto(`${ODOO_URL}`);
    await expect(this.page.getByRole('button', { name: /user/i })).toBeVisible();
    await this.page.getByRole('button', { name: /user/i }).click();
    await expect(this.page.getByRole('menuitem', { name: /log out/i })).toBeVisible();
    await this.page.getByRole('menuitem', { name: /log out/i }).click();
  }
}
