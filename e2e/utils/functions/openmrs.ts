import { Page, expect } from '@playwright/test';
import { O3_URL } from '../configs/globalSetup';

export var patientName = {
  firstName : '',
  givenName : '',
  updatedFirstName : ''
}

var patientFullName = '';

export var randomOpenMRSRoleName = {
  roleName : `${(Math.random() + 1).toString(36).substring(2)}`
}

export const delay = (mills) => {
  let datetime1 = new Date().getTime();
  let datetime2 = datetime1 + mills;
  while(datetime1 < datetime2) {
     datetime1 = new Date().getTime();
    }
}
export class OpenMRS {
  constructor(readonly page: Page) {}

  readonly patientSearchIcon = () => this.page.locator('[data-testid="searchPatientIcon"]');
  readonly patientSearchBar = () => this.page.locator('[data-testid="patientSearchBar"]');

  async login() {
    await this.page.goto(`${O3_URL}`);
    if (`${process.env.TEST_PRO}` == 'true') {
      await this.page.locator('#username').fill(`${process.env.OZONE_USERNAME}`);
      await this.page.getByRole('button', { name: 'Continue' }).click();
      await this.page.locator('#password').fill(`${process.env.OZONE_PASSWORD}`);
      await this.page.getByRole('button', { name: 'Sign In' }).click();
    } else {
      await this.page.locator('#username').fill(`${process.env.O3_USERNAME_ON_FOSS}`);
      await delay(1000);
      await this.page.getByRole('button', { name: 'Continue' }).click();
      await this.page.locator('#password').fill(`${process.env.O3_PASSWORD_ON_FOSS}`);
      await delay(1000);
      await this.page.locator('button[type="submit"]').click();
    }
    await this.page.locator('label').filter({ hasText: 'Inpatient Ward' }).locator('span').first().click();
    await this.page.getByRole('button', { name: 'Confirm' }).click();
    await expect(this.page).toHaveURL(/.*home/);
    await expect(this.page.getByRole('button', { name: 'Search Patient' })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: 'Add Patient' })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: 'My Account' })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: 'App Menu' })).toBeEnabled();
  }

  async createPatient() {
    patientName = {
      firstName : `e2e_test_${Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      givenName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`, 
      updatedFirstName: `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
    }
    patientFullName = patientName.firstName + ' ' + patientName.givenName;
    await expect(this.page.getByRole('button', { name: 'Add Patient' })).toBeEnabled();
    await this.page.getByRole('button', { name: 'Add Patient' }).click();
    await expect(this.page.getByRole('button', { name: 'Register Patient' })).toBeEnabled();
    await this.page.getByLabel('First Name').clear();
    await this.page.getByLabel('First Name').fill(`${patientName.firstName}`);
    await this.page.getByLabel('Family Name').clear();
    await this.page.getByLabel('Family Name').fill(`${patientName.givenName}`);
    await this.page.locator('label').filter({ hasText: /^Male$/ }).locator('span').first().click();
    await this.page.locator('div').filter({ hasText: /^Date of Birth Known\?YesNo$/ }).getByRole('tab', { name: 'No' }).click();
    await this.page.getByLabel('Estimated age in years').clear();
    await this.page.getByLabel('Estimated age in years').fill(`${Math.floor(Math.random() * 99)}`);
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

  async goToHomePage() {
    await this.page.goto(`${O3_URL}/openmrs/spa/home`);
    await expect(this.page).toHaveURL(/.*home/);
  }

  async searchPatient(searchText: string) {
    await this.goToHomePage();
    await this.patientSearchIcon().click();
    await this.patientSearchBar().fill(searchText);
    await this.page.getByRole('link', { name: `${patientFullName}` }).first().click();
  }

  async searchPatientId() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await expect(this.page.getByText('Actions', {exact: true})).toBeVisible();
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await expect(this.page.getByText('Edit patient details')).toBeVisible();
    await this.page.getByRole('menuitem', { name: 'Edit patient details' }).click();
    await delay(4000);
    await expect(this.page.getByText('Identifiers', {exact: true})).toBeVisible();
    await expect(this.page.getByText('OpenMRS ID', {exact: true})).toBeVisible();
  }

  async extractUuidFromURL(url) {
    // Regular expression to match UUID in URL
    var regex = /\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\//;

    var match = regex.exec(url);

    // If a match is found, return the UUID, else return null
    if (match && match.length > 1) {
        return match[1].toString();
    } else {
        return null;
    }
  }

  async getPatientUuid() {
    await this.page.goto(`${O3_URL}/openmrs/spa/home`);
    await this.patientSearchIcon().click();
    await this.patientSearchBar().type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByRole('link', { name: `${patientFullName}` }).first().click();
    let url = await this.page.url();
    return this.extractUuidFromURL(url);
  }

  async startPatientVisit() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByRole('button', { name: 'Start a visit' }).click();
    await this.page.locator('label').filter({ hasText: 'Facility Visit' }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: 'Start visit' }).click();
    await expect(this.page.getByText('Facility Visit started successfully')).toBeVisible();
    await delay(5000);
  }

  async endPatientVisit() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`)
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'End visit' }).click();
    await this.page.getByRole('button', { name: 'danger End Visit' }).click();
    await expect(this.page.getByText('Visit ended')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close', exact: true }).click();
  }

  async voidPatient() {
    await this.page.goto(`${O3_URL}/openmrs/admin/patients/index.htm`);
    await expect(this.page.getByPlaceholder(' ')).toBeVisible();
    await this.page.getByPlaceholder(' ').type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.locator('#openmrsSearchTable tbody tr.odd td:nth-child(1)').click();
    await this.page.locator('input[name="voidReason"]').fill('Void patient created by smoke test');
    await this.page.getByRole('button', { name: 'Delete Patient', exact: true }).click();
    await expect(this.page.locator('//*[@id="patientFormVoided"]')).toContainText('This patient has been deleted');
  }

  async addPatientCondition() {
    await this.page.getByRole('link', { name: 'Conditions' }).click();
    await this.page.getByText('Record conditions').click();
    await this.page.getByPlaceholder('Search conditions').fill('Typhoid fever');
    await this.page.getByRole('menuitem', { name: 'Typhoid fever' }).click();
    await this.page.getByLabel('Onset date').fill('27/07/2023');
    await this.page.getByLabel('Onset date').press('Enter');
    await this.page.locator('label').filter({ hasText: /^Active$/ }).locator('span').first().click();
    await this.page.getByRole('button', { name: 'Save & close' }).click();
    await expect(this.page.getByText('Condition saved successfully')).toBeVisible();
    await delay(2000);
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(1)')).toHaveText('Typhoid fever');
    await this.page.getByRole('button', { name: 'Close', exact: true }).click();
  }

  async voidPatientCondition() {
    await this.page.getByRole('link', { name: 'Conditions' }).click();
    await this.page.getByRole('button', { name: 'Options' }).click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
    await expect(this.page.getByText('Condition Deleted')).toBeVisible();
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
    await this.page.getByLabel('Select an appointment type').selectOption('Scheduled');
    await this.page.locator('#duration').clear();
    await this.page.locator('#duration').fill('40');
    await this.page.getByPlaceholder('Write any additional points here').clear();
    await this.page.getByPlaceholder('Write any additional points here').fill('This is an appointment.');
    await this.page.getByRole('button', { name: 'Save and close' }).click();
    await expect(this.page.getByText('Appointment scheduled')).toBeVisible();
    await this.page.getByRole('tab', { name: 'Today' }).click();
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(3)')).toHaveText('General Medicine service');
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(5)')).toHaveText('Scheduled');
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(4)')).toHaveText('Scheduled');
  }

  async cancelPatientAppointment() {
    await this.page.getByRole('link', { name: 'Appointments' }).click();
    await this.page.getByRole('tab', { name: 'Today' }).click();
    await this.page.getByRole('button', { name: 'Options' }).click();
    await this.page.getByRole('menuitem', { name: 'Cancel' }).click();
    await this.page.getByRole('button', { name: 'Cancel appointment' }).click();
    await expect(this.page.getByText('Appointment cancelled successfully')).toBeVisible();
   }

  async navigateToLabOrderForm() {
    await expect(this.page.getByLabel('Order basket')).toBeVisible();
    await this.page.getByLabel('Order basket').click();
    await delay(2000);
    await expect(this.page.getByRole('button', { name: 'Add', exact: true }).nth(1)).toBeVisible();
    await this.page.getByRole('button', { name: 'Add', exact: true }).nth(1).click();
  }

  async saveLabOrder() {
    await delay(3000);
    await this.page.getByRole('button', { name: 'Order form' }).click();
    await this.page.getByRole('button', { name: 'Save order' }).click();
    await this.page.getByRole('button', { name: 'Sign and close' }).click();
    await expect(this.page.getByText('Placed orders')).toBeVisible();
    await delay(3000);
  }

  async voidEncounter() {
    await this.page.getByRole('link', { name: 'Visits' }).click();
    await this.page.getByRole('tab', { name: 'All encounters' }).click();
    await this.page.getByRole('button', { name: 'Options', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Delete this encounter' }).click();
    await this.page.getByRole('button', { name: 'danger Delete' }).click();
    await expect(this.page.getByText('Encounter deleted')).toBeVisible();
    await expect(this.page.getByText('Encounter successfully deleted')).toBeVisible();
    await delay(5000);
  }

  async cancelLabOrder() {
    await this.page.getByRole('link', { name: 'Orders' }).click();
    await this.page.getByRole('button', { name: 'Options' }).nth(0).click();
    await this.page.getByRole('menuitem', { name: 'Cancel Order' }).click();
    await this.page.getByRole('button', { name: 'Sign and close' }).click();
  }

  async viewTestResults() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByRole('link', { name: 'Results Viewer' }).click();
  }

  async navigateToDrugOrderForm() {
    await expect(this.page.getByLabel('Order basket')).toBeVisible();
    await this.page.getByLabel('Order basket').click();
    await delay(2000);
    await expect(this.page.getByRole('button', { name: 'Add', exact: true }).nth(0)).toBeVisible();
    await this.page.getByRole('button', { name: 'Add', exact: true }).nth(0).click();
  }

  async fillDrugOrderForm() {
    await this.page.getByRole('button', { name: 'Order form' }).click();
    await this.page.getByPlaceholder('Dose').fill('4');
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(1).click();
    await this.page.getByText('Intravenous', {exact: true}).click();
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(2).click();
    await this.page.getByText('Twice daily', {exact: true}).click();
    await this.page.getByPlaceholder('Additional dosing instructions (e.g. "Take after eating")').fill('Take after eating');
    await this.page.getByLabel('Duration', { exact: true }).fill('5');
    await this.page.getByLabel('Quantity to dispense').fill('12');
    await this.page.getByLabel('Prescription refills').fill('3');
    await this.page.locator('#indication').fill('Hypertension');
  }

  async saveDrugOrder() {
    await this.page.getByRole('button', { name: 'Save order' }).focus();
    await expect(this.page.getByText('Save order')).toBeVisible();
    await this.page.getByRole('button', { name: 'Save order' }).click();
    await this.page.getByRole('button', { name: 'Sign and close' }).focus();
    await expect(this.page.getByText('Sign and close')).toBeVisible();
    await this.page.getByRole('button', { name: 'Sign and close' }).click();
    await delay(3000);
  }

  async createDrugOrderWithFreeTextDosage() {
    await expect(this.page.getByLabel('Order basket')).toBeVisible();
    await this.page.getByLabel('Order basket').click();
    await delay(2000);
    await expect(this.page.getByRole('button', { name: 'Add', exact: true }).nth(0)).toBeVisible();
    await this.page.getByRole('button', { name: 'Add', exact: true }).nth(0).click();
    await this.page.getByRole('searchbox').fill('Aspirin 325mg');
    await this.page.getByRole('button', { name: 'Order form' }).click();
    await this.page.locator('div').filter({ hasText: /^Off$/ }).locator('div').click();
    await this.page.getByPlaceholder('Free text dosage').fill('Take up to three tablets per day');
    await this.page.getByLabel('Duration', { exact: true }).fill('3');
    await this.page.getByLabel('Quantity to dispense').fill('9');
    await this.page.getByLabel('Prescription refills').fill('2');
    await this.page.locator('#indication').fill('Hypertension');
    await this.page.getByRole('button', { name: 'Save order' }).focus();
    await expect(this.page.getByText('Save order')).toBeVisible();
    await this.page.getByRole('button', { name: 'Save order' }).click();
    await this.page.getByRole('button', { name: 'Sign and close' }).focus();
    await expect(this.page.getByText('Sign and close')).toBeVisible();
    await this.page.getByRole('button', { name: 'Sign and close' }).click();
    await delay(5000);
  }

  async modifyDrugOrderDescription() {
    await this.page.getByRole('button', { name: 'Options', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Modify', exact: true }).click();
    await this.page.getByPlaceholder('Dose').clear();
    await this.page.getByPlaceholder('Dose').fill('8');
    await this.page.getByLabel('Clear selected item').nth(2).click();
    await this.page.getByPlaceholder('Frequency').click();
    await this.page.getByText('Thrice daily').click();
    await this.page.getByLabel('Duration', { exact: true }).clear();
    await this.page.getByLabel('Duration', { exact: true }).fill('6');
    await this.page.getByLabel('Quantity to dispense').clear();
    await this.page.getByLabel('Quantity to dispense').fill('8');
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

  async updatePatientDetails() {
    await this.page.getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Edit patient details' }).click();
    await delay(4000);
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

  async addRole() {
    await this.page.getByRole('link', { name: 'Add Role' }).click();
    await this.page.locator('#role').fill(`${randomOpenMRSRoleName.roleName}`);
    await this.page.locator('textarea[name="description"]').fill('OpenMRS role for e2e test');
    await this.page.getByLabel('Application: Edits Existing Encounters').check();
    await this.page.getByLabel('Application: Enters Vitals').check();
    await this.page.getByLabel('Application: Records Allergies').check();
    await this.page.getByLabel('Application: Uses Patient Summary').check();
    await this.page.getByLabel('Organizational: Registration Clerk').check();
    await this.page.getByRole('button', { name: 'Save Role' }).click();
    await expect(this.page.getByText('Role saved')).toBeVisible();
    await delay(50000);
  }

  async updateRole() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.locator('textarea[name="description"]').clear();
    await this.page.locator('textarea[name="description"]').fill('Updated role description');
    await this.page.getByLabel('Application: Registers Patients').check();
    await this.page.getByLabel('Application: Writes Clinical Notes').check();
    await this.page.getByRole('button', { name: 'Save Role' }).click();
    await expect(this.page.getByText('Role saved')).toBeVisible();
    await delay(50000);
  }

  async unlinkInheritedRoles() {
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

  async unlinkUpdatedInheritedRoles() {
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

  async deleteRole() {
    await this.page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
    await this.unlinkInheritedRoles();
    await this.page.getByRole('row', { name: `${randomOpenMRSRoleName.roleName}` }).getByRole('checkbox').check();
    await this.page.getByRole('button', { name: 'Delete Selected Roles' }).click();
    await expect(this.page.getByText(`${randomOpenMRSRoleName.roleName} deleted`)).toBeVisible();
    await this.page.getByRole('link', { name: 'Log out' }).click();
  }
}
