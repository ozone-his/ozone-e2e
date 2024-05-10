import { test, expect } from '@playwright/test';
import { Odoo } from '../utils/functions/odoo';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { O3_URL, ODOO_URL } from '../utils/configs/globalSetup';

let openmrs: OpenMRS;
let odoo: Odoo;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  odoo = new Odoo(page);

  await openmrs.login();
  await expect(page).toHaveURL(/.*home/);
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await openmrs.saveLabOrder();

  // verify
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Editing the details of an OpenMRS patient with a synced lab order edits the corresponding Odoo customer details.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await openmrs.saveLabOrder();
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  const updatedCustomer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)");
  await expect(updatedCustomer).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Ordering a drug for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrder();

  // verify
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Editing the details of an OpenMRS patient with a synced drug order edits the corresponding Odoo customer details.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrder();
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  const updatedCustomer = await page.locator("table tbody td.o_data_cell:nth-child(4)");

  await expect(updatedCustomer).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName }`);
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Revising a synced OpenMRS drug order edits the corresponding Odoo quotation line.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrder();
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator("table tbody td.o_data_cell:nth-child(3) span");
  await expect(drugOrderItem).toContainText('4.0 Tablet');
  await expect(drugOrderItem).toContainText('Twice daily - 5 Days');
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.editDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(drugOrderItem).toContainText('8.0 Tablet');
  await expect(drugOrderItem).toContainText('Thrice daily - 6 Days');
});

test('Discontinuing an OpenMRS drug order for an Odoo customer with a single quotation line removes the corresponding quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrder();
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)");
  await expect(quotation).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator("table tbody td.o_data_cell:nth-child(2) span:nth-child(1) span");
  await expect(drugOrderItem).toHaveText('Aspirin 325mg');
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await expect(quotation).toHaveText('Cancelled');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const QuotationItem = await page.locator(".o_section_and_note_list_view tbody:nth-child(2) tr:nth-child(1) td");
  await expect(QuotationItem).not.toHaveText('Aspirin 325mg');
});


test('Discontinuing a synced drug order of an Odoo customer with multiple quotation lines removes the corresponding quoatation.', async ({ page }) => {
  // setup
  await openmrs.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await openmrs.saveLabOrder();
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.createDrugOrder();
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)");
  await expect(quotation).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const labOrderItem = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span");
  const drugOrderItem = await page.locator("tr.o_data_row:nth-child(2) td:nth-child(2) span:nth-child(1) span");
  await expect(labOrderItem).toHaveText('Blood urea nitrogen');
  await expect(drugOrderItem).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(labOrderItem).toHaveText('Blood urea nitrogen');
  await expect(page.getByText('Aspirin 325mg')).not.toBeVisible();
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await odoo.open();
  await expect(page).toHaveURL(/.*web/);
  await odoo.searchCustomer();
  const customer = await page.locator("tr.o_data_row:nth-child(1) td:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test.afterEach(async ({ page }) => {
  await openmrs.deletePatient();
  await page.close();
});
