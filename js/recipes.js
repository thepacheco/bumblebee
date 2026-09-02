/* Honey Bee Boba — real boba recipes: data + rendering + detail modal + lightbox.
 * Photos are real Creative-Commons images pulled live from LoremFlickr by
 * keyword (swap any `img` for your own URL to use a specific photo).
 */
(function () {
  "use strict";

  function flickr(w, h, keys, lock) {
    return "https://loremflickr.com/" + w + "/" + h + "/" + keys + "?lock=" + lock;
  }

  var RECIPES = [
    {
      id: "classic-milk-tea",
      title: "Classic Milk Tea",
      subtitle: "The one that started it all — black tea, milk, chewy pearls.",
      time: "30 min", level: "Easy", serves: "2",
      keys: "bubble,tea", lock: 11,
      ingredients: [
        "1/2 cup dried tapioca pearls",
        "3 tbsp brown sugar (for the pearls)",
        "4 black tea bags (or 3 tbsp loose black tea)",
        "2 cups water",
        "1 cup whole milk (or oat milk)",
        "2–3 tbsp simple syrup, to taste",
        "Ice"
      ],
      steps: [
        "Cook the tapioca pearls: boil 4 cups water, add pearls, and boil 15 min, stirring so they don't stick.",
        "Turn off heat, cover, and let sit 10 min. Drain, then toss the pearls in the brown sugar and set aside.",
        "Steep the tea: pour 2 cups just-boiled water over the tea and steep 5 min for a strong brew. Remove tea; let cool.",
        "Divide the sugared pearls between two glasses. Add ice.",
        "Pour in the tea, top with milk, add simple syrup to taste, and stir."
      ]
    },
    {
      id: "brown-sugar-boba",
      title: "Brown Sugar Boba Milk",
      subtitle: "Those pretty tiger stripes — caramelized brown sugar + cold milk.",
      time: "35 min", level: "Medium", serves: "2",
      keys: "boba,drink", lock: 12,
      ingredients: [
        "1/2 cup dried tapioca pearls",
        "1/2 cup dark brown sugar",
        "1/4 cup water",
        "2 cups cold whole milk",
        "Ice (optional)"
      ],
      steps: [
        "Cook and rest the pearls as usual (boil 15 min, cover 10 min, drain).",
        "Make the syrup: simmer the brown sugar and water with the drained pearls 5–8 min until thick and glossy.",
        "Swirl the brown-sugar pearls up the inside of each glass to make the 'tiger stripes'.",
        "Add ice if you like, then pour in the cold milk. Stir before drinking."
      ]
    },
    {
      id: "matcha-latte-boba",
      title: "Matcha Boba Latte",
      subtitle: "Earthy stone-ground matcha over milk and pearls.",
      time: "25 min", level: "Easy", serves: "1",
      keys: "matcha,latte", lock: 13,
      ingredients: [
        "1/3 cup cooked tapioca pearls",
        "1.5 tsp matcha powder",
        "2 tbsp hot water (not boiling — about 80°C)",
        "1 cup milk of choice",
        "1–2 tsp honey or simple syrup",
        "Ice"
      ],
      steps: [
        "Sift the matcha into a cup, add the hot water, and whisk in a zig-zag until smooth and frothy.",
        "Add the cooked pearls to a glass with ice.",
        "Pour in the milk, then float the matcha on top.",
        "Sweeten to taste and stir just before drinking."
      ]
    },
    {
      id: "taro-milk-tea",
      title: "Taro Milk Tea",
      subtitle: "Nutty, vanilla-sweet, and that dreamy purple color.",
      time: "40 min", level: "Medium", serves: "2",
      keys: "taro,dessert", lock: 14,
      ingredients: [
        "1 cup fresh taro root, peeled and cubed (or 3 tbsp taro powder)",
        "1/2 cup cooked tapioca pearls",
        "2 black tea bags",
        "1.5 cups water",
        "1 cup milk",
        "3 tbsp sugar",
        "Ice"
      ],
      steps: [
        "If using fresh taro: steam the cubes 15–20 min until fork-tender, then mash with the sugar until smooth.",
        "Steep the tea in 1.5 cups hot water for 5 min; remove bags and cool.",
        "Blend the mashed taro (or taro powder) with the milk until creamy.",
        "Add pearls and ice to glasses, pour in the tea, then the taro milk. Stir."
      ]
    },
    {
      id: "thai-tea",
      title: "Thai Iced Tea",
      subtitle: "Bold spiced black tea with sweet condensed milk.",
      time: "20 min", level: "Easy", serves: "2",
      keys: "thai,tea", lock: 15,
      ingredients: [
        "4 tbsp Thai tea mix (or strong black tea + a pinch of star anise)",
        "2 cups water",
        "3 tbsp sweetened condensed milk",
        "2 tbsp evaporated milk (to finish)",
        "1/2 cup cooked tapioca pearls",
        "Ice"
      ],
      steps: [
        "Steep the Thai tea in just-boiled water for 5 min, then strain — it should be deep amber.",
        "Stir the condensed milk into the hot tea until dissolved. Let cool.",
        "Fill glasses with pearls and ice, pour in the tea.",
        "Float evaporated milk on top for the classic two-tone look."
      ]
    },
    {
      id: "strawberry-fruit-tea",
      title: "Strawberry Fruit Tea",
      subtitle: "Light, fruity green tea — no milk, all refreshment.",
      time: "20 min", level: "Easy", serves: "2",
      keys: "strawberry,drink", lock: 16,
      ingredients: [
        "1 cup fresh strawberries, halved",
        "2 green tea bags",
        "2 cups water",
        "2 tbsp honey",
        "1/3 cup popping or tapioca pearls",
        "Ice"
      ],
      steps: [
        "Muddle half the strawberries with the honey in the bottom of a jug.",
        "Steep the green tea 3 min (don't over-steep or it turns bitter); cool.",
        "Add the tea, remaining sliced strawberries, and ice to the jug.",
        "Spoon pearls into glasses and pour the fruit tea over. Stir gently."
      ]
    }
  ];

  var BASICS = [
    {
      id: "tapioca-pearls",
      title: "How to Cook Tapioca Pearls",
      subtitle: "Get them soft, chewy, and never gummy.",
      time: "30 min", level: "Easy", serves: "4",
      keys: "tapioca,pearls", lock: 17,
      ingredients: [
        "1 cup dried tapioca pearls",
        "6 cups water",
        "1/4 cup brown sugar (for soaking)"
      ],
      steps: [
        "Bring the water to a rolling boil — use plenty so the pearls have room.",
        "Add pearls and stir gently until they float, then boil 15 min uncovered.",
        "Turn off the heat, cover, and rest another 10 min for the centers to soften.",
        "Drain and rinse briefly, then soak in the brown sugar (with a splash of hot water) until ready.",
        "Use within a few hours — pearls are best fresh and harden if refrigerated."
      ]
    },
    {
      id: "brown-sugar-syrup",
      title: "Brown Sugar Syrup",
      subtitle: "The glossy sweetener behind every good boba.",
      time: "10 min", level: "Easy", serves: "8",
      keys: "brown,sugar", lock: 18,
      ingredients: [
        "1 cup dark brown sugar",
        "1/2 cup water"
      ],
      steps: [
        "Combine sugar and water in a small pot over medium heat.",
        "Stir until the sugar dissolves, then simmer 5 min until slightly syrupy.",
        "Cool completely — it thickens as it cools. Store in a jar in the fridge up to 2 weeks."
      ]
    }
  ];

  var GALLERY = [
    { keys: "bubble,tea", lock: 21 },
    { keys: "boba", lock: 22 },
    { keys: "matcha", lock: 23 },
    { keys: "tea,drink", lock: 24 },
    { keys: "strawberry,drink", lock: 25 },
    { keys: "milk,tea", lock: 26 }
  ];

  var byId = {};
  RECIPES.concat(BASICS).forEach(function (r) { byId[r.id] = r; });

  /* ---------- render cards ---------- */
  function cardHtml(r, big) {
    var w = big ? 640 : 480, h = big ? 420 : 340;
    return (
      '<button class="recipe-card" data-recipe="' + r.id + '">' +
        '<div class="recipe-thumb"><img loading="lazy" src="' + flickr(w, h, r.keys, r.lock) + '" alt="' + esc(r.title) + '" /></div>' +
        '<div class="recipe-info">' +
          '<h3>' + esc(r.title) + "</h3>" +
          "<p>" + esc(r.subtitle) + "</p>" +
          '<div class="recipe-meta"><span>⏱ ' + esc(r.time) + "</span><span>• " + esc(r.level) + "</span><span>• serves " + esc(r.serves) + "</span></div>" +
        "</div>" +
      "</button>"
    );
  }

  function renderInto(id, list, big) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.map(function (r) { return cardHtml(r, big); }).join("");
  }

  /* ---------- gallery ---------- */
  function renderGallery() {
    var el = document.getElementById("gallery-grid");
    if (!el) return;
    el.innerHTML = GALLERY.map(function (g) {
      var url = flickr(500, 500, g.keys, g.lock);
      return '<button class="gallery-item" data-img="' + url + '"><img loading="lazy" src="' + url + '" alt="Boba photo" /></button>';
    }).join("");
  }

  /* ---------- recipe modal ---------- */
  var modal = document.getElementById("recipe-modal");
  var modalBody = document.getElementById("recipe-modal-body");

  function openRecipe(id) {
    var r = byId[id];
    if (!r) return;
    modalBody.innerHTML =
      '<button class="recipe-hero" data-img="' + flickr(1000, 640, r.keys, r.lock) + '">' +
        '<img src="' + flickr(1000, 640, r.keys, r.lock) + '" alt="' + esc(r.title) + '" />' +
        '<span class="tap-photo">🔍 tap photo to enlarge</span>' +
      "</button>" +
      '<div class="recipe-detail">' +
        "<h2>" + esc(r.title) + "</h2>" +
        '<p class="recipe-sub">' + esc(r.subtitle) + "</p>" +
        '<div class="recipe-meta big"><span>⏱ ' + esc(r.time) + "</span><span>• " + esc(r.level) + "</span><span>• serves " + esc(r.serves) + "</span></div>" +
        '<div class="recipe-cols">' +
          '<div class="recipe-ing"><h4>Ingredients</h4><ul>' +
            r.ingredients.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") +
          "</ul></div>" +
          '<div class="recipe-steps"><h4>Steps</h4><ol>' +
            r.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") +
          "</ol></div>" +
        "</div>" +
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

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- go ---------- */
  renderInto("recipe-grid", RECIPES, false);
  renderInto("basics-grid", BASICS, false);
  renderGallery();
})();
