- [x] change mistromy names to mist.
- [ ] update domain — CNAME file + DNS record still needed, steps in DOCS.md
- [x] add mist puns
- [x] add working numbers — github repos/followers/commits live; nirupama servers/members/uptime/messages live from the stats gist; visits waits on the go backend
- [x] combine 2d and 3d pages — one /ART section with filter chips
- [x] remove some cringe lines
- [x] add cooler effects. but no scrolljacking, scroll effects, cursor effects can be added. but dont replace the actual cursor.
- [x] drop cgi renders into assets/art/ (tiles show stencil placeholders until then; any export ratio works — the gallery lays out native ratios)
- [x] wire the stats gist — done, reads nirupama's stats.json gist live (api first, raw url fallback)
- [x] stats read from named SOURCES in data.js — api.mista.tech/nirupama first (30 s poll, 120 s stale window), gist kept as the fallback for keys the api doesn't serve
- [ ] serve `visits` from the api — last key still saying "wire me"
- [ ] teach the site wss://api.mista.tech/nirupama/live — polling covers it for now, socket would just cut the latency
- [ ] add https://mistromy.github.io + a localhost origin to the api's CORS allowlist, or live numbers only work on mista.tech
- [x] split into taster homepage + art.html (full archive) + projects.html (flagship + project cards + repos)
- [x] artworks counter = ART.length, no redeploy for count changes
- [x] messages tracked → nirupama box, 713K big + full number in the label
- [x] marquee: seamless loop (no off-screen dead time), shuffled every load
- [x] random marquee quote in the about block + nav corner note
- [x] mystery link — placeholder social rolls wikipedia-unusual / rickroll / zombo per click
- [x] gallery: sparse last row folds into the previous one — no more tile-sized holes
- [x] multi-image posts (images: [...]) + artstation/instagram links (post: {...}) in fullscreen view
- [x] nav unified across all pages, /ART + /SYS hover-dropdown to full pages
- [x] art + sys headers clickable, big artstation link on /art, github link on /projects
- [x] dropdown fade/slide animation
- [x] audio: quiet default (0.12) + volume slider; audio:null in data.js removes the widget
- [x] video/animation support in the gallery (.mp4/.webm = looping muted tile, controls in fullscreen)
- [x] multi-tag mediums (["cgi","2d"]) + filter chips auto-generate from data
- [x] search wired, input commented out in art.html until the archive needs it
- [x] lightbox: per-image sizing (vertical frames no longer zoomed), raw ↗ button on every image
- [x] lightbox swipe left/right on touch
- [x] mobile: burger menu (closes on outside tap), general layout polish
- [x] SEO/AEO: factual meta + JSON-LD person schema, auto alt texts, data-nosnippet on the fun-facts bio
- [x] stats pipe merges every *.json file in the gist — one file per project, no override risk
- [ ] google analytics: paste the G-… id into the commented snippet (all 3 heads) once the data stream exists
- [ ] displaying GA visitor counts = go backend (GA4 Data API needs a service account)
- [x] mobile menu: invisible scrim swallows the closing tap — nothing underneath gets clicked
- [x] volume slider restyled — thin filled line + square thumb, no browser chrome
- [x] random nav quote visible on mobile, ellipsized instead of wrapping at mid widths
- [x] gallery packing balanced — no more tiny rows (cult area) or giant/midget neighbours
- [x] lightbox: framed panel (click outside = close), page scroll locked, mobile layout unbroken
- [x] stat numbers animate when scrolled into view, not on page load
- [x] plans copy: "give up (tomorrow)" reframed as procrastination-as-motivation, evaporation puns dropped
- [x] footer lines pull from the random quote pool

