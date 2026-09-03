/* ============================================================
   MIST — homepage machinery

   Three things happen here and nothing else:
     1. the random lines get seeded into their two slots
     2. the decorative reel is built
     3. the gallery renders and the viewer opens

   The live-data plumbing, the project cards and the links grid
   were all deleted along with the sections that used them. No
   fetches leave this page any more, which is why it loads the way
   it does.

   THE GALLERY AND VIEWER ARE V2'S CODE, UNCHANGED. The hover
   flicker people saw was never in here — it was a CSS rule that
   moved the tile out from under the cursor. See css/site.css.
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const mediums = it => [].concat(it.medium);
const altFor = it => it.alt ||
  `${it.title} — ${mediums(it).join(" and ")} artwork by Mist${it.tags ? ` (${it.tags})` : ""}`;
/* THE DIRECTORY THIS PAGE WAS SERVED FROM, captured once at load and
   never recomputed.

   The viewer rewrites the address bar to /p/<slug> while it is open.
   From that moment a RELATIVE path like "p/no-entry" no longer
   resolves against the site root — the browser resolves it against
   the current directory, which is now /p/, giving /p/p/no-entry. Each
   arrow press added another /p/, the resulting address 404'd on
   reload, and Back walked through a trail of URLs that were never
   real. Everything that builds a path has to go through ROOT.

   HOME is the page itself, hash dropped: closing the viewer puts the
   address back to the page you actually opened it from, which is
   art.html for a deep link and / for the homepage. */
const ROOT = location.pathname.replace(/[^/]*$/, "").replace(/\/p\/$/, "/");
const HOME = ROOT === location.pathname ? location.pathname : location.pathname + location.search;

const tileSrcs = it => [`${ROOT}p/t/${slug(it.title)}.webp`, `${ROOT}p/t/${slug(it.title)}.jpg`];

/* language first — it caches the English out of the DOM, so
   nothing may rewrite page text before this runs */
I18N.init();

const yrEl = $("#yr");
if (yrEl) yrEl.textContent = new Date().getFullYear();

/* ---------- which row of the tree am I standing in? ----------

   Any rail link pointing at an anchor on THIS page becomes a
   position readout: at the top "Home" is lit, and it hands over as
   each zone passes the reading line.

   Deliberately NOT IntersectionObserver. IO is the tidy way to do
   this, but it reports nothing at all in a throttled tab and in
   some embedded webviews — and a navigation that silently stops
   telling you where you are is worse than one that costs a scroll
   handler. This reads geometry directly, on a passive listener.

   The line sits at 35% of the viewport rather than the very top,
   because a section is "the one you are reading" well before its
   heading reaches the ceiling. */
(function spy() {
  const links = $$(".rail-nav a[href^='#']");
  const zones = links
    .map(a => ({ a, el: $(a.getAttribute("href")) }))
    .filter(z => z.el);
  if (!zones.length) return;

  const mark = () => {
    const line = scrollY + innerHeight * 0.35;
    let cur = zones[0];
    for (const z of zones) {
      if (z.el.getBoundingClientRect().top + scrollY <= line) cur = z;
    }
    links.forEach(a => a.removeAttribute("aria-current"));
    cur.a.setAttribute("aria-current", "true");
  };

  /* Throttled on a clock, NOT on requestAnimationFrame. rAF is the
     usual way to coalesce scroll work, but it does not fire at all
     in a throttled tab or in some embedded webviews — and a
     coalescer that never runs means the readout silently freezes
     on whatever it said first. A timer always runs. Two rect reads
     every 80ms is nothing.

     The trailing call matters: without it, the last scroll event
     before you stop is the one that gets dropped, which is exactly
     the position you end up looking at. */
  let last = 0, trailing = null;
  const tick = () => {
    const now = Date.now();
    clearTimeout(trailing);
    if (now - last >= 80) { last = now; mark(); }
    else trailing = setTimeout(() => { last = Date.now(); mark(); }, 80);
  };

  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", tick);
  /* the gallery changes the page height when it lays out, which
     moves every zone boundary under us */
  addEventListener("relayout", tick);
  mark();
})();

/* ---------- how tall is the bottom bar? ----------
   On a phone the rail is a FIXED bar, so the page has to reserve
   room under itself or the last row of art hides behind it. That
   height is not knowable from CSS: it depends on how many lines
   the nav wraps to, which depends on the language and the width.
   So measure it and publish it as --rail-h. */
