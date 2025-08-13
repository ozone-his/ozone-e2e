import { expect } from '@playwright/test';
import { O3_URL, ORTHANC_URL, test } from '../utils/configs/globalSetup';
import { OpenMRS, patientName } from '../utils/functions/openmrs';
import { Orthanc } from '../utils/functions/orthanc';
import { Keycloak } from '../utils/functions/keycloak';

let openmrs: OpenMRS;
let orthanc: Orthanc;
let keycloak: Keycloak;

test.beforeEach(async ({ orthancPage }) => {
  openmrs = new OpenMRS(orthancPage);
  orthanc = new Orthanc(orthancPage);
  keycloak = new Keycloak(orthancPage);

  await keycloak.open();
  await keycloak.navigateToUsers();
  await keycloak.addUserButton().click();
  await keycloak.createUser();
  await openmrs.navigateToLoginPage();
  await openmrs.open();
});

test('Uploading a DICOM study in Orthanc creates the corresponding radiology image for the OpenMRS patient.', async ({ page, context, orthancPage }) => {
  // setup
  await openmrs.createPatient();
  await openmrs.navigateToAttachments();
  await expect(orthancPage.getByText(/there are no attachments to display for this patient/i)).toBeVisible();
  await openmrs.searchPatientId();
  const patientIdentifier = await orthancPage.locator('[data-testid="identifier-placeholder"]').textContent();

  // replay
  await orthanc.open();
  await expect(orthancPage.locator('#lookup').getByText('Orthanc server')).toBeVisible();
  await orthancPage.goto(`${ORTHANC_URL}/ui/app/index.html`);
  await orthanc.uploadAttachments();
  await expect(orthancPage.locator('text=VIX - Extrémités')).toBeVisible();
  await expect(orthancPage.locator('text=Uploaded studies')).toBeVisible();
  await orthanc.navigateToImageStudyForm();
  await orthancPage.locator("//div[text()='OtherPatientIDs']/following::input[1]").fill(`${patientIdentifier}`);
  await orthanc.clickOnModifyButton();

  // verify
  await orthancPage.goto(`${O3_URL}`);
  await openmrs.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
  await openmrs.navigateToAttachments();
  await expect(orthancPage.getByText(/radiology-image/i)).toBeVisible();
  await orthancPage.getByLabel(/table view/i).click();
  await expect(orthancPage.getByText(/radiology-image/i)).toBeVisible();
});

test.afterEach(async ({}) => {
  await orthanc.removeAttachments();
  await keycloak.deleteUser();
});
