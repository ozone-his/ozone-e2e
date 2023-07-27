import { Page, expect } from '@playwright/test';

export var patientName = {
  firstName : '',
  givenName : ''
}

var patientFullName = '';

const delay = (mills) => {
  let datetime1 = new Date().getTime();
  let datetime2 = datetime1 + mills;
  while(datetime1 < datetime2) {
     datetime1 = new Date().getTime();
    }
}

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
    await delay(4000);
  }

  async goToAnalytics() {
    await this.page.goto('https://analytics.ozone-qa.mekomsolutions.net/');
  }

  async goToOdoo() {
    await this.page.goto('https://erp.ozone-qa.mekomsolutions.net/');
    await this.page.getByRole('link', { name: 'Login with Single Sign-On' }).click();
  }

  async goToSENAITE() {
    await this.page.goto('https://lims.ozone-qa.mekomsolutions.net/');
  }

  async createPatient() {
    patientName = {
      firstName : `e2e_test_${Math.floor(Math.random() * 10000)}`,
      givenName : `${(Math.random() + 1).toString(36).substring(2)}`
    }

    patientFullName = patientName.firstName + ' ' + patientName.givenName;

    await this.page.getByRole('button', { name: 'Add Patient' }).click();
    await this.page.getByLabel('First Name').clear();
    await this.page.getByLabel('First Name').fill(`${patientName.firstName}`);
    await this.page.getByLabel('Family Name').clear();
    await this.page.getByLabel('Family Name').fill(`${patientName.givenName}`);
    await this.page.locator('label').filter({ hasText: /^Male$/ }).locator('span').first().click();
    await this.page.locator('div').filter({ hasText: /^Date of Birth Known\?YesNo$/ }).getByRole('tab', { name: 'No' }).click();
    await this.page.getByLabel('Estimated age in years').clear();
    await this.page.getByLabel('Estimated age in years').type('24');
    await expect(this.page.getByText('Register Patient')).toBeVisible();
    if (await this.page.getByTitle('close notification').isVisible()) {
      await this.page.getByTitle('close notification').click();
    }
    await this.page.getByRole('button', { name: 'Register Patient' }).click();

    await expect(this.page.getByText('New Patient Created')).toBeVisible();

    await this.page.getByRole('button', { name: 'Start a visit' }).click();
    await this.page.locator('label').filter({ hasText: 'Facility Visit' }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: 'Start a visit' }).click();

    await expect(this.page.getByText('Facility Visit started successfully')).toBeVisible();
  }

  async searchPatient(searchText: string) {
    await this.patientSearchIcon().click();
    await this.patientSearchBar().type(searchText);
    await this.page.getByRole('link', { name: `${patientFullName}`}).click();
  }

  async startPatientVisit() {
    await this.searchPatient(`${patientFullName}`)
    await this.page.getByRole('button', { name: 'Start a visit' }).click();
    await this.page.locator('label').filter({ hasText: 'Facility Visit' }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: 'Start a visit' }).click();

    await expect(this.page.getByText('Facility Visit started successfully')).toBeVisible();
  }

  async endPatientVisit() {
    await this.searchPatient(`${patientFullName}`)
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'End visit' }).click();
    await this.page.getByRole('button', { name: 'danger End Visit' }).click();

    await expect(this.page.getByText('Visit ended')).toBeVisible();

    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async deletePatient(){
    await this.page.goto(`${process.env.E2E_BASE_URL}/openmrs/admin/patients/index.htm`);
    await this.page.getByPlaceholder(' ').type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.locator('#openmrsSearchTable tbody tr.odd td:nth-child(1)').click();
    await this.page.locator('input[name="voidReason"]').fill('Delete patient created by smoke tests');
    await this.page.getByRole('button', { name: 'Delete Patient', exact: true }).click();

    const message = await this.page.locator('//*[@id="patientFormVoided"]').textContent();
    expect(message?.includes('This patient has been deleted')).toBeTruthy();
    await this.page.getByRole('link', { name: 'Log out' }).click();
  }

  async goToLabOrderForm() {
    await this.page.locator('div').filter({ hasText: /^Form$/ }).getByRole('button').click();
    await delay(4000);
    await expect(this.page.getByText('Laboratory Tests')).toBeVisible();
    await this.page.getByText('Laboratory Tests').click();
  }

  async saveLabOrder() {
    await this.page.getByRole('button', { name: 'Save and close' }).click();
    await expect(this.page.getByText('Lab order(s) generated')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close' }).click();
    await delay(4000);
  }

  async updateLabOrder() {
    await this.page.getByRole('link', { name: 'Visits' }).click();
    await this.page.getByRole('tab', { name: 'All encounters' }).click();
    await this.page.getByRole('row', { name: 'Encounter table actions menu' }).getByRole('button', { name: 'Encounter table actions menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Edit this encounter' }).click();
    await this.page.locator('#tab select').selectOption('160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    await this.page.getByRole('button', { name: 'Save and close' }).click();
    await expect(this.page.getByText('Lab order(s) generated')).toBeVisible();
    await delay(2000);
  }

  async discontinueLabOrder() {
    await this.page.getByRole('link', { name: 'Visits' }).click();
    await this.page.getByRole('tab', { name: 'All encounters' }).click();
    await this.page.getByRole('row', { name: 'Encounter table actions menu' }).getByRole('button', { name: 'Encounter table actions menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Delete this encounter' }).click();
    await this.page.getByRole('button', { name: 'danger Delete' }).click();

    await expect(this.page.getByText('Encounter deleted')).toBeVisible();
    await expect(this.page.getByText('Encounter successfully deleted')).toBeVisible();
    await delay(2000);
  }

  async createPartition() {
    await this.page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
    await this.page.locator('input[type=checkbox]').first().click();
    await delay(3000);
    await this.page.locator('#receive_transition span:nth-child(1)').click();
    await this.page.getByRole('button', { name: 'Create Partitions' }).click();
    await this.page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
    await delay(3000);
  }

  async publishLabResults() {
    await this.page.locator('#ajax_save_selection').click();
    await this.page.getByRole('button', { name: 'Submit' }).click();
    await this.page.locator('input[name="uids\\:list"]').first().check();
    await this.page.getByRole('button', { name: 'Verify' }).click();
    await this.page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
    await this.page.locator('input[name="uids\\:list"]').check();
    await delay(3000);
    await this.page.locator('#publish_transition span:nth-child(1)').click();
    await delay(5000)
    await this.page.getByRole('button', { name: 'Email' }).click();
    await delay(5000)
    await this.page.getByRole('button', { name: 'Send' }).click();
    await delay(5000)
  }

  async viewTestResults() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByRole('link', { name: 'Test Results' }).click();
    await this.page.getByRole('tab', { name: 'Panel' }).click();
  }

  async createDrugOrder() {
    await this.page.getByRole('complementary').filter({ hasText: 'MedicationsNoteFormPatient lists' }).getByRole('button').first().click();
    await this.page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
    await this.page.getByRole('listitem').filter({ hasText: 'Aspirin 325mg — 325mg — tabletImmediately add to basket' }).click();
    await delay(4000)
    await this.page.getByPlaceholder('Dose').fill('4');
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(1).click();
    await this.page.getByText('Intravenous').click();
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(2).click();
    await this.page.getByText('Twice daily').click();
    await this.page.getByPlaceholder('Additional dosing instructions (e.g. "Take after eating")').fill('Take after eating');
    await this.page.getByLabel('Duration', { exact: true }).fill('5');
    await this.page.getByLabel('Quantity to dispense').fill('12');
    await this.page.getByLabel('Prescription refills').fill('3');
    await this.page.getByPlaceholder('e.g. "Hypertension"').type('Hypertension');
    await this.page.getByRole('button', { name: 'Save order' }).focus();
    await expect(this.page.getByText('Save order')).toBeVisible();
    await this.page.getByRole('button', { name: 'Save order' }).click();
    await this.page.getByRole('button', { name: 'Sign and close' }).focus();
    await expect(this.page.getByText('Sign and close')).toBeVisible();
    await this.page.getByRole('button', { name: 'Sign and close' }).click();
    await delay(4000);
  }

  async reviseDrugOrder() {
    await this.page.getByRole('complementary').filter({ hasText: 'MedicationsNoteFormPatient lists' }).getByRole('button').first().click();
    await this.page.getByRole('complementary').filter({ hasText: 'Order basketMaximizeHideSearch for a drug or orderset (e.g. "Aspirin")Order Bask' }).getByRole('button', { name: 'Actions menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Modify' }).click();
    await this.page.getByRole('listitem').filter({ hasText: 'Modify' }).click();
    await delay(4000);
    await this.page.getByPlaceholder('Dose').clear();
    await this.page.getByPlaceholder('Dose').fill('8');
    await this.page.getByPlaceholder('Frequency').click();
    await this.page.getByText('Thrice daily').click();
    await this.page.getByLabel('Duration', { exact: true }).clear();
    await this.page.getByLabel('Duration', { exact: true }).fill('6');
    await this.page.getByRole('button', { name: 'Save order' }).focus();
    await this.page.getByRole('button', { name: 'Save order' }).dispatchEvent('click');
    await expect(this.page.getByText('Sign and close')).toBeVisible();
    await this.page.getByRole('button', { name: 'Sign and close' }).focus();
    await this.page.getByRole('button', { name: 'Sign and close' }).dispatchEvent('click');
    await delay(4000);
  }

  async discontinueDrugOrder() {
    await this.page.getByRole('complementary').filter({ hasText: 'MedicationsNoteFormPatient lists' }).getByRole('button').first().click();
    await this.page.getByRole('button', { name: 'Actions menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Discontinue' }).click();
    await expect(this.page.getByText('Sign and close')).toBeVisible();
    await this.page.getByRole('button', { name: 'Sign and close' }).focus();
    await this.page.getByRole('button', { name: 'Sign and close' }).dispatchEvent('click');
    await delay(3000);
  }

  async addPatientCondition() {
    await this.page.getByRole('link', { name: 'Conditions' }).click();
    await this.page.getByText('Record conditions').click();
    await this.page.getByPlaceholder('Search conditions').fill('Typhoid fever');
    await this.page.getByRole('menuitem', { name: 'Typhoid fever' }).click();
    await this.page.getByLabel('Onset date').fill('27/07/2023');
    await this.page.getByRole('button', { name: 'Save & close' }).click();

    await expect(this.page.getByText('Condition saved successfully')).toBeVisible();
    await delay(2000);
    const patientCondition = await this.page.locator('table tbody tr:nth-child(1) td:nth-child(1)');
    await expect(patientCondition).toHaveText('Typhoid fever');
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async addPatientBiometrics() {
    await this.page.getByRole('link', { name: 'Vitals & Biometrics' }).click();
    await this.page.getByText('Record biometrics').click();
    await this.page.getByRole('spinbutton', { name: 'Weight' }).fill('78');
    await this.page.getByRole('spinbutton', { name: 'Height' }).fill('165');
    await this.page.getByRole('spinbutton', { name: 'MUAC' }).fill('34');
    await this.page.getByRole('button', { name: 'Save and close' }).click();

    await expect(this.page.getByText('Biometrics saved')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async addPatientAppointment() {
    await this.page.getByRole('link', { name: 'Appointments' }).click();
    await this.page.getByRole('button', { name: 'Add', exact: true }).click();
    await this.page.getByRole('combobox', { name: 'Select service' }).selectOption('General Medicine service');
    await this.page.getByRole('combobox', { name: 'Select the type of appointment' }).selectOption('WalkIn');
    await this.page.getByPlaceholder('Write any additional points here').clear();
    await this.page.getByPlaceholder('Write any additional points here').fill('This is an appointment.');
    await this.page.getByRole('button', { name: 'Save and close' }).click();
    await expect(this.page.getByText('Appointment scheduled')).toBeVisible();

    await this.page.getByRole('tab', { name: 'Today' }).click();
    const serviceType = await this.page.locator('table tbody tr:nth-child(1) td:nth-child(3)');
    await expect(serviceType).toHaveText('General Medicine service');

    const appointmentType = await this.page.locator('table tbody tr:nth-child(1) td:nth-child(5)');
    await expect(appointmentType).toHaveText('WalkIn');

    const appointmentStatus = await this.page.locator('table tbody tr:nth-child(1) td:nth-child(4)');
    await expect(appointmentStatus).toHaveText('Scheduled');
  }

  async selectDBSchema() {
    await this.page.getByRole('button', { name: 'triangle-down SQL Lab' }).click();
    await this.page.getByRole('link', { name: 'SQL Editor' }).click();
    await this.page.locator('div').filter({ hasText: /^Select schema or type schema name$/ }).nth(1).click();
    await this.page.getByTitle('public').getByText('public').click();
    await delay(3000);
    await this.page.getByRole('textbox').clear();
  }

  async runSQLQuery() {
    await this.page.getByRole('button', { name: 'Run' }).click();
    await delay(4000);
  }

  async clearQueryHistory() {
    await this.page.getByRole('button', { name: 'triangle-down SQL Lab' }).click();
    await this.page.getByRole('link', { name: 'SQL Editor' }).click();
    await this.page.getByRole('tab', { name: 'Query history' }).click();
    await this.page.getByRole('textbox').clear();
  }

  async searchCustomerInOdoo() {
    await this.page.locator("//a[contains(@class, 'full')]").click();
    await this.page.getByRole('menuitem', { name: 'Sales' }).click();
    await this.page.getByRole('img', { name: 'Remove' }).click();
    await delay(2000);
    await this.page.getByPlaceholder('Search...').type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByPlaceholder('Search...').press('Enter');
    await delay(2000);
  }

  async searchUpdatedCustomerInOdoo() {
    await this.page.locator("//a[contains(@class, 'full')]").click();
    await this.page.getByRole('menuitem', { name: 'Sales' }).click();
    await this.page.getByRole('img', { name: 'Remove' }).click();
    await delay(1500);
    await this.page.getByPlaceholder('Search...').type('Winniefred'+ ' ' + `${patientName.givenName }`);
    await this.page.getByPlaceholder('Search...').press('Enter');
    await delay(2000);
  }

  async searchClientInSENAITE() {
    await this.page.locator("//i[contains(@class, 'sidebar-toggle-icon')]").click();
    await this.page.getByRole('link', { name: 'Clients Clients' }).click();
    await this.page.getByRole('textbox', { name: 'Search' }).click();
    await this.page.getByRole('textbox', { name: 'Search' }).type(`${patientName.firstName}`);
    await this.page.locator('div.col-sm-3.text-right button:nth-child(2) i').click();
  }

  async searchUpdatedClientInSENAITE() {
    await this.page.getByRole('link', { name: 'Clients Clients' }).click();
    await this.page.getByRole('textbox', { name: 'Search' }).type(`${patientName.givenName}`);
    await this.page.locator('div.col-sm-3.text-right button:nth-child(2) i').click();
  }

  async updatePatientDetails() {
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Edit patient details' }).click();
    await delay(4000);
    await this.page.getByLabel('First Name').click();
    await this.page.getByLabel('First Name').clear();
    await this.page.getByLabel('First Name').type('Winniefred');
    await delay(4000);
    await this.page.locator('label').filter({ hasText: 'Female' }).locator('span').first().click();
    await this.page.getByRole('button', { name: 'Update Patient' }).click();
    await expect(this.page.getByText('Patient Details Updated')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close' }).click();
    await delay(4000);
  }
}
