# 🐝 Bumblebee — Honey Bee Boba

A public boba/milk-tea site (**Honey Bee Boba**) that quietly doubles as a private
status check-in for two people. To everyone else it's just a tea shop. Tap the
right thing and a hidden check-in **opens right on the homepage** — there's no
separate page to stumble onto.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | The public site **and** the hidden check-in overlay |
| `css/styles.css` | Shared design tokens + public-site styles |
| `css/checkin.css` | Check-in overlay styles (reuses the same tokens) |
| `js/main.js` | Hero slider, mobile nav, and the bee-logo trigger |
| `js/store.js` | The sync layer — **localStorage by default** |
| `js/store-firebase.js` | Optional drop-in for real cross-device sync (see below) |
| `js/checkin.js` | Check-in logic — presets, hearts, presence, history, story |
| `assets/` | Inline SVG bee + elephant logos |

No build step, no dependencies. Open `index.html` in a browser, or serve the
folder with any static host.

## The secret trigger

- **Bee in the header** → single click, always goes home. Normal logo.
- **Bee in the footer** → click it **3× within 2 seconds** to open the check-in
  **overlay on the homepage**. One or two clicks do nothing. Because it's an
  overlay (not its own URL), there's no page anyone can reach by guessing a link.

## The check-in

- Pick your side (🐘 elephant / 🐝 bee) — no names. Remembered on that device.
- **Presets only — no free text.** The composer is a tap-friendly grid where you
  **pick as many as you like** across sections, then hit **Update status**:
  - *What am I doing?* — Working, Resting, Out & about, Studying, Driving, Dropping off, Being stupid
  - *What am I feeling?* — Sleepy, Happy, Stressed, Missing you
  - *Plans for today?* — Going out, Family, An event, Cooking, Cleaning
  - *What do you want to do to me?* — Tuck you in, Hold you, Kiss you, Hot for you, All the above
  - *A little note* — Thinking of you 💛, My heart hurts 💔
  - *How many hearts?* — tap **anywhere in the box** to add hearts ("I love you ×N")
- Your selection **replaces** your current status and stamps it with the
  **date and time** of the check-in.
- Each side shows the other's current status, last check-in date/time, and a
  **green dot when they're active right now** (a heartbeat while the overlay is open).
- **🦜 (top center)** opens the emoji story timeline.
- **🕘 (top left)** opens the **check-in history** — a running log of every
  past check-in (who, what, date/time).
- Optional PIN per person in `js/checkin.js` (`PINS` — empty = no PIN).

## Making it sync across devices (the database)

Out of the box, `js/store.js` uses `localStorage`, so it syncs between tabs on
the **same browser** — perfect for testing. For you and the elephant on two
different phones, follow the ~5-minute setup at the top of
**`js/store-firebase.js`**: create a free Firebase project, paste its config,
and swap the script tags in `index.html`. Nothing else changes — the app only
ever calls `Store.subscribe()`, `Store.setStatus()`, and `Store.heartbeat()`.

That backend also gives **reliable online/offline presence across two users**:
each side writes a heartbeat while their overlay is open, and Firebase's
`onDisconnect` zeroes it the instant a tab closes — so the other person sees you
go offline right away. The shared **history log** lives in the same database.

## Swapping in real photos

The hero, menu, and gallery use CSS-gradient placeholders so the site is fully
self-contained. To use real photography, drop image files into `assets/` and
replace the gradient `.slide` / `.drink-thumb` / `.gphoto` backgrounds with
`background-image: url('assets/your-photo.jpg')` (there's a commented example
on the hero slides in `index.html`).
