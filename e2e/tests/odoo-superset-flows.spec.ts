import { test, expect } from '@playwright/test';
import { Odoo } from '../utils/functions/odoo';
import { Superset } from '../utils/functions/superset';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { O3_URL, SUPERSET_URL } from '../utils/configs/globalSetup';

let odoo: Odoo;
let openmrs: OpenMRS;
let superset: Superset;

test.beforeEach(async ({ page }) => {
  openmrs = new OpenMRS(page);
  odoo = new Odoo(page);
  superset = new Superset(page);

  await openmrs.login();
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test(`Creating an Odoo sale order line generates an entry in Superset's sale_order_lines table.`, async ({ page }) => {
  // setup
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Complete blood count');
  await openmrs.saveLabOrder();
  await superset.open();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let saleOrderLinesCountQuery = `SELECT COUNT (*) FROM sale_order_lines;`;
  await page.getByRole('textbox').first().fill(saleOrderLinesCountQuery);
  await superset.runSQLQuery();
  let initialSaleOrderLinesCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.createSaleOrderLine();
  const salesOrderId = await page.locator('.oe_title h1:nth-child(1) span').textContent();
  await expect(page.locator('table tbody td.o_data_cell:nth-child(2) span:nth-child(1) span')).toHaveText('Acétaminophene Co 500mg');

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(saleOrderLinesCountQuery);
  await superset.runSQLQuery();
  let updatedSaleOrderLinesCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedSaleOrderLinesCount).toBe(initialSaleOrderLinesCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let saleOrderLinesQuery = `SELECT sale_order_name, customer_name, product_name, quantity, unit_price FROM sale_order_lines WHERE sale_order_name like '${salesOrderId}';`;
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${salesOrderId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Acétaminophene Co 500mg');
  let quantity = Number(await page.locator('div.virtual-table-cell:nth-child(4)').textContent());
  let unitPrice = Number(await page.locator('div.virtual-table-cell:nth-child(5)').textContent());
  await expect(quantity).toBe(8);
  await expect(unitPrice).toBe(2);
});

test(`A (synced) sale order line in Odoo generates an entry in Superset's sale_order_lines table.`, async ({ page }) => {
  // setup
  await superset.open();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let saleOrderLinesCountQuery = `SELECT COUNT (*) FROM sale_order_lines;`;
  await page.getByRole('textbox').first().fill(saleOrderLinesCountQuery);
  await superset.runSQLQuery();
  let initialSaleOrderLinesCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Haemoglobin');
  await openmrs.saveLabOrder();

  // replay
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(4)')).toContainText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('tr.o_data_row:nth-child(1) td:nth-child(8) span')).toHaveText('Quotation');
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).click();
  const salesOrderId = await page.locator('.oe_title h1:nth-child(1) span').textContent();
  await expect(page.locator('table tbody td.o_data_cell:nth-child(2) span:nth-child(1) span')).toHaveText('Haemoglobin');
  let quantity = Number(await page.locator('td.o_data_cell:nth-child(4)').textContent());
  await expect(quantity).toBe(1);
  await expect(page.locator('td.o_data_cell:nth-child(7)')).toContainText('24');

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(saleOrderLinesCountQuery);
  await superset.runSQLQuery();
  let updatedSaleOrderLinesCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedSaleOrderLinesCount).toBe(initialSaleOrderLinesCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let saleOrderLinesQuery = `SELECT sale_order_name, customer_name, product_name, quantity, unit_price FROM sale_order_lines WHERE sale_order_name like '${salesOrderId}';`;
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${salesOrderId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Haemoglobin');
  quantity = Number(await page.locator('div.virtual-table-cell:nth-child(4)').textContent());
  let unitPrice = Number(await page.locator('div.virtual-table-cell:nth-child(5)').textContent());
  await expect(quantity).toBe(1);
  await expect(unitPrice).toBe(24);
});

test.afterEach(async ({ page }) => {
  await openmrs.voidPatient();
  await page.close();
});
