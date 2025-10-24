import sqlite3 from 'sqlite3'; //.verbose();

export class SQLite {
  /*
    @ path. */
  constructor (path) {
    this.Db = null;

    if (!path || typeof path !== 'string' ) { return; }

    const Db = new sqlite3.Database(path, sqlite3.OPEN_READWRITE);

    if (!Db) { return; }

    this.Db = Db;
  }

  IsReady () {
    return this.Db ? true : false;
  }

  Close () {
    if (!this.Db) { return; }

    this.Db.close();

    this.Db = null;
  }

  /*
    @ SQL command string.
    @ parameters. should be an array.
    < a Promise object. */
  Query (sql, params = []) {
    return new Promise ((resolve, reject) => {
      if (!this.Db) {
        return reject(-1);
      }

      if (!sql || !params || typeof sql !== 'string' || !(params instanceof Array)) {
        return reject(-2);
      }

      this.Db.all(
        sql,
        params,
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result || []);
        });
    });
  }

  /*
    @ command. should be 'BEGIN' | 'COMMIT' | 'ROLLBACK'.
    < a Promise object. */
  Transaction (command) {
    return new Promise ((resolve, reject) => {
      if (!this.Db) {
        return reject(-1);
      }

      if (!command || typeof command !== 'string') {
        return reject(-2);
      }

      let sql;

      command = command.toUpperCase();

      switch (command) {
        case 'BEGIN':
          sql = 'BEGIN TRANSACTION;';

          break;

        case 'ROLLBACK':
        case 'COMMIT':
          sql = command + ';';

          break;

        default:
          return reject(-3);
      }

      this.Db.exec(
        sql,
        (error) => {
          if (error) {
            return reject(-4, error);
          }

          resolve();
        });
    });
  }

  /* check if a row is exist in a table.
    @ table name.
    @ field name.
    @ parameter.
    < a Promise object. */
  IsARowExist (table, field, param) {
    return new Promise ((Resolve, Reject) => {
      if (!this.Db) { return Reject(-1); }

      if (
        !table ||
        !field ||
        !param ||
        typeof table !== 'string' ||
        typeof field !== 'string' ||
        typeof param !== 'string'
      ) {
        return Reject(-2);
      }

      const CntFld = `COUNT(${field})`;

      this.Db.get(
        `SELECT ${CntFld} FROM ${table} WHERE ${field} = ? LIMIT 1;`,
        [ param ],
        (Err, Rst) => { // error, result.
          if (Err) { return Resolve(false, Err); }

          Resolve((!Rst[CntFld] || Rst[CntFld] < 1) ? false : true);
        });
    });
  }

  /*
    @ table name.
    @ extra info for condition. optional, default null, format { field, params }
      @ field name. optional, default '' to ignore extra info.
      @ parameters. optional, default [].
    < a Promise object. */
  TableRows (table, { field = '', params = [] } = {}) {
    return new Promise ((resolve, reject) => {
      if (!this.Db) {
        return reject(-1);
      }

      if (!table || typeof table !== 'string') {
        return reject(-2);
      }

      const fineParams = [];

      let sql = 'SELECT COUNT(*) FROM ' + table;

      if (field && params && typeof field === 'string' && params instanceof Array && params.length > 0) {
        let holes = []; // sql prepare statment holes.

        for (let i = 0; i < params.length; i++) {
          if (typeof params[i] === 'string') {
            fineParams.push(params[i]);
            holes.push('?');
          }
        }

        holes = holes.join(', ');
        sql += ` WHERE ${field} IN (${holes})`;
      }

      this.Db.get(
        sql + ';',
        fineParams,
        (error, result) => { // error, result.
          if (error) { return resolve(0, error); }

          resolve(result['COUNT(*)'] || 0);
        }
      );
    });
  }

  /*
    @ table name.
    @ number of data which been get, optional , default 1.
    < a Promise object. */
  RandomGet (table, number = 1) {
    return new Promise((resolve, reject) => {
      if (!this.Db) {
        return reject(-1);
      }

      if (!table || typeof table !== 'string' || typeof number !== 'number' || number < 1) {
        return reject(-2);
      }

      this.Db.get(
        `SELECT * FROM ${table} ORDER BY RANDOM() LIMIT ${number};`,
        [],
        (error, result) => {
          if (error) {
            return resolve([], error);
          }

          resolve(result || []);
        }
      );
    });
  }
}

export default SQLite;
