import fs from 'fs';

import is from '../is.mjs';
import log from '../log.mjs';

export const cache = {
  caches: { files: {}, data: {} },
  isRolling: false,
  /*
    @ file path.
    @ callback (error, stream, time).
      @ error code.
      @ file context string.
      @ time stamp. */
  fileLoad (filePath, callback) {
    const caches = this.caches;

    if (caches.files[filePath]) {
      const { timeStamp = null, string = '' } = caches.files[filePath];

      if (!timeStamp || !string) { return callback(-1); }

      return callback(1, string, timeStamp);
    }

    fs.readFile(
      filePath,
      'utf8',
      function (error, filString) {
        if (error) { return callback(-2); }

        const timeStamp = Date.now();

        caches.files[filePath] = { timeStamp, string: filString };

        callback(0, filString, timeStamp);
      });
  },
  // To Do: deprecated. alias.
  FileLoad (filePath, callback) {
    log('FileLoad is deprecated. use fileLoad instead.', 'warn');
    this.fileLoad(filePath, callback);
  },

  /*
    @ key name.
    < true | false. */
  isFileCached (key) {
    const fileInfo = this.caches.files && this.caches.files[key] || null;

    if (!fileInfo || !fileInfo.timeStamp || !fileInfo.string) { return false; }

    return true;
  },
  // To Do: deprecated. alias.
  IsFileCached (key) {
    log('IsFileCached is deprecated. use isFileCached instead.', 'warn');
    this.isFileCached(key);
  },

  has (key) {
    return this.caches.data[key] ? true : false;
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
    if (
      !this.caches.data[key] ||
      !this.caches.data[key]['value'] ||
      !this.caches.data[key]['timeStamp'] ||
      !this.caches.data[key]['secondLimit']
    ) {
      return null;
    }

    const duration = (Date.now() - this.caches.data[key]['timeStamp']) / 1000;

    return duration > this.caches.data[key]['secondLimit'] ? null : this.caches.data[key]['value'];
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
  set (key, value, secondLimit = 300) {
    if (typeof key !== 'string' || typeof secondLimit !== 'number') { return false; }

    this.caches.data[key] = { value, timeStamp: Date.now(), secondLimit };

    return true;
  },
  // To Do: deprecated. alias.
  Set (key, value, secondLimit = 300) {
    log('Set is deprecated. use set instead.', 'warn');
    this.set(key, value, secondLimit);
  },

  recycle () {
    const keys = Object.keys(this.caches.data);
    const nowTime = Date.now();

    for (let i = 0; i < keys.length; i++) {
      const target = this.caches.data[keys[i]];

      if (!target || !target.value || !target.timeStamp || !target.secondLimit) {
        delete this.caches.data[keys[i]];
        continue;
      }

      const duration = (nowTime - target.timeStamp) / 1000;

      if (duration > target.secondLimit) { delete this.caches.data[keys[i]]; }
    }
  },
  // To Do: deprecated. alias.
  Recycle () {
    log('Recycle is deprecated. use recycle instead.', 'warn');
    this.recycle();
  },

  /*
    @ minute to trigger recycling. */
  recycleRoll (minutes = 1) {
    if (this.isRolling) { return; }

    this.isRolling = true;

    if (!is.Number(minutes)) { minutes = 1; }

    const milliseconds = minutes * 60 * 1000;

    setInterval(this.recycle.bind(this), milliseconds);
  },
  // To Do: deprecated. alias.
  RecycleRoll (minutes) {
    log('RecycleRoll is deprecated. use recycleRoll instead.', 'warn');
    this.recycleRoll(minutes);
  },
};

export default cache;
