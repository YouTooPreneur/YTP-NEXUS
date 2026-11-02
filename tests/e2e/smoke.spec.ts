// TASK-0013 · The first end-to-end check, at computer and phone width. Written by the planner; builders never edit this file.
import { expect, test } from '@playwright/test';

test('the home page shows the product and reaches the API @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'YTP Nexus' })).toBeVisible();
  await expect(page.getByText('API: connected')).toBeVisible();
});

test('nothing scrolls sideways @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'YTP Nexus' })).toBeVisible();
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.window);
});

test('the page is in English and in Emerald by default @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-colour', 'emerald');
});
