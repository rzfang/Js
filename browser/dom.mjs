let DOM;

(function Z_DOM_API () {
  'use strict';

  /* Extend some function to any Element to simulate JQuery DOM Traveler. */
  function Initialize () {
    if (!Array.prototype.indexOf) { // handle indexOf function of array.
      Array.prototype.indexOf = Data => {
        for (let i = 0; i < this.length; i++) {
          if (Data === this[i]) { return true; }
        }

        return false;
      };
    }

    //==== extend functions. ====

    NodeList.prototype.ToArray = function ToArray () {
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
    Array.prototype.Each = function Each (func) {
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
    Array.prototype.Some = function Some (func) {
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
    Element.prototype.Find = function Find (SltrStr) {
      if (typeof SltrStr !== 'string' || SltrStr.length === 0) { return []; }

      return this.querySelectorAll(SltrStr).ToArray();
    };

    /*
      < first child node. */
    Element.prototype.FirstChild = function FirstChild () {
      let Elt = this.firstChild;

      while (Elt && Elt.nodeType !== 1) { Elt = Elt.nextSibling; }

      return Elt;
    };

    /*
      < last child node. */
    Element.prototype.LastChild = function LastChild () {
      let Elt = this.lastChild;

      while (Elt && Elt.nodeType !== 1) { Elt = Elt.previousSibling; }

      return Elt;
    };

    /* find Above (parent) node of current node.
      @ Level to source up. optional, default: 1.
      < parent node, or document node as top level node. */
    Element.prototype.Above = function Above (Lv) {
      let PrtNd = this.parentNode;

      if (typeof Lv !== 'number' || Lv < 1) { Lv = 1; }

      Lv = Math.floor(Lv);

      for (let i = 1; (i < Lv) && (PrtNd !== document); i++) { PrtNd = PrtNd.parentNode; }

      return PrtNd;
    };

    /*
      @ filter Selector String. optional.
      < children nodes array, or []. */
    Element.prototype.Children = function Children (selectorString) {
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

    Element.prototype.Prev = function Prev () {
      let Nd = this.previousSibling;

      while (Nd && Nd.nodeType !== 1) { Nd = Nd.previousSibling; }

      return Nd;
    };

    Element.prototype.Next = function Next () {
      let Nd = this.nextSibling;

      while (Nd && Nd.nodeType !== 1) { Nd = Nd.nextSibling; }

      return Nd;
    };

    /*
      @ filter Selector String. optional.
      Need: Children(). */
    Element.prototype.Siblings = function Siblings (selectorString) {
      const elements = this.parentNode.Children(selectorString);

      for (let i = 0; i < elements.length; i++) {
        if (elements[i] === this) {
          elements.splice(i, 1);

          break;
        }
      }

      return elements;
    };

    Element.prototype.Append = function Append (Elt) {
      this.appendChild(Elt);

      return this;
    };

    Element.prototype.Prepend = function Prepend (Elt) {
      this.appendChild(Elt);
      this.insertBefore(Elt, this.firstChild);

      return this;
    };

    Element.prototype.Process = function Process (Fctn) {
      Fctn(this);

      return this;
    };

    Element.prototype.Index = function Index (selectorString) {
      const elements = this.Above().Children(selectorString);

      for (const i in elements) {
        if (elements[i] === this) {
          return i;
        }
      }

      return -1;
    };

    Element.prototype.Remove = function Remove () {
      this.Above().removeChild(this);

      return this;
    };

    Element.prototype.AddEvent = function AddEvent (EvtStr, Fctn) {
      if (!EvtStr || typeof EvtStr !== 'string' || !Fctn || typeof Fctn !== 'function') { return null; }

      this.addEventListener(EvtStr, Fctn);

      return this;
    };

    /* Not Yet. */
    Element.prototype.Attr = function Attr (_attr, _val) {
    };

    Event.prototype.Element = function Element () {
      return (this.srcElement && !this.target) ? this.srcElement : this.target;
    };
  }

  //==== define global Z object with useful functions. ====

  /* Extend some function to any Element to simulate JQuery Selector.
    @ Element object or Selector string.
    < element array, or null as empty; */
  function Find (es) {
    const type = typeof es;

    let elements = null; // 'elements' = Node Array.

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

  function NewNode (TgNm) {
    return document.createElement(TgNm);
  }

  /*
    @ target, the DOM object, can also be window object.
    @ event name, an existed event name string.
    @ new function which will be add into the event. */
  function EventListen (target, eventName, newFunction) {
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

    target[eventName] = Evt => {
      oldFunction(Evt);
      newFunction(Evt);
    };
  }

  DOM = {
    Find: Find,
    NewNode: NewNode,
    EventListen: EventListen,
    Initialize: Initialize,
  };

  if (typeof window !== 'undefined') {
    if (!window.Z || typeof window.Z !== 'object') { window.Z = { DOM: DOM }; }
    else { window.Z.DOM = DOM; }

    DOM.Initialize();
  }
})();

export default DOM;
