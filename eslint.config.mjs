import globals from 'globals';
import { defineConfig } from 'eslint/config';

import jsonConfig from './eslint/config.json.mjs';
import jsStrictConfig from './eslint/config.js.strict.mjs';
import jsStyleConfig from './eslint/config.js.style.mjs';
import mdConfig from './eslint/config.markdown.mjs';

export default defineConfig([
  {
    files: [ '**/*.{js,mjs,cjs}' ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, jQuery: true },
    },
  },
  jsonConfig,
  jsStrictConfig,
  jsStyleConfig,
  mdConfig,
]);
