import { Page, expect } from '@playwright/test';
import { O3_URL } from '../configs/globalSetup';
import { Keycloak } from './keycloak';

export var patientName = {
  firstName : '',
  givenName : '',
  updatedFirstName : ''
}

var patientFullName = '';

export var randomOpenMRSRoleName = {
  roleName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
}

export const delay = (mills) => {
  const endTime = Date.now() + mills;
  while (Date.now() < endTime) {
    // Do nothing, just wait
  }
};
export class OpenMRS {
  constructor(readonly page: Page) {}

  readonly patientSearchIcon = () => this.page.locator('[data-testid="searchPatientIcon"]');
  readonly patientSearchBar = () => this.page.locator('[data-testid="patientSearchBar"]');
  readonly createPatientButton = () => this.page.locator('button[type=submit]');

  async login() {
    await this.page.goto(`${O3_URL}`);
    if (`${process.env.TEST_PRO}` == 'true') {
      await this.enterLoginCredentials();
    } else {
      await this.page.locator('#username').fill(`${process.env.O3_USERNAME_ON_FOSS}`), delay(500);
      await this.page.getByRole('button', { name: /continue/i }).click();
      await this.page.locator('#password').fill(`${process.env.O3_PASSWORD_ON_FOSS}`), delay(500);
      await this.page.locator('button[type="submit"]').click();
    }
    await this.page.locator('label').filter({ hasText: /inpatient ward/i }).locator('span').first().click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
    await expect(this.page).toHaveURL(/.*home/);
    await expect(this.page.getByRole('button', { name: /search patient/i })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: /add Patient/i })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: /my account/i })).toBeEnabled();
    await expect(this.page.getByRole('button', { name: /app Menu/i })).toBeEnabled();
  }

  async enterLoginCredentials() {
    await this.page.locator('#username').fill(`${process.env.OZONE_USERNAME}`);
    await this.page.getByRole('button', { name: /continue/i }).click();
    await this.page.locator('#password').fill(`${process.env.OZONE_PASSWORD}`);
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }

  async createPatient() {
    patientName = {
      firstName : `e2e_test_${Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      givenName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`, 
      updatedFirstName: `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
    }
    patientFullName = patientName.firstName + ' ' + patientName.givenName;
    await this.page.getByRole('button', { name: /add patient/i }).click();
    await expect(this.createPatientButton()).toBeEnabled();
    await this.page.locator('#givenName').fill(`${patientName.firstName}`);
    await this.page.locator('#familyName').fill(`${patientName.givenName}`);
    await this.page.locator('label').filter({ hasText: /^Male$/ }).locator('span').first().click();
    await this.page.locator('div[aria-label="day, "]').fill('16');
    await this.page.locator('div[aria-label="month, "]').fill('08');
    await this.page.locator('div[aria-label="year, "]').fill('2002');
    await this.createPatientButton().click();
    await expect(this.page.getByText(/new patient created/i)).toBeVisible(), delay(3000);;
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
    await expect(this.page.getByText(/actions/i, {exact: true})).toBeVisible();
    await this.page.getByRole('button', { name: /actions/i, exact: true }).click();
    await expect(this.page.getByText(/edit patient details/i)).toBeVisible();
    await this.page.getByRole('menuitem', { name: /edit patient details/i }).click(), delay(4000);
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
    await this.page.getByRole('button', { name: /start a visit/i }).click();
    await this.page.locator('label').filter({ hasText: /facility Visit/i }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: /start visit/i }).click();
    await expect(this.page.getByText(/facility Visit started successfully/i)).toBeVisible(), delay(4000);
  }

  async endPatientVisit() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`)
    await this.page.getByRole('button', { name: /actions/i, exact: true }).click();
    await this.page.getByRole('menuitem', { name: /end visit/i }).click();
    await this.page.getByRole('button', { name: /danger end Visit/i }).click();
    await expect(this.page.getByText(/visit ended/i)).toBeVisible(), delay(3000);
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
    await this.page.getByRole('link', { name: /conditions/i }).click();
    await this.page.getByText(/record conditions/i).click();
    await this.page.getByPlaceholder(/search conditions/i).fill('Typhoid fever');
    await this.page.getByRole('menuitem', { name: 'Typhoid fever' }).click();
    await this.page.getByLabel('Onset date').fill('27/07/2023');
    await this.page.getByLabel('Onset date').press('Enter');
    await this.page.locator('label').filter({ hasText: /^Active$/ }).locator('span').first().click();
    await this.page.getByRole('button', { name: /save & close/i }).click();
    await expect(this.page.getByText(/condition saved successfully/i)).toBeVisible(), delay(2000);
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(1)')).toHaveText('Typhoid fever');
  }

  async voidPatientCondition() {
    await this.page.getByRole('link', { name: /conditions/i }).click();
    await this.page.getByRole('button', { name: /options/i }).click();
    await this.page.getByRole('menuitem', { name: /delete/i }).click();
    await this.page.getByRole('button', { name: /delete/i }).click();
    await expect(this.page.getByText(/condition deleted/i)).toBeVisible();
  }

  async addPatientBiometrics() {
    await this.page.getByRole('link', { name: /vitals & Biometrics/i }).click();
    await this.page.getByText('Record biometrics').click();
    await this.page.getByRole('spinbutton', { name: /weight/i }).fill('78');
    await this.page.getByRole('spinbutton', { name: /height/i }).fill('165');
    await this.page.getByRole('spinbutton', { name: /muac/i }).fill('34');
    await this.page.getByRole('button', { name: /save and close/i }).click();
    await expect(this.page.getByText(/biometrics saved/i)).toBeVisible();
  }

  async addPatientAppointment() {
    await this.page.getByRole('link', { name: /appointments/i }).click();
    await this.page.getByRole('button', { name: 'Add', exact: true }).click();
    await this.page.getByLabel(/select a service/i).selectOption('General Medicine service');
    await this.page.getByLabel(/select an appointment type/i).selectOption('Scheduled');
    await this.page.locator('#duration').fill('40');
    await this.page.getByPlaceholder(/write any additional points here/i).fill('This is an appointment.');
    await this.page.getByRole('button', { name: /save and close/i }).click();
    await expect(this.page.getByText(/appointment scheduled/i)).toBeVisible();
    await this.page.getByRole('tab', { name: /today/i }).click();
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(3)')).toHaveText(/general medicine service/i);
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(5)')).toHaveText(/scheduled/i);
    await expect(this.page.locator('table tbody tr:nth-child(1) td:nth-child(4)')).toHaveText(/scheduled/i);
  }

  async cancelPatientAppointment() {
    await this.page.getByRole('link', { name: /appointments/i }).click();
    await this.page.getByRole('tab', { name: /today/i }).click();
    await this.page.getByRole('button', { name: /options/i }).click();
    await this.page.getByRole('menuitem', { name: /cancel/i }).click();
    await this.page.getByRole('button', { name: /cancel appointment/i }).click();
    await expect(this.page.getByText(/appointment cancelled successfully/i)).toBeVisible();
   }

   async navigateToAttachments() {
    await (this.page.getByRole('link', { name: /attachments/i })).click();
  }

  async navigateToLabOrderForm() {
    await this.page.getByLabel(/order basket/i).click(), delay(2000);
    await expect(this.page.getByRole('button', { name: 'Add', exact: true }).nth(1)).toBeVisible();
    await this.page.getByRole('button', { name: 'Add', exact: true }).nth(1).click();
  }

  async saveLabOrder() {
    await delay(2500), this.page.getByRole('button', { name: /order form/i }).click();
    await this.page.getByRole('button', { name: /save order/i }).click();
    await this.page.getByRole('button', { name: /sign and close/i }).click();
    await expect(this.page.getByText(/placed orders/i)).toBeVisible(), delay(5000);
  }

  async recordWeight() {
    await this.page.getByRole('link', { name: /vitals & biometrics/i }).click();
    await this.page.getByRole('button', { name: /record biometrics/i }).click();
    await this.page.getByRole('spinbutton', { name: /weight/i }).fill('75');
    await this.page.getByRole('button', { name: /save and close/i }).click();
    await expect(this.page.getByText(/vitals and biometrics saved/i)).toBeVisible(), delay(2000);
  }

  async voidEncounter() {
    await this.page.getByRole('link', { name: /visits/i }).click();
    await this.page.getByRole('tab', { name: /all encounters/i }).click();
    await this.page.getByRole('button', { name: /options/i, exact: true }).click();
    await this.page.getByRole('menuitem', { name: /delete this encounter/i }).click();
    await this.page.getByRole('button', { name: /danger delete/i }).click();
    await expect(this.page.getByText(/encounter deleted/i)).toBeVisible(), delay(5000);
  }

  async cancelLabOrder() {
    await this.page.getByRole('link', { name: /orders/i }).click();
    await this.page.getByRole('button', { name: /options/i }).nth(0).click();
    await this.page.getByRole('menuitem', { name: /cancel order/i }).click();
    await expect(this.page.getByRole('button', { name: /sign and close/i })).toBeEnabled();
    await this.page.getByRole('button', { name: /sign and close/i }).click(), delay(3000);
  }

  async viewTestResults() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await expect(this.page.getByRole('link', { name: /results/i })).toBeVisible();
    await this.page.getByRole('link', { name: /results/i }).click();
  }

  async navigateToDrugOrderForm() {
    await expect(this.page.getByLabel(/order basket/i)).toBeVisible();
    await this.page.getByLabel(/order basket/i).click(), delay(2000);
    await expect(this.page.getByRole('button', { name: 'Add', exact: true }).nth(0)).toBeVisible();
    await this.page.getByRole('button', { name: 'Add', exact: true }).nth(0).click();
  }

  async fillDrugOrderForm() {
    await this.page.getByRole('button', { name: /order form/i }).click();
    await this.page.getByPlaceholder('Dose').fill('4');
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(1).click();
    await this.page.getByText('Intravenous', {exact: true}).click();
    await this.page.getByRole('button', { name: 'Open', exact: true }).nth(2).click();
    await this.page.getByText(/twice daily/i, {exact: true}).click();
    await this.page.getByPlaceholder(/additional dosing instructions/i).fill('Take after eating');
    await this.page.getByLabel('Duration', { exact: true }).fill('5');
    await this.page.getByLabel(/quantity to dispense/i).fill('12');
    await this.page.getByLabel(/prescription refills/i).fill('3');
    await this.page.locator('#indication').fill('Hypertension');
  }

  async saveDrugOrder() {
    await this.page.getByRole('button', { name: /save order/i }).focus();
    await expect(this.page.getByText(/save order/i)).toBeVisible();
    await this.page.getByRole('button', { name: /save order/i }).click();
    await this.page.getByRole('button', { name: /sign and close/i }).focus();
    await expect(this.page.getByText(/sign and close/i)).toBeVisible();
    await this.page.getByRole('button', { name: /sign and close/i }).click(), delay(3000);
  }

  async createDrugOrderWithFreeTextDosage() {
    await expect(this.page.getByLabel(/order basket/i)).toBeVisible();
    await this.page.getByLabel(/order basket/i).click(), delay(2000);
    await expect(this.page.getByRole('button', { name: 'Add', exact: true }).nth(0)).toBeVisible();
    await this.page.getByRole('button', { name: 'Add', exact: true }).nth(0).click();
    await this.page.getByRole('searchbox').fill('Aspirin 325mg');
    await this.page.getByRole('button', { name: 'Order form' }).click();
    await this.page.locator('div').filter({ hasText: /^Off$/ }).locator('div').click();
    await this.page.getByPlaceholder('Free text dosage').fill('2 Tablets - Every after eight hours - To be taken after a meal.');
    await this.page.getByLabel('Duration', { exact: true }).fill('3');
    await this.page.getByLabel('Quantity to dispense').fill('18');
    await this.page.getByLabel('Prescription refills').fill('2');
    await this.page.locator('#indication').fill('Hypertension');
    await this.page.getByRole('button', { name: /save order/i }).focus();
    await expect(this.page.getByText(/save order/i)).toBeVisible();
    await this.page.getByRole('button', { name: /save order/i }).click();
    await this.page.getByRole('button', { name: /sign and close/i }).focus();
    await expect(this.page.getByText(/sign and close/i)).toBeVisible();
    await this.page.getByRole('button', { name: /sign and close/i }).click(), delay(5000);
  }

  async modifyDrugOrderDescription() {
    await this.page.getByRole('button', { name: /options/i, exact: true }).click();
    await this.page.getByRole('menuitem', { name: /modify/i, exact: true }).click();
    await this.page.getByPlaceholder('Dose').fill('8');
    await this.page.getByLabel(/clear selected item/i).nth(2).click();
    await this.page.getByPlaceholder(/frequency/i).click();
    await this.page.getByText(/thrice daily/i).click();
    await this.page.getByLabel('Duration', { exact: true }).fill('6');
    await this.page.getByLabel(/quantity to dispense/i).fill('8');
    await this.page.getByRole('button', { name: /save order/i }).focus();
    await this.page.getByRole('button', { name: /save order/i }).dispatchEvent('click');
    await expect(this.page.getByText(/sign and close/i)).toBeVisible();
    await this.page.getByRole('button', { name: /sign and close/i }).focus();
    await this.page.getByRole('button', { name: /sign and close/i }).dispatchEvent('click'), delay(5000);
  }

  async discontinueDrugOrder() {
    await this.page.getByRole('button', { name: /options/i, exact: true }).click();
    await this.page.getByRole('menuitem', { name: /discontinue/i }).click();
    await expect(this.page.getByText(/sign and close/i)).toBeVisible();
    await this.page.getByRole('button', { name: /sign and close/i }).focus();
    await this.page.getByRole('button', { name: /sign and close/i }).dispatchEvent('click'), delay(3000);
  }

  async updatePatientDetails() {
    await this.page.getByRole('button', { name: /actions/i, exact: true }).click();
    await this.page.getByRole('menuitem', { name: /edit patient details/i }).click(), delay(4000);
    await expect(this.page.locator('#givenName')).toBeVisible();
    await this.page.locator('#givenName').fill(`${patientName.updatedFirstName}`), delay(2000);
    await this.page.locator('label').filter({ hasText: /female/i }).locator('span').first().click();
    await this.page.locator('div[aria-label="day, "]').fill('18');
    await this.page.locator('div[aria-label="month, "]').fill('08');
    await this.page.locator('div[aria-label="year, "]').fill('2003');
    await this.page.getByRole('button', { name: /update patient/i }).click();
    await expect(this.page.getByText(/patient details updated/i)).toBeVisible();
    patientName.firstName = `${patientName.updatedFirstName}`, delay(5000);
  }

  async addRole() {
    await this.page.getByRole('link', { name: /add role/i }).click();
    await this.page.locator('#role').fill(`${randomOpenMRSRoleName.roleName}`);
    await this.page.locator('textarea[name="description"]').fill('OpenMRS role for e2e test');
    await this.page.getByLabel('Application: Edits Existing Encounters').check();
    await this.page.getByLabel('Application: Enters Vitals').check();
    await this.page.getByLabel('Application: Records Allergies').check();
    await this.page.getByLabel('Application: Uses Patient Summary').check();
    await this.page.getByLabel('Organizational: Registration Clerk').check();
    await this.page.getByRole('button', { name: /save role/i }).click();
    await expect(this.page.getByText(/role saved/i)).toBeVisible(), delay(160000);
  }

  async updateRole() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.locator('textarea[name="description"]').fill('Updated role description');
    await this.page.getByLabel('Application: Registers Patients').check();
    await this.page.getByLabel('Application: Writes Clinical Notes').check();
    await this.page.getByRole('button', { name: /save role/i }).click();
    await expect(this.page.getByText(/role saved/i)).toBeVisible(), delay(160000);
  }

  async unlinkInheritedRoles() {
    await this.page.getByRole('link', { name: `${randomOpenMRSRoleName.roleName}` }).click();
    await this.page.getByLabel('Application: Edits Existing Encounters').uncheck();
    await this.page.getByLabel('Application: Enters Vitals').uncheck();
    await this.page.getByLabel('Application: Records Allergies').uncheck();
    await this.page.getByLabel('Application: Uses Patient Summary').uncheck();
    await this.page.getByLabel('Organizational: Registration Clerk').uncheck();
    await this.page.getByRole('button', { name: /save role/i }).click();
    await expect(this.page.getByText(/role saved/i)).toBeVisible(), delay(2000);
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
    await this.page.getByRole('button', { name: /save role/i }).click();
    await expect(this.page.getByText(/role saved/i)).toBeVisible();
  }

  async deleteRole() {
    await this.page.goto(`${O3_URL}/openmrs/admin/users/role.list`);
    await this.unlinkInheritedRoles();
    await this.page.getByRole('row', { name: `${randomOpenMRSRoleName.roleName}` }).getByRole('checkbox').check();
    await this.page.getByRole('button', { name: 'Delete Selected Roles' }).click();
    await expect(this.page.getByText(`${randomOpenMRSRoleName.roleName} deleted`)).toBeVisible();
    await this.page.getByRole('link', { name: /log out/i }).click();
  }

  async navigateToRoles() {
  await this.page.goto(`${O3_URL}/openmrs/admin/users/users.list`);
  await this.page.getByRole('textbox').fill('admin');
  await this.page.getByRole('button', { name: 'Search' }).click();
  await this.page.getByRole('link', { name: 'admin', exact: true }).click();
  }

  async logout() {
    await this.page.goto(`${O3_URL}`);
    await expect(this.page.getByLabel(/my account/i)).toBeVisible();
    await this.page.getByLabel(/my account/i).click();
    await expect(this.page.getByRole('button', { name: /logout/i })).toBeVisible();
    await this.page.getByRole('button', { name: /logout/i }).click();
    let keycloak = new Keycloak(this.page);
    await keycloak.confirmLogout();
    await expect(this.page).toHaveURL(/.*login/);
  }
}
