import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'apps/web/src/api/**',
      'docs/**',
      'history/**',
      'share/**',
      'assets/**',
      'tracker.html',
      'tools/*',
      '!tools/verify/',
      'tests/**',
      'apps/*/test/**',
      'packages/*/test/**',
      '**/tsconfig.verify.json',
      '.claude/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    files: ['apps/web/**', 'packages/ui/**'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: [
      'apps/api/**',
      'packages/contracts/**',
      'tools/verify/**',
      '*.config.*',
      '**/*.config.*',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['apps/web/**', 'packages/ui/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
);
