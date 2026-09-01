# 🐝 Bumblebee

A public boba/milk-tea site (**Honeydrop Boba**) that quietly doubles as a private
status check-in for two people. To everyone else it's just a tea shop. Tap the
right thing and it opens a different room.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | The public **Honeydrop Boba** site (the decoy) |
| `checkin.html` | The hidden **Check-in** page |
| `css/styles.css` | Shared design tokens + public-site styles |
| `css/checkin.css` | Check-in page styles (reuses the same tokens) |
| `js/main.js` | Hero slider, mobile nav, and the bee-logo routing |
| `js/store.js` | The sync layer (swap this for a real backend) |
| `js/checkin.js` | Check-in app logic — presets, presence, rendering |
| `assets/` | Inline SVG bee + elephant logos |

No build step, no dependencies. Open `index.html` in a browser, or serve the
folder with any static host.

## The secret trigger

- **Bee in the header** → single click, always goes home. Normal logo.
- **Bee in the footer** → click it **3× within 2 seconds** to open the hidden
  check-in page. One or two clicks do nothing, so nobody stumbles in by accident.

## The check-in page

- Pick who you are (Nama 🐘 / Me 🐝). Your choice is remembered on that device.
- **Presets only — no free text ever.** Categories (*What am I doing? / How am I
  feeling?*) expand into taps like *Working, Resting, Sleepy, Missing you*, plus
  two one-tap notes (*Thinking of you, My heart hurts*).
- Tapping a preset **replaces** your current status and timestamps it — it's a
  live status, not a chat log.
- Each side shows the other's current status, **last check-in time**, and a
  **green dot when they're active right now** (a heartbeat ping while the page
  is open).
- Optional PIN per person in `js/checkin.js` (`PINS` — empty = no PIN).

## Making it sync across devices

Out of the box, `js/store.js` uses `localStorage`, so it syncs between tabs on
the **same browser** — perfect for a demo. For two people on two phones, replace
the `read()` / `write()` / change-subscription in `js/store.js` with a shared
backend (a small KV endpoint, Firebase, Supabase, etc.). The rest of the app
only calls `Store.subscribe()`, `Store.setStatus()`, and `Store.heartbeat()`, so
nothing else needs to change.

## Swapping in real photos

The hero, menu, and gallery use CSS-gradient placeholders so the site is fully
self-contained. To use real photography, replace the gradient `.slide` /
`.drink-thumb` / `.gphoto` backgrounds with `background-image: url(...)` (there's
a commented example on the hero slides in `index.html`).
