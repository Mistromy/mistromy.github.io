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
})();

/* ---------- keep the tagline on one line, in any language ----------

   "CGI Artist · Backend Dev · Student" fits at full size. The Polish
   "Grafik CGI · Backend Dev · Student" is longer and used to wrap
   onto two lines, which breaks the block under the masthead.

   Shrinking the size in CSS until Polish fits would punish English
   for Polish's length, and would still be a guess the next language
   breaks. So: measure, and scale only when it overflows. Width
   scales close enough to linearly with font-size — letter-spacing is
   in em, so it scales too — which is why one pass lands it; the
   0.98 is headroom for the rounding.

   Runs again after the webfont lands, because Cabinet Grotesk and
   the fallback have different metrics, and on every language switch. */
(function fitTagline() {
  const el = $(".tagline");
  if (!el) return;

  const fit = () => {
    el.style.fontSize = "";                    /* back to the CSS size before measuring */
    const avail = el.clientWidth;
    const natural = el.scrollWidth;
    if (!avail || natural <= avail) return;    /* it fits: leave it alone */
    const base = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = (base * (avail / natural) * 0.98) + "px";
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
const measure = it => new Promise(res => {
  const chain = [...tileSrcs(it), it.img];
  (function attempt(i) {
    if (i >= chain.length) return res(null);
    const im = new Image();
    im.onload = () => res(Object.assign(it, { _src: chain[i], _ar: im.naturalWidth / im.naturalHeight }));
    im.onerror = () => attempt(i + 1);
    im.src = chain[i];
  })(0);
});

function layout(mount, items, maxRows) {
  const W = mount.clientWidth;
  if (!W) return;
  const gap = 14, H = W < 640 ? 190 : 300;
  const rows = [];
  let row = [], sum = 0;
  for (const it of items) {
    const w = Math.min(W, it._ar * H);
    if (row.length && sum + w + gap * row.length > W) {
      rows.push(row); row = []; sum = 0;
      if (maxRows && rows.length >= maxRows) break;   /* a taster stops at whole rows */
    }
    row.push(it); sum += w;
  }
  if (row.length && (!maxRows || rows.length < maxRows)) rows.push(row);

  mount.innerHTML = "";
  rows.forEach((r, ri) => {
    const arSum = r.reduce((s, it) => s + it._ar, 0);
    let h = (W - gap * (r.length - 1)) / arSum;
    if (ri === rows.length - 1 && h > H * 1.25) h = H;
    const el = document.createElement("div");
    el.className = "jrow";
    r.forEach(it => {
      const extra = (it.images || []).length;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tile";
      b.style.width = Math.round(it._ar * h) + "px";
      b.style.height = Math.round(h) + "px";
      b.innerHTML =
        `<span class="tag">${mediums(it).join("·")} // ${it.year}</span>` +
        (extra ? `<span class="plus">+${extra}</span>` : "") +
        `<img src="${it._src}" alt="${altFor(it).replace(/"/g, "&quot;")}" loading="lazy" decoding="async">` +
        `<span class="name">${it.title}</span>`;
      b.addEventListener("click", () => open(OPEN.indexOf(it)));
      el.appendChild(b);
    });
    mount.appendChild(el);
  });
}

(async function gallery() {
  const mount = $("#grid");
  if (!mount) return;
  const maxRows = parseInt(mount.dataset.rows || "0", 10);
  const pool = maxRows ? Math.min(ART.length, maxRows * 5) : ART.length;
  (await Promise.all(ART.slice(0, pool).map(measure))).filter(Boolean).forEach(m => OPEN.push(m));
  layout(mount, OPEN, maxRows);
  /* a mount with no width yet (hidden tab, display:none ancestor, a
     container that hasn't been laid out) makes layout() bail — without
     a retry the gallery stays empty forever. watch the box itself. */
  let w = mount.clientWidth;
  const relayout = () => {
    if (mount.clientWidth === w) return;
    w = mount.clientWidth;
    layout(mount, OPEN, maxRows);
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

function open(i, replace = false) {
  if (i < 0 || !OPEN[i]) return;
  unzoom(true);
  idx = i;
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
  x.textContent = "close esc";
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
  stage.scrollTop = 0;
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
  unzoom(true);
  lb.classList.remove("open");
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
function apply(animate) {
  Z.clone.style.transition = animate && !reduced ? "transform .28s cubic-bezier(.2,.7,.3,1)" : "none";
  Z.clone.style.transform = `translate(${Z.x}px,${Z.y}px) scale(${Z.k})`;
  updateBars();
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
function zoomTo(k, cx, cy, animate) {
  const r = Z.base;
  if (!r) return;
  k = Math.max(1, Math.min(k, Z.max));
  const px = (cx - r.left - Z.x) / Z.k;      /* image-local point... */
  const py = (cy - r.top - Z.y) / Z.k;
  Z.k = k;
  Z.x = cx - r.left - px * k;                /* ...put back under the cursor */
  Z.y = cy - r.top - py * k;
  clamp(k, r);
  apply(animate);
}

/* the ORIGINAL <img> never moves. a COPY is lifted out and grown on top
   of it, and the original just goes visibility:hidden — which keeps its
   box, so the stage's layout and scrollTop are never touched. that is
   what fixes both bugs: the grid can't jitter (nothing left the flow)
   and closing the zoom can't teleport to the top (scrollTop never
   changed in the first place). */
function toggleZoom(img, e) {
  if (Z.img) return unzoom();
  const r = img.getBoundingClientRect();
  /* enough to be worth it, capped so a small file doesn't turn to mush */
  const k = Math.max(1.6, Math.min(img.naturalWidth / r.width || 2, 5));

  const clone = img.cloneNode(true);
  clone.removeAttribute("id");
  clone.style.cssText =
    `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;` +
    `margin:0;max-width:none;max-height:none;transform-origin:0 0;z-index:200;` +
    `cursor:zoom-out;touch-action:none;`;
  document.body.appendChild(clone);
  img.style.visibility = "hidden";

  Z.img = img; Z.clone = clone; Z.base = r; Z.k = 1; Z.x = 0; Z.y = 0;
  /* k is 1:1 pixels — the level a click lands on. The ceiling sits
     ABOVE it on purpose: with max == the click level there is
     nowhere for a pinch-out or a wheel-zoom to go, so on a phone
     (where 1:1 is already a big number) the gesture would silently
     do nothing. 1.6x past native is enough to inspect a detail
     without turning the file to mush; the 8 is a hard stop. */
  Z.nat = k;
  Z.max = Math.min(Math.max(k * 1.6, 4), 8);
  makeBars();
  apply(false);
  /* flush this as the transition's starting point. reading a layout
     property forces it synchronously — rAF would be the usual trick but
     it doesn't fire in a throttled or hidden tab, and the FINAL position
     must never depend on the frame loop running. */
  void clone.offsetWidth;

  Z.k = k;
  Z.x = (e.clientX - r.left) * (1 - k);
  Z.y = (e.clientY - r.top) * (1 - k);
  clamp(k, r);
  apply(true);
  lb.classList.add("zooming");
  clone.addEventListener("click", () => { if (!Z.dragged) unzoom(); });
  clone.addEventListener("pointerdown", onPointerDown);
}

function unzoom(instant = false) {
  const { img, clone, base } = Z;
  if (!img || !clone) return;
  Z.img = null;
  lb.classList.remove("zooming");
  killBars();
  const done = () => { clone.remove(); img.style.visibility = ""; Z.clone = null; };
  if (instant || reduced) return done();
  /* animate back onto wherever the original actually sits now, rather
     than assuming it hasn't moved */
  const now = img.getBoundingClientRect();
  Z.k = 1;
  Z.x = now.left - base.left;
  Z.y = now.top - base.top;
  apply(true);
  clone.addEventListener("transitionend", done, { once: true });
  setTimeout(done, 340);              /* transitionend can be skipped */
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
    Z.dragged = false;
    Z.downAt = { x: e.clientX, y: e.clientY };
    Z.panFrom = { x: e.clientX - Z.x, y: e.clientY - Z.y };
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
    if (p.d > 0 && Z.pinch.d > 0) zoomTo(Z.pinch.k * (p.d / Z.pinch.d), p.cx, p.cy, false);
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
}

function onPointerUp(e) {
  pointers.delete(e.pointerId);

  if (pointers.size < 2) Z.pinch = null;
  if (pointers.size === 1) {
    /* re-anchor the pan on the finger that is still down */
    const [p] = [...pointers.values()];
    Z.panFrom = { x: p.x - Z.x, y: p.y - Z.y };
    Z.downAt = { x: p.x, y: p.y };
    return;
  }
  if (pointers.size) return;

  Z.panFrom = Z.downAt = null;
  if (Z.clone) Z.clone.style.cursor = "zoom-out";
  setTimeout(() => Z.dragged = false, 0);   /* let the click handler see it */
  /* pinched all the way back down: close rather than leaving a
     zoomed view that is no longer zoomed into anything */
  if (Z.img && Z.k <= 1.02) unzoom();
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
      zoomTo(Z.k * Math.exp(-e.deltaY * unit * 0.0035), e.clientX, e.clientY, false);
      if (Z.k <= 1.02) unzoom();
      return;
    }
    Z.x -= e.deltaX * unit;
    Z.y -= e.deltaY * unit;
    clamp(Z.k, Z.base);
    apply(false);
  }, { passive: false });

  $("#lbPrev").addEventListener("click", () => step(-1));
  $("#lbNext").addEventListener("click", () => step(1));
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
    if (Z.img) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
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
  let sx = null, sy = null, sTop = 0;
  lb.addEventListener("touchstart", e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    sTop = stage.scrollTop;
  }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (sx == null || Z.img) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > 1.5 * Math.abs(dx) && sTop <= 0) shut();
    sx = sy = null;
  }, { passive: true });
}

/* arriving on /p/<slug> or #p/<slug> opens that piece */
function deepLink() {
  const m = location.pathname.match(/\/p\/([^/]+)$/) || location.hash.match(/^#p\/(.+)/);
  if (!m) return;
  const i = OPEN.findIndex(a => slug(a.title) === m[1]);
  if (i >= 0) open(i, true);
}
