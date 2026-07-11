/* ============================================================
   MIST — data
   this file is the whole CMS. everything the site lists lives
   here — links, art, plans, config. add a line, get a card.
   how to add things → DOCS.md. the machinery is in js/app.js,
   you should almost never need to touch it.
   ============================================================ */

const SITE = {
  name: "MIST",
  githubUser: "Mistromy",
  flagshipRepo: "Mistromy/Nirupama",

  /* the stats pipe — Nirupama pushes stats.json to this gist.
     expected JSON shape (every key optional):
     {
       "guild_count": 12,
       "user_count": 492,
       "uptime": 100.0,              // number, percent
       "last_updated": 1783687032,   // unix epoch — drives online/offline
       "messages_tracked": 713545,
       "visits": 1234                // not pushed yet — go backend, someday
     }
     the site tries the gist API first (fresh, no CDN cache — survives
     a 10 s push interval), then falls back to the raw url (CDN-cached
     ~5 min). swap statsUrl for the go backend later — same keys. */
  statsGistApi: "https://api.github.com/gists/cdb82a1247ae6095f5d43098eb074dba",
  statsFile: "stats.json",
  statsUrl: "https://gist.githubusercontent.com/Mistromy/cdb82a1247ae6095f5d43098eb074dba/raw/stats.json",

  /* if last_updated is older than this (seconds), the bot counts as
     offline. gist pushes are ~5 min apart (soon 10 s) and github's
     raw CDN caches ~5 min, so leave headroom. */
  staleAfter: 1200,

  /* shields.io badge JSON — commit-count fallback when the github
     api rate-limits (shields has its own generous limits) */
  commitsBadge: "https://img.shields.io/github/commit-activity/t/Mistromy/Nirupama.json",

  /* set to null to remove the audio widget entirely */
  audio: {
    src: "assets/track.mp3",   // drop an mp3 into assets/ and rename
    title: "tamagotchi-taconafide.mp3",
    volume: 0.12,              // really quiet on purpose — slider in the widget
  },
};

/* ---------- every link that matters. add a line, get a row. ---------- */
const SOCIALS = [
  { name: "ArtStation", sub: "Some of my pictures", url: "https://www.artstation.com/mistromy" },
  { name: "GitHub", sub: "omg He has a github", url: "https://github.com/mistromy" },
  { name: "Discord dm", sub: "@sudomist — fastest way to reach me", url: "https://discord.com/users/859371145076932619" },
  { name: "Discord Server", sub: "Nobody is here", url: "https://discord.gg/kGtPvNgXVu" },
  { name: "Nirupama", sub: "the bot, the site, the playground", url: "https://nirupama.mista.tech" },
  { name: "Ko-fi", sub: "I need money to sink into Nirupama", url: "https://ko-fi.com/mist" },
  { name: "Instagram", sub: "I sometimes post here", url: "https://www.instagram.com/mi5tromy" },
  { name: "Google.com", sub: "I needed to fill the space", url: "https://www.google.com/search?q=mistromy" },
  /* random: [...] instead of url → every click picks one at random */
  {
    name: "another placeholder", sub: "huh, maybe i don't have enough socials.", random: [
      "https://en.wikipedia.org/wiki/Wikipedia:Unusual_articles",
      "https://www.rickroll.it/rickroll.mp4",
      "https://html5zombo.com/",
    ]
  },
];

/* ---------- the archive — 2d and cgi. same pile, one word: art.
   medium: "2d" | "cgi" | ["cgi","2d"] | any new word
           → drives the filter chips. chips generate themselves from
           whatever mediums exist in this list, so a new word here =
           a new filter, no other changes. arrays put a piece in
           several filters at once.
   img:    path under assets/ or any url — a missing file renders as
           a stencil tile instead of breaking, so you can add the
           entry now and the file later. .mp4/.webm urls become
           looping muted videos (animations welcome).
   alt:    optional literal description for screen readers / SEO.
           auto-generated from title + medium when missing.
   newest first — ART[0] fills the "latest transmission" panel and
   ART.length IS the artwork counter. images keep their native aspect
   ratio in the gallery, so no shape juggling needed.

   optional per entry:
   images: ["url", ...]  → extra images (behind the scenes etc.) —
                           they stack under the cover in the fullscreen
                           view, scroll down to see them. the tile gets
                           a +N badge.
   post: { artstation: "https://www.artstation.com/artwork/xxxx",
           instagram:  "https://www.instagram.com/p/xxxx" }
                         → link buttons in the fullscreen caption.
                           either key alone is fine. */
