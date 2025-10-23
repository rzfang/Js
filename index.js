import cache from './node/cache.mjs';
import dom from './browser/dom.mjs';
import is from './is.mjs';
import log from './log.mjs';
import sqlite from './node/sqlite.mjs';

export default {
  cache,
  Cache: cache, // ToDo: deprecated. the alias.
  dom,
  DOM: dom, // ToDo: deprecated. the alias.
  is,
  Is: is, // ToDo: deprecated. the alias.
  log,
  Log: log, // ToDo: deprecated. the alias.
  sqlite,
  SQLite: sqlite, // ToDo: deprecated. the alias.
};
