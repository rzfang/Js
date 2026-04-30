import fs from 'fs';

import log from '../log.mjs';

export const Cache = {
  Cchs: { Fls: {}, Dt: {} }, // caches, files, data.
  IsRolling: false,
  /*
    @ file path.
    @ callback (error code, result data). */
  fileLoad (FlPth, Clbck) {
    const This = this;

    if (this.Cchs.Fls[FlPth]) {
      const { Dt = null, Str = '' } = this.Cchs.Fls[FlPth];

      if (!Dt || !Str) { return Clbck(-1); }

      return Clbck(1, Str, Dt);
    }

    fs.readFile(
      FlPth,
      'utf8',
      function (Err, FlStr) { // error, file string.
        if (Err) { return Clbck(-2); }

        const Dt = (new Date()).getTime();

        This.Cchs.Fls[FlPth] = { Dt, Str: FlStr };

        Clbck(0, FlStr, Dt);
      });
  },
  // To Do: deprecated. alias.
  FileLoad (FlPth, Clbck) {
    log('FileLoad is deprecated. use fileLoad instead.', 'warn');
    this.fileLoad(FlPth, Clbck);
  },

  /*
    @ key name.
    < true | false. */
  isFileCached (key) {
    const fileInfo = this.Cchs.Fls && this.Cchs.Fls[key] || null;

    if (!fileInfo || !fileInfo.Dt || !fileInfo.Str) { return false; }

    return true;
  },
  // To Do: deprecated. alias.
  IsFileCached (key) {
    log('IsFileCached is deprecated. use isFileCached instead.', 'warn');
    this.isFileCached(key);
  },

  has (Ky) {
    return this.Cchs.Dt[Ky] ? true : false;
  },
  // To Do: deprecated. alias.
  Has (key) {
    log('Has is deprecated. use has instead.', 'warn');
    this.has(key);
  },

  /* get the value.
    @ key name.
    < cached data, or null. */
  get (key) {
    if (!this.Cchs.Dt[key] || !this.Cchs.Dt[key]['Vl'] || !this.Cchs.Dt[key]['Dt'] || !this.Cchs.Dt[key]['ScndLmt']) {
      return null;
    }

    const duration = ((new Date()).getTime() - this.Cchs.Dt[key]['Dt']) / 1000;

    return duration > this.Cchs.Dt[key]['ScndLmt'] ? null : this.Cchs.Dt[key]['Vl'];
  },
  // To Do: deprecated. alias.
  Get (key) {
    log('Get is deprecated. use get instead.', 'warn');
    this.get(key);
  },

  /* set the value.
    @ key name.
    @ value.
    @ second limit, default 300 seconds.
    < return true or false. */
  set (Ky, Vl, ScndLmt = 300) {
    if (typeof Ky !== 'string' || typeof ScndLmt !== 'number') { return false; }

    this.Cchs.Dt[Ky] = { Vl: Vl, Dt: (new Date()).getTime(), ScndLmt: ScndLmt };

    return true;
  },
  // To Do: deprecated. alias.
  Set (Ky, Vl, ScndLmt = 300) {
    log('Set is deprecated. use set instead.', 'warn');
    this.set(Ky, Vl, ScndLmt);
  },

  recycle () {
    const keys = Object.keys(this.Cchs.Dt);
    const nowTime = (new Date()).getTime();

    for (let i = 0; i < keys.length; i++) {
      const target = this.Cchs.Dt[keys[i]];

      if (!target || !target.Vl || !target.Dt || !target.ScndLmt) {
        delete this.Cchs.Dt[keys[i]];
        continue;
      }

      const duration = (nowTime - target.Dt) / 1000;

      if (duration > target.ScndLmt) { delete this.Cchs.Dt[keys[i]]; }
    }
  },
  // To Do: deprecated. alias.
  Recycle () {
    log('Recycle is deprecated. use recycle instead.', 'warn');
    this.recycle();
  },

  /*
    @ minute to trigger recycling. */
  recycleRoll (Mnt) {
    if (this.IsRolling) { return; }

    this.IsRolling = true;

    if (!Mnt || typeof Mnt !== 'number' || Mnt < 1) { Mnt = 1; }

    const MlScnd = Mnt * 60 * 1000; // millisecond.

    setInterval(this.Recycle.bind(this), MlScnd);
  },
  // To Do: deprecated. alias.
  RecycleRoll (Mnt) {
    log('RecycleRoll is deprecated. use recycleRoll instead.', 'warn');
    this.recycleRoll(Mnt);
  },
};

export default Cache;
