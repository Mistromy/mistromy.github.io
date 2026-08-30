# The old homepage — everything it had

The homepage was replaced. This file is the record of what was on it, so
nothing gets lost by accident and nothing has to be re-remembered later.

**Scope.** Written from `index.html` as it stood at commit `f08c232`,
before the rewrite. Everything below is either verbatim or a description
of behaviour. If you want the exact markup back rather than the words:

```bash
git show f08c232:index.html
```

The jokes and one-liners live in `humour.md`, which is still the holding
pen for those. This file is about **structure, prose and headers** — the
things `humour.md` deliberately doesn't cover.

Legend for what happened to each piece:

- **KEPT** — on the new page now
- **PARKED** — deliberately dropped for now, wanted back later
- **GONE** — dropped on purpose, not coming back

---

## Head — SEO and metadata

All **KEPT**, carried onto the new `index.html` unchanged.

| | |
|---|---|
| `<title>` | `MIST — Portfolio` → now `MIST — CGI artist and backend developer` |
| description | "Mist (Mistromy) — student, CGI artist and developer. 3D environment renders and 2D poster art, plus software projects including the Nirupama Discord bot. Portfolio and links." |
| `og:title` | `MIST — art & code portfolio` |
| `og:image` | `https://mistromy.github.io/assets/og.png` |
| `og:description` | "Mist (Mistromy) — student, CGI artist and developer. 3D renders, 2D posters, and software projects." |
| `twitter:card` | `summary_large_image` — Discord only shows the image big when this is present |
| canonical | `https://mistromy.github.io/` |
| favicon | `https://avatars.githubusercontent.com/u/125371422?v=4` |
| Google Analytics | `G-1TMG615E9J`, cookieless mode (`analytics_storage` and `ad_storage` denied before init) |

**JSON-LD `Person` schema** — KEPT verbatim. Worth knowing it carries
`alternateName: ["Mistromy", "sudomist", "Mjist", "jjeff"]`,
`knowsAbout: ["CGI", "3D rendering", "Blender", "2D design", "Python", "Go", "PostgreSQL"]`,
and a `sameAs` list of ArtStation, GitHub, Instagram, YouTube, Steam,
Ko-fi and nirupama.mista.tech.

---

## Chrome — the system face

**GONE.** The whole `.sys` register.

- **Boot sequence** — played once per session, click to skip. Log lines:
  `> condensing…………………… ok` / `> heartbeat…………………… found` /
  `> can you hear me?`
- **System bar** — `MIST.SYS`, status `condensing…`, `SYS_EPOCH // ———`,
  `VISITS // ———`, and a pulsing dot
- **Audio player** — `no_signal.mp3` label, play button, EQ bars, volume
  slider defaulting to 12%. Played `assets/track.mp3`
  (`tamagotchi-taconafide.mp3`). File deleted, config removed from
  `data.js`. Someone else's copyrighted track, autoloaded, on a site
  whose own legal page has to be accurate. Not coming back.
- **Cursor fringe** — a radial glow following the pointer
- **Nav** — `/ABOUT /LINKS /ART /SYS /BIO`, with `/ART` and `/SYS`
  dropping down to the full pages. Corner note: `// stay condensed`

---

## 1 · About / hero

