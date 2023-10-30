import { test, expect } from '@playwright/test';
import { HomePage } from '../utils/functions/testBase';
import { patientName } from '../utils/functions/testBase';

let homePage: HomePage;

test.beforeEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.initiateLogin();

  await expect(page).toHaveURL(/.*home/);
});

test('Adding an OpenMRS patient syncs patient into patients table in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let patientsCountQuery = `SELECT COUNT (*) FROM patients;`
  await page.getByRole('textbox').first().fill(patientsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfPatients = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialPatientsCount = Number(initialNumberOfPatients);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.createPatient();
  await homePage.searchPatientId();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();

  // verify
  await page.goto(`${process.env.E2E_ANALYTICS_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(patientsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfPatients = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedPatientsCount = Number(updatedNumberOfPatients);

  await expect(updatedPatientsCount).toBe(initialPatientsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientQuery = `SELECT * FROM patients WHERE identifier like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientQuery);
  await homePage.runSQLQuery();

  let patientGivenName = await page.getByRole('gridcell', { name: `${patientName.firstName}` });
  let patientFamilyName = await page.getByRole('gridcell', { name: `${patientName.givenName}` });
  let patientGender = await page.getByRole('gridcell', { name: 'M', exact: true });

  await expect(patientGivenName).toHaveText(`${patientName.firstName}`);
  await expect(patientFamilyName).toHaveText(`${patientName.givenName}`);
  await expect(patientGender).toHaveText('M');
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
});

