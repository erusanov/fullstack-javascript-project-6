import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });
const jestCompat = compat.extends('plugin:jest/recommended');

const baseConfig = {
  files: ['**/*.{js,mjs,cjs}'],
  plugins: {
    import: importPlugin,
  },
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.jest,
    },
  },
  rules: {
    'no-unused-vars': 0,
    'no-console': 0,
    'no-lonely-if': 'error',
    'no-trailing-spaces': 'error',
    'one-var': ['error', 'never'],
    'one-var-declaration-per-line': 'error',
    indent: ['error', 2],
    'arrow-parens': ['error', 'always'],
    'consistent-return': 'error',
    'no-await-in-loop': 'error',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForOfStatement',
        message: 'iterators/generators require regenerator-runtime',
      },
    ],
    'import/extensions': 0,
    'import/no-extraneous-dependencies': ['error', { devDependencies: false }],
    'import/no-mutable-exports': 'error',
    'import/prefer-default-export': 'error',
    'import/no-cycle': 'error',
    'new-cap': ['error', { properties: false }],
    semi: ['error', 'always'],
    'max-len': ['error', { code: 100 }],
    'comma-dangle': ['error', 'always-multiline'],
    'prefer-arrow-callback': 'error',
    'func-names': ['warn', 'as-needed'],
    'object-curly-newline': ['error', { multiline: true, consistent: true }],
    'function-paren-newline': ['error', 'multiline-arguments'],
    'quote-props': ['error', 'as-needed'],
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['req', 'reply'],
      },
    ],
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'no-underscore-dangle': ['error', { allow: ['__filename', '__dirname'] }],
  },
};

const config = [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...jestCompat,
  baseConfig,
];

export default config;
