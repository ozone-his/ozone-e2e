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
  await openmrs.createLabOrder();

  // verify
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchCustomer();
  const customer = await page.locator(".bold a:nth-child(1)");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.deletePatient();
});

test('Ordering a drug for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrder();

  // verify
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchCustomer();
  const customer = await page.locator(".bold a:nth-child(1)");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await page.locator('#customer-dashboard_tab-tab').click();
  await page.getByLabel('Dashboard').getByText('Quotation').click();
  await erpnext.searchQuotation();
  await expect(page.getByText('Draft').nth(0)).toBeVisible();
  await openmrs.deletePatient();
  await erpnext.deleteQuotation();
});

test('Ending an OpenMRS patient visit with a synced drug order updates the corresponding ERPNext draft quotation to an open state.', async ({ page }) => {
  // setup
  await openmrs.createDrugOrder();
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchQuotation();

  const quotationStatus = await page.locator('div.level-left.ellipsis div:nth-child(3) span span');
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
  await openmrs.deletePatient();
  await erpnext.deleteQuotation();
});

test('Revising a synced OpenMRS drug order edits the corresponding ERPNext quotation item.', async ({ page }) => {
  // setup
  await openmrs.createDrugOrder();
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
  await openmrs.deletePatient();
  await erpnext.deleteQuotation();
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await erpnext.open();
  await expect(page).toHaveURL(/.*home/);
  await erpnext.searchCustomer();
  const customer = await page.locator(".bold a:nth-child(1)");
  await expect(customer).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.getByRole('link', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await page.locator('#customer-dashboard_tab-tab').click();
  await page.getByLabel('Dashboard').getByText('Quotation').click();
  await erpnext.searchQuotation();
  await expect(page.getByText('Draft').nth(0)).toBeVisible();
  await openmrs.deletePatient();
  await erpnext.deleteQuotation();
});

test('Discontinuing a synced OpenMRS drug order for an ERPNext customer with a single quotation line removes the corresponding quotation.', async ({ page }) => {
  // setup
  await openmrs.createDrugOrder();
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
  await openmrs.deletePatient();
});

test.afterEach(async ({ page }) => {
  await erpnext.deleteCustomer();
  await page.close();
});
