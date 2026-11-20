// TASK-0049 · Google sign-in on the sign-in page: the start request (back to / on success, to /sign-in on a refusal, nothing else), busy at once and until the browser leaves, a refused start, and Google's return to /sign-in?error=<code>: the denied state (its box right under the heading, gone at the next press), each code's message, the address cleaned at once, and nothing else read from the address, shown or sent. Written by the planner; builders never edit this file.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { answer, nexusError, sentTo, sessionIs } from '../msw/fake-api';
import { openPage } from '../msw/open-page';

const SOCIAL = '/api/auth/sign-in/social';
const START = { provider: 'google', callbackURL: '/', errorCallbackURL: '/sign-in' };
const GOOGLE_URL = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=x';
const DENIED_MESSAGE =
  "This Google account isn't on Nexus's list of people who can sign in. Ask the owner to add you in Users and roles, then try again.";
const DENIED_HELP =
  'New joiners can start with a personal Gmail; the owner switches it to the company account later and nothing is lost.';
const CANNOT = "This account can't sign in. Ask the owner to check it in Users and roles.";
const UNFINISHED = "Google sign-in didn't finish. Please try again.";

// A hostile address: values a page must never read, show, fill in, follow or send on.
const EVIL = 'https://evil.example/landing';
const SPIKED =
  `next=${encodeURIComponent(EVIL)}&redirect=${encodeURIComponent(EVIL)}&callbackURL=${encodeURIComponent(EVIL)}` +
  '&returnTo=%2F%2Fevil.example&email=attacker%40evil.example&error_description=Call+evil.example+now&message=Call+us';

const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const settle = (ms = 50) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
// True when `later` comes after `first` in the page.
const after = (first: Node, later: Node) =>
  Boolean(first.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);
const goodStart = () => HttpResponse.json({ url: GOOGLE_URL, redirect: true });

// jsdom cannot leave the page for Google: when Better Auth's client sends it there, jsdom prints "Not implemented:
// navigation to another Document", which is expected here.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function openSignIn(path = '/sign-in'): Promise<void> {
  sessionIs('signed out');
  await openPage(path);
}

describe('Continue with Google', () => {
  it('asks Better Auth for Google with / on success and /sign-in on a refusal, busy at once with both buttons disabled', async () => {
    await openSignIn();
    await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
    answer('post', SOCIAL, goodStart);
    const google = button('Continue with Google');
    const signIn = button('Sign in');
    fireEvent.click(google);
    expect(google.textContent).toContain('Opening Google…');
    expect(google.textContent).not.toContain('Continue with Google');
    expect(google.getAttribute('aria-busy')).toBe('true');
    expect(google.disabled).toBe(true);
    expect(signIn.disabled).toBe(true);
    await waitFor(() => expect(sentTo('post', SOCIAL)).toHaveLength(1));
    const [start] = sentTo('post', SOCIAL);
    expect(start!.url).toBe('http://localhost:5310/api/auth/sign-in/social');
    expect(start!.body).toEqual(START);
    expect(start!.headers['idempotency-key']).toBeUndefined();
  });

  it('stays busy after a good start until the browser leaves, and a second press sends nothing', async () => {
    await openSignIn();
    await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
    answer('post', SOCIAL, goodStart);
    const google = button('Continue with Google');
    const signIn = button('Sign in');
    fireEvent.click(google);
    await waitFor(() => expect(sentTo('post', SOCIAL)).toHaveLength(1));
    await settle();
    expect(google.disabled).toBe(true);
    expect(google.getAttribute('aria-busy')).toBe('true');
    expect(signIn.disabled).toBe(true);
    fireEvent.click(google);
    await settle();
    expect(sentTo('post', SOCIAL)).toHaveLength(1);
  });

  it('shows a refused start in the box (the API’s words for too many tries) and can be pressed again', async () => {
    await openSignIn();
    await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
    answer('post', SOCIAL, () => nexusError(429, 'too_many_requests', 'Too many tries. Please try again in 30 seconds.'));
    fireEvent.click(button('Continue with Google'));
    const message = await screen.findByText('Too many tries. Please try again in 30 seconds.');
    expect(message.closest('[role="alert"]')).not.toBeNull();
    expect(button('Continue with Google').disabled).toBe(false);
    expect(button('Sign in').disabled).toBe(false);

    answer('post', SOCIAL, () => HttpResponse.error());
    fireEvent.click(button('Continue with Google'));
    expect(await screen.findByText("Nexus can't be reached. Check your connection and try again.")).toBeTruthy();
    expect(screen.queryByText('Too many tries. Please try again in 30 seconds.')).toBeNull();
  });
});

