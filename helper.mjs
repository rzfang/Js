import debounce from 'lodash.debounce';
import merge from 'lodash.merge';
import throttle from 'lodash.throttle';

export const array = {
  unique: function unique (arr) {
    return [ ...new Set(arr) ];
  },
};

export const object = {
  clone: function clone (obj) {
    return structuredClone(obj);
  },
  merge,
};

export default {
  array,
  debounce,
  object,
  throttle,
};
