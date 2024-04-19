import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';
import { O3_URL, ODOO_URL } from '../utils/configs/globalSetup';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.startPatientVisit();
});

test('Ordering lab test for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // replay
  await homePage.goToOdoo();
  await expect(page).toHaveURL(/.*web/);

  // verify
  await homePage.searchCustomerInOdoo();
  const customer = await page.locator("table tbody td.o_data_cell:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Editing details of an OpenMRS patient with a synced lab order edits the corresponding Odoo customer details.', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();
  await homePage.goToOdoo();
  await expect(page).toHaveURL(/.*web/);
  await homePage.searchCustomerInOdoo();
  const customer = await page.locator("table tbody td.o_data_cell:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();

  // replay
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await homePage.searchCustomerInOdoo();
  const updatedCustomer = await page.locator("table tbody td.o_data_cell:nth-child(4)");
  await expect(updatedCustomer).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Ordering drug for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.makeDrugOrder();

  // replay
  await homePage.goToOdoo();
  await expect(page).toHaveURL(/.*web/);

  // verify
  await homePage.searchCustomerInOdoo();
  const customer = await page.locator("table tbody td.o_data_cell:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Editing details of an OpenMRS patient with a synced drug order edits the corresponding Odoo customer details.', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.makeDrugOrder();
  await homePage.goToOdoo();
  await expect(page).toHaveURL(/.*web/);
  await homePage.searchCustomerInOdoo();

  const customer = await page.locator("table tbody td.o_data_cell:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();

  // replay
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await homePage.searchCustomerInOdoo();
  const updatedCustomer = await page.locator("table tbody td.o_data_cell:nth-child(4)");

  await expect(updatedCustomer).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName }`);
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Revising a synced OpenMRS drug order edits the corresponding Odoo quotation line.', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.makeDrugOrder();
  await homePage.goToOdoo();
  await expect(page).toHaveURL(/.*web/);
  await homePage.searchCustomerInOdoo();

  const customer = await page.locator("table tbody td.o_data_cell:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator("table tbody td.o_data_cell:nth-child(3) span");

  await expect(drugOrderItem).toContainText('4.0 Tablet');
  await expect(drugOrderItem).toContainText('Twice daily - 5 Days');

  // replay
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.editDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await homePage.searchCustomerInOdoo();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(drugOrderItem).toContainText('8.0 Tablet');
  await expect(drugOrderItem).toContainText('Thrice daily - 6 Days');
});

test('Discontinuing a synced OpenMRS drug order cancels the corresponding Odoo quotation.', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.makeDrugOrder();
  await homePage.goToOdoo();
  await expect(page).toHaveURL(/.*web/);
  await homePage.searchCustomerInOdoo();

  const customer = await page.locator("table tbody td.o_data_cell:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)");
  await expect(quotation).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator("table tbody td.o_data_cell:nth-child(2) span:nth-child(1) span");
  await expect(drugOrderItem).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.discontinueDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await homePage.searchCustomerInOdoo();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await expect(quotation).toHaveText('Cancelled');
});

test('Ordering drug with free text medication dosage for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.prescribeFreeTextMedicationDosage();

  // replay
  await homePage.goToOdoo();
  await expect(page).toHaveURL(/.*web/);
  await homePage.searchCustomerInOdoo();

  // verify
  const customer = await page.locator("table tbody td.o_data_cell:nth-child(4)").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation = await page.locator("table tbody td.o_data_cell:nth-child(8)").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test.afterEach(async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
