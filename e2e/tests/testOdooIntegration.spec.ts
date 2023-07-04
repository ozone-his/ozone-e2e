import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) =>  {
    const homePage = new HomePage(page);
    await homePage.initiateLogin();

    await expect(page).toHaveURL(/.*home/);

    await homePage.createPatient();
});

test('patient with lab order becomes customer in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
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

test('Editing patient details for a synced lab order edits customer details in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
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
  await page.goto("https://erp.ozone-qa.mekomsolutions.net/web");
  await homePage.searchUpdatedCustomerInOdoo();
  const updatedCustomer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier");

  await expect(updatedCustomer).toHaveText('Winniefred' + ' ' + `${patientName.givenName }`);
  await expect(quotation?.includes("Quotation")).toBeTruthy();
  patientName.firstName = 'Winniefred';
});

test('Revising a synced lab order edits corresponding quotation line in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem =   await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_product_configurator_cell.o_required_modifier span span");

  await expect(drugOrderItem).toContainText('Blood urea nitrogen');

  // replay
  await page.goto('https://ozone-qa.mekomsolutions.net/openmrs/spa/home');
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updateLabOrder();

  // verify
  await page.goto('https://erp.ozone-qa.mekomsolutions.net/web');
  await homePage.searchCustomerInOdoo();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();

  const updatedDrugOrderItem =   await page.locator("table tbody tr:nth-child(2) td.o_data_cell.o_field_cell.o_list_many2one.o_product_configurator_cell.o_required_modifier span span");

  await expect(updatedDrugOrderItem).toContainText('Sickle cell screening test');
});

test('Discontinuing a synced lab order cancels corresponding quotation line in Odoo', async ({ page }) => {
  // setup // write here code
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span");
  await expect(quotation).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem =   await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_product_configurator_cell.o_required_modifier span span");

  await expect(drugOrderItem).toHaveText('Blood urea nitrogen');

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.discontinueLabOrder();

  // verify
  await page.goto('https://erp.ozone-qa.mekomsolutions.net/web');
  await homePage.searchCustomerInOdoo();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  // await expect(quotation).toHaveText('Cancelled');
  await expect(quotation).toHaveText('Quotation');
});

test('patient with drug order becomes customer in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createDrugOrder();
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

test('Editing patient details for a synced drug order edits customer details in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createDrugOrder();
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
  await page.goto("https://erp.ozone-qa.mekomsolutions.net/web");
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
  await homePage.createDrugOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem =   await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_text.o_section_and_note_text_cell.o_required_modifier span");

  await expect(drugOrderItem).toContainText('4.0 Tablet');
  await expect(drugOrderItem).toContainText('Twice daily - 5 Days');

  // replay
  await page.goto('https://ozone-qa.mekomsolutions.net/openmrs/spa/home');
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updateDrugOrder();

  // verify
  await page.goto('https://erp.ozone-qa.mekomsolutions.net/web');
  await homePage.searchCustomerInOdoo();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(drugOrderItem).toContainText('8.0 Tablet');
  await expect(drugOrderItem).toContainText('Thrice daily - 6 Days');
});

test('Discontinuing a synced drug order cancels corresponding quotation line in Odoo', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createDrugOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span");
  await expect(quotation).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem =   await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_product_configurator_cell.o_required_modifier span span");
  await expect(drugOrderItem).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.discontinueDrugOrder();

  // verify
  await page.goto('https://erp.ozone-qa.mekomsolutions.net/web');
  await homePage.searchCustomerInOdoo();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await expect(quotation).toHaveText('Cancelled');
});

test.afterEach(async ( {page}) =>  {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
