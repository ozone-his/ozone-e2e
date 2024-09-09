import { test, expect } from '@playwright/test';
import { Odoo } from '../utils/functions/odoo';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { O3_URL, ODOO_URL } from '../utils/configs/globalSetup';

let odoo: Odoo;
let openmrs: OpenMRS;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  odoo = new Odoo(page);

  await openmrs.login();
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
});

test('Editing the details of an OpenMRS patient with a synced lab order edits the corresponding Odoo customer details.', async ({ page }) => {
  // setup
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
});

test('Ordering a drug for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

  // verify
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
});

test('Editing the details of an OpenMRS patient with a synced drug order edits the corresponding Odoo customer details.', async ({ page }) => {
  // setup
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await expect(page.locator('table tbody td.o_data_cell:nth-child(4)')).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName }`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
});

test('Revising a synced OpenMRS drug order edits the corresponding Odoo quotation line.', async ({ page }) => {
  // setup
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator('table tbody td.o_data_cell:nth-child(3) span');
  await expect(drugOrderItem).toContainText('4.0 Tablet');
  await expect(drugOrderItem).toContainText('Twice daily - 5 day');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.editDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(drugOrderItem).toContainText('8.0 Tablet');
  await expect(drugOrderItem).toContainText('Thrice daily - 6 day');
});

test('Discontinuing a synced OpenMRS drug order for an Odoo customer with a single quotation line removes the corresponding quotation.', async ({ page }) => {
  // setup
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('table tbody td.o_data_cell:nth-child(2) span:nth-child(1) span')).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Cancelled');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.getByText('Aspirin 325mg')).not.toBeVisible();
});

test('Discontinuing a synced OpenMRS drug order for an Odoo customer with multiple quotation lines removes the corresponding quoatation.', async ({ page }) => {
  // setup
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.goToDrugOrderForm();
  await page.getByPlaceholder('Search for a drug or orderset (e.g. "Aspirin")').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span')).toHaveText('Blood urea nitrogen');
  await expect(page.locator('tr.o_data_row:nth-child(2) td:nth-child(2) span:nth-child(1) span')).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span')).toHaveText('Blood urea nitrogen');
  await expect(page.getByText('Aspirin 325mg')).not.toBeVisible();
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
});

test('Discontinuing a synced OpenMRS lab order for an Odoo customer with a single quotation line cancels the corresponding quotation.', async ({ page }) => {
  // setup
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await odoo.open();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.cancelLabOrder();
  await expect(page.getByText('Discontinued Blood urea nitrogen')).toBeVisible();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Cancelled');
});

test.afterEach(async ({ page }) => {
  await openmrs.voidPatient();
  await page.close();
});
