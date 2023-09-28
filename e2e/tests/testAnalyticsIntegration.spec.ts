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
/*
test('Starting an OpenMRS visit increases visits count in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT (*) FROM  visits;');
  await homePage.runSQLQuery();
  const initialNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialCount = Number(initialNumberOfItems);

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.startPatientVisit();

  // verify
  await homePage.goToSuperset();
  await homePage.returnToSQLEditor();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT (*) FROM  visits;');
  await homePage.runSQLQuery();
  const updatedNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedCount = Number(updatedNumberOfItems);

  await expect(updatedCount).toBeGreaterThan(initialCount);
});
/*
test('Creating an OpenMRS order increases orders count in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT(*) FROM _orders;');
  await homePage.runSQLQuery();
  const initialNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialCount = Number(initialNumberOfItems);

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // verify
  await homePage.goToSuperset();
  await homePage.returnToSQLEditor();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT(*) FROM _orders;');
  await homePage.runSQLQuery();
  const updatedNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedCount = Number(updatedNumberOfItems);

  await expect(updatedCount).toBeGreaterThan(initialCount);
});

test('Creating an OpenMRS order increases encounters count in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT(*) FROM encounters;');
  await homePage.runSQLQuery();
  const initialNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialCount = Number(initialNumberOfItems);

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // verify
  await homePage.goToSuperset();
  await homePage.returnToSQLEditor();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT(*) FROM encounters;');
  await homePage.runSQLQuery();
  const updatedNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedCount = Number(updatedNumberOfItems);

  await expect(updatedCount).toBeGreaterThan(initialCount);
});

test('Adding an OpenMRS patient condition increases conditions count in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT (*) FROM _conditions;');
  await homePage.runSQLQuery();
  const initialNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).textContent();
  let initialCount = Number(initialNumberOfItems);

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientCondition();

  // verify
  await homePage.goToSuperset();
  await homePage.returnToSQLEditor();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT (*) FROM _conditions;');
  await homePage.runSQLQuery();
  const updatedNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).textContent();
  let updatedCount = Number(updatedNumberOfItems);

  await expect(updatedCount).toBeGreaterThan(initialCount);
});

test('Adding OpenMRS patient biometrics increases observations count in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT (*) FROM observations;');
  await homePage.runSQLQuery();
  const initialNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialCount = Number(initialNumberOfItems);

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientBiometrics();

  // verify
  await homePage.goToSuperset();
  await homePage.returnToSQLEditor();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT (*) FROM observations;');
  await homePage.runSQLQuery();
  const updatedNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedCount = Number(updatedNumberOfItems);

  await expect(updatedCount).toBeGreaterThan(initialCount);
});

test('Adding OpenMRS patient appointment increases appointments count in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT(*) FROM appointments;');
  await homePage.runSQLQuery();

  const initialNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialCount = Number(initialNumberOfItems);

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientAppointment();

  // verify
  await homePage.goToSuperset()
  await homePage.returnToSQLEditor();
  await page.getByRole('textbox').first().clear();
  await page.getByRole('textbox').fill('SELECT COUNT(*) FROM appointments;');
  await homePage.runSQLQuery();

  const updatedNumberOfItems = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedCount = Number(updatedNumberOfItems);

  await expect(updatedCount).toBeGreaterThan(initialCount);
});
*/
test.afterEach(async ({ page }) =>  {
    const homePage = new HomePage(page);
    await homePage.deletePatient();
    await page.close();
  });
