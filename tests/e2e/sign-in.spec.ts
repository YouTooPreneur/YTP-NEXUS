// TASK-0049 · Signing in, end to end at computer and phone width, against the API on nexus_test (TECH-DESIGN section 12 point 56): a wrong password shows its message under the field (both buttons busy first, their look unchanged), the test person signs in and reaches /, Continue with Google heads for Google with Nexus's own return address and never leaves the computer, and the page's layout, sizes, focus ring and both colours come from the design. Written by the planner; builders never edit this file.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { TEST_PERSON, endToEndSettings } from './e2e-database.js';

const APP_URL = endToEndSettings().APP_URL ?? 'http://localhost:5310';
const WRONG = 'Wrong email or password. Try again, or use Forgot password.';

const emailField = (page: Page) => page.getByLabel('Email', { exact: true });
const passwordField = (page: Page) => page.getByLabel('Password', { exact: true });
const signInButton = (page: Page) => page.getByRole('button', { name: 'Sign in', exact: true });
const googleButton = (page: Page) => page.getByRole('button', { name: 'Continue with Google', exact: true });

// The product of the opacities from the control up to the page: 1 means nothing fades it.
const shownOpacity = (control: Locator) =>
  control.evaluate((element) => {
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  });
const style = (control: Locator, names: string[]) =>
  control.evaluate((element, list) => {
    const computed = getComputedStyle(element);
    return list.map((name) => computed.getPropertyValue(name));
  }, names);
const box = async (control: Locator) => {
  const found = await control.boundingBox();
  if (!found) throw new Error('not drawn');
  return found;
};

// What a disabled or busy button must keep: only its pointer may change.
const LOOK = ['color', 'background-color', 'border-color', 'filter', 'opacity', 'box-shadow'];

test('a wrong password shows its message after a busy, unfaded button, then the test person signs in and reaches /', async ({
  page,
}) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to Nexus', exact: true })).toBeVisible();
  await emailField(page).fill(TEST_PERSON.email);
  await passwordField(page).fill('not-the-password-0049');
  // Both buttons' look before the press, with the pointer already on Sign in (as during the press).
  await signInButton(page).hover();
  const signInBefore = await style(signInButton(page), LOOK);
  const googleBefore = await style(googleButton(page), LOOK);
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/sign-in/email', async (route) => {
    await held;
    await route.continue();
  });
  await signInButton(page).click();
  const busy = page.getByRole('button', { name: 'Signing in…', exact: true });
  await expect(busy).toBeDisabled();
  await expect(busy).toHaveAttribute('aria-busy', 'true');
  await expect(googleButton(page)).toBeDisabled();
  for (const control of [busy, googleButton(page)]) {
    expect(await shownOpacity(control)).toBe(1);
    expect(await style(control, ['cursor'])).toEqual(['not-allowed']);
  }
  expect(await style(busy, LOOK)).toEqual(signInBefore);
  expect(await style(googleButton(page), LOOK)).toEqual(googleBefore);
  release();
  const message = page.getByText(WRONG, { exact: true });
  await expect(message).toBeVisible();
  // A field's message: 12 px, weight 600, in the red of the tokens.
  expect(await style(message, ['font-size', 'font-weight', 'color'])).toEqual(['12px', '600', 'rgb(169, 72, 58)']);
  await page.unroute('**/api/auth/sign-in/email');
  await expect(passwordField(page)).toHaveValue('');
  await expect(passwordField(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(emailField(page)).toHaveValue(TEST_PERSON.email);

  await passwordField(page).fill(TEST_PERSON.password);
  await signInButton(page).click();
  await expect(page).toHaveURL('http://localhost:5310/');
  await expect(page.getByRole('heading', { level: 1, name: 'YTP Nexus', exact: true })).toBeVisible();
  await expect(page.getByText('API: connected')).toBeVisible();
  // A new page load finds the session in the cookie and stays on /.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'YTP Nexus', exact: true })).toBeVisible();
  await expect(page).toHaveURL('http://localhost:5310/');
});

