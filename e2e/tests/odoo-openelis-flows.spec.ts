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
  await openELISGlobal.createLabOrder();

  // verify
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.lastName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(7) span')).toHaveText('$ 31.63');
});

test.afterEach(async ({}) => {
  await keycloak.deleteOEGUser();
});
