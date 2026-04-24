import markdown from '@eslint/markdown';

const config = {
  extends: [ 'markdown/recommended' ],
  files: [ '**/*.md' ],
  language: 'markdown/gfm',
  plugins: { markdown },
};

export default config;
