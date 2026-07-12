# MIST.SYS — operator docs

Private notes for future-me. How to add anything to the site without
touching the machinery. Everything editable lives in **`js/data.js`**.
If you're editing `js/app.js` or `css/style.css` to add *content*,
something went wrong.

---

## Pages

- `index.html` — the taster: about, links, newest 6 artworks, stats +
  Nirupama, log, plans.
- `art.html` — the full archive, with filter chips.
- `projects.html` — flagship + all projects + public repos.

All three share `css/style.css`, `js/data.js`, `js/app.js`. Every
builder in `app.js` checks whether its mount element exists, so the
same script serves all pages.

## Add an artwork

Open `js/data.js`, add an entry to the **top** of `ART` (newest first):

```js
{ title: "NEW PIECE", year: "2026", medium: "2d",   // or "cgi"
  img: "assets/art/newpiece.png",
  tags: "glitch · type",
  note: "one line for the lightbox caption." },
```

- Drop the image into `assets/art/` (2d, cgi, doesn't matter — one
  pile). Export web-res — ~2000–2500 px on the long edge, jpg/webp.
- **Shapes:** the gallery is justified rows — every image keeps its
  own native aspect ratio and rows pack themselves to full width.
  There is nothing to configure; whatever ratio the file has is the
  shape it gets. No crops, no bars, no holes.
- If the file isn't there yet, a 3:4 stencil placeholder holds the
  spot instead of breaking the layout.
- `medium` takes a string or an **array** — `["cgi","2d"]` puts a piece
  in both filters. The filter chips on `art.html` **generate themselves**
  from whatever mediums exist in the list, so a new word = a new chip,
  zero other changes.
- `tags` is flavor only: it feeds the alt text and the lightbox caption
  fallback. Filtering runs on `medium`, search (when enabled) covers
  title + tags + note + medium.
- **Search**: the JS is wired; uncomment the `#artSearch` input in
  `art.html` when the archive is big enough to need it.
- **Animations**: an `img:` (or `images:` entry) ending in `.mp4`/`.webm`
  renders as a muted looping autoplay video in the grid, and with
  controls in the fullscreen view. GIFs just work as images. Keep tile
  loops short and compressed (a few MB) — every visible tile plays.
- `alt`: optional literal description for screen readers/SEO. When
  missing it's auto-generated from title + medium ("X — cgi artwork by
  Mist"), so you never *have* to write one.
- `ART[0]` auto-fills the **latest transmission** panel on the home
  page, and `ART.length` **is** the "pieces in the archive" counter —
  both maintain themselves.

### Where images live

`assets/art/` in this repo. GitHub Pages serves it through a CDN;
limits are ~1 GB per repo (soft), 100 MB per file (hard), 100 GB/mo
bandwidth (soft) — web-res renders won't get near any of that.
If it ever does, move files to a separate "assets" repo (raw URLs
work fine in `img:`) or behind the go backend / R2 later — `img:`
takes any URL.

ArtStation can't be fetched from the browser — their JSON endpoints
block cross-origin requests — and it doesn't have everything anyway.
The go backend could scrape `artstation.com/users/mistromy/projects.json`
server-side someday; until then the manifest above is the source of
truth.

## Add a project

`js/data.js` → `PROJECTS`. There's a commented template in the file.
The `flagship: true` entry renders as the big box (home + projects
page); everything else becomes a card on `projects.html`.

Wiring data to a project:

```js
stats: [
  { label: "some number", value: 42 },            // by hand
  { label: "live number", key: "my_gist_key" },   // from the stats gist
  { label: "big number",  key: "messages_tracked", compact: true }, // 713545 → 713K, full number shown in the label
  { label: "percent",     key: "uptime", fmt: "percent" },
]
```

`key` reads from the stats gist JSON — so wiring live data for a new
project = have the bot/backend push one more key, reference it here.
No other code changes.

## Add a social / link

`js/data.js` → `SOCIALS`. One line, one row:

```js
{ name: "Bluesky", sub: "short description", url: "https://..." },
```

`mailto:` links are handled (no target=_blank).

Mystery link: use `random: ["url1", "url2", ...]` instead of `url` —
every click opens one of them at random.

## Add / update a plan

`js/data.js` → `PLANS`. Statuses and their colors:

| status        | color    |
|---------------|----------|
| `planned`     | concrete |
| `in progress` | cyan     |
| `ongoing`     | magenta  |
| `tomorrow`    | signal red (reserved for giving up) |

## Update the hand-counted numbers

`js/data.js` → `MANUAL`. Only the commit-count fallback lives there
now — the artwork counter derives from `ART.length` automatically.

## Add a multi-image post / link a post out

Art entries take two optional fields:

```js
{ title: "...", year: "2026", medium: "cgi", img: "cover.png",
  images: ["bts1.png", "bts2.png"],   // extra images — stack under the
                                      // cover in fullscreen, scroll down.
                                      // tile gets a +N badge.
  post: {                             // link buttons in the fullscreen caption
    artstation: "https://www.artstation.com/artwork/xxxx",
    instagram:  "https://www.instagram.com/p/xxxx",
  } },
```

