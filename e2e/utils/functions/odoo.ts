import { expect, Page } from '@playwright/test';
import { ODOO_URL } from '../configs/globalSetup';
import { delay, patientName } from './openmrs';

export class Odoo {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${ODOO_URL}`);
    if (`${process.env.TEST_PRO}` == 'true') {
      await this.page.locator('div.o_login_auth div a').click();
    } else {
      await this.page.locator('#login').fill(`${process.env.ODOO_USERNAME_ON_FOSS}`);
      await this.page.locator('#password').fill(`${process.env.ODOO_PASSWORD_ON_FOSS}`);
      await this.page.locator('button[type="submit"]').click();
    }
    await expect(this.page).toHaveURL(/.*web/);
  }

  async searchCustomer() {
    await expect(this.page.locator('.o_searchview_input')).toBeVisible();
    await this.page.locator('.o_searchview_input').fill(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.locator('.o_searchview_input').press('Enter');
    await delay(2000);
  }

  async navigateToSales() {
    await this.page.locator("//a[contains(@class, 'full')]").click();
    await expect(this.page.getByRole('menuitem', { name: /sales/i })).toBeVisible();
    await this.page.getByRole('menuitem', { name: /sales/i }).click();
    await expect(this.page.locator('.breadcrumb-item')).toHaveText(/quotations/i);
  }

  async createSaleOrderLine() {
    await this.page.getByRole('button', { name: 'Create' }).click();
    await expect(this.page.locator('li.breadcrumb-item:nth-child(2)')).toHaveText(/new/i);
    await this.page.getByLabel('Customer', { exact: true }).type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByText(`${patientName.firstName + ' ' + patientName.givenName}`).first().click();
    await this.page.getByRole('button', { name: 'Add a product' }).click();
    await this.page.locator('td.o_data_cell:nth-child(2) div:nth-child(1) input').fill('Acétaminophene Co 500mg');
    await this.page.getByText('Acétaminophene Co 500mg').first().click();
    await this.page.locator('input[name="product_uom_qty"]').clear();
    await this.page.locator('input[name="product_uom_qty"]').fill('8');
    await this.page.locator('td.o_data_cell:nth-child(7) input').clear();
    await this.page.locator('td.o_data_cell:nth-child(7) input').fill('2.00');
    await this.page.locator('td.o_data_cell:nth-child(9)').click();
    await delay(2000);
    await expect(this.page.locator('td.o_data_cell:nth-child(9)')).toHaveText('$ 16.00');
    await this.page.getByRole('button', { name: 'Confirm' }).click();
    await delay(3000);
    await expect(this.page.locator('td.o_data_cell:nth-child(2) span:nth-child(1) span')).toHaveText('Acétaminophene Co 500mg');
    await expect(this.page.locator('td.o_data_cell:nth-child(4)')).toHaveText('8');
    await expect(this.page.locator('td.o_data_cell:nth-child(9)')).toHaveText('2.00');
    await expect(this.page.locator('td.o_data_cell:nth-child(11)')).toHaveText('$ 16.00');
  }
}
