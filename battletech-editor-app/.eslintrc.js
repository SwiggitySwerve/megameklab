module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },

  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  globals: {
    React: 'readonly',
    process: 'readonly',
    module: 'readonly',
    require: 'readonly',
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
  },
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    
    // React rules
    'react/jsx-key': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/react-in-jsx-scope': 'off', // Next.js handles this
    
    // Import rules
    'import/no-anonymous-default-export': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  ignorePatterns: [
    "**/node_modules/**",
    "**/.next/**",
    "**/out/**",
    "**/dist/**",
    "battletech-editor-app/src/app_disabled/**",
  ],
}; 