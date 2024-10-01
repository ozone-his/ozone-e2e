import { Page, expect } from '@playwright/test';
import { delay, patientName } from './openmrs';
import { ERPNEXT_URL } from '../configs/globalSetup';

export class ERPNext {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${ERPNEXT_URL}`);
    await this.page.locator('input#login_email').fill(`${process.env.ERPNEXT_USERNAME}`);
    await this.page.locator('input#login_password').fill(`${process.env.ERPNEXT_PASSWORD}`);
    await this.page.locator('button.btn-login').click();
    await expect(this.page).toHaveURL(/.*home/);
  }

  async searchCustomer() {
    await this.page.getByRole('link', { name: /selling/i }).click();
    await this.page.getByRole('link', { name: 'Customer', exact: true }).click();
    await this.page.getByPlaceholder('Customer Name').clear();
    await this.page.getByPlaceholder('Customer Name').fill(`${patientName.givenName}`);
    await delay(5000);
  }

  async searchQuotation() {
    await this.page.getByRole('link', { name: /selling/i }).click();
    await this.page.getByRole('link', { name: 'Quotation', exact: true }).click();
    await this.page.getByPlaceholder(/title/i).clear();
    await this.page.getByPlaceholder(/party/i).clear();
    await this.page.getByPlaceholder(/title/i).fill(`${patientName.givenName}`);
    await delay(5000);
  }

  async deleteQuotation() {
    await this.page.goto(`${ERPNEXT_URL}/app/quotation`);
    await this.searchQuotation();
    await this.page.getByRole('checkbox', { name: 'Select All' }).check();
    await delay(2000);
    await this.page.getByRole('button', { name: 'Actions' }).click();
    await this.page.getByRole('link', { name: 'Delete' }).click();
    await this.page.getByRole('button', { name: 'Yes' }).click();
    await expect(this.page.getByText('No Quotation found')).toBeVisible();
  }

  async voidQuotation() {
    await this.page.goto(`${ERPNEXT_URL}/app/quotation`);
    await this.searchQuotation();
    await this.page.getByRole('checkbox', { name: 'Select All' }).check();
    await delay(2000);
    await this.page.getByRole('button', { name: 'Actions' }).click();
    await this.page.getByRole('link', { name: 'Cancel' }).click();
    await this.page.getByRole('button', { name: 'Yes' }).click();
  }

  async deleteCustomer() {
    await this.page.goto(`${ERPNEXT_URL}/app/customer`);
    await this.searchCustomer();
    await this.page.getByRole('checkbox', { name: 'Select All' }).check();
    await delay(2000);
    await this.page.getByRole('button', { name: 'Actions' }).click();
    await this.page.getByRole('link', { name: 'Delete' }).click();
    await this.page.getByRole('button', { name: 'Yes' }).click();
    await expect(this.page.getByText('No Customer found')).toBeVisible();
  }
}