test('Starting an OpenMRS visit syncs visit into visits table in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createPatient();
  await homePage.searchPatientId();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let visitsCountQuery = `SELECT COUNT (*) FROM visits;`
  await page.getByRole('textbox').first().fill(visitsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfVisits = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialVisitsCount = Number(initialNumberOfVisits);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.startPatientVisit();

  // verify
  await page.goto(`${process.env.E2E_ANALYTICS_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(visitsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfVisits = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedVisitsCount = Number(updatedNumberOfVisits);

  await expect(updatedVisitsCount).toBe(initialVisitsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifier like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let patientVisitQuery = `SELECT * FROM visits WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(patientVisitQuery);
  await homePage.runSQLQuery();

  patientId = await page.getByRole('gridcell', { name: `${patientIdValue}` }).first().textContent();
  let patient_Id = Number(patientId);
  let patientVisitType = await page.getByRole('gridcell', { name: 'Facility Visit' });
  let patientAgeGroupAtVisit = await page.getByRole('gridcell', { name: '20 - 24' });
  const patientGender = await page.getByRole('gridcell', { name: 'M', exact: true });
  let patientAgeAtVisit = Number(await page.getByRole('gridcell', { name: '24', exact: true }).nth(0).textContent());

  await expect(patient_Id).toBe(Number(`${patientIdValue}`));
  await expect(patientVisitType).toHaveText('Facility Visit');
  await expect(patientGender).toHaveText('M');
  await expect(patientAgeAtVisit).toBe(24);
  await expect(patientAgeGroupAtVisit).toHaveText('20 - 24');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test('Creating an OpenMRS order syncs order into orders table in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createPatient();
  await homePage.searchPatientId();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let ordersCountQuery = `SELECT COUNT(*) FROM orders;`
  await page.getByRole('textbox').first().fill(ordersCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfOrders = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialOrdersCount = Number(initialNumberOfOrders);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // verify
  await page.goto(`${process.env.E2E_ANALYTICS_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(ordersCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfOrders = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedOrdersCount = Number(updatedNumberOfOrders);

  await expect(updatedOrdersCount).toBe(initialOrdersCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifier like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let orderQuery = `SELECT * FROM orders WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(orderQuery);
  await homePage.runSQLQuery();

  patientId = await page.getByRole('gridcell', { name: `${patientIdValue}` }).first().textContent();
  const patient_Id = Number(patientId);
  let orderTypeName = await page.getByRole('gridcell', { name: 'Test Order' });
  let encounterTypeName =   await page.getByRole('gridcell', { name: 'Consultation', exact: true });
  let careSettingName = await page.getByRole('gridcell', { name: 'Inpatient', exact: true });
  let careSettingType = await page.getByRole('gridcell', { name: 'INPATIENT', exact: true });

  await expect(patient_Id).toBe(Number(`${patientIdValue}`));
  await expect(orderTypeName).toHaveText('Test Order');
  await expect(encounterTypeName).toHaveText('Consultation');
  await expect(careSettingName).toHaveText('Inpatient');
  await expect(careSettingType).toHaveText('INPATIENT');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test('Adding an OpenMRS encounter syncs encounter into encounters table in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createPatient();
  await homePage.searchPatientId();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let encountersCountQuery = `SELECT COUNT(*) FROM encounters;`
  await page.getByRole('textbox').first().fill(encountersCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfEncounters = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialEncountersCount = Number(initialNumberOfEncounters);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.goToLabOrderForm();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.locator('#tab select').selectOption('857AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  await homePage.saveLabOrder();

  // verify
  await page.goto(`${process.env.E2E_ANALYTICS_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(encountersCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfEncounters = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedEncountersCount = Number(updatedNumberOfEncounters);

  await expect(updatedEncountersCount).toBe(initialEncountersCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifier like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let encounterIdQuery = `SELECT encounter_id FROM orders WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(encounterIdQuery);
  await homePage.runSQLQuery();
  let encounterId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const encounterIdValue = Number(encounterId);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let encounterTypeUuidQuery = `SELECT encounter_type_uuid FROM orders WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').fill(encounterTypeUuidQuery);
  await homePage.runSQLQuery();
  let encounterTypeUuidValue = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();

  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let encounterQuery = `SELECT * FROM encounters WHERE encounter_id=${encounterIdValue} AND encounter_type_uuid like '${encounterTypeUuidValue}';`;
  await page.getByRole('textbox').first().fill(encounterQuery);
  await homePage.runSQLQuery();

  encounterId = await page.getByRole('gridcell', { name: `${encounterIdValue}` }).first().textContent();
  const encounter_Id = Number(encounterId);
  let encounterTypeName = await page.getByRole('gridcell', { name: 'Consultation', exact: true });
  let encounterTypeUuid = await page.getByRole('gridcell', { name: 'dd528487-82a5-4082-9c72-ed246bd49591' });
  let encounterTypeDescription = await page.getByRole('gridcell', { name: 'Consultation encounter' });
  let visitTypeName = await page.getByRole('gridcell', { name: 'Facility Visit' });
  let visitTypeUuid =  await page.getByRole('gridcell', { name: '7b0f5697-27e3-40c4-8bae-f4049abfb4ed' });
  let formName = await page.getByRole('gridcell', { name: 'Laboratory Test Orders' });
  let formUuid = await page.getByRole('gridcell', { name: '2be26a7a-b2dd-3b16-82e5-81d9c2b5bb7a' });
  let formDescription = await page.getByRole('gridcell', { name: 'Simple lab order entry form' });
  let locationName = await page.getByRole('gridcell', { name: 'Inpatient Ward' }).first();
  let locationUuid = await page.getByRole('gridcell', { name: 'ba685651-ed3b-4e63-9b35-78893060758a' });
  let locationDescription = await page.getByRole('gridcell', { name: 'Inpatient Ward' }).nth(1);

  await expect(encounter_Id).toBe(Number(`${encounterIdValue}`));
  await expect(encounterTypeName).toHaveText('Consultation');
  await expect(encounterTypeUuid).toHaveText(`${encounterTypeUuidValue}`);
  await expect(encounterTypeDescription).toHaveText('Consultation encounter');
  await expect(visitTypeName).toHaveText('Facility Visit');
  await expect(visitTypeUuid).toContainText('7b0f5697-27e3-40c4-8bae-f4049abfb4ed');
  await expect(formName).toHaveText('Laboratory Test Orders');
  await expect(formUuid).toHaveText('2be26a7a-b2dd-3b16-82e5-81d9c2b5bb7a');
  await expect(formDescription).toHaveText('Simple lab order entry form');
  await expect(locationName).toHaveText('Inpatient Ward');
  await expect(locationUuid).toHaveText('ba685651-ed3b-4e63-9b35-78893060758a');
  await expect(locationDescription).toHaveText('Inpatient Ward');
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
});

test('Adding an OpenMRS condition syncs condition into conditions table in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createPatient();
  await homePage.searchPatientId();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let conditionsCountQuery = `SELECT COUNT (*) FROM conditions;`
  await page.getByRole('textbox').first().fill(conditionsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfConditions = await page.getByRole('gridcell', { name: ' ' }).textContent();
  let initialConditionsCount = Number(initialNumberOfConditions);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientCondition();

  // verify
  await page.goto(`${process.env.E2E_ANALYTICS_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(conditionsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfConditions = await page.getByRole('gridcell', { name: ' ' }).textContent();
  let updatedConditionsCount = Number(updatedNumberOfConditions);

  await expect(updatedConditionsCount).toBe(initialConditionsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifier like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let conditionQuery = `SELECT * FROM conditions WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(conditionQuery);
  await homePage.runSQLQuery();

  patientId = await page.getByRole('gridcell', { name: `${patientIdValue}` }).first().textContent();
  const patient_Id = Number(patientId);
  let clinicalStatus = await page.getByRole('gridcell', { name: 'ACTIVE' });
  let onSetDate = await page.getByRole('gridcell', { name: '2023-07-27' });

  await expect(patient_Id).toBe(Number(`${patientIdValue}`));
  await expect(clinicalStatus).toHaveText('ACTIVE');
  await expect(onSetDate).toContainText('2023-07-27T00:00:00');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test('Adding an OpenMRS observation syncs observation into observations table in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createPatient();
  await homePage.searchPatientId();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let observationsCountQuery = `SELECT COUNT (*) FROM observations;`
  await page.getByRole('textbox').first().fill(observationsCountQuery);
  await homePage.runSQLQuery();
  const initialNumberOfObservations = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialObservationsCount = Number(initialNumberOfObservations);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientBiometrics();

  // verify
  await page.goto(`${process.env.E2E_ANALYTICS_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(observationsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfObservations = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedObservationsCount = Number(updatedNumberOfObservations);

  await expect(updatedObservationsCount).toBe(initialObservationsCount + 3);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifier like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let personIdQuery = `SELECT person_id FROM visits WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(personIdQuery);
  await homePage.runSQLQuery();
  let personId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const personIdValue = Number(personId);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let observationsQuery = `SELECT * FROM observations WHERE person_id=${personIdValue};`;
  await page.getByRole('textbox').fill(observationsQuery);
  await homePage.runSQLQuery();

  personId = await page.getByRole('gridcell', { name: `${personIdValue}` }).first().textContent();
  let person_Id = Number(personId);
  let firstConceptName = await page.getByRole('gridcell', { name: 'Circonférence du haut du bras' });
  let secondConceptName = await page.getByRole('gridcell', { name: 'Taille (cm)' });
  let thirdConceptName = await page.getByRole('gridcell', { name: 'Weight (kg)' });
  let firstConceptUuid = await page.getByRole('gridcell', { name: '9ff26a7f-b598-3e33-aff1-639fd777fc06' });
  let secondConceptUuid = await page.getByRole('gridcell', { name: 'b911bf87-a5e0-3ebf-9ffe-2bbe13e178b8' });
  let thirdConceptUuid = await page.getByRole('gridcell', { name: 'c1015fd1-729b-33c7-82e8-0b14a5a824ed' });
  let weight = await page.getByRole('gridcell', { name: '78', exact: true }).textContent();
  let patientWeight = Number(weight);
  let height = await page.getByRole('gridcell', { name: '165', exact: true }).textContent();
  let patientHeight = Number(height);
  let midUpperArmCircumference = await page.getByRole('gridcell', { name: '34', exact: true }).textContent();
  let patientMidUpperArmCircumference = Number(midUpperArmCircumference);
  let encounterTypeUuid = await page.getByRole('row', { name: 'Weight (kg)' }).getByTitle('67a71486-1a54-468f-ac3e-7091a9a79584');
  let encounterName = await page.getByRole('row', { name: 'Weight (kg)' }).getByTitle('Vitals');
  let encounterTypeDescription = await page.getByRole('row', { name: 'Taille (cm)' }).getByTitle('For capturing vital signs');

  await expect(person_Id).toBe(Number(`${personIdValue}`));
  await expect(firstConceptName).toHaveText('Circonférence du haut du bras');
  await expect(secondConceptName).toHaveText('Taille (cm)');
  await expect(thirdConceptName).toHaveText('Weight (kg)');
  await expect(patientWeight).toBe(78);
  await expect(patientHeight).toBe(165);
  await expect(patientMidUpperArmCircumference).toBe(34);
  await expect(firstConceptUuid).toHaveText('9ff26a7f-b598-3e33-aff1-639fd777fc06');
  await expect(secondConceptUuid).toHaveText('b911bf87-a5e0-3ebf-9ffe-2bbe13e178b8');
  await expect(thirdConceptUuid).toHaveText('c1015fd1-729b-33c7-82e8-0b14a5a824ed');
  await expect(encounterTypeUuid).toHaveText('67a71486-1a54-468f-ac3e-7091a9a79584');
  await expect(encounterName).toHaveText('Vitals');
  await expect(encounterTypeDescription).toHaveText('For capturing vital signs');
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
});

test('Adding an OpenMRS appointment syncs appointment into appointments table in Superset', async ({ page }) => {
  // setup
  const homePage = new HomePage(page);
  await homePage.createPatient();
  await homePage.searchPatientId();
  const patientIdentifier = await page.locator('#demographics section p:nth-child(2)').textContent();
  await homePage.startPatientVisit();
  await homePage.goToSuperset();
  await expect(page).toHaveURL(/.*superset/);
  await homePage.selectDBSchema();
  await homePage.clearSQLEditor();
  let appointmentsCountQuery = `SELECT COUNT(*) FROM appointments;`
  await page.getByRole('textbox').first().fill(appointmentsCountQuery);
  await homePage.runSQLQuery();

  const initialNumberOfAppointments = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let initialAppointmentsCount = Number(initialNumberOfAppointments);
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();

  // replay
  await page.goto(`${process.env.E2E_BASE_URL}/openmrs/spa/home`);
  await homePage.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await homePage.addPatientAppointment();

  // verify
  await page.goto(`${process.env.E2E_ANALYTICS_URL}/superset/sqllab`);
  await homePage.clearSQLEditor();
  await page.getByRole('textbox').first().fill(appointmentsCountQuery);
  await homePage.runSQLQuery();
  const updatedNumberOfAppointments = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  let updatedAppointmentsCount = Number(updatedNumberOfAppointments);

  await expect(updatedAppointmentsCount).toBe(initialAppointmentsCount + 1);

  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
  let patientIdQuery = `SELECT patient_id FROM patients WHERE identifier like '${patientIdentifier}';`;
  await page.getByRole('textbox').fill(patientIdQuery);
  await homePage.runSQLQuery();
  let patientId = await page.getByRole('gridcell', { name: ' ' }).nth(0).textContent();
  const patientIdValue = Number(patientId);
  await page.getByRole('tab', { name: 'Results' }).click();
  await homePage.clearSQLEditor();
  let appointmentQuery = `SELECT * FROM appointments WHERE patient_id=${patientIdValue};`;
  await page.getByRole('textbox').first().fill(appointmentQuery);
  await homePage.runSQLQuery();

  patientId = await page.getByRole('gridcell', { name: `${patientIdValue}` }).first().textContent();
  let patient_Id = Number(patientId);
  let appointmentServiceName = await page.getByRole('gridcell', { name: 'General Medicine service' });
  let appointmentServiceUuid = await page.getByRole('gridcell', { name: '7ba3aa21-cc56-47ca-bb4d-a60549f666c0' });
  let appointmentStatus = await page.getByRole('gridcell', { name: 'Scheduled' });
  let appointmentKind = await page.getByRole('gridcell', { name: 'WalkIn' });
  let appointmentServiceTypeName = await page.getByRole('gridcell', { name: 'Short follow-up' });
  let appointmentComment = await page.getByRole('gridcell', { name: 'This is an appointment.' });
  let patientAppointmentProviderResponse = await page.getByRole('gridcell', { name: 'ACCEPTED' });

  await expect(patient_Id).toBe(Number(`${patientIdValue}`));
  await expect(appointmentServiceName).toHaveText('General Medicine service');
  await expect(appointmentServiceUuid).toHaveText('7ba3aa21-cc56-47ca-bb4d-a60549f666c0');
  await expect(appointmentStatus).toHaveText('Scheduled');
  await expect(appointmentKind).toHaveText('WalkIn');
  await expect(appointmentServiceTypeName).toHaveText('Short follow-up');
  await expect(appointmentComment).toHaveText('This is an appointment.');
  await expect(patientAppointmentProviderResponse).toHaveText('ACCEPTED');
  await page.getByRole('tab', { name: 'Query history' }).click();
  await homePage.clearSQLEditor();
});

test.afterEach(async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.deletePatient();
  await page.close();
});
