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
| `js/store-vercel.js` | **Active sync layer** — Vercel Postgres via `/api/state`, with localStorage fallback |
| `api/state.js` | Vercel serverless function — reads/writes the Postgres tables |
| `js/store.js` | Pure-localStorage sync layer (reference / offline) |
| `js/store-firebase.js` | Alternative drop-in for Firebase real-time sync |
| `js/checkin.js` | Check-in logic — presets, hearts, presence, history, story |
| `package.json` | Declares `@vercel/postgres` so Vercel installs it |
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
  - *What am I doing?* — Working, Resting, Out & about, Driving, Running errands, Dropping off to school, Being stupid
  - *What am I feeling?* — Sleepy, Happy, Stressed, Missing you, Gosh
  - *Plans for today?* — Going out, Family, Family eating, An event, Cooking, Cleaning, At the park
  - *What am I missing most?* — Eyes, Ears, Nose, Face, Lips, Smile, Voice, Your hugs
  - *What do you want to do to me?* — Tuck you in, Hold you, Kiss you, Hold your cheek, Hot for you, All the above
  - *A little note* — Thinking of you 💛, My heart hurts 💔, **plus a free-text comment box**
  - *How many hearts?* — tap **anywhere in the box** to add hearts ("I love you ×N")
- Your selection **replaces** your current status and stamps it with the
  **date and time** of the check-in.
- Each side shows the other's current status, last check-in date/time, and a
  **green dot when they're active right now** (a heartbeat while the overlay is open).
- **🦜 (top center)** opens the emoji story timeline.
- **🕘 (top left)** opens the **check-in history** — a running log of every
  past check-in (who, what, date/time).
- Optional PIN per person in `js/checkin.js` (`PINS` — empty = no PIN).

## The database (Vercel Postgres — all in Vercel)

The site talks to `/api/state` (the `api/state.js` serverless function), which
stores everything in a **Vercel Postgres** database:

- `presence` — each side's current status + last-seen ("lock-on") time
- `checkins` — the full timestamped history of every check-in

**One-time setup in the Vercel dashboard:** open the project → **Storage** tab →
**Create Database → Postgres** → connect it to this project. That injects the
`POSTGRES_URL` environment variable, which `@vercel/postgres` reads
automatically. Redeploy and you're done — both phones now share the same status,
online state, and history.

Until a database is connected, `js/store-vercel.js` **falls back to
localStorage** automatically, so the site keeps working (per-browser) and
upgrades itself to the shared database the moment `/api/state` responds.

Online/offline is polling-based (a refresh every few seconds). If you'd rather
have instant presence, `js/store-firebase.js` is an alternative backend using
Firebase `onDisconnect` — swap the script tag in `index.html`.

## Analytics

`index.html` loads Vercel Web Analytics (`/_vercel/insights/script.js`). Turn it
on in the project's **Analytics** tab in the Vercel dashboard to start collecting
page views.

## Swapping in real photos

The hero, menu, and gallery use CSS-gradient placeholders so the site is fully
self-contained. To use real photography, drop image files into `assets/` and
replace the gradient `.slide` / `.drink-thumb` / `.gphoto` backgrounds with
`background-image: url('assets/your-photo.jpg')` (there's a commented example
on the hero slides in `index.html`).
