// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// Calculate __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a FlatCompat instance
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname, // Important for FlatCompat
});

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "battletech-editor-app/src/app_disabled/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Use FlatCompat to load Next.js configurations
  // This ensures @rushstack/eslint-patch is handled as intended by eslint-config-next
  ...compat.extends('next/core-web-vitals'),
  // Custom overrides and additional configurations
  {
     files: ['**/*.{js,jsx,ts,tsx}'],
     // Plugins are often managed by the configs loaded via FlatCompat for Next.js
     // but we can ensure typescript-eslint parser is primary
     languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tseslint.parser,
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
           project: './tsconfig.json',
        },
        globals: {
          React: 'readonly',
          process: 'readonly',
          module: 'readonly',
          require: 'readonly',
          window: 'readonly',
          document: 'readonly',
          navigator: 'readonly',
        }
     },
     rules: {
        // Rules from typescript-eslint that we want (recommended are already included)
        // Relaxed rules from previous attempt:
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
        // Original custom rules:
        'react/jsx-key': 'warn', // This might be covered by next/core-web-vitals
        'react/no-unescaped-entities': 'warn', // This might be covered
        'react-hooks/rules-of-hooks': 'error', // This might be covered
        'react-hooks/exhaustive-deps': 'warn', // This might be covered
        'import/no-anonymous-default-export': 'warn',
        'react/react-in-jsx-scope': 'off', // Next.js handles this
     },
     settings: {
        react: {
          version: 'detect',
        },
        'import/resolver': {
          typescript: true,
          node: true,
        },
        // 'next/rootDir' might not be needed when using FlatCompat from 'next/core-web-vitals'
     },
  }
);
