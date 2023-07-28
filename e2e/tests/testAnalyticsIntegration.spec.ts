import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) =>  {
   const homePage = new HomePage(page);
   await homePage.initiateLogin();

   await expect(page).toHaveURL(/.*home/);

   await homePage.createPatient();
});

test('Making an order updates orders table in Analytics', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToAnalytics();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await page.getByRole('textbox').fill('SELECT * FROM _orders;');
  await homePage.runSQLQuery();
  // let numberOfItems =   (await page.getByRole('gridcell', { name: ' ' }).innerText()).toString();
  // let initialCount = parseInt(numberOfItems.trim());

  //await page.locator('tr').first().waitFor();
  await page.getByRole('gridcell', { name: ' ' }).first().waitFor();
  let initialCount = await page.getByRole('gridcell', { name: ' ' }).count();
  //let initialCount = parseInt(num);
  // console.log(await page.locator('tr').count());

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // verify
  await homePage.goToAnalytics();
  await homePage.clearQueryHistory();
  await page.getByRole('textbox').first().fill('SELECT * FROM _orders;');
  await homePage.runSQLQuery();
  //let updatedNumberOfItems =   (await page.getByRole('gridcell', { name: ' ' }).innerText()).toString();
  //let updatedCount = parseInt(updatedNumberOfItems.trim());

  await page.getByRole('gridcell', { name: ' ' }).first().waitFor();
  let updatedCount = await page.getByRole('gridcell', { name: ' ' }).count();

  await expect(updatedCount).toBeGreaterThan(initialCount);
});

// test('Making an order updates encounters table in Analytics', async ({ page }) => {
//   // setup
//   const homePage = new HomePage(page);
//   await homePage.goToAnalytics();
//   await expect(page).toHaveURL(/.*superset/);
//   await homePage.selectDBSchema();
//   await page.getByRole('textbox').fill('SELECT COUNT(*) FROM encounters;');
//   await homePage.runSQLQuery();
//   const initialNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let initialCount = parseInt(initialNumberOfItems.trim());

//   // replay
//   await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
//   await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
//   await homePage.goToLabOrderForm();
//   await page.getByRole('button', { name: 'Add', exact: true }).click();
//   await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
//   await homePage.saveLabOrder();

//   // verify
//   await homePage.goToAnalytics();
//   await homePage.clearQueryHistory();
//   await page.getByRole('textbox').fill('SELECT COUNT(*) FROM encounters;');
//   await homePage.runSQLQuery();
//   const updatedNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let updatedCount = parseInt(updatedNumberOfItems.trim());

//   await expect(updatedCount).toBeGreaterThan(initialCount);
// });

// test('Adding patient condition updates conditions table in Analytics', async ({ page }) => {
//   // setup
//   const homePage = new HomePage(page);
//   await homePage.goToAnalytics();
//   await expect(page).toHaveURL(/.*superset/);
//   await homePage.selectDBSchema();
//   await page.getByRole('textbox').fill('SELECT COUNT (*) FROM _conditions;');
//   await homePage.runSQLQuery();
//   const initialNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let initialCount = parseInt(initialNumberOfItems.trim());

//   // replay
//   await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
//   await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
//   await homePage.addPatientCondition();

//   // verify
//   await homePage.goToAnalytics();
//   await homePage.clearQueryHistory();
//   await page.getByRole('textbox').fill('SELECT COUNT (*) FROM _conditions;');
//   await homePage.runSQLQuery();
//   const updatedNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let updatedCount = parseInt(updatedNumberOfItems.trim());

//   await expect(updatedCount).toBeGreaterThan(initialCount);
// });

// test('Adding patient biometrics updates observations table in Analytics', async ({ page }) => {
//   // setup
//   const homePage = new HomePage(page);
//   await homePage.goToAnalytics();
//   await expect(page).toHaveURL(/.*superset/);
//   await homePage.selectDBSchema();
//   await page.getByRole('textbox').fill('SELECT COUNT (*) FROM observations;');
//   await homePage.runSQLQuery();
//   const initialNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let initialCount = parseInt(initialNumberOfItems.trim());

//   // replay
//   await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
//   await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
//   await homePage.addPatientBiometrics();

//   // verify
//   await homePage.goToAnalytics();
//   await homePage.clearQueryHistory();
//   await page.getByRole('textbox').fill('SELECT COUNT (*) FROM observations;');
//   await homePage.runSQLQuery();
//   const updatedNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let updatedCount = parseInt(updatedNumberOfItems.trim());

//   await expect(updatedCount).toBeGreaterThan(initialCount);
// });

// test('Adding patient appointment updates appointments table in Analytics', async ({ page }) => {
//   // setup
//   const homePage = new HomePage(page);
//   await homePage.goToAnalytics();
//   await expect(page).toHaveURL(/.*superset/);
//   await homePage.selectDBSchema();
//   await page.getByRole('textbox').fill('SELECT COUNT (*) FROM appointments;');
//   await homePage.runSQLQuery();
//   const initialNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let initialCount = parseInt(initialNumberOfItems.trim());

//   // replay
//   await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
//   await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
//   await homePage.addPatientAppointment();


//   // verify
//   await homePage.goToAnalytics();
//   await homePage.clearQueryHistory();
//   await page.getByRole('textbox').fill('SELECT COUNT (*) FROM appointments;');
//   await homePage.runSQLQuery();
//   const updatedNumberOfItems =   await page.getByRole('gridcell', { name: ' ' }).innerText();
//   let updatedCount = parseInt(updatedNumberOfItems.trim());

//   await expect(updatedCount).toBeGreaterThan(initialCount);
// });

test.afterEach(async ({ page }) =>  {
    const homePage = new HomePage(page);
    await homePage.deletePatient();
    await page.close();
  });
