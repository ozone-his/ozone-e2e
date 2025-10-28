import { expect, Page } from '@playwright/test';
import { SENAITE_URL } from '../configs/globalSetup';
import { delay, patientName } from './openmrs';
import { Keycloak } from './keycloak';

export class SENAITE {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${SENAITE_URL}`), delay(4000);
    if(await this.page.locator('#username').isVisible()) {
      const keycloak = new Keycloak(this.page);
      await keycloak.enterUserCredentials();
    }
    await expect(this.page).toHaveURL(/.*senaite-dashboard/);
  }

  async navigateToHomePage() {
    await this.page.goto(`${SENAITE_URL}/senaite-dashboard`), delay(2000);
  }

  async searchClient() {
    await this.page.getByRole('link', { name: 'Clients', exact: true }).click();
    await expect(this.page.getByRole('textbox', { name: 'Search' })).toBeVisible();
    await this.page.getByRole('textbox', { name: 'Search' }).type(`${patientName.givenName}`);
    await this.page.locator('div.col-sm-3.text-right button:nth-child(2) i').click(), delay(2000);
  }

  async receiveSample() {
    await this.page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
    await this.page.locator('input[type=checkbox]').first().click();
    await expect(this.page.getByRole('button', { name: 'Receive' })).toBeEnabled();
    await this.page.locator('#receive_transition span:nth-child(1)').click(), delay(2000)
    await this.page.locator('th.select-column input[type=checkbox]').click();
    await this.page.locator('#create_partitions_transition').click();
    await this.page.getByRole('button', { name: 'Create Partitions' }).click();
    await expect(this.page.locator('#samples td.contentcell.state_title div>span')).toHaveText('Received');
    await this.page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click(), delay(3000);
  }

  async publishLabResults() {
    await this.page.locator('#ajax_save_selection').click();
    await this.page.getByRole('button', { name: 'Submit' }).click(), delay(5000);
    await expect(this.page.locator('input[name="uids\\:list"]').first()).toBeVisible();
    await this.page.locator('input[name="uids\\:list"]').first().check();
    await this.page.getByRole('button', { name: 'Verify' }).click(), delay(5000);
    await this.page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
    await expect(this.page.locator('#samples td.contentcell.state_title div>span')).toHaveText('Verified');
    await this.page.locator('input[name="uids\\:list"]').check();
    await expect(this.page.getByRole('button', { name: 'Publish' })).toBeEnabled();
    await this.page.locator('#publish_transition span:nth-child(1)').click(), delay(5000);
    await expect(this.page.getByText(/loading preview/i)).not.toBeVisible();
    await this.page.getByRole('button', { name: 'Email' }).click(), delay(5000);
    await expect(this.page.getByText(/generating pdf/i)).not.toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Send' })).toBeVisible();
    await this.page.getByRole('button', { name: 'Send' }).click();
    await expect(this.page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span')).toHaveText('Published'), delay(30000);
  }

  async logout() {
    await this.page.goto(`${SENAITE_URL}`);
    await expect(this.page.locator('#navbarUserDropdown')).toBeVisible();
    await this.page.locator('#navbarUserDropdown').click();
    await expect(this.page.getByRole('link', { name: /log out/i })).toBeVisible();
    await this.page.getByRole('link', { name: /log out/i }).click(), delay(4000);
    await expect(this.page.locator('#username')).toBeVisible();
  }
}