Either `post` key alone is fine; any site name works as a key — it
becomes the button label.

## Audio widget

`SITE.audio` in data.js: `volume` is the default (0.12 = really quiet;
there's a slider in the widget for visitors). Set `audio: null` to
remove the widget entirely.

Playback state (position, volume, playing) survives page switches via
sessionStorage. Browsers refuse silent autoplay on a fresh page load,
so after navigating the track may wait for one click — it resumes from
where it was, not from zero.

## The stack strip + availability + pfp

- `STACK` in data.js → the b&w icon strip in the about section.
  Hover pops the icon to colour with the name (and optional `sub`
  honesty tag: "rusty", "used once"…) as a label. `icon` is any image
  URL — a dead one renders as a name-only chip, so local paths like
  `assets/icons/affinity.png` are fine to reference before the file
  exists. Benched tools (Maya, Houdini, AE, Illustrator) sit commented
  at the bottom of the list.
- The availability strip (commissions / collabs) is **plain HTML** in
  the index hero — edit the words in place, case renders as typed.
  Tones: `tone-go` (cyan pulse), `tone-off` (grey), `tone-warn` (red).
- The **pfp slot** in the hero shows `assets/pfp.png` when the file
  exists; until then it's a "pfp // pending" stencil. Drop any square
  image there.

## Deep links + per-frame tags

- Every artwork is deep-linkable: opening the fullscreen view puts
  `#p/slug-of-title` in the url; sharing that url opens the post
  directly (works on both index and art.html). No extra links appear
  anywhere on the page.
- `images` entries can be plain urls **or** objects with a tag:
  `{ src: "url", tag: "final" }` — the tag renders as a chip on that
  frame in the fullscreen view ("final", "iteration", "wireframe"…).

## Live presence (lanyard)

Pulled from `api.lanyard.rest/v1/users/<SITE.discordId>` (registered
by being in the Lanyard Discord server) and shown in exactly one
place: the **discord bio card** beside the bio — avatar (fetched from
the API), real discord status colours on the dot (green/yellow/red/
grey), status text, and the current activity. Custom rich presences
(VSC, Blender…) show, not just Spotify. The whole thing is deliberately
below the fold — the sysbar dot is pure decoration and means nothing.

Refreshes every 60 s. Fails silent ("no signal").

## Discord embeds for artworks (/p/ stubs)

A `#hash` never reaches the server and unfurlers don't run JS, so
`/#p/…` links can't embed per-artwork. Instead, `scripts/gen_embeds.py`
writes one tiny static page per artwork into `p/` — real og:image tags
plus an instant redirect to the live lightbox. Share
`https://mistromy.github.io/p/smart-juice` and Discord attaches the
render.

- **Automatic**: `.github/workflows/gen-embeds.yml` reruns the script
  on every push that touches `js/data.js` and commits the stubs itself
  (pull after pushing art, or the bot's commit sits above yours).
  Manual fallback: `python scripts/gen_embeds.py`.
- The **share ->** button in the fullscreen viewer copies these urls.
- Extensionless urls are a GitHub Pages feature — locally
  (`python -m http.server`) you'd need the `.html` suffix.

## URL hygiene

Section hashes (`#about`, `#art`…) are stripped from the address bar
right after the jump — on click and on arrival from subpages (whose
links use `./#about` so no `index.html` lingers either). The only hash
that persists is `#p/…`, because that one *is* the share state.

## Sparklines (graphs from the gist)

Any stats-gist key whose value is an **array of numbers** renders as a
sparkline instead of a number — cyan line, latest value beside it,
min/max/latest in the hover tooltip. So when ComputerCraft (or anything
else) starts pushing history, e.g.

```json
{ "cc_energy_history": [410, 388, 402, 455, 431] }
```

…wiring it is one stats line in `PROJECTS`:
`{ label: "energy, last 5h", key: "cc_energy_history" }`.
No code changes. Keep arrays to ~50 points max — it's a sparkline,
not a dashboard.

## 88x31 badges

`BADGES` in data.js. Empty array = no row. Add entries and a badge row
appears at the bottom of the footer on every page, pixelated and
bordered like the old web intended. `url` optional.

## GitHub heatmap

`projects.html` embeds `ghchart.rshah.org/c22a6c/Mistromy` (a year of
commits, magenta ramp, no auth needed). The frame hides itself if the
service dies. Change the hex in the url to recolor.


## Benched links

Google.com and the random-redirect placeholder are commented out in
`SOCIALS`, not deleted — uncomment whenever there's room for them
again. The `random: [...]` machinery still works.

## Marquee lines + random quotes

`js/data.js` → `MARQUEE`. Keep them short. Mist puns encouraged.
The marquee shuffles on every load and loops seamlessly. The same pool
feeds the random quote in the about section and the nav-corner note —
one line each per load, no repeats.

## The about blob + the log (bio)

Both live in `index.html` — they're writing, not data, so they stay in
markup. The short blob is under `<!-- ABOUT -->`, the long bio under
`<!-- LOG -->` (`.log-prose`, plain paragraphs). The little sidebar
next to the bio (`.log-side`) is just `<span>` lines.

---

## The stats pipe (live numbers)

**Already wired.** Nirupama pushes `stats.json` to gist
`cdb82a1247ae6095f5d43098eb074dba`. The site fetches it in two steps:

1. **Gist API** (`SITE.statsGistApi`) — serves the current revision
   with no CDN cache, so it keeps up with a ~10 s push interval.
   Costs one unauthenticated GitHub API request per visitor load
   (limit: 60/h per IP, shared with the other GitHub calls — fine).
2. Fallback: the hashless **raw URL** (`SITE.statsUrl`) — GitHub's CDN
   caches it ~5 min, so it's the backup, not the primary.

**One file per project:** the site parses **every `*.json` file in the
gist** and merges them into one object, in a single request. So each
repo/bot pushes only its own file — no writer can clobber another.
Keep key names unique across files (prefix by project when in doubt,
e.g. `myproject_users`), then reference them from `PROJECTS` stats
with `key: "myproject_users"`. Files over 1 MB get truncated by the
gist API and are skipped — stats files will never get close.

Shape the site reads (every key optional):

```json
{
  "guild_count": 12,
  "user_count": 492,
  "uptime": 100.0,
  "last_updated": 1783687032,
  "messages_tracked": 713545,
  "visits": 1234
}
```

- `last_updated` drives the online/offline status — if it's older
  than `SITE.staleAfter` (seconds), the bot shows as `offline?`.
  Currently 1200 s. Once the bot pushes every ~10 s (via the gist
  API path above, that actually shows up), `staleAfter` can drop to
  something like 60 for a much sharper heartbeat.
- `visits` isn't pushed yet, so that stat says `wire me`. Add the key
  to the gist (or the backend) and it lights up — no code change.

### The go backend (later)

Serve the same JSON shape and swap `statsUrl` — one line.
Requirements:

- `GET /stats` → JSON above, `Content-Type: application/json`
- CORS: `Access-Control-Allow-Origin: *` (or the site origin) —
  without it the browser silently refuses and the site shows
  `offline // no answer`.
- No CDN in front of it = actually realtime numbers.
- If it counts visits, have the frontend POST a ping — add that to
  `app.js` when the endpoint exists.

### Offloading data.js itself (later)

`js/data.js` is a plain script, so moving it off the repo is literally
one line: point the `<script src="js/data.js">` tag (all three pages)
at a gist raw URL and it keeps working. Caveats before doing it:

- The hashless raw URL is CDN-cached ~5 min — new artworks take a few
  minutes to appear. Fine for art, and no redeploy.
- Keep the local file for testing: edit locally, open the site, verify
  nothing broke, then paste the file into the gist (or script it —
  a tiny push tool that appends an epoch comment and PATCHes the gist
  is a good first go project).
- Don't load data.js through the gist *API* — script tags need a raw
  JS response, not JSON-wrapped content.

### Google Analytics

- **Sending**: the gtag snippet sits commented in each page's `<head>`.
  Make a data stream for this domain in the GA property, paste the
  `G-…` measurement id, uncomment. Done.
- **Displaying** (visitor counts on the page): not possible from the
  frontend — the GA4 **Data API** requires OAuth or a service account,
  credentials that can't live in public JS. That's a go backend job:
  service account → Data API → expose `{ "visits": N }` → the stats
  pipe picks it up (the `visits` slot already exists and says
  "wire me").

### GitHub numbers (already live, no setup)

- repos + followers: `api.github.com/users/Mistromy`
- commit count: `Link` header trick on
  `repos/Mistromy/Nirupama/commits?per_page=1` — the `rel="last"`
  page number *is* the commit count. Falls back to the shields.io
  badge JSON (`SITE.commitsBadge`) if the API rate-limits.
- Unauthenticated rate limit is 60 req/h per visitor IP — plenty.

### ArtStation images

The art entries in `js/data.js` are hand-maintained with **local**
image paths — ArtStation has no CORS-open public API, so the browser
can't fetch your portfolio directly (their JSON endpoints sit behind
Cloudflare and block cross-origin requests). Options, in order of
sanity:

1. Keep doing what the site does now: save the render into
   `assets/art/`, add one entry to `ART`. ~30 seconds per piece.
2. Later: have the go backend scrape
   `artstation.com/users/mistromy/projects.json` server-side and
   serve it (or push it into the gist) — then the grid can build
   itself.

---

## Domain

When pointing a domain (e.g. `mista.tech` / a subdomain) at this:

1. Add a `CNAME` file to the repo root containing just the domain.
2. DNS: `CNAME` record → `mistromy.github.io`.
3. Update `og:` meta tags in `index.html` if you care about embeds.

## Local preview

It's static — open `index.html`, or `python -m http.server` from the
repo root if fetch/CORS acts up on `file://`.
