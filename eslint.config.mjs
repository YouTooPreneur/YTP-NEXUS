import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig(
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
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs', '**/*.js', '**/*.cjs'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['apps/web/**', 'packages/ui/**'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['apps/web/**', 'packages/ui/**'],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/unsupported-syntax': 'error',
      'react-hooks/incompatible-library': 'off',
    },
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