(function railHeight() {
  const rail = $(".rail");
  if (!rail) return;
  const sync = () => document.documentElement.style
    .setProperty("--rail-h", rail.offsetHeight + "px");
  sync();
  if ("ResizeObserver" in window) new ResizeObserver(sync).observe(rail);
  addEventListener("resize", sync);
  addEventListener("langchange", sync);   /* polish labels wrap differently */

  /* ---------- a scroll is not a tap ----------

     On a phone the rail is a FIXED BAR ACROSS THE BOTTOM OF THE
     SCREEN — deliberately, so it sits at thumb height. Which is also
     exactly where a thumb lands to start a scroll, and the bar is a
     solid row of navigation: "Home" points at #top and "Art" at #art.
     A swipe that begins on it and is read as a tap therefore jumps
     the page — and because <html> is scroll-behavior:smooth, it does
     not jump so much as sail, which is what makes it look like the
     page teleporting rather than a link being followed.

     Capture phase, so this runs before the anchor does anything. 12px
     is well under the smallest deliberate movement and well over the
     wobble of a finger lifting off glass. */
  let sx = 0, sy = 0, moved = false;
  rail.addEventListener("touchstart", e => {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; moved = false;
  }, { passive: true });
  rail.addEventListener("touchmove", e => {
    const t = e.touches[0];
    if (Math.hypot(t.clientX - sx, t.clientY - sy) > 12) moved = true;
  }, { passive: true });
  rail.addEventListener("click", e => {
    if (!moved) return;
    moved = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
})();

/* ---------- lock the tagline to the width of the signature ----------

   The masthead is meant to read as ONE mark: /// mist /// on top,
   the tagline directly beneath, their outer edges flush. So the
   tagline is not given a size — it is given a WIDTH, and the size
   falls out of it.

   Measured against the slash row's INK, not against the column.
   .mast-row is a block, so its clientWidth is the whole 700px
   column regardless of how wide the artwork inside it actually is;
   the number that matters runs from the left edge of the first
   slash to the right edge of the last.

   Scales in both directions, unlike the old version which only ever
   shrank. That is the point: the line lands on exactly the same
   width in English and in Polish, so the longer string simply
   resolves to a slightly smaller size instead of overflowing, and
   the two languages occupy an identical footprint.

   Runs again after the webfont lands — Cabinet Grotesk and the
   fallback have different metrics, so a measurement taken before it
   arrives describes the wrong typeface — and on every language
   switch. */
(function fitTagline() {
  const el = $(".tagline");
  const row = $(".mast-row");
  if (!el || !row) return;

  const fit = () => {
    const marks = $$(".slashes, .mast-mark", row).map(n => n.getBoundingClientRect());
    if (!marks.length) return;
    const target = Math.max(...marks.map(r => r.right)) - Math.min(...marks.map(r => r.left));
    if (!target) return;

    /* measure at a known size, then solve. width is near enough
       linear in font-size — letter-spacing is in em, so it scales
       with the type rather than fighting it — which is why a single
       pass lands instead of needing a search. */
    const probe = 100;
    el.style.fontSize = probe + "px";
    const at100 = el.scrollWidth;
    if (!at100) { el.style.fontSize = ""; return; }
    const size = probe * (target / at100);
    el.style.fontSize = size + "px";

    /* publish it: the section headers are set to this exact size, so
       they track the masthead at every width instead of being a
       clamp() that happens to look close at one of them */
    document.documentElement.style.setProperty("--tagline-size", size + "px");
  };

  fit();
  addEventListener("resize", fit);
  addEventListener("langchange", fit);
  document.fonts?.ready.then(fit);
})();

/* ---------- the random lines ----------
   Two slots only: one under the masthead, one at the foot of the
   rail. humour.md's own rule — a joke under every heading reads as
   noise, a joke in two places reads as a find. Shuffled and popped
   so the two are never the same line. */
(function seed() {
  const pool = [...MARQUEE].sort(() => Math.random() - 0.5);
  $$(".random-quote").forEach(el => el.textContent = pool.pop() ?? MARQUEE[0]);
})();

/* ============================================================
   the reel — decorative, uninteractable

   Every piece in the archive, twice, end to end. The CSS
   translates the track by exactly -50%, which lands copy two on
   copy one's starting position — that is what makes the loop
   seamless, and it only holds because BOTH copies are identical
   and complete.

   Thumbnails first: this strip is texture, and there is no reason
   to pull sixteen full-size artstation files for it.
   ============================================================ */
(function buildReel() {
  const track = $("#reel");
  if (!track) return;

  const make = it => {
    const img = new Image();
    const chain = [...tileSrcs(it), it.img];
    let n = 0;
    /* a piece whose files are all missing removes itself rather
       than leaving a grey gap in the strip */
    img.onerror = () => { if (++n < chain.length) img.src = chain[n]; else img.remove(); };
    img.src = chain[0];
    img.alt = "";
    img.decoding = "async";
    return img;
  };

  const copy = () => ART.map(make);
  [...copy(), ...copy()].forEach(img => track.appendChild(img));

  /* Paced by how much there is to show, so adding work slows the
     strip down rather than speeding it up. ~13s per piece is a
     drift — you notice it has moved, you never watch it move. */
  track.style.animationDuration = Math.max(120, ART.length * 13) + "s";
})();

/* ============================================================
   gallery — v2, verbatim
   ============================================================ */
const OPEN = [];

/* ============================================================
   remembered aspect ratios

   The grid cannot place a single tile until it knows the shape of
   every picture, and the only way to learn that from an <img> is to
   load it. So the first visit blocks on sixteen image loads before
   anything appears — and it did that again on every hop between the
   homepage and the archive, because the ratios were never kept.

   They are geometry, not content: two numbers per picture that
   never change. Keeping them means the second visit lays the whole
   grid out in the same tick, and the pictures then stream into
   boxes that already exist.

   Keyed by the URL that was actually measured, so pointing an entry
   at a different file invalidates its own entry and nothing else.
   Bump VER to throw the lot away.
   ============================================================ */
const AR = (() => {
  const KEY = "mist.ar.1";
  let map = {};
  try { map = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { }
  let queued = false;
  return {
    get: k => map[k],
    set(k, v) {
      map[k] = v;
      /* one write per batch, not one per picture */
      if (queued) return;
      queued = true;
      setTimeout(() => {
        queued = false;
        try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { }
      }, 0);
    },
  };
})();

/* ------------------------------------------------------------
   TILES ARE NOT PIECES.

   A piece is one entry in ART and one thing the viewer opens. A
   tile is one rectangle in the grid — and a piece may put more
   than one there.

   Mark any frame in `images` with hero:true and it earns its own
   tile, so a project with two strong images can show both in the
   grid while either one still opens the entire set. That is why
   the grid runs on TILES and the viewer runs on OPEN: they are
   different lists with different lengths.

       images: [
         { src: "...", tag: "wireframe", hero: true },
       ]
   ------------------------------------------------------------ */
const TILES = [];

function tilesFor(it, pieceIdx) {
  /* the cover always tiles; it has local thumbnails to try first */
  const out = [{ it, pieceIdx, frame: 0, srcs: [...tileSrcs(it), it.img] }];
  (it.images || []).forEach((f, n) => {
    const o = typeof f === "string" ? { src: f } : f;
    /* frame n+1, because frame 0 is the cover */
    if (o.hero) out.push({ it, pieceIdx, frame: n + 1, srcs: [o.src] });
  });
  return out;
}

const measure = t => {
  /* the frame number is part of the key — two tiles from one piece
     are two different pictures with two different shapes */
  const key = slug(t.it.title) + (t.frame ? "#" + t.frame : "");
  const hit = AR.get(key);
  /* a hit resolves synchronously — no request, no decode, no wait */
  if (hit && hit.a > 0) { t._src = hit.s; t._ar = hit.a; return Promise.resolve(t); }

  return new Promise(res => {
    (function attempt(i) {
      if (i >= t.srcs.length) return res(null);
      const im = new Image();
      im.onload = () => {
        t._ar = im.naturalWidth / im.naturalHeight;
        t._src = t.srcs[i];
        AR.set(key, { s: t._src, a: t._ar });
        res(t);
      };
      im.onerror = () => attempt(i + 1);
      im.src = t.srcs[i];
    })(0);
  });
};

/* returns the width it actually laid out at — the caller has to
   remember that number rather than re-reading clientWidth, see the
   scrollbar note in gallery() */
function layout(mount, items, maxRows) {
  const W = mount.clientWidth;
  if (!W) return 0;
  const gap = 14, H = W < 640 ? 190 : 300;

  /* `full` records WHY each row ended.

     A row pushed because the next picture would not fit is COMPLETE:
     it has to justify edge to edge, and its height is whatever that
     takes. The leftovers pushed after the loop are not complete, and
     stretching one or two pictures across a full row would blow them
     up out of all proportion. Only that tail needs a ceiling. */
  const rows = [], full = [];
  let row = [], sum = 0;
  for (const it of items) {
    const w = Math.min(W, it._ar * H);
    if (row.length && sum + w + gap * row.length > W) {
      rows.push(row); full.push(true);
      row = []; sum = 0;
      if (maxRows && rows.length >= maxRows) break;   /* a taster stops at whole rows */
    }
    row.push(it); sum += w;
  }
  if (row.length && (!maxRows || rows.length < maxRows)) { rows.push(row); full.push(false); }

  /* EMPTYING THE GRID COLLAPSES THE PAGE.

     innerHTML = "" takes every row out at once, the document briefly
     becomes viewport height, and the browser CLAMPS the scroll offset
     to whatever still fits — 969px becomes 279px. Re-adding the rows
     restores the height but not the offset it was holding. So any
     relayout that happened while you were part way down the archive
     dropped you somewhere else, and on a phone that reads as the page
     throwing you around while you scroll.

     Read it before, put it back after. behavior:"instant" is
     load-bearing: `scroll-behavior: smooth` is set on <html>, so a
     bare scrollTo would ANIMATE the correction and you would watch
     the page glide back to where it already was. */
  const keepY = scrollY;
  mount.innerHTML = "";
  const heights = [];
  rows.forEach((r, ri) => {
    const arSum = r.reduce((s, it) => s + it._ar, 0);
    let h = (W - gap * (r.length - 1)) / arSum;

    /* THE CAP APPLIES TO A SHORT ROW, NOT TO THE LAST ROW.

       The old rule capped whichever row came last, regardless of
       whether it was full — so a complete final row whose natural
       height happened to exceed the limit was slammed down to H and
       stopped reaching the right edge. That is exactly the bottom
       row of the homepage taster: shorter than the row above it,
       with a hole beside it, for no reason at all.

       The ceiling is the row directly above, so a ragged tail can
       never tower over its neighbour, and H when there is no row
       above to measure against. */
    if (!full[ri]) h = Math.min(h, heights[ri - 1] ?? H);
    heights.push(h);

    const el = document.createElement("div");
    /* a short tail is centred — left-aligned it reads as a mistake */
    el.className = "jrow" + (full[ri] ? "" : " jrow-tail");
    r.forEach(t => {
      const it = t.it;
      const extra = (it.images || []).length;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tile";
      b.style.width = Math.round(t._ar * h) + "px";
      b.style.height = Math.round(h) + "px";
      b.innerHTML =
        `<span class="tag">${mediums(it).join("·")} // ${it.year}</span>` +
        (extra ? `<span class="plus">+${extra}</span>` : "") +
        `<img src="${t._src}" alt="${altFor(it).replace(/"/g, "&quot;")}" loading="lazy" decoding="async">` +
        `<span class="name">${it.title}</span>`;

      /* The src may have come from the remembered ratios rather than
         from a load that just succeeded, so it can be a URL that has
         since gone. Walk the same fallback chain the measurement
         uses; indexOf advances every time, so this cannot loop. */
      const im = b.querySelector("img");
      im.addEventListener("error", () => {
        const next = t.srcs.indexOf(im.getAttribute("src")) + 1;
        if (next > 0 && next < t.srcs.length) im.src = t.srcs[next];
      });

      /* opens the whole piece, landing on the frame this tile shows */
      b.addEventListener("click", () => open(t.pieceIdx, false, t.frame));
      el.appendChild(b);
    });
    mount.appendChild(el);
  });
  if (scrollY !== keepY) scrollTo({ top: keepY, behavior: "instant" });
  return W;
}

(async function gallery() {
  const mount = $("#grid");
  if (!mount) return;
  const maxRows = parseInt(mount.dataset.rows || "0", 10);
  const pool = maxRows ? Math.min(ART.length, maxRows * 5) : ART.length;

  /* OPEN is every piece in the pool, in data order — the viewer's
     sequence, and what a /p/<slug> deep link resolves against. It
     holds pieces even if their picture failed, so a shared link
     still opens rather than 404ing on a broken thumbnail.
     TILES is the grid, which may be longer: see tilesFor(). */
  const pieces = ART.slice(0, pool);
  pieces.forEach(p => OPEN.push(p));
  const wanted = pieces.flatMap((it, i) => tilesFor(it, i));
  (await Promise.all(wanted.map(measure))).filter(Boolean).forEach(t => TILES.push(t));
  /* THE REMEMBERED WIDTH IS THE ONE LAYOUT USED, not the one the
     box has afterwards.

     Filling an empty grid makes the page tall enough to grow a
     scrollbar, which takes ~15px back off the grid — after the rows
     have already been sized for the wider box. Re-reading
     clientWidth here therefore records the NEW width while the
     tiles are built for the OLD one, and the guard below then
     decides nothing has changed and never corrects it. The gallery
     silently overhangs its column by the width of a scrollbar, on
     every load, forever.

     Taking the width back from layout() closes that gap: the
     ResizeObserver sees 1089 against a remembered 1104 and relays. */
  let w = layout(mount, TILES, maxRows);

  /* Check once, synchronously, whether filling the grid changed the
     grid. scrollbar-gutter handles the usual cause, but anything
     that reflows on insert would do it too — and the alternative is
     waiting for a ResizeObserver, which does not report at all in a
     throttled tab or some embedded webviews. Reading clientWidth
     forces layout, so this is exact rather than hopeful. */
  if (mount.clientWidth !== w) w = layout(mount, TILES, maxRows);

  /* a mount with no width yet (hidden tab, display:none ancestor, a
     container that hasn't been laid out) makes layout() bail — without
     a retry the gallery stays empty forever. watch the box itself. */
  const relayout = () => {
    if (mount.clientWidth === w) return;
    w = layout(mount, TILES, maxRows);
  };
  if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(mount);
  addEventListener("resize", relayout);
  document.addEventListener("visibilitychange", relayout);
  /* laying the grid out changes the page height, so every zone
     boundary the spy measured has just moved */
  dispatchEvent(new Event("relayout"));
  deepLink();
})();

/* ============================================================
   lightbox — v2, verbatim

   the zoom lifts a COPY of the <img> to position:fixed and
   transforms it, so it floats above the panel instead of scrolling
   inside it. that is what fixes all three bugs at once: no scroll to
   reset, nothing to shift unpredictably, and no container padding to
   blow out. panning is a drag, clamped so the image can never be
   thrown off screen, and the wheel is swallowed so you can't scroll
   out from under it.
   ============================================================ */
let idx = 0, lastFocus = null, pushed = false;
const lb = $("#lb"), stage = $("#lbStage");
const Z = { img: null, clone: null, k: 1, x: 0, y: 0, base: null };

/* which frame of the open piece the arrows are standing on */
let fIdx = 0;

/* ============================================================
   THERE IS NO "MORE BELOW" LABEL, AND THAT IS THE DESIGN.

   There was one — an overlay across the foot of the stage saying how
   many frames were under the cover. It went because the thing it was
   describing says it better: the top edge of the NEXT picture,
   showing above the fold, is a concrete, permanent, wordless signal
   that there is more, and it needs no timeout, no dismiss button and
   no translation.

   The label was competing with that signal for the same strip of
   screen. So instead of writing the fact down, css/site.css simply
   holds every frame far enough short of the viewport that the next
   one is always in view — see the max-height note on .stage img.
   ============================================================ */

/* ============================================================
   EVERY PIECE OPENS AT ITS TOP

   `stage.scrollTop = 0` on a stage that has just been filled means
   nothing: the frames have no height yet, so there is nothing to
   scroll and nothing to reset. They arrive a moment later, the
   scroller comes back to life — and Chrome restores the offset this
   same element was last left at. Scroll to the end of a five frame
   piece, close it, open it again, and you land in the middle of it
   with no sign that anything was above.

   overflow-anchor does not cover this. That governs content shifting
   underneath a reader; this is a scroller being revived.

   So the top is HELD while the frames land, and released the moment
   the reader touches anything — after that the position is theirs,
   and correcting it would be the actual bug.
   ============================================================ */
let holdTimer = null;

/* `frame` is which picture to hold in view, not always the first.

   A tile marked hero:true in data.js is a supporting frame with its
   own square in the grid, and clicking it should land on THAT frame —
   otherwise the grid shows you one picture and the viewer opens a
   different one. The position is recomputed on every tick rather than
   set once, because the frames above it are still loading and each
   one that arrives pushes the target further down. */
function holdTop(frame = 0) {
  clearInterval(holdTimer);

  const settle = () => {
    const img = frame ? $$("img", stage)[frame] : null;
    if (!img) { stage.scrollTop = 0; return; }
    const sr = stage.getBoundingClientRect(), ir = img.getBoundingClientRect();
    stage.scrollTop += (ir.top - sr.top) - (sr.height - ir.height) / 2;
  };
  settle();

  const release = () => {
    clearInterval(holdTimer);
    holdTimer = null;
    for (const ev of ["wheel", "touchstart", "pointerdown", "keydown"])
      stage.removeEventListener(ev, release);
  };

  holdTimer = setInterval(settle, 60);
  /* pointerdown covers dragging the scrollbar, which fires no wheel */
  for (const ev of ["wheel", "touchstart", "pointerdown", "keydown"])
    stage.addEventListener(ev, release, { passive: true });
  setTimeout(release, 1200);
}

function open(i, replace = false, frame = 0) {
  if (i < 0 || !OPEN[i]) return;
  /* INSTANT, not animated. The shrink-back animates the clone down
     onto the original <img> over 280ms — but this function is about
     to wipe the stage that <img> lives in, so it would be animating
     towards a box that no longer exists, on top of the next picture
     that is already being zoomed in.

     That overlap is what locked the viewer when an arrow carried you
     out of one piece and into the next: the old zoom's cleanup ran a
     third of a second later and cleared Z.clone — which by then was
     the NEW picture's clone. Z.img still said "zoomed", nothing had a
     clone to move, and neither panning nor closing could do anything. */
  unzoom(true);
  idx = i;
  fIdx = frame;
  const it = OPEN[i];
  const frames = [it.img, ...(it.images || [])].map(f => typeof f === "string" ? { src: f } : f);

  $("#lbTitle").textContent = it.title;
  $("#lbMeta").textContent = `${mediums(it).join(" · ")} // ${it.year}` +
    (frames.length > 1 ? ` // ${frames.length} frames` : "");

  const tools = $("#lbTools");
  tools.innerHTML = "";
  Object.entries(it.post || {}).forEach(([site, url]) => {
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = `${site} ↗`;
    tools.appendChild(a);
  });
  const x = document.createElement("button");
  x.textContent = "close [esc]";
  x.addEventListener("click", shut);
  tools.appendChild(x);

  stage.innerHTML = "";
  frames.forEach((f, n) => {
    const img = document.createElement("img");
    img.src = f.src;
    img.alt = altFor(it) + (n ? ` — frame ${n + 1}` : "");
    /* stopPropagation is load-bearing: without it this click carries
       on up to .lb, whose handler treats any click while zoomed as
       "outside the image, step back out" — and undoes the zoom this
       very click just created. */
    img.addEventListener("click", e => {
      if (Z.dragged) return;
      e.stopPropagation();
      fIdx = n;                 /* arrows continue from what you clicked */
      toggleZoom(img, e);
    });
    stage.appendChild(img);

    if (f.tag) {
      const tg = document.createElement("span");
      tg.className = "frametag";
      tg.textContent = f.tag;
      stage.appendChild(tg);
    }
  });
  /* NO SUPPORTING FRAME MAY OUTSIZE THE COVER.

     Each frame was sized on its own, so one that happened to be a
     few hundred pixels wider than the cover rendered LARGER than
     it — two versions of the same picture at two different sizes,
     the smaller one on top. The cover is the piece; everything
     under it is working material and has to read that way.

     Capping rather than upscaling: stretching a small frame up to
     match would only make it soft. */
  const cover = stage.querySelector("img");
  if (cover) {
    const cap = () => {
      const w = cover.getBoundingClientRect().width;
      if (w) stage.style.setProperty("--frame-cap", w + "px");
    };
    if (cover.complete && cover.naturalWidth) cap();
    else cover.addEventListener("load", cap, { once: true });
  }

  holdTop(frame);
  lb.classList.add("open");
  document.body.classList.add("locked");
  lastFocus ||= document.activeElement;

  /* instagram-style: the address bar shows the piece, the page never
     navigates or repaints. /p/<slug> is a real stub for unfurlers, so
     a reload or a paste still resolves. */
  const url = ROOT + "p/" + slug(it.title);
  if (replace || pushed) history.replaceState({ p: idx }, "", url);
  else { history.pushState({ p: idx }, "", url); pushed = true; }
  x.focus();
}

function shut(fromPop = false) {
  unzoom();
  lb.classList.remove("open");
  clearInterval(holdTimer); holdTimer = null;
  stage.innerHTML = "";
  document.body.classList.remove("locked");
  if (pushed && !fromPop) { pushed = false; history.back(); }
  /* HOME, not location.pathname — by now the address bar says
     /p/<slug>, so restoring "the current path" would just leave the
     piece's URL sitting there after the viewer had closed */
  else if (!fromPop) history.replaceState(null, "", HOME);
  pushed = false;
  lastFocus?.focus();
  lastFocus = null;
}
const step = d => open((idx + d + OPEN.length) % OPEN.length, true);

/* ============================================================
   THE ARROWS WALK FRAMES FIRST, PIECES SECOND.

   A piece with five frames is a small gallery of its own, and
   inside it the arrows move between those frames. They only cross
   into the next or previous piece once there is nowhere left to go
   — so one continuous sequence runs through everything, and you
   never have to know whether the thing you are looking at is a
   "piece" or a "frame".

   Zoomed, the next frame arrives zoomed as well: being close in on
   one picture is exactly when you want the next one the same way.
   Unzoomed, the stage scrolls to it instead.
   ============================================================ */
function showFrame(img) {
  if (!img) return;
  if (Z.img) {
    unzoom(true);
    const go = () => {
      /* a picture that has not loaded has no box, and fitting a
         zero-sized rect gives a scale of infinity */
      if (img.getBoundingClientRect().width) {
        /* false: a swap, not a zoom — see apply() */
        toggleZoom(img, { clientX: innerWidth / 2, clientY: innerHeight / 2 }, false);
      }
    };
    if (img.complete && img.naturalWidth) go();
    else img.addEventListener("load", go, { once: true });
  } else {
    /* Set scrollTop directly rather than calling scrollIntoView.

       Smooth scrolling is animated, so it needs frames — and in a
       throttled tab or a non-painting context it simply never
       happens, leaving the frame counter advanced and the stage
       exactly where it was. Rects give the same centring with
       arithmetic instead of a promise to animate. */
    const sr = stage.getBoundingClientRect(), ir = img.getBoundingClientRect();
    stage.scrollTop += (ir.top - sr.top) - (sr.height - ir.height) / 2;
  }
}

/* THE ARROWS MEAN DIFFERENT THINGS AT DIFFERENT DEPTHS.

   Not zoomed, you are browsing the gallery, so they move between
   PIECES — the behaviour the viewer has always had.

   Zoomed, you have gone into one piece, so they move between ITS
   frames. Only when a piece runs out do they carry on into the next
   one, so a long look never dead-ends.

   The depth you are at decides, which means neither mode ever
   surprises you: the arrows always do the thing that matches what
   is currently filling the screen. */
function stepFrame(d) {
  if (!Z.img) return step(d);          /* browsing: piece to piece */

  const imgs = $$("img", stage);
  const next = fIdx + d;
  if (next < 0 || next >= imgs.length) {
    step(d);
    /* Backwards lands on the LAST frame of the piece behind, not on
       its cover. Otherwise Left followed by Right does not put you
       back where you were, and a piece's supporting frames are
       unreachable from the piece after it. */
    showFrameWhenReady(d < 0);
    return;
  }
  fIdx = next;
  showFrame(imgs[fIdx]);
}

/* after step() has rebuilt the stage, re-enter the zoom on the new
   cover — Z.img is already null by then, so showFrame's zoomed
   branch cannot be used */
function showFrameWhenReady(last = false) {
  const imgs = $$("img", stage);
  if (!imgs.length) return;
  fIdx = last ? imgs.length - 1 : 0;
  const img = imgs[fIdx];
  const go = () => {
    if (img.getBoundingClientRect().width) {
      toggleZoom(img, { clientX: innerWidth / 2, clientY: innerHeight / 2 }, false);
    }
  };
  if (img.complete && img.naturalWidth) go();
  else img.addEventListener("load", go, { once: true });
}

/* ---------- zoom ---------- */
function clamp(k, baseRect) {
  const w = baseRect.width * k, h = baseRect.height * k;
  let x = Z.x, y = Z.y;
  if (w <= innerWidth) x = (innerWidth - w) / 2 - baseRect.left;
  else x = Math.min(-baseRect.left, Math.max(innerWidth - w - baseRect.left, x));
  if (h <= innerHeight) y = (innerHeight - h) / 2 - baseRect.top;
  else y = Math.min(-baseRect.top, Math.max(innerHeight - h - baseRect.top, y));
  Z.x = x; Z.y = y;
}
/* Opening and closing the zoom ANIMATE — the growth is what tells
   you where the small picture went and where it came back to.

   Everything continuous does not: wheel, pinch and drag are driven
   frame by frame by your hand, and a transition on top of that is
   just lag. Arrow-cycling between frames does not either — there
   the picture is being REPLACED, not moved, and animating a swap
   makes every press a quarter-second of choreography. */
function apply(animate) {
  Z.clone.style.transition = animate && !reduced ? "transform .28s cubic-bezier(.2,.7,.3,1)" : "none";
  Z.clone.style.transform = `translate(${Z.x}px,${Z.y}px) scale(${Z.k})`;
  updateBars();
  updateLevel();
}

/* ============================================================
   pan indicators

   Two hairlines, along the bottom and the right, each as long as
   the fraction of the image you can currently see and sitting where
   you are inside it.

   This is the answer to "how does anybody know they can move this".
   A scrollbar is the one affordance every single person already
   reads without being taught, and unlike a caption or an icon it
   also answers the second question — how much is left, and which
   way. It is information, not decoration.

   They fade out ~900ms after the image stops moving, so they are
   present exactly while they are relevant and never become
   furniture. Nothing is drawn at all when an axis has no overflow.
   ============================================================ */
/* ============================================================
   the controls hint

   Rides next to the cursor for a couple of seconds the first time
   you zoom, then goes. Next to the cursor rather than pinned to a
   corner because that is where you are already looking — a label in
   a fixed position is something you have to notice, and a label
   under your hand is something you cannot miss.

   Once per SESSION, not per zoom: repeating it on the fortieth
   picture would be nagging. sessionStorage rather than
   localStorage, so a visitor coming back next week is reminded
   once rather than never.

   It also leaves the moment anything is dragged, scrolled or
   pinched — at that point the reader has worked it out, and a hint
   that outlives its usefulness is just something in the way.
   ============================================================ */
function hint(e) {
  const KEY = "mist.zoomhint";
  try { if (sessionStorage.getItem(KEY)) return; sessionStorage.setItem(KEY, "1"); } catch { }

  const touch = matchMedia("(hover: none)").matches;
  const text = (touch ? I18N.t("zoom.hint.touch") : I18N.t("zoom.hint"))
    || (touch
      ? "drag to move · pinch to zoom · tap outside to close"
      : "drag to move · scroll to move · ctrl+scroll to zoom · esc to close");

  const el = document.createElement("div");
  el.className = "zhint";
  el.innerHTML = `<span>${text}</span><button type="button" class="zhintx" aria-label="${I18N.t("lb.dismiss") || "Dismiss"}">×</button>`;
  document.body.appendChild(el);

  const place = (x, y) => {
    /* flip to the other side of the cursor near an edge, so it is
       never clipped off screen */
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.min(x + 18, innerWidth - w - 8) + "px";
    el.style.top = (y + h + 30 > innerHeight ? y - h - 14 : y + 22) + "px";
  };
  place(e.clientX ?? innerWidth / 2, e.clientY ?? innerHeight / 2);
  /* flush the hidden state as the transition's starting point.
     reading a layout property forces it synchronously — rAF is the
     usual trick and is wrong here for the same reason it is wrong
     in toggleZoom: it does not fire in a throttled or hidden tab,
     and the hint would then sit at opacity 0 forever. */
  void el.offsetWidth;
  el.classList.add("on");

  /* placed where you clicked and then LEFT there. Following the
     cursor meant a label chasing you around while you were trying
     to read it — it only has to appear where you are already
     looking, once. */
  const done = () => {
    if (!el.isConnected) return;
    removeEventListener("wheel", onWheel);
    clearTimeout(timer);
    el.classList.remove("on");
    setTimeout(() => el.remove(), 400);
  };

  /* IT DOES NOT LEAVE WHILE YOU ARE READING IT.

     The timeout is generous, but it is still a timeout, and there is
     nothing worse than a label that vanishes half way through the
     sentence — especially this one, which is a list of four controls
     and is the only place any of them are written down. The pointer
     resting on it is the clearest possible statement that it is being
     read, so the clock stops, and restarts short when you leave.

     The same rule covers the wheel: scrolling with the pointer parked
     on the hint is not "I have worked it out", it is a scroll that
     happens to be under it. */
  let over = false;
  el.addEventListener("pointerenter", () => { over = true; clearTimeout(timer); });
  el.addEventListener("pointerleave", () => { over = false; timer = setTimeout(done, 1600); });

  el.querySelector(".zhintx").addEventListener("click", e => { e.stopPropagation(); done(); });
  /* a wheel means they are already using it; a click does not, since
     the click that opened the zoom would dismiss it instantly */
  const onWheel = () => { if (!over) done(); };
  addEventListener("wheel", onWheel, { passive: true });
  let timer = setTimeout(done, 4600);
}

/* ============================================================
   the veil

   A zoomed picture is the only thing that should be on screen. The
   viewer's own furniture — the caption, the arrows, the panel edge
   — sits BEHIND the enlarged image but around it, so it stays in
   view and keeps offering buttons that no longer make sense.

   So a dark layer is dropped in between: above the whole viewer,
   below the zoomed image. Everything that isn't the artwork goes.

   pointer-events stays none deliberately. Clicking off the picture
   should still step back out of the zoom, and that handler lives on
   .lb underneath — blocking the clicks would break it.
   ============================================================ */
function veil(on) {
  if (on) {
    if (Z.veil) return;
    Z.veil = document.createElement("div");
    Z.veil.className = "zveil";
    Z.veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(Z.veil);

    /* ---- the toolbar ----

       There is no browser control for this. Native page zoom is a
       different thing entirely — it scales the whole document, it is
       not addressable from script, and it would not know the picture
       exists. So: the smallest bar that does the job, laid out the
       way every PDF reader already lays it out, because that is the
       arrangement nobody has to be taught.

           −   140%   +  │  ×

       The reading is against the file's OWN pixels, so 100% means one
       image pixel per screen pixel — the same thing it means in a PDF
       viewer or in Photoshop, rather than a number relative to
       whatever size the thumbnail happened to be. */
    const bar = document.createElement("div");
    bar.className = "zbar";
    bar.innerHTML =
      `<button type="button" class="zstep zout" aria-label="${I18N.t("zoom.out") || "Zoom out"}">−</button>` +
      `<span class="zlvl" role="status" aria-live="off">100%</span>` +
      `<button type="button" class="zstep zin" aria-label="${I18N.t("zoom.in") || "Zoom in"}">+</button>` +
      `<button type="button" class="zclose" aria-label="${I18N.t("zoom.close") || "Close full size"}">×</button>`;

    /* stopPropagation on every one of them: a click that reaches .lb
       is read as "off the picture, step back out", which would undo
       the zoom the button just changed */
    const stop = fn => e => { e.stopPropagation(); fn(); };
    /* about the middle of the screen, which is the part you are
       looking at — anchoring on a corner walks the subject away */
    const nudge = f => zoomTo(Z.k * f, innerWidth / 2, innerHeight / 2, true);
    bar.querySelector(".zout").addEventListener("click", stop(() => nudge(1 / 1.3)));
    bar.querySelector(".zin").addEventListener("click", stop(() => nudge(1.3)));
    bar.querySelector(".zclose").addEventListener("click", stop(unzoom));
    /* a drag that begins on the bar must not pan the picture */
    bar.addEventListener("pointerdown", e => e.stopPropagation());

    document.body.appendChild(bar);
    Z.bar = bar;
    Z.lvl = bar.querySelector(".zlvl");
    Z.zin = bar.querySelector(".zin");
    Z.zout = bar.querySelector(".zout");
    updateLevel();
    return;
  }
  Z.veil?.remove(); Z.veil = null;
  Z.bar?.remove(); Z.bar = null;
  Z.lvl = Z.zin = Z.zout = null;
}

/* the readout and the two buttons' enabled state, refreshed from
   apply() so wheel, pinch, drag and the buttons all keep it honest */
function updateLevel() {
  if (!Z.lvl) return;
  /* Z.nat is the scale at which the clone renders 1:1. A picture
     whose natural size never arrived falls back to the fit level, so
     the bar reads relative to SOMETHING rather than showing NaN%. */
  const unit = Z.nat > 0 ? Z.nat : (Z.min || 1);
  Z.lvl.textContent = Math.round(Z.k / unit * 100) + "%";
  const e = 1e-3;
  Z.zin.disabled = Z.k >= Z.max - e;
  Z.zout.disabled = Z.k <= Z.min + e;
}

function makeBars() {
  const mk = cls => {
    const b = document.createElement("div");
    b.className = "panbar " + cls;
    b.setAttribute("aria-hidden", "true");
    document.body.appendChild(b);
    return b;
  };
  Z.bars = { x: mk("panbar-x"), y: mk("panbar-y") };
}

function killBars() {
  if (!Z.bars) return;
  Z.bars.x.remove();
  Z.bars.y.remove();
  Z.bars = null;
  clearTimeout(Z.idle);
  document.body.classList.remove("panning-idle");
}

function updateBars() {
  if (!Z.bars || !Z.base) return;
  const r = Z.base;

  /* offset = how far the image's leading edge sits off-screen. the
     clone is pinned at r.left/r.top and transformed from origin
     0 0, so its edge on screen is r.left + Z.x. */
  const set = (el, size, viewport, offset) => {
    if (size <= viewport + 1) { el.style.setProperty("--vis", "0"); return; }
    const frac = viewport / size;
    const p = Math.min(1, Math.max(0, offset / (size - viewport)));
    el.style.setProperty("--len", (frac * 100) + "%");
    el.style.setProperty("--pos", (p * (100 - frac * 100)) + "%");
    el.style.setProperty("--vis", "1");
  };
  set(Z.bars.x, r.width * Z.k, innerWidth, -(r.left + Z.x));
  set(Z.bars.y, r.height * Z.k, innerHeight, -(r.top + Z.y));

  document.body.classList.remove("panning-idle");
  clearTimeout(Z.idle);
  Z.idle = setTimeout(() => document.body.classList.add("panning-idle"), 900);
}

/* ANCHORED ZOOM — the one primitive wheel, pinch and click all use.

   Zoom that scales about the element's origin makes the thing you
   were looking at slide off screen, so you chase it with a drag
   afterwards. This keeps the point under the cursor (or under the
   midpoint of two fingers) pinned exactly where it is: convert that
   screen point into the image's own unscaled coordinates, change k,
   then solve for the translate that puts the same image point back
   under the same screen point. */
function zoomTo(k, cx, cy, animate = false) {
  const r = Z.base;
  if (!r) return;
  stopGlide();
  /* THE FLOOR IS THE FIT LEVEL, not 1.

     Zooming out bottoms out at "the whole picture on screen" and
     stays there. It must never shrink past that and it must never
     close: one decisive scroll to zoom back out would otherwise
     dismiss the viewer and then hand the rest of the gesture to the
     browser, which starts zooming the page. Closing is for the
     click, Escape, and the swipe. */
  k = Math.max(Z.min ?? 1, Math.min(k, Z.max));
  const px = (cx - r.left - Z.x) / Z.k;      /* image-local point... */
  const py = (cy - r.top - Z.y) / Z.k;
  Z.k = k;
  Z.x = cx - r.left - px * k;                /* ...put back under the cursor */
  Z.y = cy - r.top - py * k;
  clamp(k, r);
  /* animated only for the toolbar's two buttons: a discrete press
     with no motion behind it reads as the picture having been
     swapped for a different one. Wheel and pinch stay instant — they
     are continuous, and a transition on top of a live gesture is
     just lag. */
  apply(animate);
}

/* ============================================================
   momentum

   A flick should carry. Every photo viewer and every map on a phone
   behaves this way, and a drag that stops dead the moment you lift
   reads as the picture being heavy — you end up making four small
   drags where one throw would have done it.

   The velocity comes from the last few milliseconds of the drag
   rather than an average of the whole of it, so a careful
   repositioning that happens to end with a flourish does not launch,
   and a genuine throw is not damped away by the slow part before it.

   ON A TIMER, NOT requestAnimationFrame — the same call this file
   makes everywhere else, for the same reason. rAF is the textbook
   answer for an animation loop and it reports nothing at all in a
   throttled tab or an embedded webview, which is how the scroll spy
   ended up on a clock too. The distance travelled is computed from
   the elapsed time rather than from a frame count, so a late tick
   covers the ground it missed instead of shortening the throw, and
   16ms lands on the same cadence a display would give it anyway.
   ============================================================ */
function stopGlide() {
  clearInterval(Z.raf);
  Z.raf = 0;
}

function glide() {
  stopGlide();
  let vx = Z.vx || 0, vy = Z.vy || 0;          /* px per ms */
  if (Math.hypot(vx, vy) < 0.08) return;       /* a drag, not a throw */
  let last = performance.now();
  /* a hard deadline as well as the decay. On a machine that is
     throttling timers the ticks arrive late, each one is capped at
     48ms of credit, and the decay therefore takes far longer in wall
     clock than the ~400ms it is tuned for. A throw is over in half a
     second or it is not a throw. */
  const until = last + 1200;

  const tick = () => {
    if (!Z.clone) return stopGlide();
    const now = performance.now();
    if (now > until) return stopGlide();
    /* a tick the browser sat on must not teleport the picture across
       the room, so the step it can account for is capped */
    const dt = Math.min(48, now - last);
    last = now;
    if (dt <= 0) return;
    /* the per-16ms decay, resolved for the interval actually elapsed,
       so a throw covers the same ground on a busy machine as on an
       idle one */
    const f = Math.pow(.93, dt / 16);
    vx *= f; vy *= f;

    const bx = Z.x, by = Z.y;
    Z.x += vx * dt; Z.y += vy * dt;
    clamp(Z.k, Z.base);
    /* an axis that has reached its stop is finished. Without this it
       keeps spending velocity into the clamp while the other axis
       runs on, which looks like the picture sliding along a wall. */
    if (Z.x === bx) vx = 0;
    if (Z.y === by) vy = 0;
    apply(false);

    if (Math.hypot(vx, vy) <= .02) stopGlide();
  };
  Z.raf = setInterval(tick, 16);
}

/* ============================================================
   the window changed size under a zoomed picture

   Z.base is the original <img>'s rectangle, measured once when the
   zoom opened, and every other number is derived from it: where the
   clone is pinned, how far it may be panned, what "fit" means, what
   100% means. Resize the window and all of them describe a layout
   that no longer exists — the stage has re-flowed, the original has
   moved and changed size, and the clone stays nailed to coordinates
   that point nowhere. Panning then hits invisible walls in the wrong
   places and the picture can be left stranded off screen.

   So re-measure, re-derive, and keep whatever was in the middle of
   the screen in the middle of the screen. That is the part worth
   preserving: you were looking at something.
   ============================================================ */
function rebase() {
  if (!Z.img || !Z.clone) return;

  /* an opening transition is still in flight — the geometry it is
     animating towards is about to be replaced, and snapping the
     picture out of the animation would undo the one bit of motion
     that tells you where it came from. Come back when it has landed. */
  if (Z.animUntil && Date.now() < Z.animUntil) {
    clearTimeout(Z.reTimer);
    Z.reTimer = setTimeout(rebase, Z.animUntil - Date.now() + 20);
    return;
  }
  stopGlide();

  const old = Z.base;
  /* what sits under the middle of the screen, as a FRACTION of the
     picture — the one description of "where you are" that survives
     the picture changing size */
  const fx = old.width ? (innerWidth / 2 - old.left - Z.x) / Z.k / old.width : .5;
  const fy = old.height ? (innerHeight / 2 - old.top - Z.y) / Z.k / old.height : .5;

  const r = Z.img.getBoundingClientRect();
  if (!r.width || !r.height) return;
  Z.base = Z.base0 = r;
  Z.clone.style.left = r.left + "px";
  Z.clone.style.top = r.top + "px";
  Z.clone.style.width = r.width + "px";
  Z.clone.style.height = r.height + "px";

  const fit = Math.max(1, Math.min(innerWidth / r.width, innerHeight / r.height));
  Z.nat = Z.img.naturalWidth / r.width || fit;
  Z.min = fit;
  Z.max = Math.min(Math.max(fit, Z.nat) * 1.6, 8);
  /* a window that grew past the old fit level pulls the picture up
     with it, so "fit" keeps meaning fit */
  Z.k = Math.max(Z.min, Math.min(Z.k, Z.max));

  Z.x = innerWidth / 2 - r.left - fx * r.width * Z.k;
  Z.y = innerHeight / 2 - r.top - fy * r.height * Z.k;
  clamp(Z.k, r);
  apply(false);
}
/* TWICE: once now, and once after everything else has stopped moving.

   Several other things on this page listen for a resize — the gallery
   re-lays its rows out, the rail republishes its height, the masthead
   re-solves the tagline — and any of them can shift the <img> AFTER
   this handler has already measured it. A rect read before the layout
   has settled pins the clone to coordinates that are stale the moment
   they are written, which is the original bug wearing a hat. The
   second pass costs one rect read and closes it. */
const resettle = () => {
  rebase();
  clearTimeout(Z.reSettle);
  Z.reSettle = setTimeout(rebase, 120);
};
addEventListener("resize", resettle);
addEventListener("orientationchange", resettle);

/* the ORIGINAL <img> never moves. a COPY is lifted out and grown on top
   of it, and the original just goes visibility:hidden — which keeps its
   box, so the stage's layout and scrollTop are never touched. that is
   what fixes both bugs: the grid can't jitter (nothing left the flow)
   and closing the zoom can't teleport to the top (scrollTop never
   changed in the first place). */
function toggleZoom(img, e, animate = true) {
  if (Z.img) return unzoom();
  const r = img.getBoundingClientRect();

  /* ZOOM TO FIT THE SCREEN, not to 1:1.

     A click used to jump straight to native pixels, which on a
     2000px poster means landing somewhere in the middle of it with
     no idea which part you are looking at. Fitting the viewport is
     what people actually want first: the whole picture, as large as
     it goes, with the panel and its chrome out of the way. Going
     closer is what the wheel and the pinch are for.

     min() of the two ratios is "contain" — the axis that runs out
     of room first decides. */
  const fit = Math.min(innerWidth / r.width, innerHeight / r.height);
  const k = Math.max(1, fit);

  const clone = img.cloneNode(true);
  clone.removeAttribute("id");
  clone.style.cssText =
    `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;` +
    `margin:0;max-width:none;max-height:none;transform-origin:0 0;z-index:200;` +
    `cursor:zoom-out;touch-action:none;`;
  document.body.appendChild(clone);
  img.style.visibility = "hidden";

  Z.img = img; Z.clone = clone; Z.base = r; Z.k = 1; Z.x = 0; Z.y = 0;
  /* The ceiling has to clear BOTH the fit level and native pixels,
     or a gesture silently does nothing: on a phone native is already
     a big number, and on a wide screen the fit can exceed it. 1.6x
     past whichever is larger is enough to inspect a detail without
     turning the file to mush; 8 is a hard stop. */
  Z.nat = img.naturalWidth / r.width || k;
  Z.min = k;                       /* fit — the floor, see zoomTo */
  Z.max = Math.min(Math.max(k, Z.nat) * 1.6, 8);
  Z.base0 = r;                     /* where it grew FROM, for the return */
  makeBars();
  veil(true);
  if (animate) hint(e);            /* not on an arrow swap */
  apply(false);
  /* flush the starting state as the transition's first frame.
     reading a layout property forces it synchronously — rAF would be
     the usual trick but it doesn't fire in a throttled or hidden
     tab, and the FINAL position must never depend on the frame loop
     running. */
  void clone.offsetWidth;

  Z.k = k;
  Z.x = (e.clientX - r.left) * (1 - k);
  Z.y = (e.clientY - r.top) * (1 - k);
  clamp(k, r);
  apply(animate);
  /* how long rebase() has to keep its hands off. A window resize that
     lands in the middle of the growth animation would re-derive the
     geometry the animation is travelling towards and cut it in half. */
  Z.animUntil = animate && !reduced ? Date.now() + 300 : 0;
  lb.classList.add("zooming");
  clone.addEventListener("click", () => { if (!Z.dragged) unzoom(); });
  clone.addEventListener("pointerdown", onPointerDown);
}

function unzoom(instant = false) {
  const { img, clone, base0 } = Z;
  if (!img || !clone) return;
  Z.img = null;
  Z.animUntil = 0;
  clearTimeout(Z.reTimer);
  clearTimeout(Z.reSettle);
  stopGlide();
  lb.classList.remove("zooming");
  killBars();
  veil(false);

  /* `Z.clone === clone` before clearing: a deferred cleanup must never
     disown a zoom that started after it. See the note in open(). */
  const done = () => {
    clone.remove();
    img.style.visibility = "";
    if (Z.clone === clone) Z.clone = null;
  };
  if (instant || reduced) return done();

  /* shrink back onto wherever the original actually sits NOW, rather
     than assuming the page hasn't moved under it */
  const now = img.getBoundingClientRect();
  Z.k = 1;
  Z.x = now.left - base0.left;
  Z.y = now.top - base0.top;
  apply(true);
  clone.addEventListener("transitionend", done, { once: true });
  setTimeout(done, 340);            /* transitionend can be skipped */
}

/* ============================================================
   pan and pinch — one pointer map, so mouse, pen and touch are the
   same code path and a finger lifting mid-pinch does not strand the
   gesture.

   One pointer down  → drag to pan.
   Two pointers down → pinch to zoom about their midpoint.
   Lift one of two   → hands back to panning from where that finger
                       now is, instead of the image jumping by
                       however far the other finger had travelled.
   ============================================================ */
const pointers = new Map();

/* a tap is not a drag. without a threshold the few pixels a finger
   moves while lifting would count as a pan, and the tap-to-close
   click would be swallowed every time. */
const DRAG_SLOP = 6;

const pinchNow = () => {
  const [a, b] = [...pointers.values()];
  return {
    d: Math.hypot(a.x - b.x, a.y - b.y),
    cx: (a.x + b.x) / 2,
    cy: (a.y + b.y) / 2,
  };
};

function onPointerDown(e) {
  if (!Z.clone) return;
  e.preventDefault();
  /* throws NotFoundError if the pointer is no longer active by the
     time this runs. capture is an optimisation here — pointermove is
     bound to the window anyway — so losing it must not abort the
     gesture before a single finger has been registered. */
  try { Z.clone.setPointerCapture?.(e.pointerId); } catch { }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    /* catching a picture that is still gliding stops it dead, the way
       catching a spinning wheel does */
    stopGlide();
    Z.dragged = false;
    Z.downAt = { x: e.clientX, y: e.clientY };
    /* where the WHOLE gesture began. Z.downAt is re-anchored when a
       finger lifts out of a pinch; this one is not, so the swipe test
       always measures the real travel. */
    Z.downAt0 = { x: e.clientX, y: e.clientY };
    Z.panFrom = { x: e.clientX - Z.x, y: e.clientY - Z.y };
    Z.vx = Z.vy = 0;
    Z.vt = performance.now();
    Z.lx = Z.x; Z.ly = Z.y;
    Z.yAtDown = Z.y;          /* for the swipe-down-to-close test */
    Z.touch = e.pointerType !== "mouse";
    Z.clone.style.cursor = "grabbing";
  } else if (pointers.size === 2) {
    const p = pinchNow();
    Z.pinch = { d: p.d, k: Z.k };
    Z.dragged = true;                 /* a pinch must never read as a tap */
  }
}

function onPointerMove(e) {
  if (!pointers.has(e.pointerId) || !Z.clone) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size >= 2 && Z.pinch) {
    const p = pinchNow();
    if (p.d > 0 && Z.pinch.d > 0) zoomTo(Z.pinch.k * (p.d / Z.pinch.d), p.cx, p.cy);
    return;
  }
  if (!Z.panFrom) return;
  if (Z.downAt && Math.hypot(e.clientX - Z.downAt.x, e.clientY - Z.downAt.y) > DRAG_SLOP) {
    Z.dragged = true;
  }
  Z.x = e.clientX - Z.panFrom.x;
  Z.y = e.clientY - Z.panFrom.y;
  clamp(Z.k, Z.base);
  apply(false);

  /* Measured from the CLAMPED position, so a drag that is already
     pressed against an edge builds no speed and cannot launch into a
     wall. Weighted towards the newest sample: the last few
     milliseconds are the throw, everything before them is aim.

     A gap over 100ms means the finger stopped and then lifted — a
     placement, not a flick — so the throw is cancelled outright
     rather than resurrected from whatever it was doing before. */
  const now = performance.now();
  const dt = now - (Z.vt || now);
  if (dt >= 100) { Z.vx = Z.vy = 0; }
  else if (dt > 0) {
    const a = .7;
    Z.vx = a * ((Z.x - Z.lx) / dt) + (1 - a) * (Z.vx || 0);
    Z.vy = a * ((Z.y - Z.ly) / dt) + (1 - a) * (Z.vy || 0);
  }
  Z.vt = now; Z.lx = Z.x; Z.ly = Z.y;
}

function onPointerUp(e) {
  pointers.delete(e.pointerId);

  if (pointers.size < 2) Z.pinch = null;
  if (pointers.size === 1) {
    /* re-anchor the pan on the finger that is still down */
    const [p] = [...pointers.values()];
    Z.panFrom = { x: p.x - Z.x, y: p.y - Z.y };
    Z.downAt = { x: p.x, y: p.y };
    /* the finger that stayed has not been moving on its own, so it
       inherits no speed from the pinch it was half of */
    Z.vx = Z.vy = 0;
    Z.vt = performance.now();
    Z.lx = Z.x; Z.ly = Z.y;
    /* a pinch is not a swipe — cancel the dismiss test for this
       gesture rather than letting the leftover finger complete one */
    Z.downAt0 = null;
    return;
  }
  if (pointers.size) return;

  /* SWIPE DOWN TO LEAVE FULL SIZE.

     The same gesture that closes the viewer should close the zoom,
     and on a phone it is the only way out that does not involve
     finding a 30px × with your thumb.

     The conflict is that dragging is already panning. What separates
     them is whether the picture HAD anywhere to go: if the drag moved
     it, you were panning; if the picture did not move at all — either
     it fits the screen, or you were already against its top edge —
     then the gesture had no other meaning, and a firm pull downwards
     is a dismiss. That is the same rubber-band rule the viewer's own
     pull-to-close uses, and it needs no threshold nobody can see.

     Touch and pen only. A mouse drag down is someone panning a
     picture that happens to be clamped, and closing on them would be
     baffling. */
  if (Z.img && Z.touch && Z.downAt0) {
    const dx = e.clientX - Z.downAt0.x, dy = e.clientY - Z.downAt0.y;
    if (dy > 90 && Math.abs(dy) > 1.5 * Math.abs(dx) && Math.abs(Z.y - Z.yAtDown) < 1) {
      Z.panFrom = Z.downAt = Z.downAt0 = null;
      setTimeout(() => Z.dragged = false, 0);
      return unzoom();
    }
  }

  Z.panFrom = Z.downAt = Z.downAt0 = null;
  if (Z.clone) Z.clone.style.cursor = "zoom-out";
  if (Z.dragged) glide();
  setTimeout(() => Z.dragged = false, 0);   /* let the click handler see it */
  /* a pinch that runs out of room settles at the fit level and
     stays open — see the floor note in zoomTo */
}

/* on the window, not the clone: a drag that leaves the image still
   has to keep panning, and a pointer released off-screen still has
   to end the gesture */
addEventListener("pointermove", onPointerMove);
addEventListener("pointerup", onPointerUp);
addEventListener("pointercancel", onPointerUp);
/* Everything below binds to the viewer's own markup, so it is
   fenced off: legal, labs and 404 load this same file and have no
   #lb in them. Without the fence the script would throw on those
   pages and take the rail's language toggle down with it. */
if (lb) {
  /* WHEEL, while zoomed.

     It used to be swallowed outright so you couldn't scroll out from
     under the image — which stopped the bug but left the wheel doing
     nothing, and the wheel is the first thing anyone tries. Now it
     pans, and the image still can't be scrolled out from under.

     ctrl/⌘ + wheel zooms instead. That is not an extra keybinding to
     learn: a two-finger pinch on a trackpad is delivered to the page
     as a wheel event with ctrlKey set, so this is what makes trackpad
     pinch work at no extra cost.

     deltaMode has to be normalised — Firefox reports lines, not
     pixels, and unconverted a single notch pans the width of a
     character instead of a chunk of image.

     The listener is on window rather than .lb because the zoomed
     clone is a child of <body>, outside .lb entirely. */
  addEventListener("wheel", e => {
    if (!Z.img) return;                       /* not zoomed: let the stage scroll */
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    if (e.ctrlKey || e.metaKey) {
      /* no close-on-zoom-out: zoomTo floors at the fit level */
      zoomTo(Z.k * Math.exp(-e.deltaY * unit * 0.0035), e.clientX, e.clientY);
      return;
    }
    stopGlide();
    Z.x -= e.deltaX * unit;
    Z.y -= e.deltaY * unit;
    clamp(Z.k, Z.base);
    apply(false);
  }, { passive: false });

  $("#lbPrev").addEventListener("click", () => stepFrame(-1));
  $("#lbNext").addEventListener("click", () => stepFrame(1));
  lb.addEventListener("click", e => {
    /* Zoomed: anything that is NOT the image steps back out of the
       zoom, rather than doing nothing. Reaching this handler already
       means "not the image" — the zoomed clone lives on <body>,
       outside .lb, so its own clicks never bubble here. One click
       out of the zoom, a second click out of the viewer. */
    if (Z.img) { if (!Z.dragged) unzoom(); return; }
    if (!e.target.closest(".panel, .lb-arrow")) shut();
  });

  /* THE PAGE MUST NOT ZOOM.

     touch-action:none on the clone stops Chrome and Firefox, but
     iOS Safari ignores touch-action for the document pinch
     entirely. So once our zoom hits its floor and stops consuming
     the gesture, the browser picks it up and starts scaling the
     whole page instead — which is the thing you can't undo without
     double-tapping your way back out.

     Eating multi-touch moves for as long as the viewer is zoomed is
     the only thing that reliably stops it. Single-finger touches
     fall through untouched, so panning and the swipe gestures below
     still work. */
  addEventListener("touchmove", e => {
    if (Z.img && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  addEventListener("popstate", () => { if (lb.classList.contains("open")) shut(true); });
  addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") return Z.img ? unzoom() : shut();
    /* the arrows work zoomed as well as not — being close in on one
       picture is exactly when you want to see the next one the same
       way, and it saves zooming out and back in for every piece */
    if (e.key === "ArrowLeft") return stepFrame(-1);
    if (e.key === "ArrowRight") return stepFrame(1);
    if (Z.img) return;
    if (e.key === "Tab") {
      const f = $$("button, a[href]", lb).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const [first, last] = [f[0], f.at(-1)];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  /* SWIPES, while not zoomed.
       sideways → previous / next piece
       downward → close, the gesture every photo viewer on a phone
                  has trained people to expect

     scrollTop is captured at touchSTART, not at the end: a piece
     with extra frames scrolls vertically, and "I was at the top
     when I began pulling" is what separates a dismiss from an
     ordinary scroll. Reading it afterwards would mean a fast scroll
     that lands at the top also closes the viewer. */
  let sx = null, sy = null, sTop = 0, pulling = false;
  const panel = $("#lbPanel");

  const dropPanel = () => {
    pulling = false;
    panel.style.transition = "transform .22s ease, opacity .22s ease";
    panel.style.transform = "";
    panel.style.opacity = "";
  };

  lb.addEventListener("touchstart", e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    sTop = stage.scrollTop;
    pulling = false;
  }, { passive: true });

  /* THE PULL MUST NOT SCROLL THE STAGE FIRST.

     Dragging down to dismiss and dragging down to scroll are the same
     finger movement, and the stage was winning: you pulled, the
     frames scrolled up under you, and only when you let go did the
     viewer close — so a single gesture did two unrelated things, one
     of which you did not ask for.

     Deciding at touchSTART is what separates them. If the stage was
     already at its top when the finger landed, a downward pull cannot
     mean "scroll" — there is nothing above to scroll to — so it is a
     dismiss, and preventDefault stops the browser treating it as one.
     Anywhere else in the stack it is an ordinary scroll and is left
     completely alone.

     preventDefault has to happen on the FIRST move of the gesture. A
     scroll the browser has already started cannot be called back,
     which is why this is a non-passive listener rather than the tidy
     passive one everywhere else in this file.

     The panel follows the finger at 60% — moving less than your hand
     reads as resistance, which is the thing that says "let go and
     this closes" without a word of instruction. */
  lb.addEventListener("touchmove", e => {
    if (sx == null || Z.img || e.touches.length > 1) return;
    const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
    if (!pulling) {
      if (sTop > 0 || dy < 8 || Math.abs(dy) < Math.abs(dx)) return;
      pulling = true;
      panel.style.transition = "none";
    }
    e.preventDefault();
    panel.style.transform = `translateY(${dy * .6}px)`;
    panel.style.opacity = String(Math.max(.4, 1 - dy / 620));
  }, { passive: false });

  lb.addEventListener("touchend", e => {
    if (sx == null || Z.img) { sx = sy = null; return; }
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = sy = null;
    if (pulling) {
      /* far enough is a dismiss; anything less springs back, so a
         half-hearted pull is a question you can withdraw */
      dropPanel();
      if (dy > 90) shut();
      return;
    }
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  lb.addEventListener("touchcancel", dropPanel, { passive: true });
}

/* arriving on /p/<slug> or #p/<slug> opens that piece */
function deepLink() {
  const m = location.pathname.match(/\/p\/([^/]+)$/) || location.hash.match(/^#p\/(.+)/);
  if (!m) return;
  const i = OPEN.findIndex(a => slug(a.title) === m[1]);
  if (i >= 0) open(i, true);
}
