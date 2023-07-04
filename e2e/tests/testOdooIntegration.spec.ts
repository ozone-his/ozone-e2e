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

test.afterEach(async ( {page}) =>  {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
