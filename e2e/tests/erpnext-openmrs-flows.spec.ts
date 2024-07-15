import { test, expect } from '@playwright/test';
import { ERPNext } from '../utils/functions/erpnext';
import { O3_URL, ERPNEXT_URL } from '../utils/configs/globalSetup';
import { OpenMRS, patientName } from '../utils/functions/openmrs';

let openmrs: OpenMRS;
let erpnext: ERPNext;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  erpnext = new ERPNext(page);

  await openmrs.login();
  await expect(page).toHaveURL(/.*home/);
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding ERPNext customer.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchCustomer();
  const customer = await page.locator("div.list-row-container:nth-child(3) span:nth-child(2) a");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test('Ordering a drug for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

  // verify
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchCustomer();
  const customer = await page.locator("div.list-row-container:nth-child(3) span:nth-child(2) a");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await page.locator('#customer-dashboard_tab-tab').click();
  await page.getByLabel('Dashboard').getByText('Quotation').click();
  const quotationStatus = await page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span').nth(1);
  await expect(quotationStatus).toHaveText('Draft');
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test('Editing the details of an OpenMRS patient with a synced lab order edits the corresponding ERPNext customer details.', async ({ page }) => {
  // setup
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await erpnext.open();
  await erpnext.searchCustomer();
  const customer = await page.locator("div.list-row-container:nth-child(3) span:nth-child(2) a");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchCustomer();
  await expect(customer).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test('Editing the details of an OpenMRS patient with a synced drug order edits the corresponding ERPNext customer details.', async ({ page }) => {
  // setup
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await erpnext.searchCustomer();
  const customer = await page.locator("div.list-row-container:nth-child(3) span:nth-child(2) a");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchCustomer();
  await expect(customer).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test('Ending an OpenMRS patient visit with a synced drug order updates the corresponding ERPNext draft quotation to an open state.', async ({ page }) => {
  // setup
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchQuotation();

  const quotationStatus = await page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span');
  await expect(quotationStatus).toHaveText('Draft');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.endPatientVisit();

   // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();
  await expect(quotationStatus).toHaveText('Open');
  await erpnext.voidQuotation();
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test('Revising a synced OpenMRS drug order edits the corresponding ERPNext quotation item.', async ({ page }) => {
  // setup
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const quantity = await page.locator("div.bold:nth-child(4) div:nth-child(2) div");
  await expect(quantity).toHaveText('12');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.editDrugOrder();

  // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(quantity).toHaveText('8');
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchCustomer();
  const customer = await page.locator("div.list-row-container:nth-child(3) span:nth-child(2) a");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
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
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
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
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.open();
  await erpnext.searchQuotation();

  const firstQuotationStatus = await page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span');
  await expect(firstQuotationStatus).toHaveText('Draft');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.endPatientVisit();
  await openmrs.startPatientVisit();
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 81mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

   // verify
  await page.goto(`${ERPNEXT_URL}/app/home`);
  await erpnext.searchQuotation();

  const secondQuotationStatus = await page.locator('div.list-row-container:nth-child(4) div:nth-child(3) span:nth-child(1) span');
  await expect(firstQuotationStatus).toHaveText('Draft');
  await expect(secondQuotationStatus).toHaveText('Open');
  await erpnext.voidQuotation();
  await openmrs.voidPatient();
  await erpnext.deleteQuotation();
});

test.afterEach(async ({ page }) => {
  await erpnext.deleteCustomer();
  await page.close();
});
