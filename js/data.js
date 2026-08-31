/* ============================================================
   MIST — data
   this file is the whole CMS. everything the site lists lives
   here — links, art, plans, config. add a line, get a card.
   how to add things → DOCS.md. the machinery is in js/site.js,
   you should almost never need to touch it.
   ============================================================ */

const SITE = {
  name: "MIST",
  githubUser: "Mistromy",
  flagshipRepo: "Mistromy/Nirupama",

  /* discord presence via lanyard (api.lanyard.rest) — shows the live
     activity (custom rich presences included: vsc, blender…) in the
     sysbar. stays completely silent until this id is registered by
     joining the lanyard discord server: https://discord.gg/lanyard */
  discordId: "859371145076932619",

  /* every live number the site shows comes from SOURCES, right below.
     add an endpoint there, reference its keys from PROJECTS. */

  /* default for a source without its own staleAfter (seconds): how old
     a heartbeat can get before the thing counts as offline. */
  staleAfter: 1200,

  /* shields.io badge JSON — commit-count fallback when the github
     api rate-limits (shields has its own generous limits) */
  commitsBadge: "https://img.shields.io/github/commit-activity/t/Mistromy/Nirupama.json",

  /* the audio widget is gone, and so is assets/track.mp3. it played
     someone else's copyrighted track, unasked, on a page whose own
     legal notice has to be accurate — a liability and an annoyance
     in one. don't put it back. */
};

/* ---------- where the live numbers come from ----------
   one entry per api. all of them are fetched in parallel on load and
   merged into a single lookup, so anywhere the site wants a number it
   just names the key:   { label: "servers", key: "guild_count" }

   sources are tried top to bottom and the FIRST one that has a key
   wins — put the most trustworthy api first. when two of them publish
   the same name, pin one with a prefix:  key: "gist.uptime"

   per source, everything except url is optional:
     url         endpoint returning a JSON object. it must send CORS
                 headers for this site's origin (https://mista.tech) or
                 the browser drops the response and the numbers go dark.
     fallback    second url, tried only when the first one fails.
     format      "gist" → parse every *.json file in the gist response
                 and merge them. omitted → the body IS the object.
     heartbeat   key holding the last-write epoch, seconds or ms (both
                 understood) → drives the online/offline readout.
     staleAfter  seconds before that heartbeat reads as offline.
                 falls back to SITE.staleAfter.
     refresh     seconds between re-fetches. omit = fetch once on load.
     map         { "their_name": "our_name" } rename table, for apis
                 that don't use the site's key names.
     label       shown in the "// live" source line under a stat.

   a websocket feed (wss://api.mista.tech/nirupama/live) exists but the
   site doesn't speak it yet — polling with `refresh` is close enough. */