describe('back from Google with ?error=', () => {
  it('shows the denied state for an account nobody added, cleans the address (no new history entry), and starts Google again', async () => {
    const before = window.history.length;
    await openSignIn('/sign-in?error=signup_disabled');
    const heading = await screen.findByRole('heading', { level: 1, name: "This account can't sign in yet" });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const message = screen.getByText(DENIED_MESSAGE);
    const box = message.closest('[role="alert"]')!;
    expect(box).not.toBeNull();
    expect(screen.getByText(DENIED_HELP)).toBeTruthy();
    expect(screen.queryByLabelText('Email', { selector: 'input' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
    await waitFor(() => expect(window.location.search).toBe(''));
    expect(window.location.pathname).toBe('/sign-in');
    expect(window.history.length).toBe(before);
    expect(screen.getByText(DENIED_MESSAGE)).toBeTruthy();
    // The box sits right under the heading, before the one button, which has no G mark.
    const again = button('Try another Google account');
    expect(after(heading, box)).toBe(true);
    expect(after(box, again)).toBe(true);
    expect(again.querySelector('svg')).toBeNull();

    answer('post', SOCIAL, goodStart);
    fireEvent.click(again);
    expect(again.disabled).toBe(true);
    expect(again.getAttribute('aria-busy')).toBe('true');
    expect(again.textContent).toContain('Opening Google…');
    // The last message goes at the press, as at every press.
    expect(screen.queryByText(DENIED_MESSAGE)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    await waitFor(() => expect(sentTo('post', SOCIAL)).toHaveLength(1));
    expect(sentTo('post', SOCIAL)[0]!.body).toEqual(START);
  });

  const codes: [string, string][] = [
    ['account_not_linked', "Google sign-in isn't turned on for this account. Sign in with your email and password, or ask the owner to turn on Google sign-in for you."],
    ['unable_to_create_session', CANNOT],
    ['access_denied', 'Google sign-in was cancelled.'],
    ['state_not_found', UNFINISHED],
    ['something_else', UNFINISHED],
  ];
  for (const [code, text] of codes) {
    it(`shows "${text}" for ${code} on the sign-in page and cleans the address`, async () => {
      const before = window.history.length;
      await openSignIn(`/sign-in?error=${code}`);
      expect(await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' })).toBeTruthy();
      const message = await screen.findByText(text);
      expect(message.closest('[role="alert"]')).not.toBeNull();
      await waitFor(() => expect(window.location.search).toBe(''));
      expect(window.location.pathname).toBe('/sign-in');
      expect(window.history.length).toBe(before);
      expect(screen.getByText(text)).toBeTruthy();
      expect(screen.getByLabelText('Email', { selector: 'input' })).toBeTruthy();
    });
  }

  it('never shows text read from the address', async () => {
    await openSignIn('/sign-in?error=%3Cb%3EHello%20there%3C%2Fb%3E&error_description=Visit+evil.example+now');
    expect(await screen.findByText(UNFINISHED)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Hello there|evil\.example|<b>/);
    expect(document.body.innerHTML).not.toContain('<b>');
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('shows no message when the address has no error', async () => {
    await openSignIn('/sign-in');
    await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('an address carrying other values', () => {
  it('takes no return address and no value from it: the Email field stays empty, nothing is shown, and Google starts exactly as agreed', async () => {
    await openSignIn(`/sign-in?${SPIKED}`);
    await screen.findByRole('heading', { level: 1, name: 'Sign in to Nexus' });
    expect((screen.getByLabelText('Email', { selector: 'input' }) as HTMLInputElement).value).toBe('');
    expect(document.body.textContent).not.toMatch(/evil\.example|attacker|Call us/);
    answer('post', SOCIAL, goodStart);
    fireEvent.click(button('Continue with Google'));
    await waitFor(() => expect(sentTo('post', SOCIAL)).toHaveLength(1));
    expect(sentTo('post', SOCIAL)[0]!.body).toEqual(START);
  });

  it('shows nothing from it in the denied state either, and starts Google again exactly as agreed', async () => {
    await openSignIn(`/sign-in?error=signup_disabled&${SPIKED}`);
    await screen.findByRole('heading', { level: 1, name: "This account can't sign in yet" });
    expect(document.body.textContent).not.toMatch(/evil\.example|attacker|Call us/);
    answer('post', SOCIAL, goodStart);
    fireEvent.click(button('Try another Google account'));
    await waitFor(() => expect(sentTo('post', SOCIAL)).toHaveLength(1));
    expect(sentTo('post', SOCIAL)[0]!.body).toEqual(START);
  });
});