- Eyebrow: `// transmission open — can you hear me?` — **PARKED**
  (it's in `humour.md` under "the one you just removed and want to keep")
- GitHub avatar in a frame, beside a glitching `MIST` wordmark — **GONE**,
  replaced by the `/// mist ///` masthead
- Lede — **PARKED**:
  > **Student**. **CGI artist**. I also write code - **some of it runs**, but most doesn't even walk.
- Buttons: `my art` / `my projects` / `my socials` — **GONE**
- Blockquote `// stdout` + a random `MARQUEE` line — **KEPT** as the
  `>` quote under the tagline
- **The three paragraphs — KEPT verbatim, all three.** This is the
  personality and it does not get trimmed:
  > **Mist.** aka **sudomist** or **Mistromy** depending on what usernames were taken. I do CGI, coding, recently started 2D art, and generally anything that is involved with computers.

  > I try to pretend I know what I'm doing, and apparently it's working? some of the [numbers further down] are pretty big.

  > More about me — [down below], for the passionates and stalkers.

  ⚠ The two bracketed phrases linked to `#sys` and `#log`. Both targets
  are gone, so they are `<span class="pending">` now — styled as links,
  not clickable. Restore the sections or reword the lines.

- **Latest transmission panel** — **PARKED**. Sticky aside, auto-filled
  from `ART[0]`: header `LATEST // TRANSMISSION`, stamp, uncropped image,
  title, note, `full archive ->`. The reel replaced its job.

---

## 2 · Links

**PARKED** — becomes the Socials page.

- Eyebrow: `// find my socials`
- Header: `Links`
- Rendered from `SOCIALS` in `js/data.js`, which is **still there and
  still complete** — nine entries with their one-liners
  (`omg He has a github`, `Nobody is here`, `I need comments, PLEASE.`).
  Nothing to rewrite; build the page and it fills itself.

---

## 3 · Art

**KEPT**, as the `#art` zone plus `art.html`.

- Eyebrow: `// the newest transmissions — full archive one door down` — PARKED
- Header: `Art` (linked to `art.html`)
- Blurb — **KEPT**:
  > 2D and CGI in one pile — posters, environments, light studies, type experiments. The newest few live here; the rest are in the archive.
- Taster capped at whole rows, `full archive ->` button below — KEPT as
  the row cap. **The button itself is still to be designed**, along with
  a section header for the zone.

Then the **marquee** — a single scrolling band of shuffled `MARQUEE`
lines. **GONE** as a band; the lines now surface in two placed slots
(under the tagline, foot of the rail), per `humour.md`'s own rule.

---

## 4 · Sys — the numbers

**PARKED.** This is the biggest single thing dropped, and the one the
copy still promises.

- Eyebrow: `// sector_sys — err… nominal`
- Header: `Sys` (linked to `projects.html`)
- Blurb:
  > The dabbling, in public. Every number below is fetched live — if a wire's cut, it says so instead of making something up.
- Flagship project card, rendered from `PROJECTS` in `js/data.js`
- Numbers block, eyebrow `// the numbers — live where the wires reach, honest everywhere`:

  | figure | source label |
  |---|---|
  | public repos | `github // live` |
  | github followers | `github // live` |
  | commits on one bot | `github // live` |
  | servers running Nirupama | `stats pipe // live` |
  | pieces in the archive | `counted by the site // live` |
  | visits to this console | `stats pipe // wire me` |

- `all projects ->` button

`PROJECTS`, `SOURCES` and `MANUAL` are all **still in `js/data.js`**,
wired to `api.mista.tech`. The endpoint works — it was returning 764K
messages tracked, 513 members, 12 servers and 99.98% 90-day uptime
during the rewrite. Nothing needs rebuilding but the markup.

`projects.html` was deleted; recover it with
`git show f08c232:projects.html` if it's useful as a starting point.

---

## 5 · Log — the bio

**PARKED** — becomes the About page.

- Eyebrow: `// bio — for the passionates and the stalkers`
- Header: `Bio`
- Blurb:
  > The long version, as written. One take, no hindsight. The queue of what's next sits beside it — no promises attached.

**"Currently"** (eyebrow `// currently`) — two paragraphs. The first is
**KEPT** on the new page; the second is PARKED:
> I'm a Polish, self-taught student from Ireland.

> I am fully self taught in cgi and coding. I don't really learn things by the book. I have an idea, i start making a stupid project, and try to stick something together with my limited knowledge. When i learn something new, it's because I actually need it. But usually it ends up in me re-inventing the wheel.

There was a `✏ WRITE THIS` note against this block asking for 2–3 short
present-tense paragraphs — what you make now, what you're learning, what
to ask you about. **Still unwritten.**

**The stack** — eyebrow `// the stack — hover for names`, icons B&W
popping to colour on hover, from `STACK` in `js/data.js` (12 entries,
still there). PARKED. Note the icons were hotlinked from jsDelivr,
Iconify, Icons8, Wikimedia, Fandom and Adobe — bringing this back means
those return to the legal page's third-party list.

**The long prose** — three paragraphs, `data-nosnippet` so search engines
and AI overviews can't quote the fun facts as if they were a résumé.
**PARKED, and this is the one worth keeping intact.** Full text:

> I started getting involved with computers in 2018, when I first tried Scratch. After that, **it only got worse**. God knows when and why I tried HTML, then I started making some websites for my own use. Then I learned about Python, and around that time — it was 2021 — I started using Discord. And I just never moved on.

> During 2021 I also started trying other things. Until then my "hobby" was origami. But I started learning piano, and I was following my dad's footsteps, developing a liking for computers, photography and Photoshop. I never made anything serious back then, but it was fun — which is the biggest mistake I ever made, as I now know that **fun is for the weak**. Around early 2022, I tried Blender. I don't know what made me do that, but I gave it a go. And I failed. I don't remember if my friend showed it to me first, or how I found it, but at some point I watched the donut tutorial. As they say, ignorance is bliss, and I was quite literally unaware of how bad my work was. I was completely blinded by the fact that the render engine did the lighting for me and made a basic room look good. And then I just started doing Blender. I never watch tutorials, so over the 4–5 years I've done it, and the 800+ hours poured into Blender alone, I am nowhere near where I wanna be. But *We ball*.

> During this entire time I had this pent-up desire for more, though. So I was making Discord bots — my biggest project yet, [Nirupama], started as a super basic levels bot, and I just kept adding more to him. And even though I completely switched to Blender, some seed of creativity from Photoshop stayed, until very recently — where I tried 2D art for the first time in a long time. And oh, my old friend **blissful ignorance**: I think it looks good, so I'll do that for a while now, if I don't get bored. Because I'm having fun.

The new homepage carries a **three-line compression** of this. If the
About page gets built, the full version above belongs there.

**Discord card** — eyebrow `// my current status`, live via Lanyard:
avatar, status dot, `Mist` / `sudomist`, custom status, current activity.
**GONE.** `SITE.discordId` is still in `data.js`, but Lanyard only
answers for IDs registered by joining their Discord — it was never
actually live. Bringing it back re-adds `api.lanyard.rest` to the legal
page.

---

## Footer

- Mist signature + one random `MARQUEE` line — **KEPT** (foot of the rail)
- `© <year> mist · github · artstation · legal` — **KEPT**, trimmed to
  `contact` / `legal` / `© year mist`
- **Layout was `justify-content: space-between`**, not centred — signature
  left, copyright right. The rail footer is centred now; that's a change,
  not a restoration.
- `BADGES` (88×31 buttons) — empty array, never rendered. Still in
  `data.js`.

---

## Still to design

Flagged during the rewrite and deliberately left alone:

1. The **"more" button** under the `#art` taster
2. A **section header** for the `#art` zone
3. The **Projects** page and its on-page zone
4. **Socials** and **About** pages — both are inert rows in the nav
5. The `// currently` paragraphs, never written
6. A **real email address** — `legal.html` and the rail both still route
   contact through the Discord DM, and both say an address is coming
