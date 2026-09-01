/* Honey Bee Boba — check-in logic.
 * Runs as an OVERLAY on the homepage (opened by the footer bee triple-click
 * via window.openCheckin) — there is no separate URL to stumble onto. */
(function () {
  "use strict";

  /* ---------- config ---------- */
  var PINS = { nama: "", you: "" };   // "" = no PIN for that side
  var ONLINE_WINDOW = 20000;          // ms since last heartbeat to count as "online"
  var BEAT_EVERY   = 8000;
  var TICK_EVERY   = 5000;

  /* ---------- preset sections (multi-select) ---------- */
  var SECTIONS = [
    { title: "What am I doing?", items: [
      { emoji: "💻", text: "Working" },
      { emoji: "😴", text: "Resting" },
      { emoji: "🚶", text: "Out & about" },
      { emoji: "📚", text: "Studying" },
      { emoji: "🚗", text: "Driving" },
      { emoji: "📦", text: "Dropping off" },
      { emoji: "🤪", text: "Being stupid" }
    ]},
    { title: "What am I feeling?", items: [
      { emoji: "😪", text: "Sleepy" },
      { emoji: "😊", text: "Happy" },
      { emoji: "😮‍💨", text: "Stressed" },
      { emoji: "🥺", text: "Missing you" }
    ]},
    { title: "Plans for today?", items: [
      { emoji: "🎉", text: "Going out" },
      { emoji: "👨‍👩‍👧", text: "Family" },
      { emoji: "🎟️", text: "An event" },
      { emoji: "🍳", text: "Cooking" },
      { emoji: "🧹", text: "Cleaning" }
    ]},
    { title: "What do you want to do to me?", items: [
      { emoji: "🛏️", text: "Tuck you in" },
      { emoji: "🤗", text: "Hold you" },
      { emoji: "😘", text: "Kiss you" },
      { emoji: "🔥", text: "Hot for you" },
      { emoji: "💫", text: "All the above" }
    ]},
    { title: "A little note", items: [
      { emoji: "💛", text: "Thinking of you" },
      { emoji: "💔", text: "My heart hurts" }
    ]}
  ];

  /* ---------- story timeline (parrot button) ---------- */
  var STORY = [
    { emoji: "🏠", label: "House" },
    { emoji: "☃️", label: "Snowman" },
    { emoji: "🌩️", label: "Storm" },
    { emoji: "🛌", label: "Blanket" },
    { emoji: "🐝", label: "Bee" },
    { emoji: "🦘", label: "Kangaroo" },
    { emoji: "😜", label: "Lalalalala" },
    { emoji: "🎖️", label: "Badge" },
    { emoji: "🚗", label: "Car" },
    { emoji: "✋", label: "Hand" },
    { emoji: "⚡", label: "Lightning" },
    { emoji: "✈️", label: "Plane" },
    { emoji: "🤐", label: "Silent" },
    { emoji: "💬", label: "Texting" },
    { emoji: "♨️", label: "Hot water" },
    { emoji: "🍽️", label: "Dinner" },
    { emoji: "🚗", label: "Car" },
    { emoji: "⚖️", label: "" },
    { emoji: "👵👴", label: "The bench" }
  ];

  /* ---------- elements ---------- */
  var overlay   = document.getElementById("checkin-overlay");
  var gate      = document.getElementById("gate");
  var whoRow    = document.getElementById("who-row");
  var pinRow    = document.getElementById("pin-row");
  var pinInput  = document.getElementById("pin-input");
  var enterBtn  = document.getElementById("enter-btn");
  var gateErr   = document.getElementById("gate-err");
  var gateExit  = document.getElementById("gate-exit");
  var board     = document.getElementById("board");
  var leaveBtn  = document.getElementById("leave");

  var storyBtn  = document.getElementById("story-btn");
  var storyEl   = document.getElementById("story");
  var storyClose= document.getElementById("story-close");
  var timeline  = document.getElementById("timeline");

  var histBtn   = document.getElementById("hist-btn");
  var histEl    = document.getElementById("history");
  var histClose = document.getElementById("history-close");
  var histList  = document.getElementById("hist-list");

  var composer     = document.getElementById("composer");
  var composerBody = document.getElementById("composer-body");
  var composerClose= document.getElementById("composer-close");
  var composerSend = document.getElementById("composer-send");
  var composerPrev = document.getElementById("composer-preview");

  if (!overlay) return; // not on a page that has the overlay

  var me = null;
  var latest = null;
  var selectedKeys = {};
  var hearts = 0;

  /* ---------- open / close the overlay ---------- */
  window.openCheckin = function () {
    overlay.hidden = false;
    document.body.classList.add("checkin-open");
    var savedMe = null;
    try { savedMe = localStorage.getItem("honeydrop.me"); } catch (e) {}
    if (me || savedMe === "nama" || savedMe === "you") enter(me || savedMe);
    else showGate();
    if (me) Store.heartbeat(me);
  };
  function closeOverlay() {
    overlay.hidden = true;
    document.body.classList.remove("checkin-open");
    if (!composer.hidden) composer.hidden = true;
    if (!storyEl.hidden) storyEl.hidden = true;
    if (!histEl.hidden) histEl.hidden = true;
  }

  function showGate() { gate.hidden = false; board.hidden = true; storyBtn.hidden = true; histBtn.hidden = true; }

  /* ---------- gate ---------- */
  whoRow.addEventListener("click", function (e) {
    var btn = e.target.closest(".who-btn");
    if (!btn) return;
    whoRow.__sel = btn.getAttribute("data-who");
    Array.prototype.forEach.call(whoRow.children, function (b) { b.classList.remove("sel"); });
    btn.classList.add("sel");
    gateErr.textContent = "";
    var needsPin = PINS[whoRow.__sel] && PINS[whoRow.__sel].length > 0;
    pinRow.classList.toggle("show", needsPin);
    enterBtn.disabled = false;
    if (needsPin) { pinInput.value = ""; pinInput.focus(); }
  });

  enterBtn.addEventListener("click", tryEnter);
  pinInput.addEventListener("keydown", function (e) { if (e.key === "Enter") tryEnter(); });

  function tryEnter() {
    var who = whoRow.__sel;
    if (!who) return;
    var required = PINS[who] || "";
    if (required && pinInput.value !== required) {
      gateErr.textContent = "That PIN doesn't match.";
      pinInput.value = "";
      return;
    }
    try { localStorage.setItem("honeydrop.me", who); } catch (e) {}
    enter(who);
  }

  gateExit.addEventListener("click", closeOverlay);
  leaveBtn.addEventListener("click", closeOverlay);

  function enter(who) {
    me = who;
    gate.hidden = true;
    board.hidden = false;
    storyBtn.hidden = false;
    histBtn.hidden = false;

    document.querySelectorAll("#checkin-overlay .pane").forEach(function (p) {
      p.classList.toggle("is-me", p.getAttribute("data-side") === me);
    });
    document.querySelectorAll("#checkin-overlay [data-actions]").forEach(function (a) {
      a.hidden = a.getAttribute("data-actions") !== me;
    });

    if (latest) render(latest);
    Store.heartbeat(me);
  }

  /* ---------- wiring that runs once ---------- */
  document.querySelectorAll("#checkin-overlay [data-open]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.getAttribute("data-open") === me) openComposer();
    });
  });

  Store.subscribe(render);
  setInterval(function () { if (me && !overlay.hidden) Store.heartbeat(me); }, BEAT_EVERY);
  setInterval(function () { if (latest && !overlay.hidden) render(latest); }, TICK_EVERY);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && me && !overlay.hidden) Store.heartbeat(me);
  });

  /* ---------- render board ---------- */
  function render(state) {
    latest = state;
    ["nama", "you"].forEach(function (side) {
      var s = normalize(state[side] || {});
      var bubble = document.querySelector('#checkin-overlay [data-status="' + side + '"]');
      var meta   = document.querySelector('#checkin-overlay [data-meta="' + side + '"]');
      var dot    = document.querySelector('#checkin-overlay [data-dot="' + side + '"]');
      if (!bubble) return;

      if (s.items.length || s.hearts > 0) {
        bubble.innerHTML = renderChips(s.items, s.hearts);
        meta.textContent = "Last check-in · " + stamp(s.at);
      } else {
        bubble.textContent = "—";
        meta.textContent = "No check-in yet";
      }
      var online = s.beat && (Date.now() - s.beat < ONLINE_WINDOW);
      dot.classList.toggle("online", !!online);
      dot.title = online ? "Active now" : "Away";
    });
  }

  function normalize(s) {
    var items = [];
    if (s.status && s.status.items) items = s.status.items;
    else if (s.status && s.status.text) items = [{ emoji: s.status.emoji || "", text: s.status.text }];
    return { items: items, hearts: (s.status && s.status.hearts) || 0, at: s.at || 0, beat: s.beat || 0 };
  }

  function renderChips(items, heartCount) {
    var chips = (items || []).map(function (it) {
      return '<span class="chip-mini"><span class="emoji">' + esc(it.emoji) + "</span>" + esc(it.text) + "</span>";
    });
    if (heartCount > 0) {
      chips.push('<span class="chip-mini heart"><span class="emoji">❤️</span>×' + heartCount + " I love you</span>");
    }
    return chips.join("");
  }

  /* ---------- composer ---------- */
  function openComposer() {
    selectedKeys = {};
    hearts = 0;
    buildComposer();
    updatePreview();
    composer.hidden = false;
  }
  function closeComposer() { composer.hidden = true; }
  function keyOf(it) { return it.emoji + "|" + it.text; }

  function buildComposer() {
    composerBody.innerHTML = "";
    SECTIONS.forEach(function (sec) {
      var wrap = document.createElement("section");
      wrap.className = "composer-section";
      var h = document.createElement("h3");
      h.textContent = sec.title;
      wrap.appendChild(h);

      var grid = document.createElement("div");
      grid.className = "chip-grid";
      sec.items.forEach(function (it) {
        var chip = document.createElement("button");
        chip.className = "chip";
        chip.innerHTML = '<span class="emoji">' + esc(it.emoji) + "</span><span>" + esc(it.text) + "</span>";
        chip.addEventListener("click", function () {
          var k = keyOf(it);
          if (selectedKeys[k]) { delete selectedKeys[k]; chip.classList.remove("on"); }
          else { selectedKeys[k] = it; chip.classList.add("on"); }
          updatePreview();
        });
        grid.appendChild(chip);
      });
      wrap.appendChild(grid);
      composerBody.appendChild(wrap);
    });

    // hearts counter — tap ANYWHERE in the box to add one
    var hs = document.createElement("section");
    hs.className = "composer-section";
    hs.innerHTML =
      '<h3>How many hearts?</h3>' +
      '<div class="hearts-row" id="hearts-row" role="button" tabindex="0" aria-label="Add a heart">' +
        '<span class="heart-face" id="heart-face">❤️</span>' +
        '<div class="hearts-count"><b id="hearts-n">0</b> hearts <span>I love you</span></div>' +
        '<button class="heart-reset" id="heart-reset">reset</button>' +
      '</div>';
    composerBody.appendChild(hs);

    var row = document.getElementById("hearts-row");
    function addHeart() {
      hearts = Math.min(hearts + 1, 999);
      document.getElementById("hearts-n").textContent = hearts;
      bump(document.getElementById("heart-face"));
      updatePreview();
    }
    row.addEventListener("click", function (e) {
      if (e.target.id === "heart-reset") return; // reset handled below
      addHeart();
    });
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addHeart(); }
    });
    document.getElementById("heart-reset").addEventListener("click", function (e) {
      e.stopPropagation();
      hearts = 0;
      document.getElementById("hearts-n").textContent = 0;
      updatePreview();
    });
  }

  function selectedItems() {
    return Object.keys(selectedKeys).map(function (k) { return selectedKeys[k]; });
  }

  function updatePreview() {
    var items = selectedItems();
    var parts = items.map(function (it) { return it.emoji + " " + it.text; });
    if (hearts > 0) parts.push("❤️×" + hearts + " I love you");
    var has = parts.length > 0;
    composerPrev.textContent = has ? parts.join("  ·  ") : "Nothing selected yet";
    composerSend.disabled = !has;
  }

  composerSend.addEventListener("click", function () {
    Store.setStatus(me, { items: selectedItems(), hearts: hearts });
    closeComposer();
  });
  composerClose.addEventListener("click", closeComposer);

  /* ---------- story ---------- */
  function buildStory() {
    STORY.forEach(function (node, i) {
      var li = document.createElement("li");
      li.className = "tl-item " + (i % 2 ? "right" : "left");
      li.innerHTML =
        '<span class="tl-dot"></span>' +
        '<div class="tl-card"><span class="tl-emoji">' + node.emoji + "</span>" +
        (node.label ? '<span class="tl-label">' + esc(node.label) + "</span>" : "") +
        "</div>";
      timeline.appendChild(li);
    });
  }
  storyBtn.addEventListener("click", function () {
    if (!timeline.childNodes.length) buildStory();
    storyEl.hidden = false;
  });
  storyClose.addEventListener("click", function () { storyEl.hidden = true; });

  /* ---------- history ---------- */
  histBtn.addEventListener("click", function () {
    renderHistory(latest);
    histEl.hidden = false;
  });
  histClose.addEventListener("click", function () { histEl.hidden = true; });

  function renderHistory(state) {
    histList.innerHTML = "";
    var log = (state && state.log) || [];
    if (!log.length) {
      histList.innerHTML = '<li class="hist-empty">No check-ins yet.</li>';
      return;
    }
    log.forEach(function (e) {
      var s = normalize({ status: e.status });
      var avatar = e.side === "nama" ? "assets/elephant.svg" : "assets/bee.svg";
      var li = document.createElement("li");
      li.className = "hist-item";
      li.innerHTML =
        '<img class="hist-av" src="' + avatar + '" alt="" />' +
        '<div class="hist-main"><div class="hist-chips">' + renderChips(s.items, s.hearts) + "</div>" +
        '<div class="hist-time">' + stamp(e.at) + "</div></div>";
      histList.appendChild(li);
    });
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || overlay.hidden) return;
    if (!composer.hidden) closeComposer();
    else if (!storyEl.hidden) storyEl.hidden = true;
    else if (!histEl.hidden) histEl.hidden = true;
    else closeOverlay();
  });

  /* ---------- helpers ---------- */
  function bump(el) { if (!el) return; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // "Mon, Sep 1 · 3:14 PM" — date AND time
  function stamp(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    var date = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    var time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return date + " · " + time;
  }
})();
