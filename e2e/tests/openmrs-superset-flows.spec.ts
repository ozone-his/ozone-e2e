import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';
import { O3_URL, SUPERSET_URL } from '../utils/configs/globalSetup';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  homePage = new HomePage(page);
});

test('Creating an OpenMRS patient creates the patient in Superset patients table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let patientsCountQuery = `SELECT COUNT (*) FROM patients;`
  await page.getByRole('textbox').first().fill(patientsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfPatients = await page.locator('div.virtual-table-cell').textContent();
  let initialPatientsCount = Number(initialNumberOfPatients);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await homePage.createPatient();
  await homePage.searchOpenMRSPatientID();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(patientsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfPatients = await page.locator('div.virtual-table-cell').textContent();
  let updatedPatientsCount = Number(updatedNumberOfPatients);

  await expect(updatedPatientsCount).toBe(initialPatientsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientQuery = `SELECT * FROM patients WHERE identifiers like 'OpenMRS ID: ${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientQuery);
  await homePage.runSQLQuery();
  let patientGivenName = await page.getByText(`${patientName.firstName}`);
  let patientFamilyName = await page.getByText(`${patientName.givenName}`);
  let patientGender = await page.getByText('M', { exact: true });

  await expect(patientGivenName).toContainText(`${patientName.firstName}`);
  await expect(patientFamilyName).toContainText(`${patientName.givenName}`);
  await expect(patientGender).toHaveText('M');
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
});

test('Creating an OpenMRS visit creates the visit in Superset visits table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let visitsCountQuery = `SELECT COUNT (*) FROM visits;`
  await page.getByRole('textbox').first().fill(visitsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfVisits = await page.locator('div.virtual-table-cell').textContent();
  let initialVisitsCount = Number(initialNumberOfVisits);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await homePage.startPatientVisit();
  const patient_uuid = await homePage.getPatientUUID();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(visitsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfVisits = await page.locator('div.virtual-table-cell').textContent();
  let updatedVisitsCount = Number(updatedNumberOfVisits);

  await expect(updatedVisitsCount).toBe(initialVisitsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientVisitQuery = `SELECT * FROM visits WHERE patient_uuid like '${patient_uuid}';`;
  await page.getByRole('textbox').first().fill(patientVisitQuery);
  await homePage.runSQLQuery();
  let patientVisitType = await page.getByText('Facility Visit');
  const patientGender = await page.getByText('M', {exact: true });
  let patientAgeAtVisit = Number(await page.getByText('24', {exact: true }).nth(0).textContent());

  await expect(patientVisitType).toContainText('Facility Visit');
  await expect(patientGender).toContainText('M');
  await expect(patientAgeAtVisit).toBe(24);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test('Creating an OpenMRS order creates the order in Superset orders table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.searchOpenMRSPatientID();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let ordersCountQuery = `SELECT COUNT(*) FROM orders;`
  await page.getByRole('textbox').first().fill(ordersCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfOrders = await page.locator('div.virtual-table-cell').textContent();
  let initialOrdersCount = Number(initialNumberOfOrders);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(ordersCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfOrders = await page.locator('div.virtual-table-cell').textContent();
  let updatedOrdersCount = Number(updatedNumberOfOrders);

  await expect(updatedOrdersCount).toBe(initialOrdersCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifiers like 'OpenMRS ID: ${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.locator('div.virtual-table-cell').textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let orderQuery = `SELECT * FROM orders WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(orderQuery);
  await homePage.runSQLQuery();
  let orderTypeName = await page.getByText('Test Order' );
  let encounterTypeName = await page.getByText('Consultation', { exact: true });

  await expect(orderTypeName).toContainText('Test Order');
  await expect(encounterTypeName).toContainText('Consultation');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test('Creating an OpenMRS encounter creates the encounter in Superset encounters table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.searchOpenMRSPatientID();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let encountersCountQuery = `SELECT COUNT(*) FROM encounters;`
  await page.getByRole('textbox').first().fill(encountersCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfEncounters = await page.locator('div.virtual-table-cell').textContent();
  let initialEncountersCount = Number(initialNumberOfEncounters);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(encountersCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfEncounters = await page.locator('div.virtual-table-cell').textContent();
  let updatedEncountersCount = Number(updatedNumberOfEncounters);

  await expect(updatedEncountersCount).toBe(initialEncountersCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifiers like 'OpenMRS ID: ${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.locator('div.virtual-table-cell').textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let encounterIdQuery = `SELECT encounter_id FROM orders WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(encounterIdQuery);
  await homePage.runSQLQuery();
  let encounterId = await page.locator('div.virtual-table-cell').textContent();
  const encounterIdValue = Number(encounterId);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let encounterTypeUuidQuery = `SELECT encounter_type_uuid FROM orders WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').fill(encounterTypeUuidQuery);
  await homePage.runSQLQuery();
  let encounterTypeUuidValue = await page.locator('div.virtual-table-cell').textContent();
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let encounterQuery = `SELECT * FROM encounters WHERE encounter_id=${encounterIdValue} AND encounter_type_uuid like '${encounterTypeUuidValue}';`;
  await page.getByRole('textbox').first().fill(encounterQuery);
  await homePage.runSQLQuery();
  let encounterTypeName = await page.getByText('Consultation', { exact: true });
  let visitTypeName = await page.getByText('Facility Visit');

  await expect(encounterTypeName).toContainText('Consultation');
  await expect(visitTypeName).toContainText('Facility Visit');
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
});

test('Creating an OpenMRS condition creates the condition in Superset conditions table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.searchOpenMRSPatientID();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let conditionsCountQuery = `SELECT COUNT (*) FROM conditions;`
  await page.getByRole('textbox').first().fill(conditionsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfConditions = await page.locator('div.virtual-table-cell').textContent();
  let initialConditionsCount = Number(initialNumberOfConditions);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientCondition();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(conditionsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfConditions = await page.locator('div.virtual-table-cell').textContent();
  let updatedConditionsCount = Number(updatedNumberOfConditions);

  await expect(updatedConditionsCount).toBe(initialConditionsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifiers like 'OpenMRS ID: ${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.locator('div.virtual-table-cell').textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let conditionQuery = `SELECT * FROM conditions WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(conditionQuery);
  await homePage.runSQLQuery();
  let clinicalStatus = await page.getByText('ACTIVE');
  let onSetDate = await page.getByText('2023-07-27');

  await expect(clinicalStatus).toContainText('ACTIVE');
  await expect(onSetDate).toContainText('2023-07-27T00:00:00');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test('Creating an OpenMRS obs creates the observation in Superset observations table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.startPatientVisit();
  const patient_uuid = await homePage.getPatientUUID();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let observationsCountQuery = `SELECT COUNT (*) FROM observations;`
  await page.getByRole('textbox').first().fill(observationsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfObservations = await page.locator('div.virtual-table-cell').textContent();
  let initialObservationsCount = Number(initialNumberOfObservations);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientBiometrics();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(observationsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfObservations = await page.locator('div.virtual-table-cell').textContent();
  let updatedObservationsCount = Number(updatedNumberOfObservations);

  await expect(updatedObservationsCount).toBe(initialObservationsCount + 3);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let observationsQuery = `SELECT * FROM observations WHERE patient_uuid like '${patient_uuid}';`;
  await page.getByRole('textbox').fill(observationsQuery);
  await homePage.runSQLQuery();
  let firstConceptName = await page.getByText('Circonférence du haut du bras').first();
  let secondConceptName = await page.getByText('Taille (cm)').first();
  let thirdConceptName = await page.getByText('Weight (kg)').first();
  let weight = await page.getByText('78', {exact: true }).textContent();
  let patientWeight = Number(weight);
  let height = await page.getByText('165', {exact: true }).textContent();
  let patientHeight = Number(height);
  let midUpperArmCircumference = await page.getByText('34', {exact: true }).textContent();
  let patientMidUpperArmCircumference = Number(midUpperArmCircumference);

  await expect(firstConceptName).toHaveText('Circonférence du haut du bras');
  await expect(secondConceptName).toHaveText('Taille (cm)');
  await expect(thirdConceptName).toHaveText('Weight (kg)');
  await expect(patientWeight).toBe(78);
  await expect(patientHeight).toBe(165);
  await expect(patientMidUpperArmCircumference).toBe(34);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
});

test('Creating an OpenMRS appointment creates the appointment in Superset appointments table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.searchOpenMRSPatientID();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let appointmentsCountQuery = `SELECT COUNT(*) FROM appointments;`
  await page.getByRole('textbox').first().fill(appointmentsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfAppointments = await page.locator('div.virtual-table-cell').textContent();
  let initialAppointmentsCount = Number(initialNumberOfAppointments);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  await page.goto(`${O3_URL}`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientAppointment();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(appointmentsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfAppointments = await page.locator('div.virtual-table-cell').textContent();
  let updatedAppointmentsCount = Number(updatedNumberOfAppointments);

  await expect(updatedAppointmentsCount).toBe(initialAppointmentsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifiers like 'OpenMRS ID: ${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.locator('div.virtual-table-cell').textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let appointmentQuery = `SELECT * FROM appointments WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(appointmentQuery);
  await homePage.runSQLQuery();
  let appointmentStatus = await page.getByText('Scheduled').first();

  await expect(appointmentStatus).toContainText('Scheduled');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test('Voiding an OpenMRS obs updates the observation in Superset observations table.', async ({ page }) => {
  // replay
  await homePage.initiateLogin();
  await expect(page).toHaveURL(/.*home/);
  await homePage.createPatient();
  await homePage.startPatientVisit();
  const patient_uuid = await homePage.getPatientUUID();
  await homePage.addPatientBiometrics();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let obsVoidedQuery = `SELECT obs_voided FROM Observations WHERE patient_uuid like '${patient_uuid}';`;
  await page.getByRole('textbox').first().fill(obsVoidedQuery);
  await homePage.runSQLQuery();
  let firstObsVoidedState = await page.locator('div.virtual-table-cell:nth-child(1)');
  let secondObsVoidedState = await page.locator('div.virtual-table-cell:nth-child(2)');
  let thirdObsVoidedState = await page.locator('div.virtual-table-cell:nth-child(3)');

  await expect(firstObsVoidedState).toContainText('false');
  await expect(secondObsVoidedState).toContainText('false');
  await expect(thirdObsVoidedState).toContainText('false');

  await page.goto(`${O3_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.voidEncounter();

  // verify
  await page.goto(`${SUPERSET_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(obsVoidedQuery);
  await homePage.runSQLQuery();

  await expect(firstObsVoidedState).toContainText('true');
  await expect(secondObsVoidedState).toContainText('true');
  await expect(thirdObsVoidedState).toContainText('true');

  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
});

test.afterEach(async ({ page }) => {
  await homePage.deletePatient();
  await page.close();
});
