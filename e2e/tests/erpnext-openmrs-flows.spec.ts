import { test, expect } from '@playwright/test';
import { ERPNext } from '../utils/functions/erpnext';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { Keycloak } from '../utils/functions/keycloak';

let openmrs: OpenMRS;
let erpnext: ERPNext;
let keycloak: Keycloak;
let browserContext;
let page;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();

  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);
  erpnext = new ERPNext(page);

  await keycloak.open();
  await keycloak.createUser();
  await openmrs.open();
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding ERPNext customer.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);

  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await erpnext.open();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
});
/*
test('Ordering a drug for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);

  // replay
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

  // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await expect(page.getByRole('link', { name: `${patientName.givenName}` })).toBeVisible();
  await page.getByRole('link', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.grid-row', { has: page.locator('a', { hasText: 'Aspirin' }),}).filter({ hasText: '12' })).toBeVisible();
});

test('Editing the details of an OpenMRS patient with a synced order edits the corresponding ERPNext customer details.', async ({}) => {
  // setup
  await erpnext.navigateToHomePage();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
});

test('Revising details of a synced OpenMRS drug order modifies the corresponding ERPNext quotation item.', async ({}) => {
  // setup
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.grid-row', { has: page.locator('a', { hasText: 'Aspirin' }),}).filter({ hasText: '12' })).toBeVisible();

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.modifyDrugOrderDescription();

  // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.grid-row', { has: page.locator('a', { hasText: 'Aspirin' }),}).filter({ hasText: '12' })).not.toBeVisible();
  await expect(page.locator('.grid-row', { has: page.locator('a', { hasText: 'Aspirin' }),}).filter({ hasText: '8' })).toBeVisible();
});

test('Discontinuing a synced OpenMRS lab order for an ERPNext customer removes the corresponding quotation.', async ({}) => {
  // setup
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.grid-row', { has: page.locator('a', { hasText: 'Blood urea nitrogen' }),}).filter({ hasText: '1' })).toBeVisible();

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.cancelLabOrder();

  // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await expect(page.getByText(`${patientName.givenName}`)).not.toBeVisible();
  await expect(page.getByText('No Quotation found')).toBeVisible();
});

test('Ending an OpenMRS patient visit with a synced drug order updates the corresponding ERPNext draft quotation to an open state.', async ({}) => {
  // setup
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Draft');

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.endPatientVisit();

   // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Open');
});

test('Discontinuing a synced OpenMRS drug order for an ERPNext customer with a single quotation line removes the corresponding quotation.', async ({}) => {
  // setup
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.grid-row', { has: page.locator('a', { hasText: 'Aspirin' }),}).filter({ hasText: '8' })).toBeVisible();

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await page.getByRole('link', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.grid-row', { has: page.locator('a', { hasText: 'Aspirin' }),}).filter({ hasText: '8' })).not.toBeVisible();
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding ERPNext customer with a filled quotation.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);

  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchCustomer();
  await expect(page.locator('div.list-row-container:nth-child(3) span:nth-child(2) a')).toContainText(`${patientName.givenName}`);
});

test('Ordering a drug for an OpenMRS patient within a visit creates the corresponding ERPNext customer with a filled quotation linked to the visit.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Acide Folique Co 5mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Draft');

  // replay
  await openmrs.goToHomePage()
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.endPatientVisit();
  await openmrs.startPatientVisit();
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Clarithromycine Co 500mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

   // verify
  await erpnext.navigateToHomePage();
  await erpnext.searchQuotation();
  await expect(page.locator('div.list-row-container:nth-child(3) div:nth-child(3) span:nth-child(1) span')).toHaveText('Draft');
  await expect(page.locator('div.list-row-container:nth-child(4) div:nth-child(3) span:nth-child(1) span')).toHaveText('Open');
});
*/
test.afterAll(async ({}) => {
  await openmrs.voidPatient();
  await openmrs.logout();
  await keycloak.deleteUser();
});