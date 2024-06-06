import { Page } from '@playwright/test';
import { patientName } from '../functions/openmrs';
import { ODOO_URL } from '../configs/globalSetup';
import { delay } from './openmrs';

export class Odoo {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${ODOO_URL}`);
    if (`${process.env.TEST_PRO}` == 'true') {
      await this.page.getByRole('link', { name: 'Login with Single Sign-On' }).click();
    } else {
      await this.page.locator('#login').fill(`${process.env.ODOO_USERNAME_ON_FOSS}`);
      await delay(1000);
      await this.page.locator('#password').fill(`${process.env.ODOO_PASSWORD_ON_FOSS}`);
      await delay(1000);
      await this.page.locator('button[type="submit"]').click();
    }
  }

  async searchCustomer() {
    await this.page.locator("//a[contains(@class, 'full')]").click();
    await this.page.getByRole('menuitem', { name: 'Sales' }).click();
    await delay(1500);
    await this.page.getByPlaceholder('Search...').type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByPlaceholder('Search...').press('Enter');
    await delay(2000);
  }
}
