import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const config = {
  files: [ '**/*.{js,mjs,cjs}' ],
  languageOptions: { parser: tsParser },
  plugins: { '@typescript-eslint': tsPlugin },
  rules: {
    'max-depth': [ 'warn', 3 ],
    'no-implicit-coercion': 'warn',
    camelcase: [ 'warn' ],
    complexity: [ 'warn', 10 ],
    eqeqeq: [ 'error', 'always' ],
    '@typescript-eslint/naming-convention': [
      'warn',
      { selector: 'function', format: [ 'camelCase' ] },
      { selector: 'typeLike', format: [ 'PascalCase' ] },
      { selector: 'variable', format: [ 'camelCase', 'UPPER_CASE' ], modifiers: [ 'const' ] },
      { selector: 'variableLike', format: [ 'camelCase' ], leadingUnderscore: 'allow' },
    ],
  },
};

export default config;
