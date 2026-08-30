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
const tileSrcs = it => [`p/t/${slug(it.title)}.webp`, `p/t/${slug(it.title)}.jpg`];

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
    img.addEventListener("click", e => { if (!Z.dragged) toggleZoom(img, e); });
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
  const url = "p/" + slug(it.title);
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
  else if (!fromPop) history.replaceState(null, "", location.pathname);
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
  clone.addEventListener("pointerdown", startDrag);
}

function unzoom(instant = false) {
  const { img, clone, base } = Z;
  if (!img || !clone) return;
  Z.img = null;
  lb.classList.remove("zooming");
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

/* drag to pan — on the copy, so the grid underneath is inert */
function startDrag(e) {
  if (!Z.clone) return;
  e.preventDefault();
  Z.dragged = false;
  const sx = e.clientX - Z.x, sy = e.clientY - Z.y;
  Z.clone.setPointerCapture?.(e.pointerId);
  Z.clone.style.cursor = "grabbing";
  const move = ev => {
    Z.x = ev.clientX - sx; Z.y = ev.clientY - sy;
    Z.dragged = true;
    clamp(Z.k, Z.base);
    apply(false);
  };
  const up = () => {
    if (Z.clone) Z.clone.style.cursor = "zoom-out";
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", up);
    setTimeout(() => Z.dragged = false, 0);   /* let the click handler see it */
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", up);
}
/* Everything below binds to the viewer's own markup, so it is
   fenced off: legal, labs and 404 load this same file and have no
   #lb in them. Without the fence the script would throw on those
   pages and take the rail's language toggle down with it. */
if (lb) {
  /* you can't scroll out from under a zoomed image */
  lb.addEventListener("wheel", e => { if (Z.img) e.preventDefault(); }, { passive: false });

  $("#lbPrev").addEventListener("click", () => step(-1));
  $("#lbNext").addEventListener("click", () => step(1));
  lb.addEventListener("click", e => {
    if (Z.img) return;                                 /* zoomed: clicks belong to the image */
    if (!e.target.closest(".panel, .lb-arrow")) shut();
  });
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
  let sx = null, sy = null;
  lb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (sx == null || Z.img) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
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
