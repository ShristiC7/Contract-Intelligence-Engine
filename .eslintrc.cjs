/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      }
    }
  },
  rules: {
    'import/prefer-default-export': 'off',
    'no-void': ['error', { allowAsStatement: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never'
      }
    ]
  },
  overrides: [
    {
      files: ['apps/web/**/*.*'],
      extends: ['next/core-web-vitals']
    }
  ]
};

