import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';

let homePage: HomePage;
let fullName = patientName.firstName + ' ' + patientName.givenName;

test.beforeEach(async ({ page }) =>  {
    const homePage = new HomePage(page);
    await homePage.initiateLogin();

    await expect(page).toHaveURL(/.*home/);

    await homePage.createPatient();
    await homePage.startPatientVisit();
    await homePage.createLabOrder();
    await homePage.goToOdoo();
});

test('patient with lab order becomes customer in Odoo ', async ({ page }) => {
  await page.locator("//a[contains(@class, 'full')]").click();
  await page.getByRole('menuitem', { name: 'Sales' }).click();
  await page.getByPlaceholder('Search...').click();
  await page.getByPlaceholder('Search...').type(`${fullName}`);
  await page.getByPlaceholder('Search...').press('Enter');
  await page.waitForSelector("div.table-responsive table thead tr th:nth-child(4)");

  // syncs patient as an Odoo customer
  const customer =
  await page.locator("table tbody tr:nth-child(1) td.o_data_cell.o_field_cell.o_list_many2one.o_readonly_modifier.o_required_modifier").textContent();
  await expect(customer?.includes(`${fullName}`)).toBeTruthy();

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
