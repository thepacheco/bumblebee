/* Honeydrop Boba — public site behavior
   - hero slider (auto + dots)
   - mobile nav toggle
   - bee logo routing:
       header bee (data-bee="home")   -> single click, always go home
       footer bee (data-bee="secret") -> 3 clicks within 2s -> hidden check-in page
*/
(function () {
  "use strict";

  /* ---------- year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- hero slider ---------- */
  var slider = document.getElementById("hero-slider");
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
    var dotsWrap = document.getElementById("hero-dots");
    var idx = 0;
    var timer = null;
    var DELAY = 5000;

    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Go to slide " + (i + 1));
      if (i === 0) b.className = "is-active";
      b.addEventListener("click", function () { go(i); reset(); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function go(n) {
      slides[idx].classList.remove("is-active");
      dots[idx].classList.remove("is-active");
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add("is-active");
      dots[idx].classList.add("is-active");
    }
    function next() { go(idx + 1); }
    function reset() { if (timer) clearInterval(timer); timer = setInterval(next, DELAY); }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && slides.length > 1) reset();
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- secret trigger (all up top, no scrolling) ----------
     Tap the 🍯 in the hero to "arm", then tap the bee logo to open the
     private check-in overlay. A casual tap on the bee just goes home. */
  var HOME = "index.html";
  var ARM_WINDOW = 8000; // ms you have after tapping the honey
  var armedAt = 0;

  var honey = document.getElementById("honey-key");
  if (honey) honey.addEventListener("click", function (e) {
    e.preventDefault();
    armedAt = Date.now();
  });

  document.querySelectorAll('[data-bee="home"]').forEach(function (bee) {
    bee.addEventListener("click", function () {
      if (Date.now() - armedAt < ARM_WINDOW && typeof window.openCheckin === "function") {
        armedAt = 0;
        window.openCheckin();
      } else {
        window.location.href = HOME;
      }
    });
  });
})();
