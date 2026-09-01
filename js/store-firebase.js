/* Honey Bee Boba — OPTIONAL cross-device sync backend (Firebase Realtime DB).
 *
 * This is a drop-in replacement for js/store.js. It exposes the exact same
 * three methods the app uses (subscribe / setStatus / heartbeat), so switching
 * to real phone-to-phone sync is a two-line change in drinks.html — no other
 * code changes.
 *
 * ── HOW TO TURN IT ON (about 5 minutes) ────────────────────────────────────
 * 1. Go to https://console.firebase.google.com → "Add project" (any name).
 * 2. In the project: Build → Realtime Database → Create database
 *    → start in "test mode" (fine for two people; lock it down later).
 * 3. Project settings (gear icon) → "Your apps" → Web (</>) → register app.
 *    Copy the `firebaseConfig` object it shows you.
 * 4. Paste that object over the FIREBASE_CONFIG placeholder below.
 * 5. In drinks.html, replace the two script tags at the bottom:
 *        <script src="js/store.js"></script>
 *    with:
 *        <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
 *        <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
 *        <script src="js/store-firebase.js"></script>
 *    (keep <script src="js/checkin.js"></script> right after it.)
 * That's it — you and the elephant now sync in real time across devices.
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

  var EMPTY = {
    nama: { status: null, at: 0, beat: 0 },
    you:  { status: null, at: 0, beat: 0 }
  };

  firebase.initializeApp(FIREBASE_CONFIG);
  var ref = firebase.database().ref("checkin");

  function merge(v) {
    v = v || {};
    return {
      nama: Object.assign({}, EMPTY.nama, v.nama),
      you:  Object.assign({}, EMPTY.you,  v.you)
    };
  }

  return {
    subscribe: function (fn) {
      ref.on("value", function (snap) { fn(merge(snap.val())); });
    },
    setStatus: function (side, status) {
      ref.child(side).update({ status: status, at: Date.now(), beat: Date.now() });
    },
    heartbeat: function (side) {
      ref.child(side).child("beat").set(Date.now());
    }
  };
})();
