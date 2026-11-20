// TASK-0049 · The sign-in page (SCR-001): its parts in order with their exact texts, every text from the texts module, the show/hide button (one name, its state in aria-pressed) and the "keep me signed in" box, the email sign-in request with the password exactly as typed and never in the page's markup, the form's own checks, the busy state within 0.1 s and never faded, each refusal shown in its place in both answer shapes, nothing taken from or written into the address, and a good sign-in going to / with no token kept, logged or shown and never undone by a late get-session answer. Written by the planner; builders never edit this file.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import {
  TOKEN,
  answer,
  betterAuthError,
  healthIsUp,
  nexusError,
  sentTo,
  sessionIs,
  signedInAnswer,
} from '../msw/fake-api';
import { openPage } from '../msw/open-page';
import { signInTexts } from '../../src/modules/core/sign-in-texts';

const EMAIL = 'asha.kumar@example.com';
const PASSWORD = 'made-up-pw-0049';
const SIGN_IN = '/api/auth/sign-in/email';
const LEAD = 'Use your Google account or your email.';

const WRONG = 'Wrong email or password. Try again, or use Forgot password.';
const BAD_EMAIL = 'Enter a valid email address.';
const CANNOT = "This account can't sign in. Ask the owner to check it in Users and roles.";
const LOCKED = 'Too many wrong passwords. This account is locked for 15 minutes, and the owner has been told.';
const SOMETHING = 'Something went wrong. Please try again.';
const UNREACHABLE = "Nexus can't be reached. Check your connection and try again.";

// A hostile address: values a page must never read, show, fill in, follow or send on. Its return addresses are paths of
// this site: React Router refuses to follow an address on another site (it throws), so a page that followed one of these
// would visibly go there.
const SPIKED =
  'next=%2Fevil-next&redirect=%2Fevil-redirect&callbackURL=%2Fevil-callback&returnTo=%2Fevil-return' +
  '&email=attacker%40evil.example&error_description=Call+evil.example+now&message=Call+us';

