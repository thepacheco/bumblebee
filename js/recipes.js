/* Honey Bee Helper — honey home-remedy recipes: data + cards + filter +
 * detail modal + image lightbox. Photos are real Creative-Commons images
 * pulled live by keyword (LoremFlickr); set any item's keys/lock to change one.
 *
 * NOTE: general wellness / traditional home-remedy info — NOT medical advice.
 */
(function () {
  "use strict";

  function flickr(w, h, keys, lock) {
    return "https://loremflickr.com/" + w + "/" + h + "/" + keys + "?lock=" + lock;
  }

  var DISCLAIMER = "Traditional home-remedy info for general wellness — not medical advice. See a doctor for severe, worsening, or lasting symptoms. Never give honey to a child under 1 year old.";

  // ---- 40 honey remedies ----
  var REMEDIES = [
    // Throat & Cough
    { id: "lemon-soother", cat: "Throat & Cough", title: "Honey & Lemon Soother", helps: "Calms a scratchy, sore throat.", time: "5 min", keys: "honey,lemon", lock: 1,
      ingredients: ["1 tbsp raw honey", "Juice of 1/2 lemon", "1 cup warm (not boiling) water"],
      steps: ["Warm the water — hot enough to sip, not boiling (boiling harms honey's enzymes).", "Stir in the honey until dissolved.", "Add the lemon juice and sip slowly."] },
    { id: "ginger-tea", cat: "Throat & Cough", title: "Honey Ginger Tea", helps: "Eases coughing and throat irritation.", time: "12 min", keys: "ginger,tea", lock: 2,
      ingredients: ["1 tbsp honey", "3–4 thin slices fresh ginger", "1.5 cups water"],
      steps: ["Simmer the ginger in the water for 8–10 minutes.", "Strain into a mug and let it cool slightly.", "Stir in the honey and sip."] },
    { id: "thyme-cough-syrup", cat: "Throat & Cough", title: "Honey Thyme Cough Syrup", helps: "A homemade syrup for a nagging cough.", time: "15 min", keys: "thyme,herbs", lock: 3,
      ingredients: ["1/2 cup honey", "2 tbsp fresh thyme (or 1 tbsp dried)", "1/2 cup water"],
      steps: ["Simmer the thyme in the water 10 minutes, then remove from heat.", "Cover and steep 5 more minutes; strain out the thyme.", "Stir the warm thyme liquid into the honey.", "Take 1 tsp as needed; keep refrigerated up to 1 week."] },
    { id: "golden-milk", cat: "Throat & Cough", title: "Golden Honey Turmeric Milk", helps: "Soothes throat and eases inflammation.", time: "8 min", keys: "turmeric,milk", lock: 4,
      ingredients: ["1 cup milk (any kind)", "1/2 tsp turmeric", "Pinch of black pepper", "1 tbsp honey"],
      steps: ["Warm the milk with the turmeric and pepper (pepper helps absorption).", "Take off the heat and let it cool a minute.", "Stir in the honey and drink warm, especially before bed."] },
    { id: "acv-gargle", cat: "Throat & Cough", title: "Honey & ACV Gargle", helps: "A gargle for a raw, sore throat.", time: "3 min", keys: "vinegar,honey", lock: 5,
      ingredients: ["1 tbsp honey", "1 tbsp apple cider vinegar", "1 cup warm water"],
      steps: ["Stir everything together until the honey dissolves.", "Gargle a mouthful for 15–20 seconds, then spit.", "Repeat a few times; use 2–3× a day."] },
    { id: "black-pepper", cat: "Throat & Cough", title: "Honey Black-Pepper Mix", helps: "An old remedy for a stubborn cough.", time: "3 min", keys: "honey,spice", lock: 6,
      ingredients: ["1 tbsp honey", "Small pinch of freshly ground black pepper"],
      steps: ["Mix the pepper into the honey.", "Swallow 1 tsp slowly so it coats the throat.", "Use up to 2–3× a day."] },
    { id: "sage-gargle", cat: "Throat & Cough", title: "Honey Sage Gargle", helps: "Sage + honey for throat pain.", time: "12 min", keys: "sage,herbs", lock: 7,
      ingredients: ["1 tbsp honey", "1 tbsp fresh sage leaves", "1 cup water"],
      steps: ["Steep the sage in just-boiled water 10 minutes; strain.", "Stir in honey and let it cool to warm.", "Gargle, then you can swallow it too."] },
    { id: "onion-syrup", cat: "Throat & Cough", title: "Honey Onion Syrup", helps: "A pungent but effective cough syrup.", time: "6 hr (mostly waiting)", keys: "onion,honey", lock: 8,
      ingredients: ["1 small onion, thinly sliced", "Enough honey to cover (about 1/2 cup)"],
      steps: ["Layer the onion slices in a jar and cover with honey.", "Cover and leave at room temp 6–8 hours (or overnight).", "Strain off the now-syrupy honey.", "Take 1 tsp as needed; refrigerate up to 3 days."] },
    { id: "licorice-tea", cat: "Throat & Cough", title: "Honey Licorice Tea", helps: "Coats and calms an irritated throat.", time: "10 min", keys: "tea,herbs", lock: 9,
      ingredients: ["1 tsp dried licorice root", "1 tbsp honey", "1 cup water"],
      steps: ["Simmer the licorice root 8 minutes; strain.", "Cool slightly, then stir in honey.", "Sip warm. (Skip if you have high blood pressure.)"] },
    { id: "marshmallow-tea", cat: "Throat & Cough", title: "Honey Marshmallow-Root Tea", helps: "Great for a dry, tickly throat.", time: "4 hr cold-steep", keys: "tea,herbs", lock: 10,
      ingredients: ["1 tbsp dried marshmallow root", "1 tbsp honey", "1 cup cold water"],
      steps: ["Cold-steep the root in water 4 hours (heat destroys the soothing mucilage).", "Strain, then gently warm and stir in honey.", "Sip slowly."] },

    // Cold & Flu
    { id: "ginger-shot", cat: "Cold & Flu", title: "Honey Lemon Ginger Shot", helps: "A fiery kick-start at the first sign of a cold.", time: "5 min", keys: "ginger,lemon", lock: 11,
      ingredients: ["1 tbsp grated ginger", "Juice of 1 lemon", "1 tbsp honey", "2 tbsp warm water"],
      steps: ["Grate the ginger and squeeze out the juice (or use it grated).", "Whisk with the lemon, honey, and warm water.", "Drink it as a shot, once a day."] },
    { id: "garlic-paste", cat: "Cold & Flu", title: "Honey Garlic Immune Paste", helps: "Garlic + honey for cold and flu season.", time: "10 min", keys: "garlic,honey", lock: 12,
      ingredients: ["3 cloves garlic, crushed", "3 tbsp honey"],
      steps: ["Crush the garlic and let it sit 10 minutes (activates allicin).", "Stir it into the honey.", "Take 1 tsp a day; store covered in the fridge up to 1 week."] },
    { id: "elderberry-syrup", cat: "Cold & Flu", title: "Honey Elderberry Syrup", helps: "A classic syrup for flu symptoms.", time: "45 min", keys: "berries,syrup", lock: 13,
      ingredients: ["1/2 cup dried elderberries", "3 cups water", "1/2 cup honey"],
      steps: ["Simmer elderberries in water until reduced by half (~30–40 min).", "Mash and strain, then let the liquid cool to warm.", "Stir in the honey.", "Take 1 tbsp daily; refrigerate up to 2 weeks."] },
    { id: "cinnamon-tea", cat: "Cold & Flu", title: "Honey Cinnamon Tea", helps: "Warming help for congestion.", time: "8 min", keys: "cinnamon,tea", lock: 14,
      ingredients: ["1 cinnamon stick (or 1/2 tsp ground)", "1 tbsp honey", "1 cup water"],
      steps: ["Simmer the cinnamon in water 5 minutes.", "Cool slightly and stir in the honey.", "Sip warm."] },
    { id: "echinacea-tea", cat: "Cold & Flu", title: "Honey Echinacea Tea", helps: "Supports the immune system.", time: "10 min", keys: "flowers,tea", lock: 15,
      ingredients: ["1 echinacea tea bag (or 1 tsp dried)", "1 tbsp honey", "1 cup hot water"],
      steps: ["Steep the echinacea 8–10 minutes.", "Remove the tea and let it cool slightly.", "Stir in honey; drink 1–2× a day when you feel run-down."] },
    { id: "cayenne-tonic", cat: "Cold & Flu", title: "Honey Cayenne Tonic", helps: "Helps clear a stuffy nose.", time: "5 min", keys: "pepper,honey", lock: 16,
      ingredients: ["1 tbsp honey", "Pinch of cayenne", "Juice of 1/2 lemon", "1 cup warm water"],
      steps: ["Stir the honey and cayenne into the warm water.", "Add lemon juice.", "Sip slowly — the cayenne helps thin mucus."] },
    { id: "clove-tea", cat: "Cold & Flu", title: "Honey Clove Tea", helps: "Cloves for cold and throat relief.", time: "8 min", keys: "clove,tea", lock: 17,
      ingredients: ["3–4 whole cloves", "1 tbsp honey", "1 cup water"],
      steps: ["Simmer the cloves 5 minutes; strain.", "Cool slightly, stir in the honey.", "Sip warm."] },
    { id: "steam-bowl", cat: "Cold & Flu", title: "Honey Steam Bowl", helps: "Loosens sinus and chest congestion.", time: "10 min", keys: "steam,herbs", lock: 18,
      ingredients: ["1 tbsp honey (to sip after)", "Bowl of just-boiled water", "Optional: a few drops eucalyptus or fresh herbs"],
      steps: ["Pour hot water into a bowl; add herbs if using.", "Drape a towel over your head and breathe the steam 5–10 min, eyes closed.", "Afterward, sip a spoon of honey in warm water to soothe the throat."] },

    // Sleep & Calm
    { id: "chamomile-nightcap", cat: "Sleep & Calm", title: "Honey Chamomile Nightcap", helps: "Winds you down for sleep.", time: "8 min", keys: "chamomile,tea", lock: 19,
      ingredients: ["1 chamomile tea bag", "1 tsp honey", "1 cup hot water"],
      steps: ["Steep the chamomile 5 minutes.", "Cool slightly, then stir in the honey.", "Sip 30–45 minutes before bed."] },
    { id: "warm-milk", cat: "Sleep & Calm", title: "Honey Warm Milk", helps: "The classic bedtime drink.", time: "6 min", keys: "milk,honey", lock: 20,
      ingredients: ["1 cup milk", "1 tsp honey", "Tiny pinch of nutmeg (optional)"],
      steps: ["Warm the milk gently — don't boil.", "Take off heat and stir in the honey.", "Add nutmeg if you like and drink warm before bed."] },
    { id: "lavender-tea", cat: "Sleep & Calm", title: "Honey Lavender Tea", helps: "Calms nerves and eases stress.", time: "8 min", keys: "lavender,tea", lock: 21,
      ingredients: ["1 tsp dried culinary lavender", "1 tsp honey", "1 cup hot water"],
      steps: ["Steep the lavender 5 minutes; strain.", "Stir in the honey.", "Sip slowly and breathe in the steam."] },
    { id: "tart-cherry", cat: "Sleep & Calm", title: "Honey Tart-Cherry Drink", helps: "Natural melatonin for better sleep.", time: "3 min", keys: "cherry,drink", lock: 22,
      ingredients: ["1/2 cup tart cherry juice", "1/2 cup warm water", "1 tsp honey"],
      steps: ["Warm the water and stir in the honey.", "Mix in the tart cherry juice.", "Drink about an hour before bed."] },
    { id: "banana-tea", cat: "Sleep & Calm", title: "Honey Banana Tea", helps: "Magnesium-rich, for restful sleep.", time: "15 min", keys: "banana,tea", lock: 23,
      ingredients: ["1 ripe banana (with peel, washed)", "1 tsp honey", "2 cups water"],
      steps: ["Cut the ends off the banana and simmer it (peel on) 10 minutes.", "Pour the water into a mug through a strainer.", "Cool slightly, stir in honey, and sip before bed."] },
    { id: "nutmeg-milk", cat: "Sleep & Calm", title: "Honey Nutmeg Milk", helps: "Nutmeg's calming touch for sleep.", time: "6 min", keys: "milk,spice", lock: 24,
      ingredients: ["1 cup milk", "Small pinch of nutmeg (no more)", "1 tsp honey"],
      steps: ["Warm the milk with the tiny pinch of nutmeg.", "Off the heat, stir in the honey.", "Drink warm before bed. (Use only a pinch of nutmeg.)"] },

    // Skin & Wounds
    { id: "wound-dressing", cat: "Skin & Wounds", title: "Raw Honey Wound Dressing", helps: "For minor cuts and scrapes.", time: "5 min", keys: "honey,jar", lock: 25,
      caution: "Only for minor wounds. Use medical-grade or raw honey. See a doctor for deep, dirty, or infected wounds, or if you're diabetic.",
      ingredients: ["Raw or medical-grade honey", "Clean gauze/bandage"],
      steps: ["Clean the wound gently with water.", "Spread a thin layer of honey on the gauze (not directly poured into the wound).", "Cover and change the dressing 1–2× a day."] },
    { id: "oatmeal-mask", cat: "Skin & Wounds", title: "Honey Oatmeal Face Mask", helps: "Soothes and gently exfoliates skin.", time: "20 min", keys: "oats,honey", lock: 26,
      ingredients: ["1 tbsp honey", "1 tbsp finely ground oats", "1 tsp warm water"],
      steps: ["Mix into a soft paste.", "Spread over clean skin and leave 10–15 minutes.", "Rinse with warm water and pat dry."] },
    { id: "cinnamon-spot", cat: "Skin & Wounds", title: "Honey Cinnamon Spot Treatment", helps: "Targets the odd breakout.", time: "15 min", keys: "cinnamon,honey", lock: 27,
      caution: "Cinnamon can irritate — patch-test first and avoid if sensitive.",
      ingredients: ["2 tsp honey", "1/4 tsp cinnamon"],
      steps: ["Mix into a paste and patch-test on your inner arm first.", "Dab a little on the blemish, avoiding broken skin.", "Leave 10 minutes, then rinse off."] },
    { id: "aloe-burn", cat: "Skin & Wounds", title: "Honey Aloe Burn Gel", helps: "Cooling relief for minor burns.", time: "5 min", keys: "aloe,plant", lock: 28,
      caution: "Minor (first-degree) burns only. Cool the burn under running water first. Seek care for blistering or large burns.",
      ingredients: ["1 tsp honey", "1 tsp fresh aloe vera gel"],
      steps: ["Run cool water over the burn for a few minutes first.", "Mix the honey and aloe.", "Apply a thin layer; reapply as needed."] },
    { id: "lip-balm", cat: "Skin & Wounds", title: "Honey Lip Balm", helps: "Rescues chapped lips.", time: "5 min", keys: "honey,balm", lock: 29,
      ingredients: ["1 tsp honey", "1 tsp coconut oil", "Optional: tiny pinch of sugar to scrub"],
      steps: ["Warm the coconut oil until soft and mix with honey.", "For chapped lips, gently scrub with the sugar version, then rinse.", "Smooth on the honey balm and leave."] },
    { id: "sugar-scrub", cat: "Skin & Wounds", title: "Honey Sugar Scrub", helps: "Smooths dry, rough skin.", time: "5 min", keys: "sugar,scrub", lock: 30,
      ingredients: ["2 tbsp honey", "2 tbsp sugar", "1 tbsp olive or coconut oil"],
      steps: ["Stir everything into a grainy paste.", "Massage gently onto damp skin in circles.", "Rinse with warm water."] },
    { id: "yogurt-mask", cat: "Skin & Wounds", title: "Honey Yogurt Mask", helps: "Calms red, irritated skin.", time: "20 min", keys: "yogurt,honey", lock: 31,
      ingredients: ["1 tbsp honey", "2 tbsp plain yogurt"],
      steps: ["Mix into a smooth mask.", "Apply to clean skin for 15 minutes.", "Rinse with cool water and pat dry."] },

    // Digestion
    { id: "tummy-tea", cat: "Digestion", title: "Honey Ginger Tummy Tea", helps: "Settles nausea and upset stomach.", time: "12 min", keys: "ginger,tea", lock: 32,
      ingredients: ["3 slices fresh ginger", "1 tsp honey", "1.5 cups water"],
      steps: ["Simmer the ginger 8–10 minutes; strain.", "Cool slightly, stir in the honey.", "Sip slowly."] },
    { id: "peppermint-tea", cat: "Digestion", title: "Honey Peppermint Tea", helps: "Eases bloating and gas.", time: "8 min", keys: "mint,tea", lock: 33,
      ingredients: ["1 peppermint tea bag (or fresh leaves)", "1 tsp honey", "1 cup hot water"],
      steps: ["Steep the peppermint 5 minutes.", "Stir in honey once slightly cooled.", "Sip after meals."] },
    { id: "lemon-water", cat: "Digestion", title: "Honey Lemon Warm Water", helps: "A gentle morning digestive.", time: "3 min", keys: "lemon,water", lock: 34,
      ingredients: ["1 tsp honey", "Juice of 1/2 lemon", "1 cup warm water"],
      steps: ["Stir the honey into the warm water.", "Add the lemon juice.", "Sip first thing in the morning."] },
    { id: "fennel-tea", cat: "Digestion", title: "Honey Fennel Tea", helps: "Classic remedy for gas.", time: "10 min", keys: "fennel,tea", lock: 35,
      ingredients: ["1 tsp fennel seeds, lightly crushed", "1 tsp honey", "1 cup water"],
      steps: ["Simmer the fennel seeds 8 minutes; strain.", "Cool slightly and stir in honey.", "Sip after eating."] },
    { id: "digestive-tonic", cat: "Digestion", title: "Honey ACV Digestive Tonic", helps: "Before-meal tonic for indigestion.", time: "3 min", keys: "vinegar,honey", lock: 36,
      caution: "Vinegar is acidic — always dilute, and skip if you have ulcers or reflux.",
      ingredients: ["1 tsp honey", "1 tsp apple cider vinegar", "1 cup water"],
      steps: ["Stir the honey and vinegar into the water.", "Sip about 15 minutes before a heavy meal."] },

    // Immunity & Energy
    { id: "immunity-paste", cat: "Immunity & Energy", title: "Honey Turmeric Immunity Paste", helps: "A daily spoonful for immune support.", time: "10 min", keys: "turmeric,honey", lock: 37,
      ingredients: ["1/2 cup honey", "2 tbsp turmeric", "1/2 tsp black pepper", "1 tsp lemon juice"],
      steps: ["Mix everything into a smooth paste.", "Store in a small jar.", "Take 1/4–1/2 tsp a day, especially in cold season."] },
    { id: "date-balls", cat: "Immunity & Energy", title: "Honey Date Energy Balls", helps: "A quick natural energy snack.", time: "15 min", keys: "dates,nuts", lock: 38,
      ingredients: ["1 cup pitted dates", "1 tbsp honey", "1/2 cup oats", "2 tbsp nut butter"],
      steps: ["Blend the dates until sticky.", "Mix in the honey, oats, and nut butter.", "Roll into balls and chill 20 minutes."] },
    { id: "tahini-bites", cat: "Immunity & Energy", title: "Honey Tahini Bites", helps: "Protein-rich pick-me-up.", time: "15 min", keys: "sesame,honey", lock: 39,
      ingredients: ["1/4 cup tahini", "2 tbsp honey", "1/2 cup oats", "1 tbsp sesame seeds"],
      steps: ["Stir the tahini and honey together.", "Fold in the oats and sesame seeds.", "Roll into small bites and refrigerate."] },
    { id: "beet-tonic", cat: "Immunity & Energy", title: "Honey Beet Tonic", helps: "For stamina and a natural boost.", time: "5 min", keys: "beetroot,juice", lock: 40,
      ingredients: ["1/2 cup beet juice", "1 tsp honey", "Squeeze of lemon"],
      steps: ["Stir the honey into the beet juice.", "Add a squeeze of lemon.", "Drink fresh, ideally before activity."] }
  ];

  var GALLERY = [
    { keys: "honey", lock: 51 },
    { keys: "honey,jar", lock: 52 },
    { keys: "lemon,ginger", lock: 53 },
    { keys: "tea,herbs", lock: 54 },
    { keys: "turmeric", lock: 55 },
    { keys: "honeycomb", lock: 56 }
  ];

  var byId = {};
  REMEDIES.forEach(function (r) { byId[r.id] = r; });

  // ordered category list
  var CATS = [];
  REMEDIES.forEach(function (r) { if (CATS.indexOf(r.cat) < 0) CATS.push(r.cat); });

  var activeCat = "All";

  /* ---------- cards ---------- */
  function cardHtml(r) {
    return (
      '<button class="recipe-card" data-recipe="' + r.id + '">' +
        '<div class="recipe-thumb"><img loading="lazy" src="' + flickr(480, 340, r.keys, r.lock) + '" alt="' + esc(r.title) + '" /></div>' +
        '<div class="recipe-info">' +
          '<span class="cat-badge">' + esc(r.cat) + "</span>" +
          "<h3>" + esc(r.title) + "</h3>" +
          "<p>" + esc(r.helps) + "</p>" +
          '<div class="recipe-meta"><span>⏱ ' + esc(r.time) + "</span></div>" +
        "</div>" +
      "</button>"
    );
  }

  function renderGridList() {
    var el = document.getElementById("recipe-grid");
    if (!el) return;
    var list = REMEDIES.filter(function (r) { return activeCat === "All" || r.cat === activeCat; });
    el.innerHTML = list.map(cardHtml).join("");
  }

  function renderFilters() {
    var el = document.getElementById("recipe-filters");
    if (!el) return;
    var all = ["All"].concat(CATS);
    el.innerHTML = all.map(function (c) {
      return '<button class="filter-chip' + (c === activeCat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
  }

  /* ---------- gallery ---------- */
  function renderGallery() {
    var el = document.getElementById("gallery-grid");
    if (!el) return;
    el.innerHTML = GALLERY.map(function (g) {
      var url = flickr(500, 500, g.keys, g.lock);
      return '<button class="gallery-item" data-img="' + url + '"><img loading="lazy" src="' + url + '" alt="Honey photo" /></button>';
    }).join("");
  }

  /* ---------- modal ---------- */
  var modal = document.getElementById("recipe-modal");
  var modalBody = document.getElementById("recipe-modal-body");

  function openRecipe(id) {
    var r = byId[id];
    if (!r) return;
    var big = flickr(1000, 640, r.keys, r.lock);
    modalBody.innerHTML =
      '<button class="recipe-hero" data-img="' + big + '"><img src="' + big + '" alt="' + esc(r.title) + '" /><span class="tap-photo">🔍 tap photo to enlarge</span></button>' +
      '<div class="recipe-detail">' +
        '<span class="cat-badge">' + esc(r.cat) + "</span>" +
        "<h2>" + esc(r.title) + "</h2>" +
        '<p class="recipe-sub">' + esc(r.helps) + "</p>" +
        '<div class="recipe-meta big"><span>⏱ ' + esc(r.time) + "</span></div>" +
        (r.caution ? '<div class="caution"><strong>⚠️ Caution:</strong> ' + esc(r.caution) + "</div>" : "") +
        '<div class="recipe-cols">' +
          '<div class="recipe-ing"><h4>You need</h4><ul>' + r.ingredients.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>" +
          '<div class="recipe-steps"><h4>How to</h4><ol>' + r.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>" +
        "</div>" +
        '<p class="modal-disclaimer">' + esc(DISCLAIMER) + "</p>" +
      "</div>";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalBody.scrollTop = 0;
  }
  function closeRecipe() { modal.hidden = true; document.body.classList.remove("modal-open"); }

  /* ---------- lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightImg = document.getElementById("lightbox-img");
  function openLightbox(url) { lightImg.src = url; lightbox.hidden = false; document.body.classList.add("modal-open"); }
  function closeLightbox() { lightbox.hidden = true; lightImg.src = ""; if (modal.hidden) document.body.classList.remove("modal-open"); }

  /* ---------- wiring ---------- */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest("[data-cat]");
    if (chip) { activeCat = chip.getAttribute("data-cat"); renderFilters(); renderGridList(); return; }
    var card = e.target.closest("[data-recipe]");
    if (card) { openRecipe(card.getAttribute("data-recipe")); return; }
    var imgBtn = e.target.closest("[data-img]");
    if (imgBtn) { openLightbox(imgBtn.getAttribute("data-img")); return; }
    if (e.target.closest("[data-close-recipe]")) closeRecipe();
    if (e.target.closest("[data-close-light]")) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!lightbox.hidden) closeLightbox();
    else if (!modal.hidden) closeRecipe();
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  renderFilters();
  renderGridList();
  renderGallery();
})();
