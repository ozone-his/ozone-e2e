import { test, expect } from '@playwright/test';
import { SUPERSET_URL } from '../utils/configs/globalSetup';
import { Odoo } from '../utils/functions/odoo';
import { Superset } from '../utils/functions/superset';
import { OpenMRS, patientName } from '../utils/functions/openmrs';

let odoo: Odoo;
let openmrs: OpenMRS;
let superset: Superset;
let browserContext;
let page;
let salesOrderId;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  odoo = new Odoo(page);
  openmrs = new OpenMRS(page);
  superset = new Superset(page);

  await openmrs.login();
  await openmrs.createPatient();
  await openmrs.startPatientVisit();
});

test(`A (synced) sale order line in Odoo generates an entry in Superset's sale_order_lines table.`, async ({}) => {
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
  await openmrs.searchPatient(`${patientName.givenName}`);
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

test(`Creating an Odoo sale order line generates an entry in Superset's sale_order_lines table.`, async ({}) => {
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

  // replay
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.createSaleOrderLine();
  salesOrderId = await page.locator('.oe_title h1:nth-child(1) span').textContent();
  await expect(page.locator('td[name="product_template_id"] span')).toHaveText('Acétaminophene Co 500mg');

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
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Complete blood count');
  let quantity = Number(await page.locator('div.virtual-table-cell:nth-child(4)').textContent());
  let unitPrice = Number(await page.locator('div.virtual-table-cell:nth-child(5)').textContent());
  await expect(quantity).toBe(8);
  await expect(unitPrice).toBe(2);
});

test(`Revising an Odoo sale order line updates the corresponding entry in Superset's sale_order_lines table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let saleOrderLinesQuery = `SELECT sale_order_name, customer_name, product_name, quantity, unit_price FROM sale_order_lines WHERE sale_order_name like '${salesOrderId}';`;
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${salesOrderId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Acétaminophene Co 500mg');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).toHaveText('8');
  await expect(page.locator('div.virtual-table-cell:nth-child(5)')).toHaveText('2');

  // replay
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).nth(0).click();
  await odoo.modifySaleOrderLine();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${salesOrderId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Acétaminophene Co 500mg');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).toHaveText('10');
  await expect(page.locator('div.virtual-table-cell:nth-child(5)')).toHaveText('3');
});

test(`Voiding an Odoo sale order line updates the corresponding entry in Superset's sale_order_lines table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let saleOrderLinesQuery = `SELECT sale_order_name, customer_name, product_name, quantity, unit_price FROM sale_order_lines WHERE sale_order_name like '${salesOrderId}';`;
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${salesOrderId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Acétaminophene Co 500mg');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).toHaveText('8');
  await expect(page.locator('div.virtual-table-cell:nth-child(5)')).toHaveText('2');

  // replay
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).nth(0).click();
  await odoo.voidSaleOrderLine();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${salesOrderId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Acétaminophene Co 500mg');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).not.toHaveText('8');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).toHaveText('0');
});

test(`Deleting an Odoo quotation line deletes the corresponding entry in Superset's sale_order_lines table.`, async ({}) => {
  // setup
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.createQuotationLine();
  salesOrderId = await page.locator('.oe_title h1:nth-child(1) span').textContent();
  await expect(page.locator('td[name="product_template_id"] span')).toHaveText(/acyclovir Sirop 200mg/i);
  await superset.open();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let saleOrderLinesQuery = `SELECT sale_order_name, customer_name, product_name, quantity, unit_price FROM sale_order_lines WHERE sale_order_name like '${salesOrderId}';`;
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${salesOrderId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName + ' ' + patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText(/acyclovir Sirop 200mg/i);
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).toHaveText('6');
  await expect(page.locator('div.virtual-table-cell:nth-child(5)')).toHaveText('2');

  // replay
  await odoo.open();
  await odoo.navigateToSales();
  await odoo.searchCustomer();
  await page.getByRole('cell', { name: `${patientName.firstName + ' ' + patientName.givenName}` }).nth(0).click();
  await odoo.deleteQuotationLine();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(saleOrderLinesQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.ant-alert-message')).toHaveText(/the query returned no data/i);
});

test.afterAll(async ({}) => {
  await openmrs.voidPatient();
  await odoo.logout();
});