- [x] gallery tiles actually load — gen_embeds wrote `.avif`, app.js asked for `.s.jpg`, so every tile silently fell back to the multi-MB original. now webp+jpg at one size (900px), measured & rendered from the same fetch. art.html went 4 MB -> 327 KB
- [x] /p/ embeds point at the original artstation image again (+ real og:image:width/height so discord renders it large). tiles are gallery-only now
- [x] track.mp3 no longer downloads on page load — `preload="none"`, fetched on first press
- [x] legal.html — privacy notice, third-party list, acknowledgements. linked from every footer
- [ ] ⚠ replace assets/track.mp3 — it's a commercial recording (taco/quebonafide). hosting it is straightforward infringement and the repo lives on the same account as everything else
- [x] fonts downloaded — 11 woff2 in assets/fonts/ (261 KB), css/fonts.css generated from google's own unicode-ranges. latin AND latin-ext per weight, because polish diacritics (mgła, wszędzie, Poznań) live in latin-ext and latin alone breaks words mid-render
- [ ] activate the fonts — swap the 3 google <link> lines for `<link rel="stylesheet" href="css/fonts.css">` in all 5 heads. removes a processor from legal.html too
- [x] audio player fixed — was `preload="auto"` speculatively buffering, the aborted range request latched `broken=true` via player.onerror, after which the button only swapped the title. verified playing: currentTime 16.98 -> 22.99 over a 5s wait
- [ ] mark the polish/japanese bits `lang="pl"` / `lang="ja"` (marquee lines, notes) — page-level lang="en" is already right

go backend for scraping artstation and substituting links in the thing
zoom option in the images, and fix laggingess

---

## the rewrite — decided, not started

one site, layered by depth. NOT a professional/casual split: search picks the
entry point, so the fun version accumulates the inbound links and outranks the
boring one, and you'd be maintaining two copies against a year that has no room
for it. sober above the fold, humour below it and in /bio. if a stripped
artefact is needed to hand someone, that's a one-page pdf from the same data,
not a second site.

blocked on the name (everything in this group lands in one pass):
- [ ] handle + domain decided -> rebrand, real email, canonical/sitemap/robots/og/BASE all repointed (6 places, they currently name mistromy.github.io while the site serves from mista.tech)
- [ ] mailto on the site — currently the only contact route is a discord dm
- [ ] search terms into real page titles + h1s: "mist nirupama", "mist projects", "mist contact", "mist cgi"
- [ ] interlink every profile both ways (artstation/github/instagram/steam -> folio, and back)

not blocked, do whenever:
- [ ] h1 on art.html + projects.html (both currently start at h2), og tags on both (they have none)
- [ ] drop `data-nosnippet` off the bio — it's the richest description of you on the site and it's the one thing search and llms are told not to quote
- [ ] stack grid redesign: names visible without hover, separated by ・, no ides, no libs.
      blender / affinity / davinci · go / caddy / python · substance
- [ ] lightbox focus management — it claims aria-modal but focus stays behind it
- [ ] `.tool` uses aria-label on a bare div, which screen readers ignore. needs role="img" or real text (the redesign fixes this for free)
- [ ] kill the boot sequence, the sys_epoch readout and the broken visit counter — all three read as generated filler
- [ ] palette cleanup
- [ ] /labs (call the section "nerds" if you like, but the URL carries the search term): /labs/ccmanager first. ONE project, one page, shipped
- [ ] per-project indexable pages — right now the /p/ stubs are noindex, so artstation gets all the image seo and this site gets none
- [ ] copy rewrite by hand. understate the tone, not the facts

MistAPI as single source — two couplings to design around, not afterwards:
- gen_embeds.py reads data.js at BUILD time (DATA_JS_URL already supports a
  remote source). if art data goes live, tile+stub generation has to move to a
  schedule, not push.
- if art metadata is fetched client-side, google sees an empty gallery. scrape
  in go, but inject at build so the html ships populated.
- have the api return image w/h. that kills measureArt entirely — the grid could
  lay out before a single image byte arrives, instead of awaiting Promise.all on
  every image and blanking the section when one cdn is slow.