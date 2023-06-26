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
      let DA = []; // 'DA' = Data Array.

      for (let i = this.length; i--; DA.unshift(this[i]));

      return DA;
    };

    /* chainable.
      'Fctn(Obj, Idx)' = Function.
        @ each item of array.
        @ Index of item in array.
        @ Length of array.
        < false to end loop immediately.
      < array itself as OK, null as error. */
    Array.prototype.Each = function Each (Fctn) {
      if (typeof Fctn !== 'function') { return null; }

      for (let i = 0; i < this.length; i++) {
        let Rst = Fctn(this[i], i, this.length);

        if (typeof Rst === 'boolean' && !Rst) { break; }
      }

      return this;
    };

    /*
      'Fctn(Obj, Idx)' = Function.
        @ each item of array.
        @ Index of item in array.
        @ Length of array.
        < true to save item, or false to drop it.
      < new array the items saved, or [] otherwise. */
    Array.prototype.Some = function Some (Fctn) {
      let PckA = []; // 'PckA' = Picked item Array.

      for (let i = 0; i < this.length; i++) {
          let Rst = Fctn(this[i], i, this.length);

          if (typeof Rst === 'boolean' && Rst) { PckA.push(this[i]); }
      }

      return PckA;
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
    Element.prototype.Children = function Children (SltrStr) {
      let NdA = this.childNodes,
          RstNdA = [];

      for (let i = 0; i < NdA.length; i++) {
        if (NdA[i].nodeType === 1) { RstNdA.push(NdA[i]); }
      }

      if (SltrStr && typeof SltrStr === 'string') {
        let SltrNdA = [], // 'SltrNdA' = Selector matched Nodes array.
            OrgID = this.id; // 'OrgID' = Original ID.

        if (!this.id) {
          let Dt = new Date();

          this.id = 'TmpID' + Dt.getTime().toString();
        }

        SltrStr = '#' + this.id + ' > ' + SltrStr;
        NdA = document.querySelectorAll(SltrStr);

        for (let i = 0; i < NdA.length; i++)         {
          if (NdA[i].nodeType === 1) { SltrNdA.push(NdA[i]); }
        }

        if (SltrNdA.length === 0) { return []; }

        NdA = [];

        for (let i = 0; i < RstNdA.length; i++) {
          for (let j = 0; j < SltrNdA.length; j++) {
            if (RstNdA[i] === SltrNdA[j]) {
              NdA.push(RstNdA[i]);

              break;
            }
          }
        }

        if (OrgID !== this.id) { this.id = OrgID; }

        RstNdA = NdA;
      }

      return RstNdA;
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
    Element.prototype.Siblings = function Siblings (SltrStr) {
      let NdA = this.parentNode.Children(SltrStr);

      for (let i = 0; i < NdA.length; i++) {
        if (NdA[i] === this) {
          NdA.splice(i, 1);

          break;
        }
      }

      return NdA;
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

    Element.prototype.Index = function Index (SltrStr) {
      let NdA = this.Above().Children(SltrStr);

      for (let i in NdA) {
        if (NdA[i] === this) { return i; }
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
    Element.prototype.Attr = function Attr (Attr, Val) {
    };

    Event.prototype.Element = function Element () {
      return (this.srcElement && !this.target) ? this.srcElement : this.target;
    };
  }

  //==== define global Z object with useful functions. ====

  /* Extend some function to any Element to simulate JQuery Selector.
    @ Element object or Selector string.
    < node array, or null as empty; */
  function Find (ES) {
    let Tp = typeof ES,
        NdA = null; // 'NdA' = Node Array.

    if (Tp === 'object' && ES.tagName !== 'undefined' && ES.nodeType === 1) { NdA = [ES]; }
    else if (Tp === 'string') { NdA = document.querySelectorAll(ES).ToArray(); }
    else { NdA = null; }

    return NdA;
  }

  function NewNode (TgNm) {
    return document.createElement(TgNm);
  }

  /*
    @ target, the DOM object, can also be window object.
    @ event name, an existed event name string.
    @ new function which will be add into the event. */
  function EventListen (Tgt, EvtNm, NewFctn) {
    if (!Tgt || !EvtNm || typeof Tgt !== 'object' || typeof EvtNm !== 'string' || typeof NewFctn !== 'function')
    { return; }

    if (typeof Tgt[EvtNm] !== 'function') {
      Tgt[EvtNm] = NewFctn;

      return;
    }

    let OldFctn = Tgt[EvtNm];

    Tgt[EvtNm] = Evt => {
      OldFctn(Evt);
      NewFctn(Evt);
    };
  }

  DOM = {
    Find: Find,
    NewNode: NewNode,
    EventListen: EventListen,
    Initialize: Initialize
  };

  if (typeof window !== 'undefined') {
    if (!window.Z || typeof window.Z !== 'object') { window.Z = { DOM: DOM }; }
    else { window.Z.DOM = DOM; }

    DOM.Initialize();
  }
})();

export default DOM;
