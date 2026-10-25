/* eslint complexity: [ 'warn', 15 ] */

import { DatabaseSync } from 'node:sqlite'; // Note: v26, DatabaseSync > Database.

import is from '../is.mjs';

export class SQLite {
  constructor (path) {
    this.db = null;

    if (!path || typeof path !== 'string') {
      return;
    }

    const db = new DatabaseSync(path);

    if (!db) { return; }

    this.db = db;
  }

  isReady () {
    return this.db && this.db.isOpen;
  }

  close () {
    if (!this.db || !this.db.isOpen) { return; }

    this.db.close();

    this.db = null;
  }

  /*
    < data | [] */
  query (sql, params = []) {
    if (!sql || !params || !is.String(sql) || !is.Array(params) || !this.isReady()) {
      return [];
    }

    const result = this.db.prepare(sql).all(...params);

    return result || [];
  }

  /*
    < db change object. */
  mutate (sql, params = []) {
    if (!sql || !params || !is.String(sql) || !is.Array(params) || !this.isReady()) {
      return [];
    }

    const result = this.db.prepare(sql).run(...params);

    return result || null;
  }

  /*
    @ command. should be 'BEGIN' | 'COMMIT' | 'ROLLBACK'.
    < 0 as OK; < 0 as error. */
  transaction (command) {
    if (!([ 'BEGIN', 'COMMIT', 'ROLLBACK' ].includes(command)) || !this.isReady()) {
      return -1;
    }

    const sql = (command === 'BEGIN') ? 'BEGIN TRANSACTION;' : (command + ';');

    this.db.exec(sql);

    return 0;
  }

  /*
    @ table name.
    @ field name.
    @ parameter.
    < true | false. */
  isRowExisted (table, field, param) {
    if (!this.isReady()) {
      return false;
    }

    if (
      !table ||
      !field ||
      !param ||
      !is.String(table) ||
      !is.String(field) ||
      !(is.Number(param) || is.String(param))
    ) {
      return false;
    }

    const result = this.query(`SELECT COUNT(${field}) AS count FROM ${table} WHERE ${field} = ? LIMIT 1;`, [ param ]);

    return result && result[0] && (result[0].count > 0);
  }

  /*
    @ table name.
    @ extra info for condition. optional, default null, format { field, params }
      @ field name. optional, default '' to ignore extra info.
      @ parameters. optional, default [].
    < rows number | < 0 as error*/
  tableRows (table, { field = '', params = [] } = {}) {
    if (!this.isReady() || !table || !is.String(table)) {
      return -1;
    }

    const fineParams = [];
    let sql = `SELECT COUNT(*) AS count FROM ${table}`;

    if (field && params && is.String(field) && is.Array(params) && params.length > 0) {
      params
        .filter(param => param && (is.Number(param) || is.String(param)))
        .forEach(param => { fineParams.push(param); });

      const holes = (new Array(fineParams.length)).fill('?'); // sql prepare statement holes.

      sql += ` WHERE ${field} IN (${holes})`;
    }

    sql += ' LIMIT 1;'

    const result = this.query(sql, fineParams);

    return result && result[0] && result[0].count || 0;
  }

  /*
    @ table name.
    @ number.
    < row object | null as error */
  randomGet (table, number = 1) {
    if (!this.isReady() || !table || !is.String(table) || !number || !is.Number(number)) {
      return null;
    }

    return this.query(`SELECT * FROM ${table} ORDER BY RANDOM() LIMIT ${number};`);
  }
}

export default SQLite;
