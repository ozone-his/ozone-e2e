import { test, expect } from '@playwright/test';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { SENAITE } from '../utils/functions/senaite';
import { O3_URL, SENAITE_URL } from '../utils/configs/globalSetup';

let openmrs: OpenMRS;
let senaite: SENAITE;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  senaite = new SENAITE(page);

  await openmrs.login();
  await expect(page).toHaveURL(/.*home/);
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding SENAITE client with an analysis request.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await senaite.open();
  await expect(page).toHaveURL(/.*senaite/);
  await senaite.searchClient();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test('Editing the details of an OpenMRS patient with a synced lab order edits the corresponding SENAITE client details.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await senaite.open();
  await expect(page).toHaveURL(/.*senaite/);
  await senaite.searchClient();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${SENAITE_URL}`);
  await senaite.searchClient();

  await expect(client).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName }`);
});

test('Editing a synced OpenMRS lab order edits the corresponding SENAITE analysis request.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  await senaite.open();
  await expect(page).toHaveURL(/.*senaite/);
  await senaite.searchClient();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  const analysisRequest = await page.locator('#sampleheader-standard-fields tr:nth-child(1) td:nth-child(6)');
  await expect(analysisRequest).toHaveText('Blood urea nitrogen Template');
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updateLabOrder();

  // verify
  await page.goto(`${SENAITE_URL}`);
  await senaite.searchClient();

  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  await expect(analysisRequest).toHaveText('Sickle cell screening test Template');
});

test('Voiding a synced OpenMRS lab order cancels the corresponding SENAITE analysis request.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await senaite.open();
  await expect(page).toHaveURL(/.*senaite/);
  await senaite.searchClient();
  const client = await page.locator('table tbody tr:nth-child(1) td.contentcell.title div');
  await expect(client).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  const analysisRequest = await page.locator('#sampleheader-standard-fields tr:nth-child(1) td:nth-child(6)');
  await expect(analysisRequest).toHaveText('Blood urea nitrogen Template');
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.cancelLabOrder();

  // verify
  await page.goto(`${SENAITE_URL}`);
  await senaite.searchClient();
  await expect(client).not.toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test('Published coded lab results from SENAITE are viewable in the OpenMRS lab results viewer.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Hepatitis C test - qualitative');
  await openmrs.saveLabOrder();
  await senaite.open();
  await expect(page).toHaveURL(/.*senaite/);
  await senaite.searchClient();
  await senaite.createPartition();
  await page.getByRole('combobox', { name: 'Result' }).selectOption('664AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await senaite.publishLabResults();
  const reviewState = await page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span').textContent();
  await expect(reviewState?.includes('Published')).toBeTruthy();

  // verify
  await page.goto(`${O3_URL}`);
  await openmrs.viewTestResults();
  const testName = await page.locator('div:nth-child(2) >div> div.cds--data-table-container td:nth-child(1)').first();
  await expect(testName).toContainText('Hepatitis C test - qualitative');

  const labResult = await page.locator('div:nth-child(2) >div> div.cds--data-table-container table tbody tr td:nth-child(2) span').first();
  await expect(labResult).toContainText('Negative');
});

test('Published numeric lab results from SENAITE are viewable in the OpenMRS lab results viewer.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Total bilirubin');
  await openmrs.saveLabOrder();
  await senaite.open();
  await expect(page).toHaveURL(/.*senaite/);
  await senaite.searchClient();
  await senaite.createPartition();
  await page.locator('tr:nth-child(1) td.contentcell.Result div span input').fill('64');
  await senaite.publishLabResults();
  const reviewState = await page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span').textContent();
  await expect(reviewState?.includes('Published')).toBeTruthy();

  // verify
  await page.goto(`${O3_URL}`);
  await openmrs.viewTestResults();
  const testName = await page.locator('div:nth-child(2) >div> div.cds--data-table-container td:nth-child(1)').first();
  await expect(testName).toContainText('Total bilirubin');

  const labResult = await page.locator('div:nth-child(2) >div> div.cds--data-table-container table tbody tr td:nth-child(2) span').first();
  await expect(labResult).toContainText('64');
});

test('Published free text lab results from SENAITE are viewable in the OpenMRS lab results viewer.', async ({ page }) => {
  // replay
  await openmrs.goToLabOrderForm();
  await page.getByPlaceholder('Search for a test type').fill('Stool microscopy with concentration');
  await openmrs.saveLabOrder();
  await senaite.open();
  await expect(page).toHaveURL(/.*senaite/);
  await senaite.searchClient();
  await senaite.createPartition();
  await page.locator('div:nth-child(4) div table tbody tr td.contentcell.Result div span input').fill('Test result: Normal');
  await senaite.publishLabResults();
  const reviewState = await page.locator('table tbody tr.contentrow.state-published.parent td.contentcell.State span span').textContent();
  await expect(reviewState?.includes('Published')).toBeTruthy();

  // verify
  await page.goto(`${O3_URL}`);
  await openmrs.viewTestResults();
  const testName = await page.locator('div:nth-child(2) >div> div.cds--data-table-container td:nth-child(1)').first();
  await expect(testName).toHaveText('Stool microscopy with concentration');

  const labResult = await page.locator('div:nth-child(2) >div> div.cds--data-table-container table tbody tr td:nth-child(2) span').first();
  await expect(labResult).toHaveText('Test result: Normal');
});

test.afterEach(async ({ page }) => {
  await openmrs.voidPatient
  await page.close();
});
