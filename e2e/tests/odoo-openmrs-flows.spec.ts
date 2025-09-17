import { test, expect } from '@playwright/test';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { Odoo } from '../utils/functions/odoo';
import { Keycloak } from '../utils/functions/keycloak';

let odoo: Odoo
let openmrs: OpenMRS;
let keycloak: Keycloak;
let browserContext;
let page;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  openmrs = new OpenMRS(page);
  keycloak = new Keycloak(page);
  odoo = new Odoo(page);

  await keycloak.open();
  await keycloak.createUser();
  await openmrs.open();
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);
  
  // replay
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(7) span')).toHaveText('$ 31.63');
});

test('Ordering a drug for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);

  // replay
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('tr', { has: page.locator('td', { hasText: 'Aspirin 325mg' }),}).locator('td[name="price_subtotal"]')).toHaveText('$ 14.88')
});
/*
test('Editing the details of an OpenMRS patient with a synced order edits the corresponding Odoo customer details.', async ({}) => {
  // setup
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.text-break>div>div>span')).toHaveText('08/16/2002');

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('.text-break>div>div>span')).not.toHaveText('08/16/2002');
  await expect(page.locator('.text-break>div>div>span')).toHaveText('08/18/2003');
});

test('Revising details of a synced OpenMRS drug order modifies the corresponding Odoo quotation line.', async ({}) => {
  // setup
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  const drugOrderItem = await page.locator('table tbody td.o_data_cell:nth-child(3) span');
  await expect(drugOrderItem).toContainText('4.0 Tablet');
  await expect(drugOrderItem).toContainText('Twice daily - 5 day');
  await expect(page.locator('[name="amount_total"]')).toHaveText('$ 17.11');

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.modifyDrugOrderDescription();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(drugOrderItem).toContainText('8.0 Tablet');
  await expect(drugOrderItem).toContainText('Thrice daily - 6 day');
  await expect(page.locator('[name="amount_total"]')).toHaveText('$ 11.41');
});
/*
test('Discontinuing a synced OpenMRS lab order for an Odoo customer with a single quotation line cancels the corresponding quotation.', async ({}) => {
  // setup
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.cancelLabOrder();
  await expect(page.getByText('Discontinued Blood urea nitrogen')).toBeVisible();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Cancelled');
});

test('Discontinuing a synced OpenMRS drug order for an Odoo customer with a single quotation line removes the corresponding quotation.', async ({}) => {
  // setup
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('table tbody td.o_data_cell:nth-child(2) span:nth-child(1) span')).toHaveText('Aspirin 325mg');

  // replay
  await odoo.open();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Cancelled');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.getByText('Aspirin 325mg')).not.toBeVisible();
});

test('Discontinuing a synced OpenMRS drug order for an Odoo customer with multiple quotation lines removes the corresponding quotation.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Complete blood count');
  await openmrs.saveLabOrder();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 81mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span')).toHaveText('Blood urea nitrogen');
  await expect(page.locator('tr.o_data_row:nth-child(2) td:nth-child(2) span:nth-child(1) span')).toHaveText('Aspirin 81mg');

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span')).toHaveText('Blood urea nitrogen');
  await expect(page.getByText('Aspirin 81mg')).not.toBeVisible();
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({}) => {
  // setup
  await openmrs.searchPatient(`${patientName.givenName}`);

  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator("td.o_data_cell.o_field_cell.o_list_text.o_section_and_note_text_cell.o_required_modifier span")).toHaveText('Acetaminophen 325 mg | 18.0 Tablet | 3 day - 2 Tablets - Every after eight hours - To be taken after a meal. | Orderer: John Doe');
});

test(`Ordering a drug for an OpenMRS patient with weight creates the weight on the corresponding Odoo quotation.`, async ({}) => {
  // setup
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('#x_customer_weight_0')).toBeEmpty();

  // replay
  await openmrs.goToHomePage();
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.recordWeight();
  await openmrs.navigateToLabOrderForm();
  await page.getByLabel('Order basket').click();
  await page.getByRole('searchbox').fill('Hepatitis C test - qualitative');
  await openmrs.saveLabOrder();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(2) td:nth-child(2) span:nth-child(1) span')).toHaveText('Hepatitis C test - qualitative');
  await expect(page.locator('#x_customer_weight_0')).toHaveValue('75.0 kg');
});
*/
test.afterAll(async ({}) => {
  await openmrs.voidPatient();
  await odoo.logout();
  await keycloak.deleteUser();
});
