/* eslint no-console: 0, complexity: [ 'warn', 15 ] */

export function log (info, level = 2) {
  switch (level) {
    case 0:
    case 'error':
      console.error('\x1b[41m%s\x1b[0m', '\n[ERROR]');
      console.error(info);

      break;

    case 1:
    case 'warn':
      console.warn('\x1b[41m%s\x1b[0m', '\n[WARN ]');
      console.warn(info);

      break;

    case 2:
    case 'log':
      console.log('\x1b[42m%s\x1b[0m', '\n[ LOG ]');
      console.log(info);

      break;

    case 3:
    case 'debug':
      console.log('\x1b[30m\x1b[47m%s\x1b[0m', '\n[DEBUG]');
      console.log(info);

      break;
  }

  return typeof info === 'string' ? info : String(info);
}

export default log;
