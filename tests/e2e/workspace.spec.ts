import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Save session', exact: true })).toBeEnabled();
});
test('sample review, persistent session, and standalone report', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Small details. Big differences.' }),
  ).toBeVisible();
  await page
    .getByLabel('Review note', { exact: true })
    .fill('Checked <script>alert(1)</script> & approved');
  await page.getByRole('button', { name: 'Mark reviewed', exact: true }).click();
  await page.getByRole('button', { name: 'Save session', exact: true }).click();
  await page.getByLabel('Session name').fill('Release review');
  await page.getByRole('dialog').getByRole('button', { name: 'Save session', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Release review', exact: false }).first().click();
  await page.locator('.tree-file[title="src/components/Button.tsx"]').click();
  await expect(page.getByLabel('Review note', { exact: true })).toHaveValue(
    'Checked <script>alert(1)</script> & approved',
  );
  await expect(page.getByRole('button', { name: 'Reviewed', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Export report', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export HTML', exact: true }).click();
  const file = await downloading;
  const html = await readFile((await file.path())!, 'utf8');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; approved');
  expect(html).not.toContain('<script>');
});
test('real ZIP comparison includes file-to-folder changes and binary preview', async ({ page }) => {
  await page.locator('.source-card.before').getByRole('button', { name: 'Change ZIP' }).click();
  await page
    .getByLabel('ZIP source', { exact: true })
    .setInputFiles(resolve('examples/before.zip'));
  await expect(page.locator('.source-card.before')).toContainText('before.zip');
  await page.locator('.source-card.after').getByRole('button', { name: 'Change ZIP' }).click();
  await page.getByLabel('ZIP source', { exact: true }).setInputFiles(resolve('examples/after.zip'));
  await expect(page.locator('.source-card.after')).toContainText('after.zip');
  await page.locator('main').getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.locator('.tree-file[title="config/settings.json"]')).toBeVisible();
  await page.locator('.tree-file[title="assets/data.bin"]').click();
  await expect(page.locator('.diff-viewer')).toContainText('Compared by content fingerprint');
  await page.locator('.tree-file[title="src/greeting.ts"]').click();
  await expect(page.locator('.diff-viewer')).toContainText('Hello, Patchloom');
});
test('folder picker works and unsafe archives are rejected', async ({ page }) => {
  await page.locator('.source-card.before').getByRole('button', { name: 'Change folder' }).click();
  await page.getByLabel('Folder source', { exact: true }).setInputFiles(resolve('examples/before'));
  await expect(page.locator('.source-card.before')).toContainText('Folder snapshot');
  await page.locator('.source-card.after').getByRole('button', { name: 'Change ZIP' }).click();
  await page
    .getByLabel('ZIP source', { exact: true })
    .setInputFiles(resolve('examples/unsafe-path.zip'));
  await expect(page.getByRole('alert')).toContainText(/unsafe|invalid|path/i);
});
test('theme preferences persist and mobile layout fits', async ({ page }) => {
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('heading', { name: 'Small details. Big differences.' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
test('desktop screenshot, file search and diff display modes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.getByRole('button', { name: 'Unified diff', exact: true }).click();
  await expect(page.locator('.diff-viewer')).toContainText('Button');
  await page.getByRole('button', { name: 'Side by side', exact: true }).click();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.getByLabel('Search files').fill('no-such-file');
  await expect(page.getByText('No files match your filters.')).toBeVisible();
});
