/* Honey Bee Boba — check-in logic.
 * Runs as an OVERLAY on the homepage (opened by the footer bee triple-click
 * via window.openCheckin) — there is no separate URL to stumble onto. */
(function () {
  "use strict";

  /* ---------- config ---------- */
  var PINS = { tifajan: "", you: "" };   // "" = no PIN for that side
  var ONLINE_WINDOW = 20000;          // ms since last heartbeat to count as "online"
  var BEAT_EVERY   = 8000;
  var TICK_EVERY   = 5000;

  /* ---------- preset sections (multi-select) ---------- */
  var SECTIONS = [
    { title: "What am I doing?", items: [
      { emoji: "💻", text: "Working" },
      { emoji: "😴", text: "Resting" },
      { emoji: "🛌", text: "Laying down" },
      { emoji: "🍵", text: "Drinking tea" },
      { emoji: "🚶", text: "Out & about" },
      { emoji: "🚗", text: "Driving" },
      { emoji: "🛒", text: "Running errands" },
      { emoji: "🏫", text: "Dropping off to school" },
      { emoji: "🌳", text: "At the park" },
      { emoji: "🪑", text: "Sitting outside" },
      { emoji: "🤪", text: "Being stupid" }
    ]},
    { title: "What am I feeling?", items: [
      { emoji: "😪", text: "Sleepy" },
      { emoji: "😊", text: "Happy" },
      { emoji: "😮‍💨", text: "Stressed" },
      { emoji: "🥺", text: "Missing you" },
      { emoji: "😵‍💫", text: "Gosh" }
    ]},
    { title: "Plans for today?", items: [
      { emoji: "🎉", text: "Going out" },
      { emoji: "👨‍👩‍👧", text: "Family" },
      { emoji: "🍽️", text: "Family eating" },
      { emoji: "🎟️", text: "An event" },
      { emoji: "🍳", text: "Cooking" },
      { emoji: "🧹", text: "Cleaning" },
      { emoji: "🏞️", text: "At the park" }
    ]},
    { title: "What am I missing most?", items: [
      { emoji: "👀", text: "Eyes" },
      { emoji: "👂", text: "Ears" },
      { emoji: "👃", text: "Nose" },
      { emoji: "🙂", text: "Face" },
      { emoji: "👄", text: "Lips" },
      { emoji: "😁", text: "Smile" },
      { emoji: "🗣️", text: "Voice" },
      { emoji: "🤗", text: "Your hugs" }
    ]},
    { title: "What do you want to do to me?", items: [
      { emoji: "🛏️", text: "Tuck you in" },
      { emoji: "🤗", text: "Hold you" },
      { emoji: "😘", text: "Kiss you" },
      { emoji: "🤲", text: "Hold your cheek" },
      { emoji: "🔥", text: "Hot for you" },
      { emoji: "💫", text: "All the above" }
    ]},
    { title: "A little note", comment: true, items: [
      { emoji: "💛", text: "Thinking of you" },
      { emoji: "💔", text: "My heart hurts" }
    ]}
  ];

  /* ---------- story timeline (parrot button) ---------- */
  var STORY = [
    { era: "Childhood", items: [
      { emoji: "🏠", label: "House" },
      { emoji: "☃️", label: "Snowman" },
      { emoji: "🌩️", label: "Storm" },
      { emoji: "🛌", label: "Blanket" },
      { emoji: "🐝", label: "Bee" },
      { emoji: "🦘", label: "Kangaroo" },
      { emoji: "😜", label: "Lalalalala" }
    ]},
    { era: "Past", items: [
      { emoji: "🎖️", label: "Badge" },
      { emoji: "🚗", label: "Car" },
      { emoji: "✋", label: "Hand" },
      { emoji: "⚡", label: "Lightning" },
      { emoji: "✈️", label: "Plane" },
      { emoji: "🤐", label: "Silent" },
      { emoji: "💬", label: "Texting" },
      { emoji: "♨️", label: "Hot water" },
      { emoji: "🏨", label: "Hotel" }
    ]},
    { era: "Present", items: [
      { emoji: "🍽️", label: "Dinner" },
      { emoji: "🚗", label: "Car" },
      { emoji: "⚖️", label: "" },
      { emoji: "🤝", label: "Holding hands" }
    ]},
    { era: "Future", items: [
      { emoji: "👵👴", label: "The bench" }
    ]}
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

  var ciToolbar = document.getElementById("ci-toolbar");
  var storyBtn  = document.getElementById("story-btn");
  var storyEl   = document.getElementById("story");
  var storyClose= document.getElementById("story-close");
  var timeline  = document.getElementById("timeline");

  var msgBtn    = document.getElementById("msg-btn");
  var messagesEl= document.getElementById("messages");
  var msgClose  = document.getElementById("msg-close");
  var msgList   = document.getElementById("msg-list");
  var msgForm   = document.getElementById("msg-form");
  var msgText   = document.getElementById("msg-text");
  var MSG_API   = "/api/messages";
  var msgTimer  = null;

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
  var noteText = "";

  // friendly short label per section (defined up here so the first render,
  // fired synchronously by Store.subscribe below, can use it)
  var CAT_LABEL = {
    "What am I doing?": "Doing",
    "What am I feeling?": "Feeling",
    "Plans for today?": "Plans",
    "What am I missing most?": "Missing",
    "What do you want to do to me?": "For you",
    "A little note": "Note"
  };
  function shortCat(c) { return CAT_LABEL[c] || c || ""; }
  function chipMini(it) {
    return '<span class="chip-mini"><span class="emoji">' + esc(it.emoji) + "</span>" + esc(it.text) + "</span>";
  }

  /* ---------- open / close the overlay ---------- */
  window.openCheckin = function () {
    overlay.hidden = false;
    document.body.classList.add("checkin-open");
    // Always ask who's checking in — never auto-assign a side, so a wrong
    // tap last time can't post as the wrong person.
    showGate();
  };
  function closeOverlay() {
    overlay.hidden = true;
    document.body.classList.remove("checkin-open");
    if (!composer.hidden) composer.hidden = true;
    if (!storyEl.hidden) storyEl.hidden = true;
    if (!histEl.hidden) histEl.hidden = true;
    if (messagesEl && !messagesEl.hidden) closeMessages();
  }

  function showGate() {
    gate.hidden = false;
    board.hidden = true;
    ciToolbar.hidden = true;
    // reset the picker every time so nothing is pre-chosen
    Array.prototype.forEach.call(whoRow.children, function (b) { b.classList.remove("sel"); });
    whoRow.__sel = null;
    pinRow.classList.remove("show");
    pinInput.value = "";
    gateErr.textContent = "";
    enterBtn.disabled = true;
  }

  /* ---------- gate ---------- */
  whoRow.addEventListener("click", function (e) {
    var btn = e.target.closest(".who-btn");
    if (!btn) return;
    var who = btn.getAttribute("data-who");
    Array.prototype.forEach.call(whoRow.children, function (b) { b.classList.remove("sel"); });
    btn.classList.add("sel");
    whoRow.__sel = who;
    gateErr.textContent = "";
    var needsPin = PINS[who] && PINS[who].length > 0;
    if (needsPin) {
      pinRow.classList.add("show");
      enterBtn.disabled = false;
      pinInput.value = ""; pinInput.focus();
    } else {
      // one deliberate tap picks the side (no separate confirm, no auto-assign)
      enter(who);
    }
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
    ciToolbar.hidden = false;

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

  // "not you? switch" — go back to the picker to change sides
  document.querySelectorAll("#checkin-overlay [data-switch]").forEach(function (b) {
    b.addEventListener("click", showGate);
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
    ["tifajan", "you"].forEach(function (side) {
      var s = normalize(state[side] || {});
      var bubble = document.querySelector('#checkin-overlay [data-status="' + side + '"]');
      var meta   = document.querySelector('#checkin-overlay [data-meta="' + side + '"]');
      var dot    = document.querySelector('#checkin-overlay [data-dot="' + side + '"]');
      if (!bubble) return;

      if (s.items.length || s.hearts > 0 || s.note) {
        bubble.innerHTML = statusHtml(s);
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
    return {
      items: items,
      hearts: (s.status && s.status.hearts) || 0,
      note: (s.status && s.status.note) || "",
      at: s.at || 0,
      beat: s.beat || 0
    };
  }

  // one renderer for both the board and the history — groups items by category
  // so it's clear what the other person is saying.
  function statusHtml(s) {
    var groups = {}, order = [];
    (s.items || []).forEach(function (it) {
      var cat = it.cat || "";
      if (!(cat in groups)) { groups[cat] = []; order.push(cat); }
      groups[cat].push(it);
    });
    var html = order.map(function (cat) {
      var chips = groups[cat].map(chipMini).join("");
      var label = cat ? '<span class="grp-label">' + esc(shortCat(cat)) + "</span>" : "";
      return '<div class="stat-group">' + label + '<span class="grp-chips">' + chips + "</span></div>";
    });
    if (s.hearts > 0) {
      html.push('<div class="stat-group"><span class="grp-label">Love</span><span class="grp-chips"><span class="chip-mini heart"><span class="emoji">❤️</span>×' + s.hearts + " I love you</span></span></div>");
    }
    if (s.note) {
      html.push('<div class="stat-group note-line"><span class="emoji">💬</span>' + esc(s.note) + "</div>");
    }
    return html.join("");
  }

  /* ---------- composer ---------- */
  function openComposer() {
    selectedKeys = {};
    hearts = 0;
    noteText = "";
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
        var item = { emoji: it.emoji, text: it.text, cat: sec.title };
        var chip = document.createElement("button");
        chip.className = "chip";
        chip.innerHTML = '<span class="emoji">' + esc(it.emoji) + "</span><span>" + esc(it.text) + "</span>";
        chip.addEventListener("click", function () {
          var k = keyOf(item);
          if (selectedKeys[k]) { delete selectedKeys[k]; chip.classList.remove("on"); }
          else { selectedKeys[k] = item; chip.classList.add("on"); }
          updatePreview();
        });
        grid.appendChild(chip);
      });
      wrap.appendChild(grid);

      // free-text comment for flagged sections (the little note)
      if (sec.comment) {
        var input = document.createElement("input");
        input.className = "note-input";
        input.id = "note-input";
        input.type = "text";
        input.maxLength = 140;
        input.placeholder = "Write a little note… (optional)";
        input.value = noteText;
        input.addEventListener("input", function () {
          noteText = input.value;
          updatePreview();
        });
        wrap.appendChild(input);
      }

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
    var note = noteText.trim();
    if (note) parts.push("💬 " + note);
    var has = parts.length > 0;
    composerPrev.textContent = has ? parts.join("  ·  ") : "Nothing selected yet";
    composerSend.disabled = !has;
  }

  composerSend.addEventListener("click", function () {
    Store.setStatus(me, { items: selectedItems(), hearts: hearts, note: noteText.trim() });
    closeComposer();
  });
  composerClose.addEventListener("click", closeComposer);

  /* ---------- story: photos + era timeline ---------- */
  var storyPhotos = document.getElementById("story-photos");
  var photoAdd    = document.getElementById("photo-add");
  var photoFile   = document.getElementById("photo-file");
  var photoStatus = document.getElementById("photo-status");
  var ciLight     = document.getElementById("ci-lightbox");
  var ciLightImg  = document.getElementById("ci-light-img");
  var ciLightClose= document.getElementById("ci-light-close");
  var ciLightInner= document.getElementById("ci-light-inner");

  var PHOTO_API = "/api/photos";
  function pStatus(t) { if (photoStatus) photoStatus.textContent = t || ""; }

  // Gallery = committed files in assets/photos/ (listed in photos-manifest.json,
  // built automatically) + photos uploaded through the app (stored in the DB).
  function loadPhotos() {
    if (!storyPhotos) return;
    Promise.all([
      fetch("assets/photos-manifest.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch(PHOTO_API, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : { photos: [] }; }).catch(function () { return { photos: [] }; })
    ]).then(function (res) {
      var files = (res[0] || []).map(function (u) { return { url: u }; });
      var db = ((res[1] && res[1].photos) || []).map(function (p) {
        return { url: PHOTO_API + "?id=" + encodeURIComponent(p.id), id: p.id };
      });
      var all = db.concat(files); // newest uploads first, then committed files
      if (!all.length) {
        storyPhotos.innerHTML = '<p class="photo-empty">No photos yet — tap “＋ Add photos”. Any file works, including iPhone HEIC.</p>';
        return;
      }
      storyPhotos.innerHTML = all.map(function (x) {
        var del = x.id
          ? '<button class="photo-del" data-del-ask="' + x.id + '" aria-label="Delete photo">✕</button>' +
            '<div class="photo-confirm" hidden><span>Delete this photo?</span>' +
            '<span class="pc-actions"><button class="pc-btn pc-yes" data-del-yes="' + x.id + '">Delete</button>' +
            '<button class="pc-btn pc-no" data-del-no="1">Keep</button></span></div>'
          : "";
        return '<div class="photo-item"><img loading="lazy" src="' + x.url + '" data-photo="' + x.url + '" alt="Our photo" />' + del + "</div>";
      }).join("");
    });
  }

  /* ---- upload (any file, incl. HEIC) ---- */
  if (photoAdd && photoFile) {
    photoAdd.addEventListener("click", function () { photoFile.click(); });
    photoFile.addEventListener("change", function () {
      var files = Array.prototype.slice.call(photoFile.files || []);
      photoFile.value = "";
      if (files.length) uploadFiles(files);
    });
  }

  function uploadFiles(files) {
    var done = 0, fail = 0;
    pStatus("Uploading…");
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        return processFile(f)
          .then(function (dataUrl) {
            return fetch(PHOTO_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: dataUrl })
            });
          })
          .then(function (r) { if (!r.ok) throw new Error("upload"); done++; })
          .catch(function () { fail++; });
      });
    });
    chain.then(function () {
      pStatus(fail ? (done + " added, " + fail + " failed") : "");
      loadPhotos();
      setTimeout(function () { pStatus(""); }, 4000);
    });
  }

  // convert HEIC -> JPEG (lazy-load the converter), then downscale to a
  // reasonably sized JPEG data URL
  function processFile(file) {
    var isHeic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    var step = isHeic
      ? ensureHeic().then(function (h) { return h({ blob: file, toType: "image/jpeg", quality: 0.9 }); })
                    .then(function (out) { return Array.isArray(out) ? out[0] : out; })
      : Promise.resolve(file);
    return step.then(downscale);
  }

  function ensureHeic() {
    if (window.heic2any) return Promise.resolve(window.heic2any);
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
      s.onload = function () { resolve(window.heic2any); };
      s.onerror = function () { reject(new Error("heic")); };
      document.head.appendChild(s);
    });
  }

  function downscale(blob) {
    var opt = { imageOrientation: "from-image" };
    var make = createImageBitmap(blob, opt).catch(function () { return createImageBitmap(blob); });
    return make.then(function (bmp) {
      var max = 1400, w = bmp.width, h = bmp.height;
      var scale = Math.min(1, max / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
      var c = document.createElement("canvas");
      c.width = cw; c.height = ch;
      c.getContext("2d").drawImage(bmp, 0, 0, cw, ch);
      return c.toDataURL("image/jpeg", 0.82);
    });
  }

  function buildStory() {
    timeline.innerHTML = "";
    STORY.forEach(function (group) {
      var head = document.createElement("li");
      head.className = "tl-era";
      head.innerHTML = "<span>" + esc(group.era) + "</span>";
      timeline.appendChild(head);
      group.items.forEach(function (node, i) {
        var li = document.createElement("li");
        li.className = "tl-item " + (i % 2 ? "right" : "left");
        li.innerHTML =
          '<span class="tl-dot"></span>' +
          '<div class="tl-card"><span class="tl-emoji">' + node.emoji + "</span>" +
          (node.label ? '<span class="tl-label">' + esc(node.label) + "</span>" : "") +
          "</div>";
        timeline.appendChild(li);
      });
    });
  }

  storyBtn.addEventListener("click", function () {
    loadPhotos();
    buildStory();
    storyEl.hidden = false;
  });
  storyClose.addEventListener("click", function () { storyEl.hidden = true; });

  // photo viewer + delete
  function openPhoto(src) { ciLightImg.src = src; ciLight.hidden = false; }
  function closePhoto() { ciLight.hidden = true; ciLightImg.src = ""; }
  if (storyPhotos) storyPhotos.addEventListener("click", function (e) {
    // step 1: tap ✕ -> reveal the confirm strip on that tile
    var ask = e.target.closest("[data-del-ask]");
    if (ask) {
      var pc = ask.parentNode.querySelector(".photo-confirm");
      if (pc) pc.hidden = false;
      return;
    }
    // step 2a: "Keep" -> hide the confirm strip
    var no = e.target.closest("[data-del-no]");
    if (no) {
      var pc2 = no.closest(".photo-confirm");
      if (pc2) pc2.hidden = true;
      return;
    }
    // step 2b: "Delete" -> actually delete (this is the secondary confirmation)
    var yes = e.target.closest("[data-del-yes]");
    if (yes) {
      var id = yes.getAttribute("data-del-yes");
      yes.textContent = "Deleting…";
      fetch(PHOTO_API + "?id=" + encodeURIComponent(id), { method: "DELETE" })
        .then(function () { loadPhotos(); });
      return;
    }
    var img = e.target.closest("img[data-photo]");
    if (img) openPhoto(img.getAttribute("data-photo"));
  });
  if (ciLightClose) ciLightClose.addEventListener("click", closePhoto);
  if (ciLightInner) ciLightInner.addEventListener("click", closePhoto);

  /* ---------- history ---------- */
  histBtn.addEventListener("click", function () {
    renderHistory(latest);
    histEl.hidden = false;
  });
  histClose.addEventListener("click", function () { histEl.hidden = true; });

  /* ---------- messages (WhatsApp-style chat) ---------- */
  function openMessages() {
    messagesEl.hidden = false;
    loadMessages(true);
    if (msgTimer) clearInterval(msgTimer);
    msgTimer = setInterval(function () { if (!messagesEl.hidden) loadMessages(false); }, 4000);
    setTimeout(function () { if (msgText) msgText.focus(); }, 100);
  }
  function closeMessages() {
    messagesEl.hidden = true;
    if (msgTimer) { clearInterval(msgTimer); msgTimer = null; }
  }

  function loadMessages(forceScroll) {
    fetch(MSG_API, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("api"); return r.json(); })
      .then(function (d) {
        var msgs = (d && d.messages) || [];
        var nearBottom = msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight < 60;
        msgList.innerHTML = msgs.length ? msgs.map(renderMsg).join("") : '<p class="msg-empty">No messages yet — say hi 👋</p>';
        if (forceScroll || nearBottom) msgList.scrollTop = msgList.scrollHeight;
      })
      .catch(function () {
        msgList.innerHTML = '<p class="msg-empty">Messages need the database connected.</p>';
      });
  }

  function renderMsg(m) {
    var mine = m.side === me;
    var avatar = m.side === "tifajan" ? "assets/elephant.svg" : "assets/bee.svg";
    var av = '<img class="msg-av" src="' + avatar + '" alt="" />';
    return '<div class="msg ' + (mine ? "mine" : "them") + '" data-side="' + m.side + '">' +
             (mine ? "" : av) +
             '<div class="bubble"><span class="msg-txt">' + esc(m.text) + "</span>" +
             '<span class="msg-time">' + stamp(m.at) + "</span></div>" +
             (mine ? av : "") +
           "</div>";
  }

  function sendMessage(text) {
    text = (text || "").trim();
    if (!text || !me) return;
    fetch(MSG_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side: me, text: text })
    })
      .then(function (r) { if (!r.ok) throw new Error("send"); return loadMessages(true); })
      .catch(function () {});
  }

  if (msgBtn) msgBtn.addEventListener("click", openMessages);
  if (msgClose) msgClose.addEventListener("click", closeMessages);
  if (msgForm) msgForm.addEventListener("submit", function (e) {
    e.preventDefault();
    sendMessage(msgText.value);
    msgText.value = "";
  });

  function renderHistory(state) {
    histList.innerHTML = "";
    var log = (state && state.log) || [];
    if (!log.length) {
      histList.innerHTML = '<li class="hist-empty">No check-ins yet.</li>';
      return;
    }
    log.forEach(function (e) {
      var s = normalize({ status: e.status });
      var avatar = e.side === "tifajan" ? "assets/elephant.svg" : "assets/bee.svg";
      var li = document.createElement("li");
      li.className = "hist-item";
      li.innerHTML =
        '<img class="hist-av" src="' + avatar + '" alt="" />' +
        '<div class="hist-main"><div class="hist-chips">' + statusHtml(s) + "</div>" +
        '<div class="hist-time">' + stamp(e.at) + "</div></div>";
      histList.appendChild(li);
    });
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || overlay.hidden) return;
    if (ciLight && !ciLight.hidden) closePhoto();
    else if (!composer.hidden) closeComposer();
    else if (!storyEl.hidden) storyEl.hidden = true;
    else if (!histEl.hidden) histEl.hidden = true;
    else if (!messagesEl.hidden) closeMessages();
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
