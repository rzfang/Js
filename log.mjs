/* eslint no-console: 0, complexity: [ 'warn', 15 ] */

const isBrowser = typeof window !== 'undefined';

export function log (info, level = 2) {
  switch (level) {
    case 0:
    case 'error':
      console.error(isBrowser ? '%s' : '\n\x1b[41m%s\x1b[0m', '[ERROR]');
      console.error(info);

      break;

    case 1:
    case 'warn':
      console.warn(isBrowser ? '%s' : '\n\x1b[43m%s\x1b[0m', '[WARN ]');
      console.warn(info);

      break;

    case 2:
    case 'log':
      console.log(isBrowser ? '%s' : '\n\x1b[30;42m%s\x1b[0m', '[ LOG ]');
      console.log(info);

      break;

    case 3:
    case 'debug':
      console.log(isBrowser ? '%s' : '\n\x1b[30;47m%s\x1b[0m', '[DEBUG]');
      console.log(info);

      break;
  }

  return typeof info === 'string' ? info : String(info);
}

export default log;
