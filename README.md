# Site Ledger — PWA

The web version of Site Ledger: an installable, **offline-first** expense tracker
for fit-out projects. Same Par Ankh design, same features as the iOS app — but it
runs in any modern browser and stores everything **on the device, in the browser**.

No backend. No login. No network required after first load.

## Run it

Any static file server works (a server is required — service workers and ES
modules don't work from `file://`):

```bash
cd SiteLedgerWeb && python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Install on a phone

- **iPhone (Safari):** Share → *Add to Home Screen*. Launches full-screen, no browser chrome.
- **Android (Chrome):** the in-app *Install* banner, or ⋮ → *Install app*.

Once installed it works with **zero connectivity** — the service worker caches the
whole app shell (HTML/CSS/JS/fonts/icons) and all data is local.

## Storage — everything is in the browser

- **IndexedDB** (`site-ledger` database) holds units, categories, subcategories,
  workers and expenses, plus a small `meta` store for language/theme/last-used unit.
  IndexedDB rather than `localStorage` because receipt photos would blow past the
  ~5 MB `localStorage` cap.
- Records load into memory once at boot for fast synchronous reads; every mutation
  writes through to IndexedDB immediately.
- **Money is stored as integer whole EGP** (the keypad only enters whole numbers),
  so all sums are exact integer arithmetic — the web equivalent of the iOS app's
  `Decimal`, with no float drift. Floats appear only in percentages and bar widths.
- Photos are downscaled to max 1280px JPEG before being stored.

Data lives only in that browser profile. Clearing site data wipes it; there is no
cloud copy. "Reset to empty" and "Load sample data" are in the **⋯ More** sheet.

## Features

Full parity with the iOS build:

- **Home** — grand total, week/month/units tiles, unit cards with category dots and
  spent-vs-budget bars, designed empty state.
- **Quick add** (the ＋ FAB, reachable anywhere) — amount-first numeric keypad,
  unit defaults to last-used, category picker **scoped to the unit** with nested
  **subcategories** and inline "Create …", Uncategorized never blocks the save,
  optional worker/note/photo, Cash+today preselected, and **Save & add another**.
- **Unit detail** — total, budget bar, conic-gradient category donut with
  **full-width tappable breakdown rows**, workers-paid strip, swipeable expense
  list (swipe to reveal Edit/Delete, RTL-aware).
- **Category history** — tap a category to see its payments grouped by day, with a
  subcategory filter.
- **Unit editor** — name/client/budget plus the categories editor: suggested chips,
  free-text add, recolor from the fixed palette, reorder, delete (expenses fall back
  to Uncategorized), and expandable **subcategory** editing per category.
- **Workers** — ranked list, detail with per-unit filter.
- **Reports** — week/month totals, by-unit and by-category bars.
- **Statement** — branded statement sheet; share via the Web Share API (WhatsApp
  fallback), Print → Save as PDF, or copy the summary.
- **English ⇄ عربي** with full RTL, light/dark/system themes, haptics where supported.

## Structure

```
SiteLedgerWeb/
  index.html                app shell
  manifest.webmanifest      PWA manifest (installable, standalone)
  sw.js                     service worker — app-shell cache, offline
  css/app.css               Par Ankh design tokens + all components
  js/
    app.js                  router, render loop, delegated event handling
    db.js                   IndexedDB wrapper
    store.js                in-memory state + CRUD, written through to IndexedDB
    seed.js                 sample dataset
    i18n.js                 en/ar strings
    format.js               money/date/escaping helpers
    views/                  home, unit, categoryHistory, unitEdit, quickAdd,
                            workers, reports, statement, sheets, components
  fonts/                    DM Serif Display + Outfit
  icons/                    PWA + apple-touch icons
```

No build step, no dependencies, no external network calls — deploy the folder
as-is to Netlify, Vercel, GitHub Pages, or any static host (HTTPS is required for
service workers, except on `localhost`).

## Relationship to the iOS app

`../SiteLedger/` (SwiftUI + SwiftData) is unchanged and still builds. The two apps
share the design and data model but have **separate storage** — data does not sync
between them.
