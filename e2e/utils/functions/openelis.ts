import { expect, Page } from '@playwright/test';
import { MG_OEG_URL, ODOO_URL } from '../configs/globalSetup';
import { delay } from './openmrs';
import { Keycloak } from './keycloak';

export var odooGroupName = {
  groupName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
  updatedGroupName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
}

export var patientName = {
  firstName : '',
  lastName : '',
  updatedFirstName : ''
}

export class OpenELISGlobal {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${MG_OEG_URL}`);
    const keycloak = new Keycloak(this.page);
    await keycloak.enterUserCredentials();
  }

  async createPatient() {
    patientName = {
      firstName : `test${Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      lastName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      updatedFirstName: `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
    }
    await this.page.getByRole('button', { name: /open menu/i }).click();
    await this.page.getByRole('button', { name: /order/i }).click();
    await this.page.getByRole('link', { name: /add order/i }).click();
    await this.page.getByRole('button', { name: /new patient/i }).click(), delay(1500);
    await this.page.getByRole('textbox', { name: /last name/i }).fill(`${patientName.lastName}`)
    await this.page.getByRole('textbox', { name: 'First Name' }).fill(`${patientName.firstName}`);
    await this.page.locator('label').filter({ hasText: /^Male$/ }).click();
    await this.page.getByRole('textbox', { name: 'dd/mm/yyyy' }).fill('30/06/2006');
  }

  async enterProgram() {
    await this.goToNextPage();
    await this.page.getByRole('heading', { name: 'Program' }).click();
    await this.page.getByLabel('Program').selectOption('Cytology');
  }

  async createLabOrder() {
    await this.goToNextPage();
    await this.page.locator('#sampleId_0').selectOption('Serum');
    await this.page.locator('label').filter({ hasText: 'Hepatitis B Surface Antigen' }).click();
    await this.goToNextPage();
    await this.page.getByRole('link', { name: /generate/i }).click(), delay(1500);
    await this.page.getByRole('textbox', { name: /search site name/i }).type('LA2M Central');
    await this.page.getByText('LA2M Central').click();
    await this.page.getByRole('textbox', { name: 'Search Requester' }).fill('Fitiavana, RASOLO');
    await this.page.getByText('Fitiavana, RASOLO').click();
    await this.saveForm();
  }

  async goToNextPage() {
    await this.page.getByRole('button', { name: /next/i }).click();
  }

  async saveForm() {
    await this.page.getByRole('button', { name: /submit/i }).click();
    await expect(this.page.getByText(/successfully saved/i)).toBeVisible();
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

}
