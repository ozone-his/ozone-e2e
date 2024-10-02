import { test, expect } from '@playwright/test';
import { ERPNext } from '../utils/functions/erpnext';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { O3_URL, ERPNEXT_URL } from '../utils/configs/globalSetup';

let openmrs: OpenMRS;
let erpnext: ERPNext;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  erpnext = new ERPNext(page);

  await openmrs.login();
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
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
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
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
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
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
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
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
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
  await erpnext.voidQuotation();
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
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
  await erpnext.voidQuotation();
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
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
  await expect(page.getByText('Draft').nth(0)).toBeVisible();
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
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
  await openmrs.voidPatient();
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
  await erpnext.voidQuotation();
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test.afterEach(async ({ page }) => {
  await erpnext.deleteCustomer();
  await page.close();
});
