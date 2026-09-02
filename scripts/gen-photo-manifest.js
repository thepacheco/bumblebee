/* Build step: list the image files in assets/photos/ into
 * assets/photos-manifest.json so the story gallery can show them.
 * Any filename works. Duplicate images (same bytes) are listed once. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dir = path.join(__dirname, "..", "assets", "photos");
const out = path.join(__dirname, "..", "assets", "photos-manifest.json");
const exts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

let files = [];
try { files = fs.readdirSync(dir); } catch (e) { /* no folder yet */ }

const seen = new Set();
const list = [];
files
  .filter(function (f) { return exts.has(path.extname(f).toLowerCase()); })
  .sort()
  .forEach(function (f) {
    const full = path.join(dir, f);
    let hash = f;
    try { hash = crypto.createHash("md5").update(fs.readFileSync(full)).digest("hex"); } catch (e) {}
    if (seen.has(hash)) return; // skip duplicate images
    seen.add(hash);
    list.push("assets/photos/" + f);
  });

fs.writeFileSync(out, JSON.stringify(list, null, 2) + "\n");
console.log("photos-manifest.json:", list.length, "photo(s)");
