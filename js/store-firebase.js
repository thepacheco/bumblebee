/* Honey Bee Boba — OPTIONAL cross-device sync backend (Firebase Realtime DB).
 *
 * Drop-in replacement for js/store.js. Same three methods the app uses
 * (subscribe / setStatus / heartbeat) plus a shared history log and reliable
 * online/offline presence for two different users on two different devices.
 *
 * ── HOW TO TURN IT ON (about 5 minutes) ────────────────────────────────────
 * 1. https://console.firebase.google.com → "Add project" (any name).
 * 2. Build → Realtime Database → Create database → start in "test mode".
 * 3. Project settings (gear) → "Your apps" → Web (</>) → register app.
 *    Copy the `firebaseConfig` object it shows you.
 * 4. Paste that object over FIREBASE_CONFIG below.
 * 5. In index.html, right before <script src="js/store.js"></script>, add:
 *      <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
 *      <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
 *    then change   <script src="js/store.js"></script>
 *              to  <script src="js/store-firebase.js"></script>
 *    (keep js/checkin.js and js/main.js after it.)
 * Now you and the elephant sync in real time across phones.
 * ────────────────────────────────────────────────────────────────────────────
 */
window.Store = (function () {
  "use strict";

  // ▼▼▼ PASTE YOUR firebaseConfig HERE ▼▼▼
  var FIREBASE_CONFIG = {
    apiKey: "PASTE_ME",
    authDomain: "PASTE_ME.firebaseapp.com",
    databaseURL: "https://PASTE_ME-default-rtdb.firebaseio.com",
    projectId: "PASTE_ME",
    appId: "PASTE_ME"
  };
  // ▲▲▲ PASTE YOUR firebaseConfig HERE ▲▲▲

  var LOG_CAP = 100;
  var EMPTY = {
    nama: { status: null, at: 0, beat: 0 },
    you:  { status: null, at: 0, beat: 0 }
  };

  firebase.initializeApp(FIREBASE_CONFIG);
  var root = firebase.database().ref("checkin");
  var registered = {};

  function merge(v) {
    v = v || {};
    // history is stored as pushed children; flatten to a newest-first array
    var log = [];
    if (v.log) {
      log = Object.keys(v.log).map(function (k) { return v.log[k]; });
      log.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
      if (log.length > LOG_CAP) log = log.slice(0, LOG_CAP);
    }
    return {
      nama: Object.assign({}, EMPTY.nama, v.nama),
      you:  Object.assign({}, EMPTY.you,  v.you),
      log:  log
    };
  }

  return {
    subscribe: function (fn) {
      root.on("value", function (snap) { fn(merge(snap.val())); });
    },

    setStatus: function (side, status) {
      var now = Date.now();
      root.child(side).update({ status: status, at: now, beat: now });
      root.child("log").push({ side: side, status: status, at: now });
    },

    heartbeat: function (side) {
      var beatRef = root.child(side).child("beat");
      beatRef.set(Date.now());
      // when THIS user's tab closes, zero their heartbeat so the other
      // person immediately sees them go offline.
      if (!registered[side]) {
        registered[side] = true;
        beatRef.onDisconnect().set(0);
      }
    }
  };
})();
