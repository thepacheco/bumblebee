/* Honeydrop check-in — app logic (no free text, presets only). */
(function () {
  "use strict";

  /* ---------- config ---------- */
  // Optional PINs. Leave a value "" to skip the PIN for that person.
  var PINS = { nama: "", you: "" };
  var ONLINE_WINDOW = 20000; // ms since last heartbeat to count as "online"
  var BEAT_EVERY   = 8000;   // send a heartbeat this often while the page is open
  var TICK_EVERY   = 5000;   // re-render presence/relative-time this often

  /* ---------- presets ---------- */
  // A node is either a category ({label, children:[...]}) or a leaf ({emoji,text}).
  var PRESETS = [
    { emoji: "🎐", label: "What am I doing?", children: [
      { emoji: "💻", text: "Working" },
      { emoji: "😴", text: "Resting" },
      { emoji: "🚶", text: "Out & about" },
      { emoji: "📚", text: "Studying" },
      { emoji: "🚗", text: "Driving" }
    ]},
    { emoji: "💭", label: "How am I feeling?", children: [
      { emoji: "😪", text: "Sleepy" },
      { emoji: "😊", text: "Happy" },
      { emoji: "😮‍💨", text: "Stressed" },
      { emoji: "🥺", text: "Missing you" }
    ]},
    { emoji: "💛", text: "Thinking of you" },
    { emoji: "💗", text: "My heart hurts" }
  ];

  /* ---------- elements ---------- */
  var gate      = document.getElementById("gate");
  var whoRow    = document.getElementById("who-row");
  var pinRow    = document.getElementById("pin-row");
  var pinInput  = document.getElementById("pin-input");
  var enterBtn  = document.getElementById("enter-btn");
  var gateErr   = document.getElementById("gate-err");
  var gateExit  = document.getElementById("gate-exit");
  var board     = document.getElementById("board");
  var leaveBtn  = document.getElementById("leave");

  var backdrop  = document.getElementById("sheet-backdrop");
  var sheet     = document.getElementById("sheet");
  var sheetBack = document.getElementById("sheet-back");
  var sheetTitle= document.getElementById("sheet-title");
  var presetList= document.getElementById("preset-list");

  var me = null;          // "nama" | "you"
  var selected = null;    // gate selection
  var latest = null;      // last state snapshot

  /* ---------- gate ---------- */
  var savedMe = null;
  try { savedMe = localStorage.getItem("honeydrop.me"); } catch (e) {}
  if (savedMe === "nama" || savedMe === "you") {
    // returning user — skip straight in
    enter(savedMe);
  }

  whoRow.addEventListener("click", function (e) {
    var btn = e.target.closest(".who-btn");
    if (!btn) return;
    selected = btn.getAttribute("data-who");
    Array.prototype.forEach.call(whoRow.children, function (b) { b.classList.remove("sel"); });
    btn.classList.add("sel");
    gateErr.textContent = "";

    var needsPin = PINS[selected] && PINS[selected].length > 0;
    pinRow.classList.toggle("show", needsPin);
    enterBtn.disabled = false;
    if (needsPin) { pinInput.value = ""; pinInput.focus(); }
  });

  enterBtn.addEventListener("click", tryEnter);
  pinInput.addEventListener("keydown", function (e) { if (e.key === "Enter") tryEnter(); });

  function tryEnter() {
    if (!selected) return;
    var required = PINS[selected] || "";
    if (required && pinInput.value !== required) {
      gateErr.textContent = "That PIN doesn't match.";
      pinInput.value = "";
      return;
    }
    try { localStorage.setItem("honeydrop.me", selected); } catch (e) {}
    enter(selected);
  }

  gateExit.addEventListener("click", function () { window.location.href = "index.html"; });
  leaveBtn.addEventListener("click", function () { window.location.href = "index.html"; });

  function enter(who) {
    me = who;
    gate.hidden = true;
    board.hidden = false;

    // mark my pane, reveal my check-in button
    document.querySelectorAll(".pane").forEach(function (p) {
      p.classList.toggle("is-me", p.getAttribute("data-side") === me);
    });
    var myActions = document.querySelector('[data-actions="' + me + '"]');
    if (myActions) myActions.hidden = false;

    // wire the check-in button(s)
    document.querySelectorAll("[data-open]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.getAttribute("data-open") === me) openSheet();
      });
    });

    // start syncing + presence
    Store.subscribe(render);
    Store.heartbeat(me);
    setInterval(function () { if (me) Store.heartbeat(me); }, BEAT_EVERY);
    setInterval(function () { if (latest) render(latest); }, TICK_EVERY);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && me) Store.heartbeat(me);
    });
  }

  /* ---------- render ---------- */
  function render(state) {
    latest = state;
    ["nama", "you"].forEach(function (side) {
      var s = state[side] || {};
      var bubble = document.querySelector('[data-status="' + side + '"]');
      var meta   = document.querySelector('[data-meta="' + side + '"]');
      var dot    = document.querySelector('[data-dot="' + side + '"]');

      if (s.status && s.status.text) {
        bubble.innerHTML = '<span class="emoji">' + esc(s.status.emoji || "") + "</span>" + esc(s.status.text);
        meta.textContent = "Last check-in · " + relTime(s.at);
      } else {
        bubble.textContent = "—";
        meta.textContent = "No check-in yet";
      }

      var online = s.beat && (Date.now() - s.beat < ONLINE_WINDOW);
      dot.classList.toggle("online", !!online);
      dot.title = online ? "Active now" : "Away";
    });
  }

  /* ---------- preset sheet ---------- */
  function openSheet() { renderSheet(PRESETS, "How's it going?", false); showSheet(true); }
  function closeSheet() { showSheet(false); }

  function showSheet(on) {
    backdrop.classList.toggle("open", on);
    sheet.classList.toggle("open", on);
  }

  function renderSheet(nodes, title, showBack) {
    sheetTitle.textContent = title;
    sheetBack.hidden = !showBack;
    presetList.innerHTML = "";
    nodes.forEach(function (node) {
      var btn = document.createElement("button");
      btn.className = "preset";
      var isLeaf = !node.children;
      var label = isLeaf ? node.text : node.label;
      btn.innerHTML =
        '<span class="emoji">' + esc(node.emoji || "") + "</span>" +
        "<span>" + esc(label) + "</span>" +
        (isLeaf ? "" : '<span class="chev">›</span>');
      btn.addEventListener("click", function () {
        if (isLeaf) {
          Store.setStatus(me, { emoji: node.emoji || "", text: node.text });
          closeSheet();
        } else {
          renderSheet(node.children, node.label, true);
        }
      });
      presetList.appendChild(btn);
    });
  }

  sheetBack.addEventListener("click", function () { renderSheet(PRESETS, "How's it going?", false); });
  backdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function relTime(ts) {
    if (!ts) return "—";
    var diff = Date.now() - ts;
    if (diff < 45000) return "just now";
    var m = Math.round(diff / 60000);
    if (m < 60) return m + "m ago";
    var h = Math.round(diff / 3600000);
    if (h < 24) return h + "h ago";
    var d = new Date(ts);
    return d.toLocaleDateString([], { weekday: "short" }) + " " +
           d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
})();
