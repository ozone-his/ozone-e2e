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

test(' Patient with lab order becomes client with analysis request in SENAITE', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);

  // replay
  await homePage.searchClientInSENAITE();

  // verify
  const client =
  await page.locator('table tbody tr:nth-child(1) td.contentcell.Client div span span a').textContent();
  await expect(client?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();

  const status =
  await page.locator('table tbody tr:nth-child(1) td.contentcell.state_title div span span').textContent();
  await expect(status?.includes("Sample due")).toBeTruthy();
});

test.afterEach(async ( {page}) =>  {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