test('Continue with Google heads for Google with Nexus’s own return address, and nothing leaves the computer', async ({
  page,
}) => {
  const outside: string[] = [];
  await page.route(
    (url) => url.hostname !== 'localhost',
    async (route) => {
      outside.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Google stand-in</title><p>Google stand-in</p>',
      });
    },
  );
  await page.goto('/sign-in');
  await googleButton(page).click();
  await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//);
  const google = new URL(page.url());
  expect(google.searchParams.get('redirect_uri')).toBe(`${APP_URL}/api/auth/callback/google`);
  expect(outside.length).toBeGreaterThan(0);
  for (const url of outside) expect(url).toMatch(/^https:\/\/accounts\.google\.com\//);
});

test('the layout, sizes, keyboard order, focus ring, check box and both colours follow the design', async ({ page }) => {
  await page.goto('/sign-in');
  const heading = page.getByRole('heading', { level: 1, name: 'Sign in to Nexus', exact: true });
  await expect(heading).toBeVisible();
  await expect(page).toHaveTitle('Sign in · YTP Nexus');
  const width = page.viewportSize()!.width;
  const panelTitle = page.getByText('Everything YouTooPreneur runs, in one place.', { exact: true });
  const brandPanel = () =>
    panelTitle.evaluate((element) => {
      for (let node: Element | null = element; node; node = node.parentElement) {
        const background = getComputedStyle(node).backgroundImage;
        if (background.includes('gradient')) {
          const area = node.getBoundingClientRect();
          return { background, left: area.left, width: area.width };
        }
      }
      return null;
    });

  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
  await expect(page.getByRole('img', { name: 'YouTooPreneur' })).toBeVisible();
  // The titles are the mockup's: Sora with its size adjusted to 0.4 and its letters a little closer.
  const [adjust, spacing] = await style(heading, ['font-size-adjust', 'letter-spacing']);
  expect(adjust).toBe('0.4');
  expect(parseFloat(spacing!)).toBeLessThan(0);
  // The show/hide button sits inside the password field, which is as wide as the email field.
  const eye = await box(page.getByRole('button', { name: 'Show password', exact: true }));
  const password = await box(passwordField(page));
  expect(eye.x).toBeGreaterThanOrEqual(password.x);
  expect(eye.x + eye.width).toBeLessThanOrEqual(password.x + password.width + 0.5);
  expect(password.width).toBe((await box(emailField(page))).width);

  if (width >= 1200) {
    // The brand panel (600 px, the brand gradient) beside the card (at most 440 px, centred in the rest).
    await expect(panelTitle).toBeVisible();
    const panel = await brandPanel();
    expect(panel).toMatchObject({ left: 0, width: 600 });
    expect(panel!.background).toContain('rgb(33, 72, 63)');
    expect(panel!.background).toContain('rgb(18, 43, 36)');
    const card = await box(signInButton(page));
    expect(card.width).toBeLessThanOrEqual(440);
    expect(card.x).toBeGreaterThanOrEqual(600);
    expect(Math.abs(card.x - 600 - (width - card.x - card.width))).toBeLessThanOrEqual(2);
    expect((await box(emailField(page))).height).toBe(40);
    expect((await box(signInButton(page))).height).toBe(48);
    expect((await box(googleButton(page))).height).toBe(48);
    // The design's widths: the brand panel from exactly 1200 px; one column with the logo row above the card from 768 to
    // 1199 px, with the same sizes; the phone sizes below 768 px.
    await page.setViewportSize({ width: 1200, height: 900 });
    await expect(panelTitle).toBeVisible();
    await page.setViewportSize({ width: 1199, height: 900 });
    await expect(panelTitle).toBeHidden();
    await expect(page.getByRole('img', { name: 'YouTooPreneur' })).toBeVisible();
    // The logo row sits at the left of the card's column.
    const tabletLogo = await box(page.getByRole('img', { name: 'YouTooPreneur' }));
    expect(Math.abs(tabletLogo.x - (await box(signInButton(page))).x)).toBeLessThanOrEqual(0.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await box(emailField(page))).height).toBe(40);
    expect((await box(signInButton(page))).height).toBe(48);
    await page.setViewportSize({ width: 768, height: 900 });
    expect((await box(emailField(page))).height).toBe(40);
    expect((await box(signInButton(page))).height).toBe(48);
    await page.setViewportSize({ width: 767, height: 900 });
    expect((await box(emailField(page))).height).toBe(48);
    expect((await box(signInButton(page))).height).toBe(50);
    await page.setViewportSize({ width: 1600, height: 1000 });
  } else {
    // A phone: one column, no brand panel, the logo row at the left of the column, 48 px fields, 50 px buttons, 22 px at
    // each side, touch targets of 44 px.
    await expect(panelTitle).toBeHidden();
    expect((await box(page.getByRole('img', { name: 'YouTooPreneur' }))).x).toBe(22);
    for (const field of [emailField(page), passwordField(page)]) expect((await box(field)).height).toBe(48);
    for (const control of [signInButton(page), googleButton(page)]) {
      const area = await box(control);
      expect(area.height).toBe(50);
      expect(area.x).toBe(22);
      expect(area.x + area.width).toBe(width - 22);
    }
    for (const control of [
      page.getByRole('button', { name: 'Show password', exact: true }),
      page.getByText('Keep me signed in on this computer', { exact: true }),
      page.getByRole('link', { name: 'Forgot password?', exact: true }),
    ]) {
      const area = await box(control);
      expect(area.height).toBeGreaterThanOrEqual(44);
      expect(area.width).toBeGreaterThanOrEqual(44);
    }
  }

  // The keyboard follows the reading order, and every control shows the neon focus ring.
  const keep = page.getByRole('checkbox', { name: 'Keep me signed in on this computer', exact: true });
  const order = [
    googleButton(page),
    emailField(page),
    passwordField(page),
    page.getByRole('button', { name: 'Show password', exact: true }),
    keep,
    page.getByRole('link', { name: 'Forgot password?', exact: true }),
    signInButton(page),
  ];
  for (const control of order) {
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
    expect(await style(control, ['outline-style', 'outline-width', 'outline-color', 'outline-offset'])).toEqual([
      'solid',
      '2px',
      'rgb(3, 255, 150)',
      '2px',
    ]);
  }

  // The check box: ticked, it is the "on" green; empty, a white box with the firmer edge. A click on its words ticks it.
  await expect(keep).toBeChecked();
  expect(await style(keep, ['background-color'])).toEqual(['rgb(14, 135, 77)']);
  await page.getByText('Keep me signed in on this computer', { exact: true }).click();
  await expect(keep).not.toBeChecked();
  expect(await style(keep, ['border-top-color', 'background-color'])).toEqual(['rgb(184, 194, 188)', 'rgb(255, 255, 255)']);

  // Navy: the same page from the Navy tokens.
  expect(await style(signInButton(page), ['background-color'])).toEqual(['rgb(28, 61, 54)']);
  await page.evaluate(() => document.documentElement.setAttribute('data-colour', 'navy'));
  expect(await style(signInButton(page), ['background-color', 'color'])).toEqual(['rgb(16, 39, 58)', 'rgb(3, 255, 150)']);
  expect(await style(keep, ['border-top-color'])).toEqual(['rgb(179, 191, 204)']);
  expect(await style(page.locator('body'), ['background-color'])).toEqual(['rgb(245, 247, 250)']);
  if (width >= 1200) {
    const panel = await brandPanel();
    expect(panel!.background).toContain('rgb(26, 57, 84)');
    expect(panel!.background).toContain('rgb(12, 29, 44)');
  }
});
