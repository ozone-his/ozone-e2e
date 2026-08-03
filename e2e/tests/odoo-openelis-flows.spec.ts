import { test, expect } from '@playwright/test';
import { Odoo } from '../utils/functions/odoo';
import { Keycloak } from '../utils/functions/keycloak';
import { OpenELISGlobal, patientName } from '../utils/functions/openelis';

let odoo: Odoo
let openELISGlobal: OpenELISGlobal;
let keycloak: Keycloak;

test.beforeEach(async ({ page }) => {
  keycloak = new Keycloak(page);
  openELISGlobal = new OpenELISGlobal(page);
  odoo = new Odoo(page);

  await keycloak.login();
  await keycloak.createUser();
  await keycloak.assignOdooAndOEGRolesToUser();
});

test('Ordering a lab test for an OpenELIS Global patient creates the corresponding Odoo partner with a filled quotation.', async ({page}) => {
  // setup
  await openELISGlobal.open();

  // replay
  await openELISGlobal.createPatient();
  await openELISGlobal.enterProgram();
  await openELISGlobal.selectSingleLabOrder();
  await openELISGlobal.fillOrderForm();

  // verify
  await odoo.signIn();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.lastName}`);
});

test('Ordering multiple lab tests for an OpenELIS Global patient creates the corresponding Odoo partner with a filled quotation.', async ({page}) => {
  // setup
  await openELISGlobal.open();

  // replay
  await openELISGlobal.createPatient();
  await openELISGlobal.enterProgram();
  await openELISGlobal.selectMultipleLabOrders()
  await openELISGlobal.fillOrderForm();

  // verify
  await odoo.signIn();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.lastName}`);
});

test('Editing the details of an OpenMRS patient with a synced order edits the corresponding Odoo customer details.', async ({page}) => {
  // reply
  await openELISGlobal.open();
  await openELISGlobal.createPatient();
  await openELISGlobal.enterProgram();
  await openELISGlobal.selectSingleLabOrder();
  await openELISGlobal.fillOrderForm();
  await odoo.signIn();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.lastName}`);
  await openELISGlobal.goToHomePage();

  // verify
  await odoo.signIn();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.lastName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.lastName}` }).click();
  await expect(page.locator('.text-break>div>div>span')).not.toHaveText('08/16/2002');
  await expect(page.locator('.text-break>div>div>span')).toHaveText('08/18/2003');
});

test('Ordering additional lab test for an OpenELIS Global patient with a synced order updates the corresponding partner’s sale order .', async ({page}) => {
  // reply
  await openELISGlobal.open();
  await openELISGlobal.createPatient();
  await openELISGlobal.enterProgram();
  await openELISGlobal.selectSingleLabOrder();
  await openELISGlobal.fillOrderForm();
  await odoo.signIn();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.lastName}`);
  await openELISGlobal.goToHomePage();

  // verify
  await odoo.goToHomePage();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toHaveText(`${patientName.updatedFirstName}` + ' ' + `${patientName.lastName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.lastName}` }).click();
  await expect(page.locator('.text-break>div>div>span')).not.toHaveText('08/16/2002');
  await expect(page.locator('.text-break>div>div>span')).toHaveText('08/18/2003');
});

test.afterEach(async ({}) => {
  await keycloak.deleteOEGUser();
});
