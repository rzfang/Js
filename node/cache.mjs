import fs from 'fs';

export const Cache = {
  Cchs: { Fls: {}, Dt: {} }, // caches, files, data.
  IsRolling: false,
  /*
    @ file path.
    @ callback (error code, result data). */
  FileLoad (FlPth, Clbck) {
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
  /*
    @ key name.
    < true | false. */
  IsFileCached (key) {
    const fileInfo = this.Cchs.Fls && this.Cchs.Fls[key] || null;

    if (!fileInfo || !fileInfo.Dt || !fileInfo.Str) { return false; }

    return true;
  },
  Has (Ky) {
    return this.Cchs.Dt[Ky] ? true : false;
  },
  /* get the value.
    @ key name.
    < cached data, or null. */
  Get (key) {
    if (!this.Cchs.Dt[key] || !this.Cchs.Dt[key]['Vl'] || !this.Cchs.Dt[key]['Dt'] || !this.Cchs.Dt[key]['ScndLmt']) {
      return null;
    }

    const duration = ((new Date()).getTime() - this.Cchs.Dt[key]['Dt']) / 1000;

    return duration > this.Cchs.Dt[key]['ScndLmt'] ? null : this.Cchs.Dt[key]['Vl'];
  },
  /* set the value.
    @ key name.
    @ value.
    @ second limit, default 300 seconds.
    < return true or false. */
  Set (Ky, Vl, ScndLmt = 300) {
    if (typeof Ky !== 'string' || typeof ScndLmt !== 'number') { return false; }

    this.Cchs.Dt[Ky] = { Vl: Vl, Dt: (new Date()).getTime(), ScndLmt: ScndLmt };

    return true;
  },
  Recycle () {
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
  /*
    @ minute to trigger recycling. */
  RecycleRoll (Mnt) {
    if (this.IsRolling) { return; }

    this.IsRolling = true;

    if (!Mnt || typeof Mnt !== 'number' || Mnt < 1) { Mnt = 1; }

    const MlScnd = Mnt * 60 * 1000; // millisecond.

    setInterval(this.Recycle.bind(this), MlScnd);
  },
};

export default Cache;
