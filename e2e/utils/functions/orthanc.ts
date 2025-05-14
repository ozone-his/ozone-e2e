import { expect, Page } from '@playwright/test';
import { ORTHANC_URL } from '../configs/globalSetup';
import { delay } from './openmrs';

  export class Orthanc {
    constructor(readonly page: Page) {}

    async open() {
      await this.page.goto(`${ORTHANC_URL}`);
    }

    async navigateToImageStudyForm() {
      await this.page.getByText('VIX', {exact: true}).nth(0).click();
      await expect(this.page.locator('i[title="Modify"]')).toBeVisible();
      await this.page.locator('i[title="Modify"]').click();
      await this.page.getByRole('button', { name: 'Modify Study tags' }).click();
      await this.page.getByRole('radio', { name: 'Modify the original study. (keeping the original DICOM UIDs)' }).check();
      await this.page.locator("//div[text()='OtherPatientIDs']/following::input[1]").clear();
    }

    async clickOnModifyButton() {
      await this.page.getByRole('button', { name: 'Modify' }).click(), delay(10000);
    }

    async uploadAttachments() {
      await this.page.getByText('Upload', { exact: true }).click();
      const filePath = './e2e/utils/support/upload/imageStudy.zip';
      const fileInput = this.page.locator('#filesUpload');
      await fileInput.setInputFiles(filePath), delay(20000);
    }

    async removeAttachments() {
      await this.page.goto(`${ORTHANC_URL}/ui/app/index.html`);
      await this.page.getByRole('row', { name: 'VIX' }).getByRole('checkbox').check();
      await this.page.locator('//i[@title="Delete"]').click();
      await this.page.getByRole('button', { name: /delete/i }).click();
    }
}
