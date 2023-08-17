export { Is } from './Is.js';
export { Log } from './Log.js';
import Is from './Is.js';
import Log from './Log.js';

export { Cache } from './node/Cache.js';
export { SQLite } from './node/SQLite.js';
import Cache from './node/Cache.js';
import SQLite from './node/SQLite.js';

import DOM from './browser/DOM.js';

export default {
  Cache,
  DOM,
  Is,
  Log,
  SQLite,
};
