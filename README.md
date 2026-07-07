# MISTROMY.SYS — portfolio

One file (`index.html`) + an `assets/` folder. No build step, no framework. Host it anywhere static.

## Wire it up (5 minutes)

Everything editable is at the **top of the `<script>` block** in `index.html`:

1. **Nirupama stats** — point `CONFIG.endpoints.nirupamaStats` at your API.
   Expected JSON: `{ "servers": 2, "members": 140, "uptime": "99.9%", "online": true }`
   (add CORS headers on your backend: `Access-Control-Allow-Origin: https://yourdomain`)
2. **Visit counter** — point `CONFIG.endpoints.visits` at your backend.
   Expected JSON: `{ "visits": 1234 }`. Increment server-side on each GET.
3. **Music** — drop an mp3 at `assets/track.mp3` and set `CONFIG.audio.title`.
4. **GitHub** — already live via the public API (`api.github.com`), no key needed.
   Unauthenticated limit is 60 req/hr per visitor IP — fine for a portfolio.
5. **Email** — swap the `mailto:` placeholder on the /ME page.

## Adding work

Add an object to `WORK_2D` or `WORK_3D`:

```js
{ title: "NAME", year: "2026", img: "assets/file.png", tags: "a · b", note: "one line" }
```

Cards with missing image files render as stencil placeholder tiles automatically
(and tell you which path they're waiting for), so you can commit the list first
and the images later. The 3D list already contains your ArtStation titles —
drop renders into `assets/3d/` with the listed filenames and they light up.

## Everything degrades honestly

Any API that doesn't answer shows `░░░  offline // no answer` instead of fake
numbers — same policy as the Nirupama site.

## Later, if you outgrow one file

The hash router (`#/2d`, `#/3d`, `#/sys`, `#/me`) maps 1:1 to real routes if you
ever split into separate pages or move to a framework — each `<section data-page>`
is already a self-contained page.
