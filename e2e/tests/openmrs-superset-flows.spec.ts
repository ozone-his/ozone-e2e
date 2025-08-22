import { test, expect } from '@playwright/test';
import { O3_URL, SUPERSET_URL } from '../utils/configs/globalSetup';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { Superset } from '../utils/functions/superset';
import { Keycloak } from '../utils/functions/keycloak';

let openmrs: OpenMRS;
let keycloak: Keycloak;
let superset: Superset;
let browserContext;
let page;
let patient_uuid;
let patientIdentifier;
let initialObservationsCount;
let updatedEncountersCount;
let patientId;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  openmrs = new OpenMRS(page);
  superset = new Superset(page);
  keycloak = new Keycloak(page);

  await keycloak.open();
  await keycloak.createUser();
});

test(`Creating an OpenMRS patient creates the patient in Superset's patients table.`, async ({}) => {
  // setup
  await openmrs.login();
  await superset.open();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let patientsCountQuery = `SELECT COUNT (*) FROM patients;`
  await page.getByRole('textbox').first().fill(patientsCountQuery);
  await superset.runSQLQuery();
  let initialPatientsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.createPatient();
  patient_uuid = await openmrs.getPatientUuid();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(patientsCountQuery);
  await superset.runSQLQuery();
  let updatedPatientsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedPatientsCount).toBe(initialPatientsCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let patientQuery = `SELECT patient_id, given_name, family_name, identifiers, gender, birthdate FROM patients WHERE patient_uuid like '${patient_uuid}';`;
  await page.getByRole('textbox').fill(patientQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText(`${patientName.firstName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText(`${patientName.givenName}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(5)')).toHaveText('M');
  await expect(page.locator('div.virtual-table-cell:nth-child(6)')).toHaveText('2002-08-16');
  await page.getByRole('tab', { name: 'Results' }).click();
  await superset.clearSQLEditor();
});

test(`Creating an OpenMRS visit creates the visit in Superset's visits table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let visitsCountQuery = `SELECT COUNT (*) FROM visits;`
  await page.getByRole('textbox').first().fill(visitsCountQuery);
  await superset.runSQLQuery();
  let initialVisitsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await openmrs.startPatientVisit();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(visitsCountQuery);
  await superset.runSQLQuery();
  let updatedVisitsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedVisitsCount).toBe(initialVisitsCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let patientVisitQuery = `SELECT patient_gender, patient_age_at_visit, patient_birthdate, patient_uuid FROM visits WHERE patient_uuid like '${patient_uuid}';`;
  await page.getByRole('textbox').first().fill(patientVisitQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText('M');
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText('22');
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('2002-08-16');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).toHaveText(`${patient_uuid}`)
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
});
test(`Creating an OpenMRS encounter creates the encounter in Superset's encounters table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let encountersCountQuery = `SELECT COUNT(*) FROM encounters;`
  await page.getByRole('textbox').first().fill(encountersCountQuery);
  await superset.runSQLQuery();
  let initialEncountersCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Blood urea nitrogen');
  await openmrs.saveLabOrder();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(encountersCountQuery);
  await superset.runSQLQuery();
  updatedEncountersCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedEncountersCount).toBe(initialEncountersCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let encounterQuery = `SELECT patient_uuid, encounter_id, encounter_voided, encounter_datetime FROM encounters WHERE encounter_id=${updatedEncountersCount};`;
  await page.getByRole('textbox').first().fill(encounterQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toContainText(`${updatedEncountersCount}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toContainText('false');
  await page.getByRole('tab', { name: 'Results' }).click();
  await superset.clearSQLEditor();
});

test(`Creating an OpenMRS order creates the order in Superset's orders table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let ordersCountQuery = `SELECT COUNT(*) FROM orders;`
  await page.getByRole('textbox').first().fill(ordersCountQuery);
  await superset.runSQLQuery();
  let initialOrdersCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.navigateToLabOrderForm();
  await page.getByRole('searchbox').fill('Complete blood count');
  await openmrs.saveLabOrder();
  await openmrs.navigateToLabOrders();
  const orderElement = await page.locator('text=/ORD-\\d+/').nth(0);
  const orderNumber = await orderElement.textContent();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(ordersCountQuery);
  await superset.runSQLQuery();
  let updatedOrdersCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedOrdersCount).toBe(initialOrdersCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let orderQuery = `SELECT order_number, patient_uuid, encounter_voided FROM orders WHERE order_number like '${orderNumber}';`;
  await page.getByRole('textbox').first().fill(orderQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText(`${orderNumber}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('false');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
});

test(`Creating an OpenMRS condition creates the condition in Superset's conditions table.`, async ({}) => {
  // setup
  await openmrs.searchPatientId();
  patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let conditionsCountQuery = `SELECT COUNT (*) FROM conditions;`
  await page.getByRole('textbox').first().fill(conditionsCountQuery);
  await superset.runSQLQuery();
  let initialConditionsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await page.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.addPatientCondition();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(conditionsCountQuery);
  await superset.runSQLQuery();
  let updatedConditionsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedConditionsCount).toBe(initialConditionsCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifiers like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await superset.runSQLQuery();
  patientId = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Results' }).click();
  await superset.clearSQLEditor();
  let conditionQuery = `SELECT patient_id, condition_id, clinical_status, onset_date, voided FROM conditions WHERE patient_id=${patientId};`;
  await page.getByRole('textbox').first().fill(conditionQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)').nth(0)).toHaveText(`${patientId}`);
  await expect(page.locator('div.virtual-table-cell:nth-child(3)').nth(0)).toContainText('ACTIVE');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)').nth(0)).toContainText('2023-07-27');
  await expect(page.locator('div.virtual-table-cell:nth-child(5)').nth(0)).toContainText('false');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
});

test(`Creating an OpenMRS obs creates the observation in Superset's observations table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let observationsCountQuery = `SELECT COUNT (*) FROM observations;`
  await page.getByRole('textbox').first().fill(observationsCountQuery);
  await superset.runSQLQuery();
  initialObservationsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.addPatientBiometrics();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(observationsCountQuery);
  await superset.runSQLQuery();
  let updatedObservationsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedObservationsCount).toBe(initialObservationsCount + 3);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let observationsQuery = `SELECT obs_id, obs_voided, patient_uuid, answer_numeric, obs_date_time, obs_uuid FROM observations WHERE obs_id IN (${initialObservationsCount + 1}, ${initialObservationsCount + 2}, ${initialObservationsCount + 3});`;
  await page.getByRole('textbox').fill(observationsQuery);
  await superset.runSQLQuery();
  await expect(page.getByText('false').nth(0)).toBeVisible();
  await expect(page.getByText('165', { exact: true })).toBeVisible();
  await expect(page.getByText('34', { exact: true })).toBeVisible();
  await expect(page.getByText('78', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Results' }).click();
  await superset.clearSQLEditor();
});

test(`Creating an OpenMRS appointment creates the appointment in Superset's appointments table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let appointmentsCountQuery = `SELECT COUNT(*) FROM appointments;`
  await page.getByRole('textbox').first().fill(appointmentsCountQuery);
  await superset.runSQLQuery();
  let initialAppointmentsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.addPatientAppointment();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(appointmentsCountQuery);
  await superset.runSQLQuery();
  let updatedAppointmentsCount = Number(await page.locator('div.virtual-table-cell').textContent());
  await expect(updatedAppointmentsCount).toBe(initialAppointmentsCount + 1);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
  let appointmentQuery = `SELECT patient_id, status, appointment_kind, comments, appointment_service_name FROM appointments WHERE patient_id=${patientId};`;
  await page.getByRole('textbox').fill(appointmentQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText('Scheduled');
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('Scheduled');
  await expect(page.locator('div.virtual-table-cell:nth-child(4)')).toHaveText('This is an appointment.');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await superset.clearSQLEditor();
});

test(`Voiding an OpenMRS obs updates the observation in Superset's observations table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let obsVoidedQuery = `SELECT obs_voided FROM Observations WHERE obs_id IN (${initialObservationsCount + 1}, ${initialObservationsCount + 2}, ${initialObservationsCount + 3});`;
  await page.getByRole('textbox').first().fill(obsVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText('false');
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText('false');
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('false');

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.voidObs();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(obsVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell:nth-child(1)')).toHaveText('true');
  await expect(page.locator('div.virtual-table-cell:nth-child(2)')).toHaveText('true');
  await expect(page.locator('div.virtual-table-cell:nth-child(3)')).toHaveText('true');
  await page.getByRole('tab', { name: 'Results' }).click();
  await superset.clearSQLEditor();
});

test(`Voiding an OpenMRS condition updates the condition in Superset's conditions table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let conditionVoidedQuery = `SELECT voided FROM conditions WHERE patient_id=${patientId};`;
  await page.getByRole('textbox').first().fill(conditionVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell')).toHaveText('false');
  await superset.clearSQLEditor();

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.voidPatientCondition();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(conditionVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell')).toHaveText('true');
  await superset.clearSQLEditor();
});

test(`Cancelling an OpenMRS appointment updates the appointment in Superset's appointments table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let appointmentStatusQuery = `SELECT status FROM appointments WHERE patient_id=${patientId};`;
  await page.getByRole('textbox').first().fill(appointmentStatusQuery);
  await superset.runSQLQuery();
  let appointmentStatus = await page.locator('div.virtual-table-cell');
  await expect(appointmentStatus).toContainText('Scheduled');
  await superset.clearSQLEditor();

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.cancelPatientAppointment();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(appointmentStatusQuery);
  await superset.runSQLQuery();
  await expect(appointmentStatus).toContainText('Cancelled');
  await superset.clearSQLEditor();
});

test(`Voiding an OpenMRS encounter updates the encounter in Superset's encounters table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let encounterVoidedQuery = `SELECT encounter_voided FROM encounters WHERE encounter_id=${updatedEncountersCount};`;
  await page.getByRole('textbox').first().fill(encounterVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell')).toHaveText('false');
  await superset.clearSQLEditor();

  // replay
  await openmrs.searchPatient(`${patientName.givenName}`);
  await openmrs.voidEncounter();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(encounterVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell')).toHaveText('true');
  await superset.clearSQLEditor();
});

test(`Voiding an OpenMRS patient updates the patient in Superset's patients table.`, async ({}) => {
  // setup
  await superset.navigateToHomePage();
  await superset.selectDBSchema();
  await superset.clearSQLEditor();
  let personVoidedQuery = `SELECT person_voided FROM patients where patient_uuid like '${patient_uuid}';`;
  await page.getByRole('textbox').first().fill(personVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell')).toHaveText('false');

  // replay
  await openmrs.voidPatient();

  // verify
  await page.goto(`${SUPERSET_URL}/sqllab`);
  await superset.clearSQLEditor();
  await page.getByRole('textbox').first().fill(personVoidedQuery);
  await superset.runSQLQuery();
  await expect(page.locator('div.virtual-table-cell')).toHaveText('true');
  await superset.clearSQLEditor();
  await openmrs.logout();
});

test(`Superset should contain dataset per flattened table on fresh install dataset`, async ({}) => {
  // setup
  await openmrs.open();

  // replay
  await superset.open();

  // verify
  await superset.navigateToDatasets();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('patients');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'patients' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('orders');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'orders' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('appointments');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'appointments' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('concepts');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'concepts' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('conditions');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'conditions' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('encounter_diagnoses');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'encounter_diagnoses' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('encounters');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'encounters' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('locations');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'locations' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('observations');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'observations' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('patient_programs');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'patient_programs' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('sale_order_lines');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'sale_order_lines' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
  await page.getByRole('textbox', { name: 'Type a value' }).fill('visits');
  await superset.pressEnterButton();
  await expect(page.locator('tr', { has: page.locator('a', { hasText: 'visits' })}).locator('[aria-label="dataset-virtual"]')).toBeVisible();
});

test.afterAll(async ({}) => {
  await keycloak.deleteUser();
});
