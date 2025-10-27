import { test, expect } from '@playwright/test';
import { Keycloak, user } from '../utils/functions/keycloak';
import { SENAITE } from '../utils/functions/senaite';
import { Odoo } from '../utils/functions/odoo';
import { Superset } from '../utils/functions/superset';
import { OpenMRS } from '../utils/functions/openmrs';
import { O3_URL, ODOO_URL, SENAITE_URL, SUPERSET_URL } from '../utils/configs/globalSetup';

let senaite: SENAITE;
let keycloak: Keycloak;
let odoo: Odoo;
let openmrs: OpenMRS;
let superset: Superset;
let browserContext;
let page;

test.beforeAll(async ({ browser }) => {
  browserContext = await browser.newContext();
  page = await browserContext.newPage();
  keycloak = new Keycloak(page);
  senaite = new SENAITE(page);
  odoo = new Odoo(page);
  superset = new Superset(page);
  openmrs = new OpenMRS(page);

  await keycloak.open();
  await keycloak.createUser();
});

test('Logging out from SENAITE ends the session in Keycloak and logs out the user.', async ({}) => {
  // setup
  await senaite.open();
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).toBeVisible();

  // replay
  await senaite.logout();
  await expect(page.locator('#username')).toBeVisible();

  // verify
  await keycloak.navigateToHomePage();
  await keycloak.navigateToClients();
  await keycloak.selectSENAITEId();
  await keycloak.selectSessions();
  await expect(page.getByText(`${user.userName}`)).not.toBeVisible();
  await senaite.navigateToHomePage();
  await expect(page.locator('#username')).toBeVisible();
});

test('Activating auto-login authentication should login the user in any app.', async ({}) => {
  // setup
  await keycloak.navigateToHomePage();
  await keycloak.navigateToAuthentication();

  // replay
  await keycloak.activateAutoLogin();

  // verify
  await page.goto(`${ODOO_URL}`);
  await expect(page).toHaveURL(/.*web/);
  await page.goto(`${SENAITE_URL}`);
  await expect(page).toHaveURL(/.*senaite-dashboard/);
  await page.goto(`${SUPERSET_URL}`);
  await page.locator('#btn-signin-keycloak').click();
  await expect(page).toHaveURL(/.*superset/);
  await page.goto(`${O3_URL}`)
  await page.locator('label').filter({ hasText: /inpatient ward/i }).locator('span').first().click();
  await page.getByRole('button', { name: /confirm/i }).click();
  await expect(page).toHaveURL(/.*home/);
  await keycloak.navigateToHomePage();
  await keycloak.navigateToAuthentication();
  await keycloak.deActivateAutoLogin();
});

test.afterAll(async ({}) => {
  await keycloak.deleteUser();
});