const SOURCES = {
  /* the selfhosted go api — no CDN in front of it, so these numbers
     are actually current. source: github.com/Mistromy/MistAPI */
  nirupama: {
    label: "mist api",
    url: "https://api.mista.tech/nirupama",
    /* heartbeat_epoch_ms is the BOT's last push (~5 min apart), not the
       api's freshness — epoch_ms is that, and it'd read "online" even
       with the bot face down. so staleAfter has to cover the push
       interval with room to spare; drop it to ~60 the day the bot
       pushes every 10 s and the readout gets sharp for free. */
    heartbeat: "heartbeat_epoch_ms",
    staleAfter: 1200,
    /* nothing here moves faster than the bot pushes — polling harder
       just burns requests on numbers that haven't changed */
    refresh: 60,
  },

  /* the old gist pipe — kept as the home for anything the api doesn't
     serve yet (visits), and as a second opinion when it's down. one
     *.json file per project, so no writer can clobber another. */
  gist: {
    label: "stats pipe",
    url: "https://api.github.com/gists/cdb82a1247ae6095f5d43098eb074dba",
    format: "gist",
    fallback: "https://gist.githubusercontent.com/Mistromy/cdb82a1247ae6095f5d43098eb074dba/raw/stats.json",
    heartbeat: "last_updated",
    staleAfter: 1200,
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
  { name: "YouTube", sub: "videos, apparently", url: "https://www.youtube.com/@Mistromy" },
  { name: "Steam", sub: "I need comments, PLEASE.", url: "https://steamcommunity.com/id/mistromy/" },
  /* benched, not deleted — bring back whenever there's a reason:
  { name: "Google.com", sub: "I needed to fill the space", url: "https://www.google.com/search?q=mistromy" },
  // random: [...] instead of url → every click picks one at random
  {
    name: "another placeholder", sub: "huh, maybe i don't have enough socials.", random: [
      "https://en.wikipedia.org/wiki/Wikipedia:Unusual_articles",
      "https://www.rickroll.it/rickroll.mp4",
      "https://html5zombo.com/",
    ]
  },
  */
];

/* ---------- 88x31 badges — the footer row. empty = no row rendered.
   drop files into assets/badges/ (or hotlink) and add lines:
   { img: "assets/badges/whatever.gif", url: "https://...", alt: "what it is" },
   url is optional — badges without one just sit there looking retro. */
const BADGES = [
];

/* the availability strip (commissions / collabs) lives directly in
   index.html — it's two lines of writing, not data */

/* ---------- the stack — the icon strip in the about section.
   icons render black & white and pop to colour on hover, with the
   name (and optional sub) as the hover label.
   icon: any image url. missing/dead url = name-only chip, so local
         paths like "assets/icons/x.svg" are fine to add before the file.
   sub:  optional one-word honesty tag, shows under the name on hover. */
const STACK = [
  { name: "Blender", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg" },
  { name: "VS Code", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" },
  { name: "GitHub", icon: "https://api.iconify.design/simple-icons/github.svg?color=%23e9e3d3" },
  { name: "Affinity", icon: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Affinity_%28App%29_Logo.svg" },
  { name: "Substance Painter", icon: "https://experienceleague.adobe.com/en/docs/substance-3d/general-knowledge/ecosystem/media_1cb978542586dac191339b3512cfd11bd8285165c.svg?width=2000&format=webply&optimize=mediums" },
  { name: "Paint.NET", icon: "https://static.wikia.nocookie.net/logopedia/images/c/c7/Paint.NET_2014_Stacked.png/revision/latest?cb=20220510141637" },
  { name: "Fusion", icon: "https://api.iconify.design/simple-icons/autodesk.svg?color=%23e9e3d3" },
  { name: "SolidWorks", icon: "https://img.icons8.com/?size=512&id=62397&format=png" },
  { name: "Onshape", icon: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/onshape.svg" },
  { name: "DaVinci Resolve", icon: "https://api.iconify.design/simple-icons/davinciresolve.svg?color=%23e9e3d3" },
  { name: "Go", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" },
  { name: "Git", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
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
    title: "NO ENTRY", year: "2026", medium: ["2d", "photo"], img: "https://cdnb.artstation.com/p/assets/images/images/100/731/981/large/mist-no-entry2.jpg?1783886414", tags: "brutalist, color, print",
    note: "really enjoying making this. photo taken in Poznań",
    images: ["https://cdna.artstation.com/p/assets/images/images/100/723/294/large/mist-whatsapp-image-2026-07-07-at-22-19-58.jpg?1783861718"],
    post: { artstation: "https://www.artstation.com/artwork/kw4Oa6", instagram: "https://www.instagram.com/p/Db3YEsTiCcJ" }
  },
  {
    title: "DON'T LOOK DOWN", year: "2026", medium: ["2d", "photo"], img: "https://cdnb.artstation.com/p/assets/images/images/100/723/241/large/mist-dontlook-down.jpg?1783861550", tags: "stencil · schematic · collage",
    note: "MORE OF MY OWN PHOTOGRAPHY",
    images: ["https://cdnb.artstation.com/p/assets/images/images/100/723/301/large/mist-whatsapp-image-2026-07-06-at-15-47-50.jpg?1783861746"],
    post: { artstation: "https://www.artstation.com/artwork/G1Xdz3" }
  },
  {
    title: "OPEN YOUR EYES", year: "2026", medium: ["2d", "photo"], img: "https://cdnb.artstation.com/p/assets/images/images/100/681/089/large/mist-eyes.jpg?1783691774", tags: "photo · binary · type",
    note: "More of my own photography.",
    images: ["https://cdnb.artstation.com/p/assets/images/images/100/723/323/large/mist-img-20260704-214932.jpg?1783861815"],
    post: { artstation: "https://www.artstation.com/artwork/41bln4" }
  },
  {
    title: "DON'T STOP", year: "2026", medium: ["2d", "photo"], img: "https://cdnb.artstation.com/p/assets/images/images/100/543/347/large/mist-lights.jpg?1783265712", tags: "glitch · datamosh · signal",
    note: "My third ever poster. Based on my own photography.",
    images: ["https://cdnb.artstation.com/p/assets/images/images/100/723/347/large/mist-original.jpg?1783861935"],
    post: { artstation: "https://www.artstation.com/artwork/8vWQ3x" }
  },
  {
    title: "Pills", year: "2026", medium: "cgi", img: "https://cdna.artstation.com/p/assets/images/images/101/069/288/medium/mist-pills3.jpg?1784981817",
    tags: "realism · closeup", note: "inspired by a shot from Ash Thorp's awaken akira"
  },
  {
    title: "Smart Juice", year: "2026", medium: "cgi", img: "https://cdna.artstation.com/p/assets/images/images/098/445/890/large/mist-pillswatermarked.webp?1777062281", tags: "product · packaging",
    note: "My lawyers say i can't sell this.", post: { artstation: "https://www.artstation.com/artwork/8BABGm" },
    /* images entries can be a plain url OR { src, tag } — the tag shows
       as a chip on that frame in the fullscreen view ("final",
       "wireframe", "iteration", any word). mix both forms freely: */
    images: [
      { src: "https://cdna.artstation.com/p/assets/images/images/098/446/088/large/mist-pillswireframe.webp?1777062954", tag: "wireframe" },
      { src: "https://cdnb.artstation.com/p/assets/images/images/098/446/139/large/mist-zrzut-ekranu-2026-04-24-213724.webp?1777063052", tag: "viewport" },
      "https://cdnb.artstation.com/p/assets/images/images/098/446/199/large/mist-zrzut-ekranu-2026-04-24-213823.webp?1777063122",
      "https://cdna.artstation.com/p/assets/images/images/098/446/228/large/mist-zrzut-ekranu-2026-04-24-213938.webp?1777063183",
    ]
  },
  {
    title: "180SX Wrap", year: "2026", medium: ["cgi", "2d"], img: "https://cdnb.artstation.com/p/assets/images/images/098/027/683/large/mist-180sxposter.webp?1775906831", tags: "vehicle · livery",
    note: "Full sticker-bomb livery study.", images: ["https://cdnb.artstation.com/p/assets/images/images/098/027/685/large/mist-180sx-blackandwhite.webp?1775906594"],
  },
  {
    title: "RampageRally stuntman", year: "2026", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/092/611/929/large/mist-rampagerallies43.webp?1760125297", tags: "Rampage Rally · Animation",
    note: "Couldn't finish this one due to technical issues and time, but it was a huge learning experience."
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
    title: "Flower Field", year: "2024", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/090/255/863/large/mist-field.jpg?1753366060", tags: "nature · scatter"
  },
  {
    title: "Some cult area", year: "2024", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/088/487/197/large/mist-ancient-gatewayfinal.jpg?1748424711", tags: "scene · story",
    note: "I think they're dead."
  },
  {
    title: "Dark Kitchen", year: "2024", medium: "cgi", img: "https://cdnb.artstation.com/p/assets/images/images/088/487/019/large/mist-kimchen.jpg?1748424326", tags: "interior · archviz",
    note: "I didn't know how to texture walls."
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
   stats entries: { label, key }        → live value, from SOURCES
                  { label, value }      → static, written by hand
                  { label, status }     → heartbeat of a source id,
                                          e.g. status: "nirupama"
   optional per stat: compact: true     → 713545 shows as 713K
                      fmt: "percent"    → 99.98 shows as 99.98%
   `key` names a key any source publishes; prefix it with a source id
   ("gist.visits") to pin it to one. add a project = add an object.
   wiring live data for it = publish the key from an endpoint in
   SOURCES and reference it here. that's the whole flow. */
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
      { label: "uptime, 90d", key: "nirupama.uptime", fmt: "percent" },
      { label: "status", status: "nirupama" },
    ],
  },
  {
    name: "Mist API",
    desc: "A unified go https and websocket API for all my projects.",
    pills: ["go", "tailscale"],
    links: [
      { label: "Read the source", url: "https://github.com/Mistromy/MistAPI" }
    ],
    stats: [
      { label: "uptime, 90d", value: "soon", fmt: "percent" }
    ]
  },
  /* template for the next one:
  {
    name: "project name",
    desc: "what it is, one or two sentences.",
    pills: ["stack", "goes", "here"],
    links: [{ label: "source", url: "https://github.com/..." }],
    stats: [
      { label: "some number", value: 42 },        // by hand
      { label: "live number", key: "my_key" },    // from any source
      { label: "status", status: "nirupama" },    // a source's heartbeat
    ],
  },
  */
];

/* ---------- /labs — the writeups. its own section, not a project card.
   art breakdowns and code architecture both live here.
   { title, kind, year, blurb, url }
   kind: "cgi" | "code" | anything else you want as a label.
   empty array = the section renders an honest "nothing yet" state
   instead of inventing entries. add one line, get a row:

   { title: "ccmanager — the world model", kind: "code", year: "2026",
     blurb: "sparse chunked voxels, morton ordering, and why A* needed
             orientation in the search node.", url: "labs/ccmanager.html" },
*/
const LABS = [
];

/* the log prose lives in index.html (#log) — it's writing, not data */

/* ---------- the marquee ---------- */
const MARQUEE = [
  "please, wake up", '"I guess, I\'m afraid..."', "#299.9KG CLUB", "I'll give up tomorrow",
  "I choose UNLIMITED games, but no games", "mist you too", "visibility: low", "do not evaporate",
  "起きてください", "mgła gęstnieje", "もやもや", "67", "mist-er Worldwide",
  '"Hey you, you\'re finally awake."', '"Protocol 3: Protect the Pilot"', "The fog is coming.", "rendered in 240p",
  "it works on my machine", "znowu mam hikikomori", "cicho wszędzie, głucho wszędzie",
  "big facts, no printer", "si vis pacem, para bellum", "Local bars hate this simple trick",
  "will a turtle not be part of the choir?", "bajo jajo, bajo jajo", "BLOOD FOR THE BLOOD GOD",
  "please uninstall", "pool's closed", "GOLD GOLD GOLD", "TITAN HOLO", "GREEN, GREEN",
  "biggest torta", "workin' hard or hardly workin' ? ",
  "my code runs, but i sprint", "to nie sprzęt, a technicka robi z ciebie zawodnika", "wąchaj gume leszcu",
  "jestem oazą spokoju", "brzuch boli od pizzy", "Press F to pay respects.",
  "You cannot rest now, there are monsters nearby.", "The cake is a lie.", "F",
  "patio is closed because it's not open", "Veni, vidi, abii",
  "I came, i saw, i conquered", "i'd betray my country for confetti",
  "we win these", "Technoblade never dies", "MIST from DOWNTOWN",
  "that's a lot of science", "funny quote", "+REP", "Welcome to zombo.com!", '"Technoblade" -Technoblade',
  "not even close", "if you wish to defeat me, train for another hundred years", "I'm always in pursuit of knowledge",
  "clutching my pearls!", "I'm glad you asked!", "I don't believe in comedy",
  "w piątki leżę w wannie", 'git commit -m "please work"', "patrz, to noWy baTmAN", "unexpected like a mixtape",
  "bede gral w gre",
]
