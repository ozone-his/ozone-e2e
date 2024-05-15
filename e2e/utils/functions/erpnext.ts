import { Page } from '@playwright/test';
import { delay, patientName } from './openmrs';
import { ERPNEXT_URL } from '../configs/globalSetup';

export class ERPNext {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${ERPNEXT_URL}`);
    await this.page.locator('input#login_email').fill(`${process.env.ERPNEXT_USERNAME}`);
    await this.page.locator('input#login_password').fill(`${process.env.ERPNEXT_PASSWORD}`);
    await this.page.locator('button.btn-login').click();
  }

  async searchCustomer() {
    await this.page.getByRole('link', { name: /selling/i }).click();
    await this.page.getByRole('link', { name: 'Customer', exact: true }).click();
    await this.page.getByPlaceholder('Customer Name').clear();
    await this.page.getByPlaceholder(/customer name/i).fill(`${patientName.givenName}`);
    await delay(3000);
  }

  async searchQuotation() {
    await this.page.getByRole('link', { name: /selling/i }).click();
    await this.page.getByRole('link', { name: 'Quotation', exact: true }).click();
    await this.page.getByPlaceholder(/title/i).clear();
    await this.page.getByPlaceholder(/party/i).clear();
    await this.page.getByPlaceholder(/title/i).fill(`${patientName.givenName}`);
    await delay(3000);
  }
}
