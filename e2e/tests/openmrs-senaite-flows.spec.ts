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
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding SENAITE client with an analysis request.', async ({ page }) => {
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await senaite.open();
  await senaite.searchClient();
  await expect(page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
});

test('Editing the details of an OpenMRS patient with a synced lab order edits the corresponding SENAITE client details.', async ({ page }) => {
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await senaite.open();
  await senaite.searchClient();
  await expect(page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${SENAITE_URL}`);
  await senaite.searchClient();
  await expect(page.locator('table tbody tr:nth-child(1) td.contentcell.title div span a')).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName }`);
});

test('Voiding a synced OpenMRS lab order cancels the corresponding SENAITE analysis request.', async ({ page }) => {
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await senaite.open();
  await senaite.searchClient();
  await expect(page.locator('table tbody tr:nth-child(1) td.contentcell.title div')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.getId div span a').click();
  await expect(page.locator('#sampleheader-standard-fields tr:nth-child(1) td:nth-child(6)')).toHaveText('Blood urea nitrogen Template');
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.cancelLabOrder();
  await expect(page.getByText('Discontinued Blood urea nitrogen')).toBeVisible();

  // verify
  await page.goto(`${SENAITE_URL}`);
  await senaite.searchClient();
  await page.locator('table tbody tr:nth-child(1) td.contentcell.title div').click();
  await expect(page.getByText('Urine')).not.toBeVisible();
  await expect(page.getByText('Sample due')).not.toBeVisible();
});

test('Published coded lab results from SENAITE are viewable in the OpenMRS lab results viewer.', async ({ page }) => {
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Hepatitis C test - qualitative');
  await openmrs.saveLabOrder();
  await senaite.open();
  await senaite.searchClient();
  await senaite.receiveSample();
  await page.getByRole('combobox', { name: 'Result' }).selectOption('664AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await senaite.publishLabResults();

  // verify
  await page.goto(`${O3_URL}`);
  await openmrs.viewTestResults();
  await expect(page.locator('tbody tr td:nth-child(1) p')).toContainText('Hepatitis C test - qualitative');
  await expect(page.locator('tbody tr td:nth-child(2) p')).toContainText('Negative');
});

test('Published numeric lab results from SENAITE are viewable in the OpenMRS lab results viewer.', async ({ page }) => {
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Total bilirubin');
  await openmrs.saveLabOrder();
  await senaite.open();
  await senaite.searchClient();
  await senaite.receiveSample();
  await page.locator('tr:nth-child(1) td.contentcell.Result div span input').fill('64');
  await senaite.publishLabResults();

  // verify
  await page.goto(`${O3_URL}`);
  await openmrs.viewTestResults();
  await expect(page.locator('tbody tr td:nth-child(1) p')).toContainText('Total bilirubin');
  await expect(page.locator('tbody tr td:nth-child(2) p')).toContainText('64');
});

test('Published free text lab results from SENAITE are viewable in the OpenMRS lab results viewer.', async ({ page }) => {
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Stool microscopy with concentration');
  await openmrs.saveLabOrder();
  await senaite.open();
  await senaite.searchClient();
  await senaite.receiveSample();
  await page.locator('div:nth-child(4) div table tbody tr td.contentcell.Result div span input').fill('Positive');
  await senaite.publishLabResults();

  // verify
  await page.goto(`${O3_URL}`);
  await openmrs.viewTestResults();
  await expect(page.locator('tbody tr td:nth-child(1) p')).toContainText('Stool microscopy with concentration');
  await expect(page.locator('tbody tr td:nth-child(2) p')).toContainText('Positive');
});

test.afterEach(async ({ page }) => {
  await openmrs.voidPatient();
  await page.close();
});
