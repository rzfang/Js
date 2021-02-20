const sqlite3 = require('sqlite3'); //.verbose();

module.exports = class SQLite {
  /*
    @ path. */
  constructor (Pth) {
    this.Db = null;

    if (!Pth || typeof Pth !== 'string' ) { return; }

    const Db = new sqlite3.Database(Pth, sqlite3.OPEN_READWRITE);

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
  Query (SQL, Prms = []) {
    return new Promise ((Resolve, Reject) => {
      if (!this.Db) { return Reject(-1); }

      if (!SQL || !Prms || typeof SQL !== 'string' || !(Prms instanceof Array)) { return Reject(-2); }

      this.Db.all(
        SQL,
        Prms,
        (Err, Rst) => {
          if (Err) { return Reject(Err); }

          Resolve(Rst || []);
        });
    });
  }

  /*
    @ command. should be 'BEGIN' | 'COMMIT' | 'ROLLBACK'.
    < a Promise object. */
  Transaction (Cmd) {
    return new Promise ((Resolve, Reject) => {
      if (!this.Db) { return Reject(-1); }

      if (!Cmd || typeof Cmd !== 'string') { return Reject(-2); }

      let SQL;

      Cmd = Cmd.toUpperCase();

      switch (Cmd) {
        case 'BEGIN':
          SQL = 'BEGIN TRANSACTION;';

          break;

        case 'ROLLBACK':
        case 'COMMIT':
          SQL = Cmd + ';';

          break;

        default:
          return Reject(-3);
      }

      this.Db.exec(
        SQL,
        (Err) => {
          if (Err) { return Reject(-4, Err); }

          Resolve();
        });
    });
  }

  /* check if a row is exist in a table.
    @ table name.
    @ field name.
    @ parameter.
    < a Promise object. */
  IsARowExist (Tbl, Fld, Prm) {
    return new Promise ((Resolve, Reject) => {
      if (!this.Db) { return Reject(-1); }

      if (!Tbl || !Fld || !Prm || typeof Tbl !== 'string' || typeof Fld !== 'string' || typeof Prm !== 'string') {
        return Reject(-2);
      }

      const CntFld = `COUNT(${Fld})`;

      this.Db.get(
        `SELECT ${CntFld} FROM ${Tbl} WHERE ${Fld} = ? LIMIT 1;`,
        [ Prm ],
        (Err, Rst) => { // error, result.
          if (Err) { return Resolve(false, Err); }

          Resolve((!Rst[CntFld] || Rst[CntFld] < 1) ? false : true);
        });
    });
  }

  /*
    @ table name.
    @ extra info for condition. optional, default null, format { Fld, Prms }
      @ field name. optional, default '' to ignore extra info.
      @ parameters. optional, default [].
    < a Promise object. */
  TableRows (Tbl, { Fld = '', Prms = [] } = {}) {
    return new Promise ((Resolve, Reject) => {
      if (!this.Db) { return Reject(-1); }

      if (!Tbl || typeof Tbl !== 'string') { return Reject(-2); }

      let SQL = 'SELECT COUNT(*) FROM ' + Tbl,
          FnPrms = []; // fine values.

      if (Fld && Prms && typeof Fld === 'string' && Prms instanceof Array && Prms.length > 0) {
        let SQLHls = []; // SQL prepare statment holes.

        for (let i = 0; i < Prms.length; i++) {
          if (typeof Prms[i] === 'string') {
            FnPrms.push(Prms[i]);
            SQLHls.push('?');
          }
        }

        SQLHls = SQLHls.join(', ');
        SQL += ` WHERE ${Fld} IN (${SQLHls})`;
      }

      this.Db.get(
        SQL + ';',
        FnPrms,
        (Err, Rst) => { // error, result.
          if (Err) { return Resolve(0, Err); }

          Resolve(Rst['COUNT(*)'] || 0);
        });
    });
  }

  /*
    @ table name.
    @ number of data which been get, optional , default 1.
    < a Promise object. */
  RandomGet (Tbl, Nbr = 1) {
    return new Promise((Resolve, Reject) => {
      if (!this.Db) { return Reject(-1); }

      if (!Tbl || typeof Tbl !== 'string' || typeof Nbr !== 'number' || Nbr < 1) { return Reject(-2); }

      let SQL = `SELECT * FROM ${Tbl} ORDER BY RANDOM() LIMIT ${Nbr};`;

      this.Db.get(
        SQL,
        [],
        (Err, Rst) => {
          if (Err) { return Resolve([], Err); }

          Resolve(Rst || []);
        });
    });
  }
};
