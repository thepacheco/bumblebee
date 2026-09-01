/* Honey Bee Boba — sync layer backed by Vercel Postgres (via /api/state).
 *
 * Same three methods the app uses (subscribe / setStatus / heartbeat).
 * Polls the API so both phones stay in sync. If the API isn't reachable yet
 * (e.g. you haven't connected a Postgres store in the Vercel Storage tab), it
 * transparently FALLS BACK to browser localStorage so nothing breaks — and it
 * upgrades to the shared database automatically once the API responds.
 */
window.Store = (function () {
  "use strict";

  var API = "/api/state";
  var POLL = 3000;                       // ms between refreshes
  var LS_KEY = "honeydrop.checkin.v1";
  var LOG_CAP = 100;

  var listeners = [];
  var useApi = true;                     // flips to false on first failed call
  var EMPTY = {
    nama: { status: null, at: 0, beat: 0 },
    you:  { status: null, at: 0, beat: 0 },
    log:  []
  };
  var latest = clone(EMPTY);

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function emit() { listeners.forEach(function (fn) { fn(latest); }); }

  /* ---- localStorage fallback ---- */
  function lsRead() {
    try {
      var r = localStorage.getItem(LS_KEY);
      if (!r) return clone(EMPTY);
      var p = JSON.parse(r);
      return {
        nama: Object.assign({}, EMPTY.nama, p.nama),
        you:  Object.assign({}, EMPTY.you,  p.you),
        log:  Array.isArray(p.log) ? p.log : []
      };
    } catch (e) { return clone(EMPTY); }
  }
  function lsWrite(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {} }
  function lsSet(side, status) {
    var s = lsRead();
    if (!s[side]) return;
    var now = Date.now();
    s[side].status = status; s[side].at = now; s[side].beat = now;
    s.log = s.log || [];
    s.log.unshift({ side: side, status: status, at: now });
    if (s.log.length > LOG_CAP) s.log = s.log.slice(0, LOG_CAP);
    lsWrite(s); latest = s; emit();
  }
  window.addEventListener("storage", function (e) {
    if (!useApi && e.key === LS_KEY) { latest = lsRead(); emit(); }
  });

  /* ---- API ---- */
  function pull() {
    if (!useApi) return;
    fetch(API, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("api"); return r.json(); })
      .then(function (s) { latest = s; emit(); })
      .catch(function () {
        if (useApi) { useApi = false; latest = lsRead(); emit(); } // fall back
      });
  }
  setInterval(pull, POLL);

  return {
    subscribe: function (fn) {
      listeners.push(fn);
      latest = lsRead();   // show something immediately
      fn(latest);
      pull();              // then try the real database
    },

    setStatus: function (side, status) {
      if (useApi) {
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", side: side, status: status })
        })
          .then(function (r) { if (!r.ok) throw new Error("api"); return pull(); })
          .catch(function () { useApi = false; lsSet(side, status); });
      } else {
        lsSet(side, status);
      }
    },

    heartbeat: function (side) {
      if (useApi) {
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "heartbeat", side: side })
        }).catch(function () {});
      } else {
        var s = lsRead();
        if (s[side]) { s[side].beat = Date.now(); lsWrite(s); latest = s; emit(); }
      }
    }
  };
})();
