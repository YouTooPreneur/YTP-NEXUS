// TASK-0049 · The first end-to-end check, at computer and phone width (TASK-0013's smoke test, rewritten for the sign-in page): a visitor nobody has signed in opens / and ends on the sign-in page; get-session is asked once and answered through the screens' /api passing; nothing scrolls sideways; the page is in English and in Emerald. Written by the planner; builders never edit this file.
import { expect, test } from '@playwright/test';

test('a visitor nobody has signed in opens / and gets the sign-in page, through the screens’ /api passing @smoke', async ({
  page,
}) => {
  const asked: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/get-session') asked.push(request.url());
  });
  const answered = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/auth/get-session');
  await page.goto('/');
  const answer = await answered;
  expect(answer.url()).toBe('http://localhost:5310/api/auth/get-session');
  expect(answer.status()).toBe(200);
  expect(await answer.json()).toBeNull();
  await expect(page).toHaveURL('http://localhost:5310/sign-in');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to Nexus', exact: true })).toBeVisible();
  // One get-session per page load, with StrictMode and the development server.
  await page.waitForLoadState('networkidle');
  expect(asked).toEqual(['http://localhost:5310/api/auth/get-session']);
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.window);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-colour', 'emerald');
});