let logged: string[] = [];
beforeEach(() => {
  logged = [];
  for (const level of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logged.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

const field = (name: string) => screen.getByLabelText(name, { selector: 'input' }) as HTMLInputElement;
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const settle = (ms = 50) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
// True when `later` comes after `first` in the page.
const after = (first: Node, later: Node) =>
  Boolean(first.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
const goodSignIn = () =>
  HttpResponse.json({ redirect: false, token: TOKEN, url: undefined, user: signedInAnswer.user });

// Every address the page moves to from now on (pushState and replaceState, as the router calls them): a path and query
// on the page's own site, or the whole address elsewhere.
function recordMoves(): string[] {
  const moves: string[] = [];
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = window.history[method].bind(window.history);
    vi.spyOn(window.history, method).mockImplementation((state: unknown, unused: string, url?: string | URL | null) => {
      if (url !== undefined && url !== null) {
        const moved = new URL(url, window.location.href);
        moves.push(moved.origin === window.location.origin ? moved.pathname + moved.search : moved.href);
      }
      original(state, unused, url);
    });
  }
  return moves;
}

async function openSignIn(path = '/sign-in'): Promise<void> {
  sessionIs('signed out');
  await openPage(path);
  await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
}

function fillIn(email = EMAIL, password = PASSWORD): void {
  fireEvent.change(field('Email'), { target: { value: email } });
  fireEvent.change(field('Password'), { target: { value: password } });
}

// Every string in the texts module, however it is nested.
function textsOf(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(textsOf);
  if (value && typeof value === 'object') return Object.values(value).flatMap(textsOf);
  return [];
}

function visibleTexts(): string[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const found: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? '';
    if (text !== '') found.push(text);
  }
  return found;
}

// Nothing on the way from the control to the page fades it: no opacity class and no opacity style.
function neverFaded(element: HTMLElement): void {
  for (let node: HTMLElement | null = element; node && node !== document.body; node = node.parentElement) {
    expect(String(node.getAttribute('class') ?? '')).not.toMatch(/opacity/);
    expect(node.style.opacity).toBe('');
  }
}

describe('the page', () => {
  it('shows its parts in reading order, with the exact texts and attributes', async () => {
    document.title = 'YTP Nexus';
    await openSignIn();
    const parts = [
      screen.getByRole('heading', { level: 1, name: 'Sign in to Nexus' }),
      screen.getByText(LEAD),
      button('Continue with Google'),
      screen.getByText('or', { exact: true }),
      field('Email'),
      field('Password'),
      button('Show password'),
      screen.getByRole('checkbox', { name: 'Keep me signed in on this computer' }),
      screen.getByRole('link', { name: 'Forgot password?' }),
      button('Sign in'),
      screen.getByText('Only people YouTooPreneur has added can sign in.'),
    ];
    for (let i = 1; i < parts.length; i++) {
      expect(after(parts[i - 1]!, parts[i]!)).toBe(true);
    }
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe('Sign in · YTP Nexus');

    const email = field('Email');
    expect([email.type, email.required, email.getAttribute('autocomplete')]).toEqual(['email', true, 'username']);
    const password = field('Password');
    expect([password.type, password.required, password.getAttribute('autocomplete')]).toEqual([
      'password',
      true,
      'current-password',
    ]);
    // The form keeps the browser's own checks of the two required fields.
    expect(email.closest('form')!.noValidate).toBe(false);
    const keep = screen.getByRole('checkbox', { name: 'Keep me signed in on this computer' }) as HTMLInputElement;
    expect(keep.checked).toBe(true);
    expect(screen.getByRole('link', { name: 'Forgot password?' }).getAttribute('href')).toBe('/forgot-password');
    expect(button('Sign in').type).toBe('submit');
    expect(button('Continue with Google').type).toBe('button');
    expect(button('Show password').type).toBe('button');
    for (const mark of button('Continue with Google').querySelectorAll('svg')) {
      expect(mark.getAttribute('aria-hidden')).toBe('true');
    }
    expect(screen.getAllByRole('img', { name: 'YouTooPreneur' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Only people YouTooPreneur has added can sign in.').querySelector('a')).toBeNull();
    // The brand panel: its title is a level-2 heading, then its words and facts.
    expect(screen.getByRole('heading', { level: 2, name: 'Everything YouTooPreneur runs, in one place.' })).toBeTruthy();
    for (const text of [
      'Clients, renewals, projects, invoices, the team and the Academy, behind one login.',
      'No renewal missed',
      'Invoices paid within 15 days',
      'Every lead answered within a day',
      'YouTooPreneur · Digital Business & Growth Ecosystem',
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    // No language pill until TASK-0074, and the keyboard follows the reading order with the show/hide button in it.
    expect(document.body.textContent).not.toMatch(/தமிழ்|English/);
    for (const element of document.querySelectorAll('[tabindex]')) {
      expect(Number(element.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    }
    expect(button('Show password').tabIndex).toBe(0);
  });

  it('moves to Forgot password? within the app (the router’s link), never with a full page load', async () => {
    await openSignIn();
    const moves = recordMoves();
    fireEvent.click(screen.getByRole('link', { name: 'Forgot password?' }));
    await waitFor(() => expect(moves).toContain('/forgot-password'));
  });

  it('takes every visible text from the texts module', async () => {
    await openSignIn();
    const texts = textsOf(signInTexts);
    expect(texts).toContain('Sign in to Nexus');
    for (const text of visibleTexts()) expect(texts).toContain(text);
  });

  it('shows and hides the password with one button whose name never changes, its state in aria-pressed', async () => {
    await openSignIn();
    fillIn();
    const toggle = button('Show password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(field('Password').type).toBe('text');
    expect(button('Show password')).toBe(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('button', { name: /hide/i })).toBeNull();
    fireEvent.click(toggle);
    expect(field('Password').type).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(field('Password').value).toBe(PASSWORD);
  });
});

describe('email sign-in', () => {
  it('sends the email, the password and "keep me signed in", with no callbackURL, straight to Better Auth', async () => {
    await openSignIn();
    answer('post', SIGN_IN, () => betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'));
    fillIn();
    fireEvent.click(button('Sign in'));
    await screen.findByText(WRONG);
    fireEvent.click(screen.getByText('Keep me signed in on this computer'));
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    fillIn();
    fireEvent.click(button('Sign in'));
    await waitFor(() => expect(sentTo('post', SIGN_IN)).toHaveLength(2));
    const [first, second] = sentTo('post', SIGN_IN);
    expect(first!.url).toBe('http://localhost:5310/api/auth/sign-in/email');
    expect(first!.body).toEqual({ email: EMAIL, password: PASSWORD, rememberMe: true });
    expect(second!.body).toEqual({ email: EMAIL, password: PASSWORD, rememberMe: false });
    for (const request of [first!, second!]) {
      expect(request.headers['idempotency-key']).toBeUndefined();
      expect(request.headers['x-nexus-background']).toBeUndefined();
    }
  });

  it('sends the password exactly as typed, spaces included', async () => {
    await openSignIn();
    answer('post', SIGN_IN, () => betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'));
    fillIn(EMAIL, '  made up pw 0049  ');
    fireEvent.click(button('Sign in'));
    await waitFor(() => expect(sentTo('post', SIGN_IN)).toHaveLength(1));
    expect(sentTo('post', SIGN_IN)[0]!.body).toEqual({
      email: EMAIL,
      password: '  made up pw 0049  ',
      rememberMe: true,
    });
    await screen.findByText(WRONG);
  });

  it('stops the browser’s own submit (the form’s submit event is cancelled) and sends one request', async () => {
    await openSignIn();
    answer('post', SIGN_IN, () => betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'));
    fillIn();
    const form = field('Email').closest('form')!;
    expect(fireEvent.submit(form)).toBe(false);
    await screen.findByText(WRONG);
    expect(sentTo('post', SIGN_IN)).toHaveLength(1);
  });

  it('never keeps the typed password in the page’s markup, shown or hidden, before, during and after a refusal', async () => {
    await openSignIn();
    let release = () => {};
    const answered = new Promise<void>((resolve) => {
      release = resolve;
    });
    answer('post', SIGN_IN, async () => {
      await answered;
      return betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password');
    });
    fillIn();
    expect(document.documentElement.outerHTML).not.toContain(PASSWORD);
    fireEvent.click(button('Show password'));
    expect(document.documentElement.outerHTML).not.toContain(PASSWORD);
    fireEvent.click(button('Show password'));
    fireEvent.click(button('Sign in'));
    await waitFor(() => expect(sentTo('post', SIGN_IN)).toHaveLength(1));
    expect(document.documentElement.outerHTML).not.toContain(PASSWORD);
    release();
    await screen.findByText(WRONG);
    expect(field('Password').value).toBe('');
    expect(document.documentElement.outerHTML).not.toContain(PASSWORD);
  });

  it('is busy within 0.1 s: both buttons disabled, "Signing in…", aria-busy, and never faded', async () => {
    await openSignIn();
    let release = () => {};
    const answered = new Promise<void>((resolve) => {
      release = resolve;
    });
    answer('post', SIGN_IN, async () => {
      await answered;
      return betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password');
    });
    fillIn();
    const signIn = button('Sign in');
    const google = button('Continue with Google');
    fireEvent.click(signIn);
    expect(signIn.disabled).toBe(true);
    expect(signIn.textContent).toBe('Signing in…');
    expect(signIn.getAttribute('aria-busy')).toBe('true');
    expect(google.disabled).toBe(true);
    neverFaded(signIn);
    neverFaded(google);
    fireEvent.click(signIn);
    await waitFor(() => expect(sentTo('post', SIGN_IN)).toHaveLength(1));
    release();
    await screen.findByText(WRONG);
    expect(signIn.disabled).toBe(false);
    expect(signIn.textContent).toBe('Sign in');
    expect(signIn.getAttribute('aria-busy')).not.toBe('true');
    expect(google.disabled).toBe(false);
    expect(sentTo('post', SIGN_IN)).toHaveLength(1);
  });

  it('goes to / (replacing the sign-in page) after a good sign-in, puts back the title it found, asks get-session no more, and keeps no token', async () => {
    document.title = 'Some earlier page';
    await openSignIn();
    healthIsUp();
    answer('post', SIGN_IN, goodSignIn);
    const before = window.history.length;
    fillIn();
    fireEvent.click(button('Sign in'));
    await screen.findByRole('heading', { level: 1, name: 'YTP Nexus' });
    expect(window.location.pathname).toBe('/');
    expect(window.history.length).toBe(before);
    expect(document.title).toBe('Some earlier page');
    expect(await screen.findByText('API: connected')).toBeTruthy();
    expect(sentTo('get', '/api/auth/get-session')).toHaveLength(1);
    const kept = [
      document.documentElement.outerHTML,
      logged.join('\n'),
      JSON.stringify({ ...localStorage }),
      JSON.stringify({ ...sessionStorage }),
      document.cookie,
      window.location.href,
      JSON.stringify(window.history.state),
    ].join('\n');
    for (const secret of [TOKEN, PASSWORD, signedInAnswer.user.name]) expect(kept).not.toContain(secret);
  });

  it('takes nothing from an address carrying other values: the Email field stays empty, and a good sign-in goes to exactly / and nowhere else', async () => {
    await openSignIn(`/sign-in?${SPIKED}`);
    expect(field('Email').value).toBe('');
    expect(document.body.textContent).not.toMatch(/evil|attacker|Call us/);
    healthIsUp();
    answer('post', SIGN_IN, goodSignIn);
    const moves = recordMoves();
    fillIn();
    fireEvent.click(button('Sign in'));
    await screen.findByRole('heading', { level: 1, name: 'YTP Nexus' });
    await settle();
    expect(window.location.pathname + window.location.search).toBe('/');
    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) expect(move).toBe('/');
  });

  const lateAnswers: [string, () => Response][] = [
    ['nobody signed in', () => HttpResponse.json(null)],
    ['no answer at all', () => HttpResponse.error()],
  ];
  for (const [what, late] of lateAnswers) {
    it(`keeps a good sign-in when the page load’s get-session answers after it (${what})`, async () => {
      let release = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      sessionIs(async () => {
        await held;
        return late();
      });
      healthIsUp();
      await openPage('/sign-in');
      await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
      answer('post', SIGN_IN, goodSignIn);
      fillIn();
      fireEvent.click(button('Sign in'));
      await screen.findByRole('heading', { level: 1, name: 'YTP Nexus' });
      release();
      await settle(80);
      expect(window.location.pathname).toBe('/');
      expect(screen.getByRole('heading', { level: 1, name: 'YTP Nexus' })).toBeTruthy();
      expect(sentTo('get', '/api/auth/get-session')).toHaveLength(1);
    });
  }
});

type Place = 'email' | 'password' | 'box';

const refusals: { what: string; reply: () => Response; place: Place; text: string; hidden?: string }[] = [
  {
    what: 'a wrong email or password (Better Auth, 401)',
    reply: () => betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'),
    place: 'password',
    text: WRONG,
    hidden: 'Invalid email or password',
  },
  {
    what: 'a malformed email (Better Auth, 400)',
    reply: () => betterAuthError(400, 'INVALID_EMAIL', 'Invalid email'),
    place: 'email',
    text: BAD_EMAIL,
    hidden: 'Invalid email',
  },
  {
    what: 'a disabled person (Better Auth, 401)',
    reply: () => betterAuthError(401, 'FAILED_TO_CREATE_SESSION', 'Failed to create session'),
    place: 'box',
    text: CANNOT,
    hidden: 'Failed to create session',
  },
  {
    what: 'a locked account (Better Auth’s shape)',
    reply: () => betterAuthError(423, 'ACCOUNT_LOCKED', 'Account locked until later'),
    place: 'box',
    text: LOCKED,
    hidden: 'Account locked until later',
  },
  {
    what: 'a locked account (Nexus’s shape)',
    reply: () => nexusError(403, 'ACCOUNT_LOCKED', 'Account locked until later'),
    place: 'box',
    text: LOCKED,
    hidden: 'Account locked until later',
  },
  {
    what: 'too many tries (Nexus, 429): the API’s own words',
    reply: () => nexusError(429, 'too_many_requests', 'Too many tries. Please try again in 42 seconds.'),
    place: 'box',
    text: 'Too many tries. Please try again in 42 seconds.',
  },
  {
    what: 'an unknown 401',
    reply: () => betterAuthError(401, 'SOMETHING_NEW', 'Some new reason'),
    place: 'box',
    text: SOMETHING,
    hidden: 'Some new reason',
  },
  {
    what: 'Better Auth refusing the address (403)',
    reply: () => betterAuthError(403, 'INVALID_ORIGIN', 'Invalid origin'),
    place: 'box',
    text: SOMETHING,
    hidden: 'Invalid origin',
  },
  {
    what: 'Nexus refusing the request (403)',
    reply: () => nexusError(403, 'not_same_site', 'This request did not come from Nexus'),
    place: 'box',
    text: SOMETHING,
    hidden: 'This request did not come from Nexus',
  },
  {
    what: 'an answer that is not JSON (502)',
    reply: () => new HttpResponse('<html>Bad gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }),
    place: 'box',
    text: SOMETHING,
    hidden: 'Bad gateway',
  },
  {
    what: 'no answer at all',
    reply: () => HttpResponse.error(),
    place: 'box',
    text: UNREACHABLE,
  },
];

describe('a refused sign-in', () => {
  for (const refusal of refusals) {
    it(`shows ${refusal.what} in its place, keeps the email, clears the password and leaves the address alone`, async () => {
      await openSignIn();
      answer('post', SIGN_IN, refusal.reply);
      fillIn();
      fireEvent.click(button('Sign in'));
      const message = await screen.findByText(refusal.text);
      const alert = message.closest('[role="alert"]');
      expect(alert).not.toBeNull();
      const email = field('Email');
      const password = field('Password');
      const describedBy = (input: HTMLInputElement) => (input.getAttribute('aria-describedby') ?? '').split(/\s+/);
      for (const [input, place] of [
        [email, 'email'],
        [password, 'password'],
      ] as const) {
        if (refusal.place === place) {
          expect(input.getAttribute('aria-invalid')).toBe('true');
          expect(describedBy(input)).toContain(alert!.id);
          expect(alert!.id).not.toBe('');
        } else {
          expect(input.getAttribute('aria-invalid')).not.toBe('true');
          if (alert!.id !== '') expect(describedBy(input)).not.toContain(alert!.id);
        }
      }
      // Where it shows: a field's message right under its field; the box between the lead and Continue with Google.
      if (refusal.place === 'email') {
        expect(after(email, alert!)).toBe(true);
        expect(after(alert!, password)).toBe(true);
      } else if (refusal.place === 'password') {
        expect(after(password, alert!)).toBe(true);
        expect(after(button('Show password'), alert!)).toBe(true);
        expect(after(alert!, screen.getByRole('checkbox'))).toBe(true);
      } else {
        expect(after(screen.getByText(LEAD), alert!)).toBe(true);
        expect(after(alert!, button('Continue with Google'))).toBe(true);
      }
      expect(email.value).toBe(EMAIL);
      expect(password.value).toBe('');
      expect(button('Sign in').disabled).toBe(false);
      expect(button('Continue with Google').disabled).toBe(false);
      if (refusal.hidden) expect(document.body.textContent).not.toContain(refusal.hidden);
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      // Nothing typed goes into the address.
      await settle(30);
      expect(window.location.pathname + window.location.search).toBe('/sign-in');
    });
  }

  it('shows only the latest try’s message', async () => {
    await openSignIn();
    answer('post', SIGN_IN, () => betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'));
    fillIn();
    fireEvent.click(button('Sign in'));
    await screen.findByText(WRONG);
    answer('post', SIGN_IN, () => betterAuthError(401, 'FAILED_TO_CREATE_SESSION', 'Failed to create session'));
    fillIn();
    fireEvent.click(button('Sign in'));
    // The last message goes in the same press.
    expect(screen.queryByText(WRONG)).toBeNull();
    await screen.findByText(CANNOT);
    expect(screen.queryByText(WRONG)).toBeNull();
    expect(field('Password').getAttribute('aria-invalid')).not.toBe('true');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('never writes anything to the console or the browser’s storage', async () => {
    await openSignIn();
    answer('post', SIGN_IN, () => betterAuthError(401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password'));
    fillIn();
    fireEvent.click(button('Sign in'));
    await screen.findByText(WRONG);
    await settle(30);
    expect(logged.join('\n')).not.toContain(PASSWORD);
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });
});
