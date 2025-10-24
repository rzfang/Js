import cache from './node/cache.mjs';
import dom from './browser/dom.mjs';
import is from './is.mjs';
import log from './log.mjs';
import sqlite from './node/sqlite.mjs';

export {
  cache,
  cache as Cache, // ToDo: deprecated. the alias.
  dom,
  dom as DOM, // ToDo: deprecated. the alias.
  is,
  is as Is, // ToDo: deprecated. the alias.
  log,
  log as Log, // ToDo: deprecated. the alias.
  sqlite,
  sqlite as SQLite, // ToDo: deprecated. the alias.
};

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
