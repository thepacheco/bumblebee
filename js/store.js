/* Honeydrop check-in — sync layer.
 *
 * This is the ONLY piece that talks to storage. The default backend uses
 * localStorage (+ the cross-tab `storage` event) so the page works with zero
 * setup and syncs between tabs/windows on the same browser.
 *
 * To make it sync across DEVICES (you <-> Tifa Jan on separate phones), replace the
 * three methods below — read(), write(), and the change subscription — with
 * calls to a shared backend (a tiny KV endpoint, Firebase, Supabase, etc.).
 * Nothing else in the app needs to change: it only ever calls
 *   Store.subscribe(fn), Store.setStatus(side, status), Store.heartbeat(side).
 *
 * State shape:
 *   { tifajan: { status:{emoji,text}|null, at:ms|0, beat:ms|0 },
 *     you:  { status:{emoji,text}|null, at:ms|0, beat:ms|0 } }
 */
window.Store = (function () {
  "use strict";

  var KEY = "honeydrop.checkin.v1";
  var listeners = [];

  var LOG_CAP = 100;

  var EMPTY = {
    tifajan: { status: null, at: 0, beat: 0 },
    you:  { status: null, at: 0, beat: 0 },
    log:  []   // history of check-ins, newest first
  };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return clone(EMPTY);
      var parsed = JSON.parse(raw);
      // shallow-merge to tolerate older/partial payloads
      return {
        tifajan: Object.assign({}, EMPTY.tifajan, parsed.tifajan),
        you:  Object.assign({}, EMPTY.you,  parsed.you),
        log:  Array.isArray(parsed.log) ? parsed.log : []
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
      var now = Date.now();
      s[side].status = status;      // {items:[...], hearts:N}
      s[side].at = now;             // timestamp of this check-in (replaces old)
      s[side].beat = now;           // checking in counts as being present
      // append to the history log (newest first, capped)
      s.log = s.log || [];
      s.log.unshift({ side: side, status: status, at: now });
      if (s.log.length > LOG_CAP) s.log = s.log.slice(0, LOG_CAP);
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
