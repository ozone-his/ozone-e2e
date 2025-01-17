import { Page, expect } from '@playwright/test';
import { ERPNEXT_URL } from '../configs/globalSetup';
import { delay, patientName } from './openmrs';

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
    await expect(this.page.getByPlaceholder('Customer Name')).toBeVisible();
    await this.page.getByPlaceholder('Customer Name').fill(`${patientName.givenName}`), delay(3500);
  }

  async searchQuotation() {
    await this.page.getByRole('link', { name: /selling/i }).click();
    await this.page.getByRole('link', { name: 'Quotation', exact: true }).click();
    await expect(this.page.getByPlaceholder(/title/i)).toBeVisible();
    await this.page.getByPlaceholder(/title/i).clear();
    await this.page.getByPlaceholder(/party/i).clear();
    await this.page.getByPlaceholder(/title/i).fill(`${patientName.givenName}`), delay(3500);
  }
}
