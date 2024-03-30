import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('前回の画面スクリーンショットと差分がないこと', async ({ page }) => {
  await expect(page).toHaveScreenshot({ fullPage: true });
});

test('axeでエラーがないこと', async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
