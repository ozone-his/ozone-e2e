import { Page, expect } from '@playwright/test';
import {
  E2E_BASE_URL,
  E2E_ODOO_URL,
  E2E_SENAITE_URL,
  E2E_KEYCLOAK_URL,
  E2E_ANALYTICS_URL
}
  from '../configs/globalSetup';

export var patientName = {
  firstName : '',
  givenName : '',
  updatedFirstName : ''
}

var patientFullName = '';

export var randomOpenMRSRoleName = {
  roleName : `Ab${(Math.random() + 1).toString(36).substring(2)}`
}

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

  async initiateLogin() {
    await this.page.goto(`${E2E_BASE_URL}`);
    if (`${process.env.E2E_RUNNING_ON_OZONE_PRO}` == 'true') {
      await this.page.locator('#username').fill(`${process.env.E2E_USER_ADMIN_USERNAME}`);
      await this.page.getByRole('button', { name: 'Continue' }).click();
      await this.page.locator('#password').fill(`${process.env.E2E_USER_ADMIN_PASSWORD}`);
      await this.page.getByRole('button', { name: 'Sign In' }).click();
    } else {
      await this.page.locator('#username').fill(`${process.env.FOSS_E2E_USER_ADMIN_USERNAME}`);
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('button', { name: 'Continue' }).click();
      await this.page.locator('#password').fill(`${process.env.FOSS_E2E_USER_ADMIN_PASSWORD}`);
      await this.page.waitForTimeout(1000);
      await this.page.locator('button[type="submit"]').click();
    }
    if (`${process.env.E2E_RUNNING_ON_OZONE_PRO}` == 'true' && !(await this.page.locator('#checkbox').isChecked())
    && await this.page.locator('input[role="searchbox"]').isVisible()) {
      await this.page.locator('label').filter({ hasText: 'Inpatient Ward' }).locator('span').first().click();
      await this.page.getByRole('button', { name: 'Confirm' }).click();
    } else {
      await this.page.locator('label').filter({ hasText: 'Inpatient Ward' }).locator('span').first().click();
      await this.page.getByRole('button', { name: 'Confirm' }).click();
    }
    await delay(5000);
    await this.expectAllButtonsToBePresent();
  }

  async goToSuperset() {
    await this.page.goto(`${E2E_ANALYTICS_URL}`);
  }

  async goToKeycloak() {
    await this.page.goto(`${E2E_KEYCLOAK_URL}/admin/master/console`);
    await this.page.getByLabel('Username or email').fill('admin');
    await this.page.getByLabel('Password').fill('password');
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await delay(8000);
  }

  async goToOdoo() {
    await this.page.goto(`${E2E_ODOO_URL}`);
    if (`${process.env.E2E_RUNNING_ON_OZONE_PRO}` == 'true') {
      await this.page.getByRole('link', { name: 'Login with Single Sign-On' }).click();
    } else {
      await delay(3000);
      await this.page.locator('#login').fill(`${process.env.FOSS_E2E_USER_ADMIN_USERNAME}`);
      await delay(1000);
      await this.page.locator('#password').fill('admin');
      await delay(1000);
      await this.page.locator('button[type="submit"]').click();
    }
  }

  async goToSENAITE() {
    await this.page.goto(`${E2E_SENAITE_URL}`);
    if (!(`${process.env.E2E_RUNNING_ON_OZONE_PRO}` == 'true')) {
      await delay(3000);
      await this.page.locator('#__ac_name').fill(`${process.env.FOSS_E2E_USER_ADMIN_USERNAME}`);
      await delay(1000);
      await this.page.locator('#__ac_password').fill('password');
      await delay(1000);
      await this.page.locator('#buttons-login').click();
    }
  }

  async createPatient() {
    patientName = {
      firstName : `e2e_test_${Math.floor(Math.random() * 10000)}`,
      givenName : `${(Math.random() + 1).toString(36).substring(2)}`,
      updatedFirstName: `${(Math.random() + 1).toString(36).substring(2)}`
    }
    patientFullName = patientName.firstName + ' ' + patientName.givenName;

    if (`${process.env.E2E_RUNNING_ON_OZONE_PRO}` == 'true') {
      await this.makeDelayFor03ToLoad();
    }
    await this.expectAllButtonsToBePresent();
    await this.page.getByRole('button', { name: 'Add Patient' }).click();
    await expect(this.page.getByRole('button', { name: 'Register Patient' })).toBeEnabled();
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
    if (await this.page.getByTitle('close notification').first().isVisible()) {
      await this.page.getByTitle('close notification').first().click();
    }
    if (await this.page.getByTitle('close notification').isVisible()) {
      await this.page.getByTitle('close notification').click();
    }
    await this.page.getByRole('button', { name: 'Close', exact: true }).click();
    await delay(3000);
  }

  async searchPatient(searchText: string) {
    await this.patientSearchIcon().click();
    await this.patientSearchBar().type(searchText);
    await this.page.getByRole('link', { name: `${patientFullName}` }).first().click();
  }

  async searchOpenMRSPatientID() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await expect(this.page.getByText('Actions', {exact: true})).toBeVisible();
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await expect(this.page.getByText('Edit patient details')).toBeVisible();
    await this.page.getByRole('menuitem', { name: 'Edit patient details' }).click();
    await delay(4000);
    await expect(this.page.getByText('Identifiers', {exact: true})).toBeVisible();
    await expect(this.page.getByText('OpenMRS ID', {exact: true})).toBeVisible();
  }

  async startPatientVisit() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByRole('button', { name: 'Start a visit' }).click();
    await this.page.locator('label').filter({ hasText: 'Facility Visit' }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: 'Start a visit' }).click();
    await expect(this.page.getByText('Facility Visit started successfully')).toBeVisible();
    await delay(4000);
  }

  async endPatientVisit() {
    await this.searchPatient(`${patientFullName}`)
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'End visit' }).click();
    await this.page.getByRole('button', { name: 'danger End Visit' }).click();

    await expect(this.page.getByText('Visit ended')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async deletePatient() {
    await this.page.goto(`${E2E_BASE_URL}/openmrs/admin/patients/index.htm`);
    await this.page.getByPlaceholder(' ').type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.locator('#openmrsSearchTable tbody tr.odd td:nth-child(1)').click();
    await this.page.locator('input[name="voidReason"]').fill('Delete patient created by smoke tests');
    await this.page.getByRole('button', { name: 'Delete Patient', exact: true }).click();

    const message = await this.page.locator('//*[@id="patientFormVoided"]').textContent();
    await expect(message?.includes('This patient has been deleted')).toBeTruthy();
    await this.page.getByRole('link', { name: 'Log out' }).click();
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
    await this.page.getByRole('button', { name: 'Close', exact: true }).click();
  }

  async addPatientBiometrics() {
    await this.page.getByRole('link', { name: 'Vitals & Biometrics' }).click();
    await this.page.getByText('Record biometrics').click();
    await this.page.getByRole('spinbutton', { name: 'Weight' }).fill('78');
    await this.page.getByRole('spinbutton', { name: 'Height' }).fill('165');
    await this.page.getByRole('spinbutton', { name: 'MUAC' }).fill('34');
    await this.page.getByRole('button', { name: 'Save and close' }).click();

    await expect(this.page.getByText('Biometrics saved')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close', exact: true }).click();
  }

  async addPatientAppointment() {
    await this.page.getByRole('link', { name: 'Appointments' }).click();
    await this.page.getByRole('button', { name: 'Add', exact: true }).click();
    await this.page.getByLabel('Select a service').selectOption('General Medicine service');
    await this.page.getByLabel('Select the type of appointment').selectOption('WalkIn');
    await this.page.locator('#duration').clear();
    await this.page.locator('#duration').fill('40');
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
    await this.page.getByRole('button', { name: 'triangle-down SQL', exact: true }).click();
    await this.page.getByRole('link', { name: 'SQL Lab', exact: true }).click();
    await this.page.getByTitle('public').getByText('public').click();
    await delay(4000);
  }

  async clearSQLEditor() {
    await this.page.getByRole('textbox').first().clear();
    await this.page.getByRole('textbox').first().fill('');
    await delay(3000);
  }

  async runSQLQuery() {
    await this.page.getByRole('button', { name: 'Run' }).click();
    await delay(5000);
  }

  async goToLabOrderForm() {
    await this.page.getByLabel('Clinical forms').click();
    await delay(3000);
    await expect(this.page.getByText('Laboratory Test Orders')).toBeVisible();
    await this.page.getByText('Laboratory Test Orders').click();
  }

  async saveLabOrder() {
    await this.page.getByRole('button', { name: 'Save and close' }).click();
    await expect(this.page.getByText('Lab order(s) generated')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close', exact: true }).click();
    await delay(5000);
  }

  async updateLabOrder() {
    await this.page.getByRole('link', { name: 'Visits' }).click();
    await this.page.getByRole('tab', { name: 'All encounters' }).click();
    await this.page.getByRole('button', { name: 'Options', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Edit this encounter' }).click();
    await this.page.locator('#tab select').selectOption('160225AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    await this.page.getByRole('button', { name: 'Save and close' }).click();
    await expect(this.page.getByText('Lab order(s) generated')).toBeVisible();
    await delay(5000);
  }

  async discontinueLabOrder() {
    await this.page.getByRole('link', { name: 'Visits' }).click();
    await this.page.getByRole('tab', { name: 'All encounters' }).click();
    await this.page.getByRole('button', { name: 'Options', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Delete this encounter' }).click();
    await this.page.getByRole('button', { name: 'danger Delete' }).click();

    await expect(this.page.getByText('Encounter deleted')).toBeVisible();
    await expect(this.page.getByText('Encounter successfully deleted')).toBeVisible();
    await delay(5000);
  }

  async createPartition() {
    await this.page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
    await this.page.locator('input[type=checkbox]').first().click();
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
    await this.page.locator('#publish_transition span:nth-child(1)').click();
    await delay(5000);
    await this.page.getByRole('button', { name: 'Email' }).click();
    await delay(5000);
    await this.page.getByRole('button', { name: 'Send' }).click();
    await delay(8000);
  }

  async viewTestResults() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByRole('link', { name: 'Test Results' }).click();
    await this.page.getByRole('tab', { name: 'Panel' }).click();
  }

  async makeDrugOrder() {
    await this.page.getByLabel('Order basket', { exact: true }).click();
    await delay(3000);
    await this.page.getByRole('button', { name: 'Add', exact: true }).nth(0).click();

    await delay(2000);
    await this.page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
    await this.page.getByRole('button', { name: 'Order form' }).click();
    await delay(4000);
    await this.page.getByPlaceholder('Dose').fill('4');
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(1).click();
    await this.page.getByText('Intravenous', {exact: true}).click();
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(2).click();
    await this.page.getByText('Twice daily', {exact: true}).click();
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
    await delay(5000);
  }

  async editDrugOrder() {
    await this.page.getByRole('button', { name: 'Options', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Modify', exact: true }).click();
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
    await delay(5000);
  }

  async discontinueDrugOrder() {
    await this.page.getByRole('button', { name: 'Options', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Discontinue' }).click();
    await expect(this.page.getByText('Sign and close')).toBeVisible();
    await this.page.getByRole('button', { name: 'Sign and close' }).focus();
    await this.page.getByRole('button', { name: 'Sign and close' }).dispatchEvent('click');
    await delay(3000);
  }

  async searchCustomerInOdoo() {
    await this.page.locator("//a[contains(@class, 'full')]").click();
    await this.page.getByRole('menuitem', { name: 'Sales' }).click();
    if (`${process.env.E2E_RUNNING_ON_OZONE_PRO}` == 'true') {
      await this.page.getByRole('img', { name: 'Remove' }).click();
    }
    await delay(1500);
    await this.page.getByPlaceholder('Search...').type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByPlaceholder('Search...').press('Enter');
    await delay(2000);
  }

  async searchClientInSENAITE() {
    await this.page.getByRole('link', { name: 'Clients', exact: true }).click();
    await this.page.getByRole('textbox', { name: 'Search' }).type(`${patientName.givenName}`);
    await this.page.locator('div.col-sm-3.text-right button:nth-child(2) i').click();
    await delay(2000);
  }

  async updatePatientDetails() {
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Edit patient details' }).click();
    await delay(4000);
    await this.page.getByLabel('First Name').click();
    await this.page.getByLabel('First Name').clear();
    await this.page.getByLabel('First Name').type(`${patientName.updatedFirstName}`);
    await delay(4000);
    await this.page.locator('label').filter({ hasText: 'Female' }).locator('span').first().click();
    await this.page.getByRole('button', { name: 'Update Patient' }).click();
    await expect(this.page.getByText('Patient Details Updated')).toBeVisible();
    patientName.firstName = `${patientName.updatedFirstName}`;
    await this.page.getByRole('button', { name: 'Close', exact: true }).click();
    await delay(5000);
  }

  async addOpenMRSRole() {
    await this.page.getByRole('link', { name: 'Add Role' }).click();
    await this.page.locator('#role').fill(`${randomOpenMRSRoleName.roleName}`);
    await this.page.locator('textarea[name="description"]').fill('Role for e2e test');
    await this.page.getByLabel('Application: Edits Existing Encounters').check();
    await this.page.getByLabel('Application: Enters Vitals').check();
    await this.page.getByLabel('Application: Records Allergies').check();
    await this.page.getByLabel('Application: Uses Patient Summary').check();
    await this.page.getByLabel('Organizational: Registration Clerk').check();
    await this.page.getByRole('button', { name: 'Save Role' }).click();
    await expect(this.page.getByText('Role saved')).toBeVisible();
  }

  async updateOpenMRSRole() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.locator('textarea[name="description"]').clear();
    await this.page.locator('textarea[name="description"]').fill('Updated role description');
    await this.page.getByLabel('Application: Registers Patients').check();
    await this.page.getByLabel('Application: Writes Clinical Notes').check();
    await this.page.getByRole('button', { name: 'Save Role' }).click();
    await expect(this.page.getByText('Role saved')).toBeVisible();
  }

  async goToClients() {
    await this.page.getByTestId('realmSelectorToggle').click();
    await this.page.getByRole('menuitem', { name: 'ozone' }).click();
    await this.page.getByRole('link', { name: 'Clients' }).click();
    await delay(2000);
  }

  async unlinkInheritedOpenMRSRoles() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.getByLabel('Application: Edits Existing Encounters').uncheck();
    await this.page.getByLabel('Application: Enters Vitals').uncheck();
    await this.page.getByLabel('Application: Records Allergies').uncheck();
    await this.page.getByLabel('Application: Uses Patient Summary').uncheck();
    await this.page.getByLabel('Organizational: Registration Clerk').uncheck();
    await this.page.getByRole('button', { name: 'Save Role' }).click();
    await expect(this.page.getByText('Role saved')).toBeVisible();
    await delay(2000);
  }

  async unlinkUpdatedOpenMRSInheritedRoles() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.getByLabel('Application: Edits Existing Encounters').uncheck();
    await this.page.getByLabel('Application: Enters Vitals').uncheck();
    await this.page.getByLabel('Application: Records Allergies').uncheck();
    await this.page.getByLabel('Application: Registers Patients').uncheck();
    await this.page.getByLabel('Application: Writes Clinical Notes').uncheck();
    await this.page.getByLabel('Application: Uses Patient Summary').uncheck();
    await this.page.getByLabel('Organizational: Registration Clerk').uncheck();
    await this.page.getByRole('button', { name: 'Save Role' }).click();
    await expect(this.page.getByText('Role saved')).toBeVisible();
  }

  async deleteOpenMRSRole() {
    await this.page.goto(`${E2E_BASE_URL}/openmrs/admin/users/role.list`);
    await this.unlinkInheritedOpenMRSRoles();
    await this.page.getByRole('row', { name: `${randomOpenMRSRoleName.roleName}` }).getByRole('checkbox').check();
    await this.page.getByRole('button', { name: 'Delete Selected Roles' }).click();
    await expect(this.page.getByText(`${randomOpenMRSRoleName.roleName} deleted`)).toBeVisible();
    await delay(1500);
    await this.page.getByRole('link', { name: 'Log out' }).click();
  }

  async makeDelayFor03ToLoad() {
    await this.page.goto(`${E2E_SENAITE_URL}`);
    if (!(`${process.env.E2E_RUNNING_ON_OZONE_PRO}` == 'true')) {
      await delay(3000);
      await this.page.locator('#__ac_name').fill(`${process.env.FOSS_E2E_USER_ADMIN_USERNAME}`);
      await delay(1000);
      await this.page.locator('#__ac_password').fill('password');
      await delay(1000);
      await this.page.locator('#buttons-login').click();
    }
    await delay(4000);
    await this.page.goto(`${E2E_BASE_URL}`);
  }

  async expectAllButtonsToBePresent() {
    await expect(this.page.getByRole('button', { name: 'Search Patient' })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: 'Add Patient' })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: 'Implementer Tools' })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: 'Users' })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: 'App Menu' })).toBeEnabled();
  }

}