const ART = [
  {
    title: "DON'T LOOK DOWN", year: "2026", medium: ["2d", "photo"], img: "assets/dontlook_down.png", tags: "stencil · schematic · collage",
    note: "MORE OF MY OWN PHOTOGRAPHY"
  },
  {
    title: "OPEN YOUR EYES", year: "2026", medium: ["2d", "photo"], img: "assets/eyes.png", tags: "photo · binary · type",
    note: "More of my own photography."
  },
  {
    title: "DON'T STOP", year: "2026", medium: ["2d", "photo"], img: "assets/lights.png", tags: "glitch · datamosh · signal",
    note: "My third ever poster. Based on my own photography."
  },
  {
    title: "Smart Juice", year: "2026", medium: "cgi", img: "https://cdna.artstation.com/p/assets/images/images/098/445/890/large/mist-pillswatermarked.webp?1777062281", tags: "product · packaging",
    note: "My lawyers say i can't sell this.", post: { artstation: "https://www.artstation.com/artwork/8BABGm" }, images: ["https://cdna.artstation.com/p/assets/images/images/098/446/088/large/mist-pillswireframe.webp?1777062954", "https://cdnb.artstation.com/p/assets/images/images/098/446/139/large/mist-zrzut-ekranu-2026-04-24-213724.webp?1777063052", "https://cdnb.artstation.com/p/assets/images/images/098/446/199/large/mist-zrzut-ekranu-2026-04-24-213823.webp?1777063122", "https://cdna.artstation.com/p/assets/images/images/098/446/228/large/mist-zrzut-ekranu-2026-04-24-213938.webp?1777063183"]
  },
  {
    title: "180SX Wrap", year: "2026", medium: ["cgi", "2d"], img: "https://cdnb.artstation.com/p/assets/images/images/098/027/683/large/mist-180sxposter.webp?1775906831", tags: "vehicle · livery",
    note: "Full sticker-bomb livery study.", images: ["https://cdnb.artstation.com/p/assets/images/images/098/027/685/large/mist-180sx-blackandwhite.webp?1775906594"],
  },
  {
    title: "Gothic Bedroom", year: "2025", medium: "cgi", img: "https://cdna.artstation.com/p/assets/images/images/090/387/186/large/mist-darkacademiaroomresized.jpg?1753788209", tags: "environment · interior",
    note: "Green walls, old money, heavy air."
  },
  {
    title: "Library Light", year: "2025", medium: "cgi", img: "https://cdna.artstation.com/p/assets/images/images/090/255/874/large/mist-cafe11.jpg?1753366098", tags: "environment · lighting",
    note: "A light study with books in the way."
  },
  {
    title: "The Corridor", year: "2025", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/088/487/037/large/mist-corridor.jpg?1748424383", tags: "environment · mood",
    note: "Fluorescent, wet, and going somewhere bad."
  },
  {
    title: "Indoor Pool", year: "2024", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/088/486/999/large/mist-richassbathroom.jpg?1748424270", tags: "interior · water",
    note: "Inspired by some pinterest post."
  },
  {
    title: "Flower Field", year: "2024", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/090/255/863/large/mist-field.jpg?1753366060", tags: "nature · scatter",
    note: "I don't like this one."
  },
  {
    title: "Some cult area", year: "2024", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/088/487/197/large/mist-ancient-gatewayfinal.jpg?1748424711", tags: "scene · story",
    note: "I think they're dead."
  },
  {
    title: "Dark Kitchen", year: "2024", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/088/487/019/large/mist-kimchen.jpg?1748424326", tags: "interior · archviz",
    note: "I didnt know how to texture walls."
  },
  {
    title: "Moody Bar/room", year: "2024", medium: "cgi", img: "https://cdna.artstation.com/p/assets/images/images/088/489/024/medium/mist-unreal-bar-final1080p.jpg?1748428191", tags: "interior · lighting",
    note: "First interior render I like."
  }
];

