import { test, expect } from '@playwright/test';
import { O3_URL, ERPNEXT_URL } from '../utils/configs/globalSetup';
import { ERPNext } from '../utils/functions/erpnext';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { Keycloak } from '../utils/functions/keycloak';

let openmrs: OpenMRS;
let erpnext: ERPNext;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);
  erpnext = new ERPNext(page);

  await keycloak.open();
  await keycloak.navigateToUsers();
  await keycloak.addUserButton().click();
  await keycloak.createUser();
  await openmrs.navigateToLoginPage();
  await openmrs.open();
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding ERPNext customer.', async ({ page }) => {
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await erpnext.open();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test('Ordering a drug for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

  // verify
  await erpnext.open();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await page.locator('#customer-dashboard_tab-tab').click();
  await page.getByLabel('Dashboard').getByText('Quotation').click();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span').nth(1)).toHaveText('Draft');
});

test('Editing the details of an OpenMRS patient with a synced lab order edits the corresponding ERPNext customer details.', async ({ page }) => {
  // setup
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await erpnext.open();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
});

test('Editing the details of an OpenMRS patient with a synced drug order edits the corresponding ERPNext customer details.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
});

test('Ending an OpenMRS patient visit with a synced drug order updates the corresponding ERPNext draft quotation to an open state.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Draft');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.endPatientVisit();

   // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Open');
});

test('Revising details of a synced OpenMRS drug order modifies the corresponding ERPNext quotation item.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('div.bold:nth-child(4) div:nth-child(2) div')).toHaveText('12');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.modifyDrugOrderDescription();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('div.bold:nth-child(4) div:nth-child(2) div')).toHaveText('8');
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await erpnext.open();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await page.locator('#customer-dashboard_tab-tab').click();
  await page.getByLabel('Dashboard').getByText('Quotation').click();
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span').nth(1)).toHaveText('Draft');
});

test('Discontinuing a synced OpenMRS drug order for an ERPNext customer with a single quotation line removes the corresponding quotation.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await erpnext.searchQuotation();
  await expect(page.getByText(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeVisible();

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();
  await expect(page.getByText(`${patientName.firstName + ' ' + patientName.givenName}`)).not.toBeVisible();
  await expect(page.getByText('No Quotation found')).toBeVisible();
});

test('Discontinuing a synced OpenMRS lab order for an ERPNext customer removes the corresponding quotation.', async ({ page }) => {
  // setup
  await openmrs.navigateToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Complete blood count');
  await openmrs.saveLabOrder();

  await erpnext.open();
  await erpnext.searchQuotation();
  await expect(page.getByText(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeVisible();

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.cancelLabOrder();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();
  await expect(page.getByText(`${patientName.firstName + ' ' + patientName.givenName}`)).not.toBeVisible();
  await expect(page.getByText('No Quotation found')).toBeVisible();
});

test('Ordering a drug for an OpenMRS patient within a visit creates the corresponding ERPNext customer with a filled quotation linked to the visit.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Draft');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.endPatientVisit();
  await openmrs.startPatientVisit();
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 81mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

   // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Draft');
  await expect(page.locator('div.list-row-container:nth-child(4) div:nth-child(3) span:nth-child(1) span')).toHaveText('Open');
});

test.afterEach(async ({ browser }) => {
  await openmrs.voidPatient();
  await openmrs.logout();
  const context = await browser.newContext();
  const page = await context.newPage();
  const keycloak = new Keycloak(page);
  await keycloak.deleteUser();
});
