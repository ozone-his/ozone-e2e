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

test('Patient with lab order becomes client with analysis request in SENAITE', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);

  // replay
  await homePage.searchClientInSENAITE();

  // verify
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test('Editing patient details with a synced lab test order edits client details in SENAITE', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
  await homePage.goToSENAITE();
  await homePage.searchClientInSENAITE();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updatePatientDetails();

  // verify
  await homePage.goToSENAITE();
  await homePage.searchUpdatedClientInSENAITE();

  await expect(client).toContainText('Winniefred' + ' ' + `${patientName.givenName }`);
  patientName.firstName = 'Winniefred';
});

test('Editing a synced lab order edits corresponding analysis request in SENAITE', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);

  await homePage.searchClientInSENAITE();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  const analysisRequest = await page.locator('#sampleheader-standard-fields tr:nth-child(1) td:nth-child(6)');
  await expect(analysisRequest).toHaveText('Blood urea nitrogen Template');

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updateLabOrder();

  // verify
  await homePage.goToSENAITE();
  await page.getByRole('link', { name: 'Clients Clients' }).click();
  await page.getByRole('textbox', { name: 'Search' }).type(`${patientName.givenName}`);
  await page.locator('div.col-sm-3.text-right button:nth-child(2) i').click();

  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  await expect(analysisRequest).toHaveText('Sickle cell screening test Template');
});

test('Voiding a synced lab order cancels corresponding analysis request in SENAITE', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createLabOrder();
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);

  await homePage.searchClientInSENAITE();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  const analysisRequest = await page.locator('#sampleheader-standard-fields tr:nth-child(1) td:nth-child(6)');
  await expect(analysisRequest).toHaveText('Blood urea nitrogen Template');

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.discontinueLabOrder();

  // verify
  await homePage.goToSENAITE();
  await page.getByRole('link', { name: 'Clients Clients' }).click();
  await page.getByRole('textbox', { name: 'Search' }).type(`${patientName.givenName}`);
  await page.locator('div.col-sm-3.text-right button:nth-child(2) i').click();
  await expect(client).not.toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test.afterEach(async ( {page}) =>  {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
