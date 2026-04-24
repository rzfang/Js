import json from '@eslint/json';

const config = {
  extends: [ 'json/recommended' ],
  files: [ '**/*.json' ],
  ignores: [ 'package-lock.json' ],
  language: 'json/json',
  plugins: { json },
};

export default config;
