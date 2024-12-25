import { test, expect } from '@playwright/test';
import { O3_URL, ODOO_URL } from '../utils/configs/globalSetup';
import { Odoo } from '../utils/functions/odoo';
import { OpenMRS, patientName } from '../utils/functions/openmrs';

let odoo: Odoo;
let openmrs: OpenMRS;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  odoo = new Odoo(page);

  await openmrs.login();
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test('Ordering a lab test for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
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
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(7) span')).toHaveText('$ 27.50');
});

test('Editing the details of an OpenMRS patient with a synced lab order edits the corresponding Odoo customer details.', async ({ page }) => {
  // setup
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('.o_group>table:nth-child(1) :nth-child(2) td:nth-child(2)>span')).toHaveText('08/16/2002');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('.o_group>table:nth-child(1) :nth-child(2) td:nth-child(2)>span')).not.toHaveText('08/16/2002');
  await expect(page.locator('.o_group>table:nth-child(1) :nth-child(2) td:nth-child(2)>span')).toHaveText('08/18/2003');
});

test('Ordering a drug for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
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
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(7) span')).toHaveText('$ 14.88');
});

test('Editing the details of an OpenMRS patient with a synced drug order edits the corresponding Odoo customer details.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('.o_group>table:nth-child(1) :nth-child(2) td:nth-child(2)>span')).toHaveText('08/16/2002');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.updatePatientDetails();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('table tbody td.o_data_cell:nth-child(4)')).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.givenName }`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('.o_group>table:nth-child(1) :nth-child(2) td:nth-child(2)>span')).not.toHaveText('08/16/2002');
  await expect(page.locator('.o_group>table:nth-child(1) :nth-child(2) td:nth-child(2)>span')).toHaveText('08/18/2003');
});

test('Revising details of a synced OpenMRS drug order modifies the corresponding Odoo quotation line.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const drugOrderItem = await page.locator('table tbody td.o_data_cell:nth-child(3) span');
  await expect(drugOrderItem).toContainText('4.0 Tablet');
  await expect(drugOrderItem).toContainText('Twice daily - 5 day');
  await expect(page.locator('td.o_data_cell:nth-child(9) span')).toHaveText('$ 14.88');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.modifyDrugOrderDescription();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(drugOrderItem).toContainText('8.0 Tablet');
  await expect(drugOrderItem).toContainText('Thrice daily - 6 day');
  await expect(page.locator('td.o_data_cell:nth-child(9) span')).toHaveText('$ 9.92');
});

test('Discontinuing a synced OpenMRS drug order for an Odoo customer with a single quotation line removes the corresponding quotation.', async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('table tbody td.o_data_cell:nth-child(2) span:nth-child(1) span')).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Cancelled');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.getByText('Aspirin 325mg')).not.toBeVisible();
});

test('Discontinuing a synced OpenMRS drug order for an Odoo customer with multiple quotation lines removes the corresponding quoatation.', async ({ page }) => {
  // setup
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span')).toHaveText('Blood urea nitrogen');
  await expect(page.locator('tr.o_data_row:nth-child(2) td:nth-child(2) span:nth-child(1) span')).toHaveText('Aspirin 325mg');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.discontinueDrugOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span')).toHaveText('Blood urea nitrogen');
  await expect(page.getByText('Aspirin 325mg')).not.toBeVisible();
});

test('Ordering a drug with a free text medication dosage for an OpenMRS patient creates the corresponding Odoo customer with a filled quotation.', async ({ page }) => {
  // replay
  await openmrs.createDrugOrderWithFreeTextDosage();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator("td.o_data_cell.o_field_cell.o_list_text.o_section_and_note_text_cell.o_required_modifier span")).toHaveText('Aspirin 325mg | 18.0 Tablet | 3 day - 2 Tablets - Every after eight hours - To be taken after a meal. | Orderer: John Doe');
});

test('Discontinuing a synced OpenMRS lab order for an Odoo customer with a single quotation line cancels the corresponding quotation.', async ({ page }) => {
  // setup
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.cancelLabOrder();
  await expect(page.getByText('Discontinued Blood urea nitrogen')).toBeVisible();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Cancelled');
});

test('Ordering a lab test for an OpenMRS patient with weight creates the weight on the corresponding Odoo quotation.', async ({ page }) => {
  // setup
  await openmrs.recordWeight();

  // replay
  await page.getByLabel('Order basket').click();
  await expect(page.getByRole('button', { name: 'Add', exact: true }).nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Add', exact: true }).nth(1).click();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(7) span')).toHaveText('$ 14.88');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('.o_group :nth-child(1) tbody :nth-child(3) :nth-child(2)>span')).toContainText('75');
});

test(`Recording a patient's weight in OpenMRS on the second order creates the weight on the corresponding Odoo quotation.`, async ({ page }) => {
  // setup
  await openmrs.navigateToDrugOrderForm();
  await page.getByRole('searchbox').fill('Aspirin 325mg');
  await openmrs.fillDrugOrderForm();
  await openmrs.saveDrugOrder();
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('.o_group :nth-child(1) tbody :nth-child(3) :nth-child(2)>span')).toBeEmpty();

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.recordWeight();
  await page.getByLabel('Order basket').click();
  await expect(page.getByRole('button', { name: 'Add', exact: true }).nth(2)).toBeVisible();
  await page.getByRole('button', { name: 'Add', exact: true }).nth(2).click();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await page.goto(`${ODOO_URL}`);
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(2) span:nth-child(1) span')).toHaveText('Aspirin 325mg');
  await expect(page.locator('tr.o_data_row:nth-child(2) td:nth-child(2) span:nth-child(1) span')).toHaveText('Blood urea nitrogen');
  await expect(page.locator('.o_group :nth-child(1) tbody :nth-child(3) :nth-child(2)>span')).toContainText('75');
});

test.afterEach(async ({ page }) => {
  await openmrs.voidPatient();
  await openmrs.logout();
  await odoo.logout();
  await page.close();
});
