let dom;

(function zDomApi () {
  'use strict';

  /* Extend some function to any Element to simulate JQuery DOM Traveler. */
  function initialize () {
    if (!Array.prototype.indexOf) { // handle indexOf function of array.
      Array.prototype.indexOf = data => {
        for (let i = 0; i < this.length; i++) {
          if (data === this[i]) { return true; }
        }

        return false;
      };
    }

    //==== extend functions. ====

    NodeList.prototype.toArray = function toArray () {
      const datas = [];

      for (let i = this.length; i--; datas.unshift(this[i]));

      return datas;
    };

    /* chainable.
      'func(obj, index)' = Function.
        @ each item of array.
        @ Index of item in array.
        @ Length of array.
        < false to end loop immediately.
      < array itself as OK, null as error. */
    Array.prototype.each = function each (func) {
      if (typeof func !== 'function') {
        return null;
      }

      for (let i = 0; i < this.length; i++) {
        const result = func(this[i], i, this.length);

        if (typeof result === 'boolean' && !result) {
          break;
        }
      }

      return this;
    };

    /*
      'func(obj, index)' = Function.
        @ each item of array.
        @ Index of item in array.
        @ Length of array.
        < true to save item, or false to drop it.
      < new array the items saved, or [] otherwise. */
    Array.prototype.some = function some (func) {
      const items = []; // picked item Array.

      for (let i = 0; i < this.length; i++) {
        const result = func(this[i], i, this.length);

        if (typeof result === 'boolean' && result) {
          items.push(this[i]);
        }
      }

      return items;
    };

    /*
      @ Selector String.
      < nodes array, or []. */
    Element.prototype.find = function find (selectorString) {
      if (typeof selectorString !== 'string' || selectorString.length === 0) { return []; }

      return this.querySelectorAll(selectorString).ToArray();
    };

    /*
      < first child node. */
    Element.prototype.firstChild = function firstChild () {
      let element = this.firstChild;

      while (element && element.nodeType !== 1) { element = element.nextSibling; }

      return element;
    };

    /*
      < last child node. */
    Element.prototype.lastChild = function lastChild () {
      let element = this.lastChild;

      while (element && element.nodeType !== 1) { element = element.previousSibling; }

      return element;
    };

    /* find Above (parent) node of current node.
      @ Level to source up. optional, default: 1.
      < parent node, or document node as top level node. */
    Element.prototype.above = function above (level) {
      let parentNode = this.parentNode;

      if (typeof level !== 'number' || level < 1) { level = 1; }

      level = Math.floor(level);

      for (let i = 1; (i < level) && (parentNode !== document); i++) { parentNode = parentNode.parentNode; }

      return parentNode;
    };

    /*
      @ filter Selector String. optional.
      < children nodes array, or []. */
    Element.prototype.children = function children (selectorString) {
      let elements = this.childNodes;
      let resultElements = [];

      for (let i = 0; i < elements.length; i++) {
        if (elements[i].nodeType === 1) { resultElements.push(elements[i]); }
      }

      if (selectorString && typeof selectorString === 'string') {
        const matchedElements = []; // selector matched elements.
        const originalId = this.id;

        if (!this.id) {
          const date = new Date();

          this.id = 'TmpID' + date.getTime().toString();
        }

        selectorString = '#' + this.id + ' > ' + selectorString;
        elements = document.querySelectorAll(selectorString);

        for (let i = 0; i < elements.length; i++)         {
          if (elements[i].nodeType === 1) { matchedElements.push(elements[i]); }
        }

        if (matchedElements.length === 0) { return []; }

        elements = [];

        for (let i = 0; i < resultElements.length; i++) {
          for (let j = 0; j < matchedElements.length; j++) {
            if (resultElements[i] === matchedElements[j]) {
              elements.push(resultElements[i]);

              break;
            }
          }
        }

        if (originalId !== this.id) { this.id = originalId; }

        resultElements = elements;
      }

      return resultElements;
    };

    Element.prototype.prev = function prev () {
      let node = this.previousSibling;

      while (node && node.nodeType !== 1) { node = node.previousSibling; }

      return node;
    };

    Element.prototype.next = function next () {
      let node = this.nextSibling;

      while (node && node.nodeType !== 1) { node = node.nextSibling; }

      return node;
    };

    /*
      @ filter Selector String. optional.
      Need: Children(). */
    Element.prototype.siblings = function siblings (selectorString) {
      const elements = this.parentNode.Children(selectorString);

      for (let i = 0; i < elements.length; i++) {
        if (elements[i] === this) {
          elements.splice(i, 1);

          break;
        }
      }

      return elements;
    };

    Element.prototype.append = function append (element) {
      this.appendChild(element);

      return this;
    };

    Element.prototype.prepend = function prepend (element) {
      this.appendChild(element);
      this.insertBefore(element, this.firstChild);

      return this;
    };

    Element.prototype.process = function process (func) {
      func(this);

      return this;
    };

    Element.prototype.index = function index (selectorString) {
      const elements = this.Above().Children(selectorString);

      for (const i in elements) {
        if (elements[i] === this) {
          return i;
        }
      }

      return -1;
    };

    Element.prototype.remove = function remove () {
      this.Above().removeChild(this);

      return this;
    };

    Element.prototype.addEvent = function addEvent (eventString, func) {
      if (!eventString || typeof eventString !== 'string' || !func || typeof func !== 'function') { return null; }

      this.addEventListener(eventString, func);

      return this;
    };

    /* Not Yet. */
    // Element.prototype.attr = function attr (_attr, _val) {
    // };

    Event.prototype.element = function element () {
      return (this.srcElement && !this.target) ? this.srcElement : this.target;
    };
  }

  //==== define global Z object with useful functions. ====

  /* Extend some function to any Element to simulate JQuery Selector.
    @ Element object or Selector string.
    < element array, or null as empty; */
  function find (es) {
    const type = typeof es;

    let elements; // 'elements' = Node Array.

    if (type === 'object' && es.tagName !== 'undefined' && es.nodeType === 1) {
      elements = [ es ];
    }
    else if (type === 'string') {
      elements = document.querySelectorAll(es).ToArray();
    }
    else {
      elements = null;
    }

    return elements;
  }

  function newNode (tagName) {
    return document.createElement(tagName);
  }

  /*
    @ target, the DOM object, can also be window object.
    @ event name, an existed event name string.
    @ new function which will be add into the event. */
  function eventListen (target, eventName, newFunction) {
    if (
      !target ||
      !eventName ||
      typeof target !== 'object' ||
      typeof eventName !== 'string' ||
      typeof newFunction !== 'function'
    ) {
      return;
    }

    if (typeof target[eventName] !== 'function') {
      target[eventName] = newFunction;

      return;
    }

    const oldFunction = target[eventName];

    target[eventName] = event => {
      oldFunction(event);
      newFunction(event);
    };
  }

  dom = {
    eventListen,
    find,
    initialize,
    newNode,
  };

  if (typeof window !== 'undefined') {
    if (!window.Z || typeof window.Z !== 'object') { window.Z = { dom }; }
    else { window.Z.dom = dom; }

    dom.initialize();
  }
})();

export default dom;
