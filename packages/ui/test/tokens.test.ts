// TASK-0004 · Design tokens. Written by the planner; builders never edit this file.
// @vitest-environment node
// The values are the approved "mixed" style from docs/design/mockups/mockup.css (D-134, D-137).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Comments are removed first, so the builder may add any comments to tokens.css.
const css = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Returns the variables declared in the first rule whose selector list contains `selector`. */
function variablesOf(selector: string): Record<string, string> {
  const rules = css.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const [, selectors, body] of rules) {
    const list = (selectors ?? '').split(',').map((s) => s.trim());
    if (!list.includes(selector)) continue;
    const vars: Record<string, string> = {};
    for (const [, name, value] of (body ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      vars[name as string] = (value as string).trim().replace(/\s+/g, ' ');
    }
    return vars;
  }
  throw new Error(`No rule for ${selector} in tokens.css`);
}

const shared = { '--card': '#FFFFFF', '--accent': '#03FF96', '--primary-ink': '#03FF96', '--amber': '#86600F' };

const emerald = {
  ...shared,
  '--bg': '#FAF8F3', '--stage': '#EFEBE1', '--card-2': '#F7F5EF', '--line': '#E7E3D8', '--line-soft': '#EFEBE2',
  '--ink': '#1C3D36', '--muted': '#5E6B64', '--faint': '#A0A9A3', '--key': '#1C3D36', '--logo': '#1C3D36',
  '--primary-bg': '#1C3D36', '--active-bg': '#EAF3EE', '--active-ink': '#1C3D36',
  '--red': '#A9483A', '--red-bg': '#F8EAE6', '--amber-bg': '#F6EEDB', '--green': '#1E7149', '--green-bg': '#E5F2EA',
  '--blue': '#355F86', '--blue-bg': '#E7EEF5',
  '--side-bg': 'linear-gradient(180deg, #1E4239 0%, #163229 100%)', '--radius': '16px', '--radius-sm': '10px',
};

const navy = {
  ...shared,
  '--bg': '#F5F7FA', '--stage': '#E8EDF3', '--card-2': '#F2F5F9', '--line': '#DFE6EE', '--line-soft': '#EAEFF5',
  '--ink': '#10273A', '--muted': '#5B6D80', '--faint': '#9AA8B6', '--key': '#10273A', '--logo': '#10273A',
  '--primary-bg': '#10273A', '--active-bg': '#EAF0F6', '--active-ink': '#10273A',
  '--red': '#B4483A', '--red-bg': '#FBECE9', '--amber-bg': '#F8F0DC', '--green': '#17744A', '--green-bg': '#E3F3EA',
  '--blue': '#2F5E8C', '--blue-bg': '#E6EEF7',
  '--side-bg': 'linear-gradient(180deg, #17344F 0%, #0E2235 100%)', '--radius': '18px', '--radius-sm': '12px',
};

describe('design tokens', () => {
  it('Emerald is the default and matches the approved design', () => {
    const vars = variablesOf('[data-colour="emerald"]');
    expect(variablesOf(':root')).toEqual(vars);
    for (const [name, value] of Object.entries(emerald)) expect(vars[name], name).toBe(value);
  });

  it('Navy matches the approved design', () => {
    const vars = variablesOf('[data-colour="navy"]');
    for (const [name, value] of Object.entries(navy)) expect(vars[name], name).toBe(value);
  });

  it('both colours define the same set of variables', () => {
    const e = Object.keys(variablesOf('[data-colour="emerald"]')).sort();
    const n = Object.keys(variablesOf('[data-colour="navy"]')).sort();
    expect(n).toEqual(e);
  });

  it('the fonts are DM Sans for text, Sora for titles and Noto Sans Tamil for Tamil', () => {
    expect(css).toMatch(/--font-ui:\s*"DM Sans"/);
    expect(css).toMatch(/--font-title:\s*"Sora"/);
    expect(css).toMatch(/--font-tamil:\s*"Noto Sans Tamil"/);
  });

  it('the dark menu text is near-white and the active item uses the neon accent', () => {
    const css2 = css.replace(/\s+/g, ' ');
    expect(css2).toMatch(/--side-ink: #FFFFFF;/);
    expect(css2).toMatch(/--side-active-ink: #03FF96;/);
  });
});
