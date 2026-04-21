export const is = {
  Boolean: function (obj) { return (typeof obj === 'boolean'); },
  Number: function (obj) { return (typeof obj === 'number'); },
  String: function (obj) { return (typeof obj === 'string'); },
  Function: function (obj) { return (typeof obj === 'function'); },
  Object: function (obj) { return (typeof obj === 'object'); },
  Undefined: function (obj) { return (typeof obj === 'undefined'); },
  Array: function (obj) { return Array.isArray(obj); },
  Date: function (obj) { return (obj instanceof Date); },
  RegExp: function (obj) { return (obj instanceof RegExp); },
  Promise: function (obj) {
    // return (typeof obj !== 'object' || !obj.hasOwnProperty('then') || !obj.hasOwnProperty('catch'));
    return (
      typeof obj !== 'object' ||
      !Object.prototype.hasOwnProperty.call(obj, 'then') ||
      !Object.prototype.hasOwnProperty.call(obj, 'catch')
    );
  },
  EMail: function (obj) {
    if (typeof obj !== 'string') { return false; }

    return (/^[\w.]+@.{2,16}\.[0-9a-z]{2,3}$/).test(obj);
  },
  jQuery: function (obj) { return (typeof jQuery !== 'undefined' && obj instanceof jQuery); },
  URL: function (obj) {
    if (typeof obj !== 'string') { return false; }

    return (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/).test(obj);
  }, // from here : https://stackoverflow.com/questions/1701898/how-to-detect-whether-a-string-is-in-url-format-using-javascript
  UUID: function (obj) {
    if (typeof obj !== 'string') { return false; }

    return (
      obj.match(/^[0-9a-fA-F]{32}$/) ||
      obj.match(/^[0-9a-fA-F]{13}$/) ||
      obj.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/) ||
      obj.match(/^[0-9a-fA-F]{22}$/)
    ) ? true : false;
  },

  ArrayEqual: function (a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) { false; }

    if (a === b) { return true; }

    if (a.length !== b.length) { return false; }

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) { return false; }
    }

    return true;
  },
  /* test if a string is a TimeStamp (YYYY-MM-DD HH:II:SS).
    < true | false. */
  TimeStamp: function (obj) {
    if (typeof obj !== 'string' || obj.length === 0) { return false; }

    return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(obj);
  },
};

export default is;
