// TASK-0013 · The screens pass /api to the API, and the first page draws one main heading in English and Emerald with nothing scrolling sideways, at computer and phone width: kept from TASK-0013's smoke test when TASK-0049 rewrote it for the sign-in page, so it holds before and after that card. Written by the planner; builders never edit this file.
import { expect, test } from '@playwright/test';

test('the screens’ /api passing reaches the API @smoke', async ({ page }) => {
  const answer = await page.request.get('/api/health');
  expect(answer.url()).toBe('http://localhost:5310/api/health');
  expect(answer.status()).toBe(200);
  expect(await answer.json()).toEqual({ ok: true, service: 'api' });
});

test('the first page draws one main heading, in English and Emerald, and nothing scrolls sideways @smoke', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.window);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-colour', 'emerald');
});
