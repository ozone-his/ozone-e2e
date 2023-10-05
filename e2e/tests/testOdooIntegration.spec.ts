import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.initiateLogin();

  await expect(page).toHaveURL(/.*home/);

  await homePage.createPatient();
  await homePage.startPatientVisit();
});

test('Patient with lab order becomes customer in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();
  await homePage.goToOdoo();

  // replay
  await homePage.searchCustomerInOdoo();

  // verify
  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Editing patient details with a synced lab order edits the corresponding customer details in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();
  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updatePatientDetails();

  // verify
  await page.goto(`${process.env.E2E_ODOO_URL}/web`);
  await homePage.searchUpdatedCustomerInOdoo();
  const updatedCustomer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier");

  await expect(updatedCustomer).toHaveText('Winniefred' + ' ' + `${patientName.givenName }`);
  await expect(quotation?.includes("Quotation")).toBeTruthy();
  patientName.firstName = 'Winniefred';
});

test('Patient with drug order becomes customer in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.makeDrugOrder();
  await homePage.goToOdoo();

  // replay
  await homePage.searchCustomerInOdoo();

  // verify
  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('Editing patient details with a synced drug order edits corresponding customer details in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.makeDrugOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updatePatientDetails();

  // verify
  await page.goto(`${process.env.E2E_ODOO_URL}/web`);
  await homePage.searchUpdatedCustomerInOdoo();
  const updatedCustomer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier");

  await expect(updatedCustomer).toHaveText('Winniefred' + ' ' + `${patientName.givenName }`);
  await expect(quotation?.includes("Quotation")).toBeTruthy();
  patientName.firstName = 'Winniefred';
});

test('Revising a synced drug order edits corresponding quotation line in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.makeDrugOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_text.o_section_and_note_text_cell.o_required_modifier span");

  await expect(drugOrderItem).toContainText('4.0 Tablet');
  await expect(drugOrderItem).toContainText('Twice daily - 5 Days');

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.editDrugOrder();

  // verify
  await page.goto(`${process.env.E2E_ODOO_URL}/web`);
  await homePage.searchCustomerInOdoo();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(drugOrderItem).toContainText('8.0 Tablet');
  await expect(drugOrderItem).toContainText('Thrice daily - 6 Days');
});

test('Discontinuing a synced drug order cancels corresponding quotation line in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.makeDrugOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span");
  await expect(quotation).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_product_configurator_cell.o_required_modifier span span");
  await expect(drugOrderItem).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.discontinueDrugOrder();

  // verify
  await page.goto(`${process.env.E2E_ODOO_URL}/web`);
  await homePage.searchCustomerInOdoo();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await expect(quotation).toHaveText('Cancelled');
});

test.afterEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
