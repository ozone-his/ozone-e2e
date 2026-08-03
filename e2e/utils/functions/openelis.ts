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
  updatedFirstName : '',
  nationalId: ''
}

export class OpenELISGlobal {
  constructor(readonly page: Page) {}

  async open() {
    await this.page.goto(`${MG_OEG_URL}`);
    const keycloak = new Keycloak(this.page);
    await keycloak.enterUserCredentials();
  }

  async goToHomePage() {
    await this.page.goto(`${MG_OEG_URL}`);
  }

  async createPatient() {
    patientName = {
      firstName : `test${Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      lastName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      updatedFirstName: `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      nationalId: `TE${Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
    }
    await this.page.getByRole('button', { name: /open menu/i }).click();
    await this.page.getByRole('button', { name: /order/i }).click();
    await this.page.getByRole('link', { name: /add order/i }).click();
    await this.page.getByRole('button', { name: /new patient/i }).click(), delay(1500);
    await this.page.getByRole('textbox', { name: /national id/i }).fill(`${patientName.nationalId}`);
    await this.page.getByRole('textbox', { name: /last name/i }).fill(`${patientName.lastName}`)
    await this.page.getByRole('textbox', { name: 'first name' }).fill(`${patientName.firstName}`);
    await this.page.locator('label').filter({ hasText: /^Male$/ }).click();
    await this.page.getByRole('textbox', { name: 'dd/mm/yyyy' }).fill('30/06/2006');
  }

  async enterProgram() {
    await this.goToNextPage();
    await this.page.getByRole('heading', { name: 'Program' }).click();
    await this.page.getByLabel('Program').selectOption('Cytology');
  }

  async fillOrderForm() {
    await this.page.getByRole('link', { name: /generate/i }).click(), delay(1500);
    await this.page.getByRole('textbox', { name: /search site name/i }).fill('LA2M Central'), delay(1500);
    await this.page.getByText('LA2M Central').click();
    await this.page.getByRole('textbox', { name: 'Search Requester' }).fill('RASOLO, Fitiavana'), delay(1500);
    await this.page.getByText('RASOLO, Fitiavana').first().click();
    await this.saveForm();
  }

  async selectSingleLabOrder() {
    await this.goToNextPage();
    await this.page.locator('#sampleId_0').selectOption('Whole Blood');
    await this.page.locator('label').filter({ hasText: 'Hematocrit' }).click();
    await this.goToNextPage(), delay(1500);
  }

  async selectMultipleLabOrders() {
    await this.page.locator('#sampleId_0').selectOption('Whole Blood');
    await this.page.locator('label').filter({ hasText: 'Complete Blood Count' }).click();
    await this.page.locator('label').filter({ hasText: 'hemoglobin' }).click();
    await this.goToNextPage(), delay(1500);
  }

  async goToNextPage() {
    await this.page.getByRole('button', { name: /next/i }).click();
  }

  async saveForm() {
    await this.page.getByRole('button', { name: /submit/i }).click();
    await expect(this.page.getByText(/successfully saved/i)).toBeVisible();
  }

}
