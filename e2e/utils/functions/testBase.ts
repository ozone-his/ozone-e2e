import { Page,expect } from '@playwright/test';

export var patientName = {
  firstName : `E2e${Math.floor(Math.random() * 10000)}`,
  givenName : `Test${(Math.random() + 1).toString(36).substring(2)}`
}

let fullName = patientName.firstName + ' ' + patientName.givenName;

export class HomePage {
  constructor(readonly page: Page) {}

  readonly patientSearchIcon = () => this.page.locator('[data-testid="searchPatientIcon"]');
  readonly patientSearchBar = () => this.page.locator('[data-testid="patientSearchBar"]');
  readonly floatingSearchResultsContainer = () => this.page.locator('[data-testid="floatingSearchResultsContainer"]');

  async initiateLogin() {
    await this.page.goto(`${process.env.E2E_BASE_URL}`);
    await this.page.getByPlaceholder('Username or email').fill(`${process.env.E2E_USER_ADMIN_USERNAME}`);
    await this.page.getByRole('button', { name: 'Continue' }).click();
    await this.page.getByLabel('Password').fill(`${process.env.E2E_USER_ADMIN_PASSWORD}`);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await this.page.locator('label').filter({ hasText: 'Inpatient Ward' }).locator('span').first().click();
    await this.page.getByRole('button', { name: 'Confirm' }).click();
  }

  async createPatient() {
    await this.page.getByRole('button', { name: 'Add Patient' }).click();
    await this.page.getByLabel('First Name').clear();
    await this.page.getByLabel('First Name').fill(patientName.firstName);
    await this.page.getByLabel('Family Name').clear();
    await this.page.getByLabel('Family Name').fill(patientName.givenName);
    await this.page.locator('label').filter({ hasText: /^Male$/ }).locator('span').first().click();
    await this.page.locator('div').filter({ hasText: /^Date of Birth Known\?YesNo$/ }).getByRole('tab', { name: 'No' }).click();
    await this.page.getByLabel('Estimated age in years').clear();
    await this.page.getByLabel('Estimated age in years').type('24');
    await this.page.getByLabel('Estimated age in months').clear();
    await this.page.getByLabel('Estimated age in months').type('8');

    await expect(this.page.getByText('Register Patient')).toBeVisible();

    await this.page.getByRole('button', { name: 'Register Patient' }).click();

    await expect(this.page.getByText('New Patient Created')).toBeVisible();

    await this.page.getByRole('button', { name: 'Start a visit' }).click();
    await this.page.locator('label').filter({ hasText: 'Facility Visit' }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: 'Start a visit' }).click();

    await expect(this.page.getByText('Facility Visit started successfully')).toBeVisible();
  }

  async startPatientVisit() {
    await this.findPatient(`${fullName}`)
    await this.page.getByRole('button', { name: 'Start a visit' }).click();
    await this.page.locator('label').filter({ hasText: 'Facility Visit' }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: 'Start a visit' }).click();

    await expect(this.page.getByText('Facility Visit started successfully')).toBeVisible();
  }

  async endPatientVisit() {
    await this.findPatient(`${fullName}`)
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'End visit' }).click();
    await this.page.getByRole('button', { name: 'danger End Visit' }).click();

    await expect(this.page.getByText('Visit ended')).toBeVisible();

    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async deletePatient(){
    await this.page.goto('https://demo.ozone-his.com/openmrs/admin/patients/index.htm');
    await this.page.getByPlaceholder(' ').type(`${fullName}`);
    await this.page.locator('#openmrsSearchTable tbody tr.odd td:nth-child(1)').click();
    await this.page.locator('input[name="voidReason"]').fill('Delete patient created by smoke tests');
    await this.page.getByRole('button', { name: 'Delete Patient', exact: true }).click();

    const message = await this.page.locator('//*[@id="patientFormVoided"]').textContent();
    expect(message?.includes('This patient has been deleted')).toBeTruthy();

    await this.page.getByRole('link', { name: 'Log out' }).click();
  }

  async createLabOrder() {
    await this.page.waitForSelector('div.-esm-patient-chart__action-menu__chartExtensions___Pqgr8 div:nth-child(3) button');
    await this.page.locator('div').filter({ hasText: /^Form$/ }).getByRole('button').click();

    await expect(this.page.getByText('Laboratory Tests')).toBeVisible();

    await this.page.getByText('Laboratory Tests').click();
    await this.page.getByRole('button', { name: 'Add', exact: true }).click();
    await this.page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    await this.page.getByRole('button', { name: 'Save and close' }).click();

    await expect(this.page.getByText('Lab order(s) generated')).toBeVisible();

    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async createDrugOrder() {
    await this.page.getByRole('complementary').filter({ hasText: 'MedicationsNoteFormPatient lists' }).getByRole('button').first().click();
    await this.page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Hydrochlorothiazide');
    await this.page.getByRole('listitem').filter({ hasText: 'Hydrochlorothiazide 50mg — 50mg — tabletImmediately add to basket' }).click();
    await this.page.getByPlaceholder('Dose').fill('4');
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(1).click();
    await this.page.getByText('Intravenous').click();
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(2).click();
    await this.page.getByText('Twice daily').click();
    await this.page.getByPlaceholder('Additional dosing instructions (e.g. "Take after eating")').fill('Take after eating');
    await this.page.getByLabel('Duration', { exact: true }).fill('5');
    await this.page.getByLabel('Quantity to dispense').fill('15');
    await this.page.getByLabel('Prescription refills').fill('3');
    await this.page.getByPlaceholder('e.g. "Hypertension"').fill('Hypertension');
    await this.page.getByRole('button', { name: 'Save order' }).click();
    await this.page.getByRole('button', { name: 'Sign and close' }).click();

    await expect(this.page.getByText('Order placed')).toBeVisible();
  }

  async goToOdoo() {
    await this.page.goto("https://erp.demo.ozone-his.com");
    await this.page.getByPlaceholder('Email').type('admin');
    await this.page.getByPlaceholder('Password').type('admin');
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }

  async goToSENAITE() {
    await this.page.goto("https://lims.demo.ozone-his.com");
  }

  async findPatient(searchText: string) {
    await this.patientSearchIcon().click();
    await this.patientSearchBar().type(searchText);
    await this.page.getByRole('link', { name: `${fullName}`}).click();
  }
}
