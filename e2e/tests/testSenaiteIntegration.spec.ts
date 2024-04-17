import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';
import { O3_URL } from '../utils/configs/globalSetup';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.startPatientVisit();
});

test('Patient with lab order becomes client with analysis request in SENAITE', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // replay
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);

  // verify
  await homePage.searchClientInSENAITE();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test('Editing patient details with a synced lab test order edits client details in SENAITE', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);
  await homePage.searchClientInSENAITE();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  // replay
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updatePatientDetails();

  // verify
  await homePage.goToSENAITE();
  await homePage.searchClientInSENAITE();

  await expect(client).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName }`);
});

test('Editing a synced lab order edits corresponding analysis request in SENAITE', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();
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
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.updateLabOrder();

  // verify
  await homePage.goToSENAITE();
  await homePage.searchClientInSENAITE();

  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  await expect(analysisRequest).toHaveText('Sickle cell screening test Template');
});

test('Voiding a synced lab order cancels corresponding analysis request in SENAITE', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();
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
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.voidEncounter();

  // verify
  await homePage.goToSENAITE();
  await homePage.searchClientInSENAITE();
  await expect(client).not.toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test('Published coded lab results from SENAITE are viewable in O3', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('1325AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // replay
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);
  await homePage.searchClientInSENAITE();
  await homePage.createPartition();
  await page.getByRole('combobox', { name: 'Result' }).selectOption('664AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.publishLabResults();
  const reviewState = await page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span').textContent();
  await expect(reviewState?.includes('Published')).toBeTruthy();

  // verify
  await page.goto(`${O3_URL}`);
  await homePage.viewTestResults();
  const testName = await page.locator('div:nth-child(2) >div> div.cds--data-table-container td:nth-child(1)').first();
  await expect(testName).toContainText('Hepatitis C test - qualitative');

  const labResult = await page.locator('div:nth-child(2) >div> div.cds--data-table-container table tbody tr td:nth-child(2) span').first();
  await expect(labResult).toContainText('Negative');
});

test('Published numeric lab results from SENAITE are viewable in O3', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('655AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // replay
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);
  await homePage.searchClientInSENAITE();
  await homePage.createPartition();
  await page.locator('tr:nth-child(1) td.contentcell.Result div span input').fill('64');
  await homePage.publishLabResults();
  const reviewState = await page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span').textContent();
  await expect(reviewState?.includes('Published')).toBeTruthy();

  // verify
  await page.goto(`${O3_URL}`);
  await homePage.viewTestResults();
  const testName = await page.locator('div:nth-child(2) >div> div.cds--data-table-container td:nth-child(1)').first();
  await expect(testName).toContainText('Total bilirubin');

  const labResult = await page.locator('div:nth-child(2) >div> div.cds--data-table-container table tbody tr td:nth-child(2) span').first();
  await expect(labResult).toContainText('64');
});

test('Published free text lab results from SENAITE are viewable in O3', async ({ page }) => {
  // setup
  homePage = new HomePage(page);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('161447AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // replay
  await homePage.goToSENAITE();
  await expect(page).toHaveURL(/.*senaite/);
  await homePage.searchClientInSENAITE();
  await homePage.createPartition();
  await page.locator('div:nth-child(4) div table tbody tr td.contentcell.Result div span input').fill('Test result: Normal');
  await homePage.publishLabResults();
  const reviewState = await page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span').textContent();
  await expect(reviewState?.includes('Published')).toBeTruthy();

  // verify
  await page.goto(`${O3_URL}`);
  await homePage.viewTestResults();
  const testName = await page.locator('div:nth-child(2) >div> div.cds--data-table-container td:nth-child(1)').first();
  await expect(testName).toHaveText('Stool microscopy with concentration');

  const labResult = await page.locator('div:nth-child(2) >div> div.cds--data-table-container table tbody tr td:nth-child(2) span').first();
  await expect(labResult).toHaveText('Test result: Normal');
});

test.afterEach(async ({ page }) => {
  homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
