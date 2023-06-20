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

test('voiding a patient with a lab order deletes the corresponding client in SENAITE', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.createLabOrder();
    await homePage.goToSENAITE();
  
    await expect(page).toHaveURL(/.*senaite/);
  
    await homePage.searchClientInSENAITE();
  
    // syncs patient as a SENAITE client
    const client =
    await page.locator('table tbody tr:nth-child(1) td.contentcell.Client div span span a').textContent();
    await expect(client?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeTruthy();
  
    const status =
    await page.locator('table tbody tr:nth-child(1) td.contentcell.state_title div span span').textContent();
    await expect(status?.includes("Sample due")).toBeTruthy();
  
    await homePage.deletePatient();
    await homePage.goToSENAITE();

    await expect(page).toHaveURL(/.*senaite/);

    await page.locator("//i[contains(@class, 'sidebar-toggle-icon')]").click();
    await homePage.searchClientInSENAITE();
  
    // client is deleted in SENAITE
    const checkClient =
    await page.locator('table tbody tr:nth-child(1) td.contentcell.Client div span span a').textContent();
    await expect(checkClient?.includes(`${patientName.firstName + ' ' + patientName.givenName}`)).toBeFalsy();
    await expect(checkClient).not.toContain(`${patientName.firstName + ' ' + patientName.givenName}`);
  });

  test.afterEach(async ( {page}) =>  {
    await page.close();
  });
