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
  const homePage = new HomePage(page);
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

test('Creating a quotation becomes sales order in Odoo', async ({ page }) => {
  // set up
  const homePage = new HomePage(page);
  await homePage.createDrugOrder();
  await homePage.goToOdoo();

  //replay
  await homePage.searchCustomerInOdoo();
  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  const quotation =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_badge_cell.o_readonly_modifier span");
  await expect(quotation).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  const drugOrderItem =   await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_product_configurator_cell.o_required_modifier span span");
  await expect(drugOrderItem).toHaveText('Aspirin 325mg');
  await homePage.searchCustomerInOdoo();

  // verify
  await expect(customer?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  await expect(quotation).toHaveText('Sales Order');
});

test.afterEach(async ( {page}) =>  {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
