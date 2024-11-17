import { expect, Page } from '@playwright/test';
import { SENAITE_URL } from '../configs/globalSetup';
import { delay, patientName } from './openmrs';
import { Keycloak } from './keycloak';

export class SENAITE {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${SENAITE_URL}`);
    if ((`${process.env.TEST_PRO}` == 'false')) {
      await this.page.locator('#__ac_name').fill(`${process.env.SENAITE_USERNAME_ON_FOSS}`);
      await delay(1000);
      await this.page.locator('#__ac_password').fill(`${process.env.SENAITE_PASSWORD_ON_FOSS}`);
      await delay(1000);
      await this.page.locator('#buttons-login').click();
    }
    await expect(this.page).toHaveURL(/.*senaite/);
  }

  async searchClient() {
    await this.page.getByRole('link', { name: 'Clients', exact: true }).click();
    await expect(this.page.getByRole('textbox', { name: 'Search' })).toBeVisible();
    await this.page.getByRole('textbox', { name: 'Search' }).type(`${patientName.givenName}`);
    await this.page.locator('div.col-sm-3.text-right button:nth-child(2) i').click();
    await delay(2000);
  }

  async receiveSample() {
    await this.page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
    await this.page.locator('input[type=checkbox]').first().click();
    await expect(this.page.getByRole('button', { name: 'Receive' })).toBeEnabled();
    await this.page.locator('#receive_transition span:nth-child(1)').click();
    await delay(2000)
    await this.page.locator('th.select-column input[type=checkbox]').click();
    await this.page.locator('#create_partitions_transition').click();
    await this.page.getByRole('button', { name: 'Create Partitions' }).click();
    await expect(this.page.locator('#samples td.contentcell.state_title div>span')).toHaveText('Received');
    await this.page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
    await delay(3000);
  }

  async publishLabResults() {
    await this.page.locator('#ajax_save_selection').click();
    await this.page.getByRole('button', { name: 'Submit' }).click();
    await this.page.locator('input[name="uids\\:list"]').first().check();
    await this.page.getByRole('button', { name: 'Verify' }).click();
    await this.page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
    await expect(this.page.locator('#samples td.contentcell.state_title div>span')).toHaveText('Verified');
    await this.page.locator('input[name="uids\\:list"]').check();
    await expect(this.page.getByRole('button', { name: 'Publish' })).toBeEnabled();
    await this.page.locator('#publish_transition span:nth-child(1)').click();
    await delay(5000);
    await this.page.getByRole('button', { name: 'Email' }).click();
    await delay(5000);
    await expect(this.page.getByRole('button', { name: 'Send' })).toBeVisible();
    await this.page.getByRole('button', { name: 'Send' }).click();
    await expect(this.page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span')).toHaveText('Published');
    await delay(30000);
  }

  async logout() {
    await this.page.goto(`${SENAITE_URL}`);
    await expect(this.page.locator('#navbarUserDropdown')).toBeVisible();
    await this.page.locator('#navbarUserDropdown').click();
    await expect(this.page.getByRole('link', { name: /log out/i })).toBeVisible();
    await this.page.getByRole('link', { name: /log out/i }).click();
  }
}
