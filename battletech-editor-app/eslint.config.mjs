import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// Calculate __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a FlatCompat instance
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
    ],
  },
  
  // Use FlatCompat to load Next.js configuration
  ...compat.extends('next/core-web-vitals'),
  
  // Custom rules for all JS/TS files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // React specific rules
      'react/jsx-key': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Import rules
      'import/no-anonymous-default-export': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];
