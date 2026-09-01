/* Honeydrop check-in — sync layer.
 *
 * This is the ONLY piece that talks to storage. The default backend uses
 * localStorage (+ the cross-tab `storage` event) so the page works with zero
 * setup and syncs between tabs/windows on the same browser.
 *
 * To make it sync across DEVICES (you <-> Nama on separate phones), replace the
 * three methods below — read(), write(), and the change subscription — with
 * calls to a shared backend (a tiny KV endpoint, Firebase, Supabase, etc.).
 * Nothing else in the app needs to change: it only ever calls
 *   Store.subscribe(fn), Store.setStatus(side, status), Store.heartbeat(side).
 *
 * State shape:
 *   { nama: { status:{emoji,text}|null, at:ms|0, beat:ms|0 },
 *     you:  { status:{emoji,text}|null, at:ms|0, beat:ms|0 } }
 */
window.Store = (function () {
  "use strict";

  var KEY = "honeydrop.checkin.v1";
  var listeners = [];

  var EMPTY = {
    nama: { status: null, at: 0, beat: 0 },
    you:  { status: null, at: 0, beat: 0 }
  };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return clone(EMPTY);
      var parsed = JSON.parse(raw);
      // shallow-merge to tolerate older/partial payloads
      return {
        nama: Object.assign({}, EMPTY.nama, parsed.nama),
        you:  Object.assign({}, EMPTY.you,  parsed.you)
      };
    } catch (e) {
      return clone(EMPTY);
    }
  }

  function write(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    emit(state);
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function emit(state) { listeners.forEach(function (fn) { fn(state); }); }

  // cross-tab updates
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) emit(read());
  });

  return {
    subscribe: function (fn) {
      listeners.push(fn);
      fn(read()); // fire immediately with current state
    },

    setStatus: function (side, status) {
      var s = read();
      if (!s[side]) return;
      s[side].status = status;      // {emoji, text}
      s[side].at = Date.now();      // timestamp of this check-in (replaces old)
      s[side].beat = Date.now();    // checking in counts as being present
      write(s);
    },

    heartbeat: function (side) {
      var s = read();
      if (!s[side]) return;
      s[side].beat = Date.now();
      write(s);
    }
  };
})();
