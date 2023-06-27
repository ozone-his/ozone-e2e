import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) =>  {
    const homePage = new HomePage(page);
    await homePage.initiateLogin();

    await expect(page).toHaveURL(/.*home/);

    await homePage.createPatient();
    await homePage.startPatientVisit();
});

test('patient with lab order becomes customer in Odoo', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.createLabOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  // syncs patient as an Odoo customer
  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  // amends customer running quotation
  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test('patient with drug order becomes customer in Odoo', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.createDrugOrder();
  await homePage.goToOdoo();
  await homePage.searchCustomerInOdoo();

  // syncs patient as an Odoo customer
  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  // amends customer running quotation
  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span").textContent();
  await expect(quotation?.includes("Quotation")).toBeTruthy();
});

test.afterEach(async ( {page}) =>  {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
