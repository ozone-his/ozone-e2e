import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) =>  {
    const homePage = new HomePage(page);
    await homePage.initiateLogin();

    await expect(page).toHaveURL(/.*home/);

    await homePage.createPatient();
    await homePage.createLabOrder();
    await homePage.goToSENAITE();

    await expect(page).toHaveURL(/.*senaite/);
});

test('patient with lab order becomes client in SENAITE ', async ({ page }) => {
  await page.locator("//i[contains(@class, 'sidebar-toggle-icon')]").click();
  await page.getByRole('link', { name: 'Samples Samples' }).click();
  await page.getByRole('textbox', { name: 'Search' }).type('Mikeal Edwards');
  await page.locator('div.col-sm-3.text-right button:nth-child(1) i').click();
  await page.locator('div.col-sm-3.text-right button:nth-child(2) i').click();

  // syncs patient as a SENAITE client
  const client =
  await page.locator('table tbody tr:nth-child(1) td.contentcell.Client div span span a').textContent();
  await expect(client?.includes("Mikeal Edwards")).toBeTruthy();

  const status =
  await page.locator('table tbody tr:nth-child(1) td.contentcell.state_title div span span').textContent();
  await expect(status?.includes("Sample due")).toBeTruthy();
});

test.afterEach(async ( {page}) =>  {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