/* ---------- numbers no API will admit to. update by hand. ---------- */
const MANUAL = {
  commitsFallback: "278+", // shown only if the github api won't answer
};

/* ---------- projects — flagship gets the big box, the rest get cards.
   stats entries: { label, key }        → live value from the stats gist
                  { label, value }      → static, written by hand
   optional per stat: compact: true     → 713545 shows as 713K
                      fmt: "percent"    → 99.98 shows as 99.98%
   add a project = add an object. wiring live data for it = push the
   key into the gist and reference it here. that's the whole flow. */
const PROJECTS = [
  {
    name: "Nirupama",
    flagship: true,
    desc: "A do-a-bit-of-everything Discord bot: AI chat with a tunable personality, a /ship command that reads actual user data instead of rolling dice, activity graphs backed by Postgres. Started as a level bot storing JSON. Never stopped evolving.",
    pills: ["python", "go", "postgres · supabase", "discord api", "cronitor uptime"],
    links: [
      { label: "visit the site", url: "https://nirupama.mista.tech", solid: true },
      { label: "read the source", url: "https://github.com/Mistromy/Nirupama" },
    ],
    stats: [
      { label: "servers", key: "guild_count" },
      { label: "members reached", key: "user_count" },
      { label: "messages tracked", key: "messages_tracked", compact: true },
      { label: "uptime, 30d", key: "uptime", fmt: "percent" },
    ],
  },
  /* template for the next one:
  {
    name: "project name",
    desc: "what it is, one or two sentences.",
    pills: ["stack", "goes", "here"],
    links: [{ label: "source", url: "https://github.com/..." }],
    stats: [
      { label: "some number", value: 42 },          // by hand
      { label: "live number", key: "my_gist_key" }, // from the gist
    ],
  },
  */
];

/* the log prose lives in index.html (#log) — it's writing, not data */

/* ---------- forecast — subject to evaporation.
   status: "planned" | "in progress" | "ongoing" | "done" | "tomorrow" */
const PLANS = [
  {
    title: "stats pipe", status: "done",
    note: "Nirupama pushes stats.json to a gist every few minutes; this page reads it live. Next: cranking the interval down to ~10 s for actually-realtime numbers."
  },
  {
    title: "go backend", status: "planned",
    note: "A small service, hosted separately, for the numbers no public API will hand over — visits, private stats, whatever the frontend can't scrape."
  },
  {
    title: "more 2d", status: "ongoing",
    note: "First pieces in years shipped. The signal series isn't done transmitting."
  },
  {
    title: "nirupama", status: "ongoing",
    note: "Started as a level bot storing JSON. Never stopped evolving. No reason to start stopping."
  },
  {
    title: "give up", status: "tomorrow",
    note: "Quitting is fully allowed — tomorrow. Today there's still stuff to finish. It's been 'tomorrow' for years now, and somehow everything keeps shipping."
  },
];

/* ---------- the marquee ---------- */
const MARQUEE = [
  "please, wake up", '"I guess, I\'m afraid..."', "#299.9KG CLUB", "I'll give up tomorrow",
  "I choose UNLIMITED games, but no games", "mist you too", "visibility: low", "do not evaporate",
  "stay condensed", "into thin air", "起きてください", "mgła gęstnieje", "もやもや", "67", "mist-er Worldwide",
  '"Hey you, you\'re finally awake."', '"Protocol 3: Protect the Pilot"', "The fog is coming.", "rendered in 240p",
  "gęsto tu", "it works on my machine", "znowu mam hikikomori", "cicho wszędzie, głucho wszędzie"
];
