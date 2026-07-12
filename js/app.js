/* ============================================================
   MIST — machinery
   nothing in here should need editing to add content — that's
   all js/data.js. this file just wires it up. every builder
   checks whether its mount exists, so the same script runs on
   index.html, art.html and projects.html.
   ============================================================ */

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function shuffle(arr){
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.random() * (i + 1) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- random transmissions — quotes pulled from MARQUEE ----------
   .random-quote gets a bare line, [data-random-note] gets a "// " one.
   fresh picks every load, no repeats within a page. */
(function randomBits(){
  const pool = shuffle(MARQUEE);
  const next = () => pool.length ? pool.pop() : MARQUEE[Math.random() * MARQUEE.length | 0];
  $$(".random-quote").forEach(el => el.textContent = next());
  $$("[data-random-note]").forEach(el => el.textContent = "// " + next());
})();

/* ---------- boot sequence — once per session ---------- */
(function runBoot(){
  const boot = $("#boot");
  if (!boot) return;
  if (reducedMotion || sessionStorage.getItem("booted")){ boot.remove(); return; }
  sessionStorage.setItem("booted", "1");
  const bootLines = [
    "MIST.SYS v2.0",
    "> condensing…………………… ok",
    "> mounting sectors… [/about] [/links] [/art] [/sys] [/bio]",
    "> heartbeat…………………… found",
    "> can you hear me?",
  ];
  const log = $("#bootLog");
  let i = 0;
  const timer = setInterval(() => {
    if (i >= bootLines.length){ clearInterval(timer); endBoot(); return; }
    const line = document.createElement("div");
    if (i === bootLines.length - 1){ line.innerHTML = "<b>" + bootLines[i] + "</b>"; }
    else { line.textContent = bootLines[i]; }
    log.appendChild(line);
    i++;
  }, 260);
  boot.addEventListener("click", () => { clearInterval(timer); endBoot(); }, { once: true });
  function endBoot(){
    setTimeout(() => {
      boot.classList.add("done");
      glitchOnce();
      setTimeout(() => boot.remove(), 500);
    }, 350);
  }
})();

/* ---------- epoch ticker + year ---------- */
function tickEpoch(){
  const now = Math.floor(Date.now() / 1000);
  const ep = $("#epoch"); if (ep) ep.textContent = "SYS_EPOCH // " + now;
  const fe = $("#footEpoch"); if (fe) fe.textContent = now;
}
setInterval(tickEpoch, 1000); tickEpoch();
const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

/* ---------- binary side columns ---------- */
(function fillBinary(){
  const word = "mist";
  const bin = [...word].map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
  $$(".bin").forEach(el => { el.textContent = (bin + "  ").repeat(10); });
})();

/* ---------- hero glitch pulse ---------- */
const glitchEl = $("#glitchName");
function glitchOnce(){
  if (reducedMotion || !glitchEl) return;
  glitchEl.classList.add("on");
  setTimeout(() => glitchEl.classList.remove("on"), 380);
}
if (!reducedMotion && glitchEl) setInterval(glitchOnce, 6500);

/* ---------- cursor fringe ---------- */
(function cursorFx(){
  const fx = $("#cursorFx");
  if (reducedMotion || !fx || !window.matchMedia("(hover:hover)").matches) return;
  let tx = -500, ty = -500, x = tx, y = ty, live = false;
  window.addEventListener("pointermove", e => {
    tx = e.clientX; ty = e.clientY;
    if (!live){ x = tx; y = ty; live = true; fx.classList.add("live"); }
  }, { passive: true });
  (function loop(){
    x += (tx - x) * 0.12; y += (ty - y) * 0.12;
    fx.style.transform = `translate(${x - 170}px, ${y - 170}px)`;
    requestAnimationFrame(loop);
  })();
})();

/* ---------- scroll reveal + heading scramble ---------- */
(function reveals(){
  const els = $$(".rv");
  if (reducedMotion || !("IntersectionObserver" in window)){
    els.forEach(el => el.classList.add("in"));
    $$(".scramble").forEach(h => h.dataset.done = "1");
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      const h = en.target.querySelector(".scramble");
      if (h) scramble(h);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
})();

function scramble(el){
  if (el.dataset.done) return;
  el.dataset.done = "1";
  const final = el.textContent;
  const glyphs = "▓▒░<>/\\#01_";
  const dur = 550, start = performance.now();
  (function step(t){
    const p = Math.min((t - start) / dur, 1);
    const settled = Math.floor(final.length * p);
    el.textContent = final.slice(0, settled) +
      [...final.slice(settled)].map(c => c === " " ? " " : glyphs[Math.random() * glyphs.length | 0]).join("");
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = final;
  })(start);
}

/* ---------- mobile menu — burger opens, tapping anywhere else closes.
   an invisible scrim sits under the open panel and swallows the
   closing tap, so it can't also click whatever was underneath. */
(function mobileMenu(){
  const nav = $(".nav"), burger = $("#navBurger");
  if (!nav || !burger) return;
  const scrim = document.createElement("div");
  scrim.className = "nav-scrim";
  document.body.appendChild(scrim);
  const setOpen = open => {
    nav.classList.toggle("open", open);
    scrim.classList.toggle("show", open);
    burger.setAttribute("aria-expanded", open);
  };
  burger.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  scrim.addEventListener("click", () => setOpen(false));
  $$(".nav-links a", nav).forEach(a => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
})();

/* ---------- discord presence via lanyard ----------
   fills the little discord bio card next to the bio: avatar, real
   discord status colours, and the current activity — custom rich
   presences included (vsc, blender…). the sysbar stays out of it. */
(function presence(){
  const card = $(".dcard");
  if (!card || !SITE.discordId) return;
  const COLORS = { online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e" };
  const LABELS = { online: "online", idle: "idle", dnd: "do not disturb", offline: "offline" };
  const trim = (s, n=52) => s.length > n ? s.slice(0, n - 1) + "…" : s;
  async function tick(){
    try {
      const res = await fetch("https://api.lanyard.rest/v1/users/" + SITE.discordId);
      if (!res.ok) throw new Error(res.status);
      const j = await res.json();
      if (!j.success) throw new Error("not registered");
      const d = j.data;
      const status = d.discord_status || "offline";
      const av = $("#dcAvatar");
      if (av && !av.src && d.discord_user && d.discord_user.avatar){
        av.src = "https://cdn.discordapp.com/avatars/" + SITE.discordId + "/" + d.discord_user.avatar + ".png?size=96";
      }
      $("#dcDot").style.background = COLORS[status] || COLORS.offline;
      const st = $("#dcStatus");
      st.textContent = LABELS[status] || status;
      st.style.color = COLORS[status] || "";
      /* type 0 = playing/rich presence (vsc, blender, games), 2 = spotify */
      const act = (d.activities || []).find(a => a.type === 0 || a.type === 2);
      $("#dcAct").textContent = act
        ? trim(act.name.toLowerCase() + (act.details ? " · " + act.details.toLowerCase() : ""))
        : "";
    } catch {
      const st = $("#dcStatus");
      if (st){ st.textContent = "no signal"; st.style.color = ""; }
    }
  }
  tick();
  setInterval(tick, 60000);
})();

/* ---------- url hygiene — section hashes vanish after the jump.
   #p/… (artwork deep links) are the one hash that stays. ---------- */
(function hashHygiene(){
  const clean = () => {
    if (location.hash && !location.hash.startsWith("#p/"))
      history.replaceState(null, "", location.pathname + location.search);
  };
  window.addEventListener("hashchange", () => setTimeout(clean, 60));
  /* arriving from a subpage link like ./#about — let the browser jump
     to the anchor first, then tidy the address bar */
  window.addEventListener("load", () => setTimeout(clean, 300));
})();

/* ---------- 88x31 badges — footer row, only if BADGES has entries ---------- */
(function buildBadges(){
  const foot = $("footer .wrap");
  if (!foot || typeof BADGES === "undefined" || !BADGES.length) return;
  const row = document.createElement("div");
  row.className = "badges";
  BADGES.forEach(b => {
    const img = document.createElement("img");
    img.src = b.img;
    img.alt = b.alt || "";
    img.loading = "lazy";
    img.width = 88; img.height = 31;
    img.onerror = () => (b.url ? img.parentElement : img).remove();
    if (b.url){
      const a = document.createElement("a");
      a.href = b.url; a.target = "_blank"; a.rel = "noopener";
      a.appendChild(img);
      row.appendChild(a);
    } else row.appendChild(img);
  });
  foot.appendChild(row);
})();

/* ---------- github heatmap — hide the frame if the image dies ---------- */
(function heatmap(){
  const img = $("#ghHeat");
  if (!img) return;
  const kill = () => { const box = img.closest(".heatmap"); if (box) box.style.display = "none"; };
  if (img.complete && !img.naturalWidth) kill();
  img.onerror = kill;
})();

/* ---------- nav scrollspy (index) / static sector (subpages) ---------- */
(function scrollspy(){
  const fixed = document.body.dataset.sector;
  if (fixed){
    const st = $("#sysStatus"); if (st) st.textContent = "sector:/" + fixed;
    return;
  }
  const sections = $$("main section[id]");
  const links = $$(".nav a[data-nav]");
  if (sections.length < 2 || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      links.forEach(a => a.classList.toggle("active", a.dataset.nav === id));
      const st = $("#sysStatus"); if (st) st.textContent = "sector:/" + id;
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach(s => io.observe(s));
})();

/* ---------- links ---------- */
(function buildLinks(){
  const grid = $("#linksGrid");
  if (!grid) return;
  SOCIALS.forEach((s, i) => {
    const a = document.createElement("a");
    a.className = "social rv";
    a.style.transitionDelay = (i * 60) + "ms";
    if (s.random){
      /* mystery link — every click rolls the dice again */
      a.href = s.random[0];
      a.target = "_blank"; a.rel = "noopener";
      a.addEventListener("click", e => {
        e.preventDefault();
        window.open(s.random[Math.random() * s.random.length | 0], "_blank", "noopener");
      });
    } else {
      a.href = s.url;
      if (!s.url.startsWith("mailto:")){ a.target = "_blank"; a.rel = "noopener"; }
    }
    a.innerHTML =
      '<span><span class="social-name">' + s.name + '</span><br>' +
      '<span class="social-sub">' + s.sub + '</span></span><span class="go">-&gt;</span>';
    grid.appendChild(a);
  });
  observeLate(grid);
})();

/* ============================================================
   the gallery — justified rows.
   every image keeps its native aspect ratio; rows are packed to
   the full container width at roughly equal heights. no crops,
   no stretching, no bars, no holes. missing files become 3:4
   stencil tiles so the layout never breaks.
   ============================================================ */
let lbList = [], lbIndex = 0;
const PLACEHOLDER_AR = 3 / 4;

const mediums = item => [].concat(item.medium);
const isVideo = src => /\.(mp4|webm)([?#]|$)/i.test(src);
/* literal description for screen readers + SEO. item.alt overrides. */
const altFor  = item => item.alt ||
  (item.title + " — " + mediums(item).join(" and ") + " artwork by Mist" + (item.tags ? " (" + item.tags + ")" : ""));

function measureArt(items){
  return Promise.all(items.map(it => new Promise(res => {
    if (it._ar != null) return res();
    if (isVideo(it.img)){
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { it._ar = (v.videoWidth / v.videoHeight) || PLACEHOLDER_AR; it._ok = true; res(); };
      v.onerror = () => { it._ar = PLACEHOLDER_AR; it._ok = false; res(); };
      v.src = it.img;
    } else {
      const im = new Image();
      im.onload  = () => { it._ar = im.naturalWidth / im.naturalHeight; it._ok = true; res(); };
      im.onerror = () => { it._ar = PLACEHOLDER_AR; it._ok = false; res(); };
      im.src = it.img;
    }
  })));
}

function makeTile(item, w, h){
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "tile" + (item._ok ? "" : " noimg");
  tile.style.width = w + "px";
  tile.style.height = h + "px";
  tile.dataset.title = item.title;
  tile.dataset.src = item.img;
  const tag = mediums(item).join("·") + " // " + item.year;
  const extra = (item.images || []).length;
  if (item._ok){
    const media = isVideo(item.img)
      ? '<video src="' + item.img + '" muted loop autoplay playsinline aria-label="' + altFor(item).replace(/"/g,"&quot;") + '"></video>'
      : '<img src="' + item.img + '" alt="' + altFor(item).replace(/"/g,"&quot;") + '">';
    tile.innerHTML =
      '<span class="tile-tag">' + tag + "</span>" +
      (extra ? '<span class="tile-count">+' + extra + "</span>" : "") +
      media +
      '<span class="tile-title">' + item.title + "</span>";
  } else {
    tile.innerHTML = '<span class="tile-tag">' + tag + "</span>";
  }
  return tile;
}

function layoutJustified(mount, items, onTileClick){
  const W = mount.clientWidth;
  if (!W) return;
  /* clientWidth, not innerWidth — it tracks the css media queries even
     when the visual viewport is pinch-zoomed */
  const mobile = document.documentElement.clientWidth <= 600;
  const gap = mobile ? 10 : 14;
  const target = mobile ? 200 : 300;        // ideal row height
  const maxH = Math.round(target * 1.5);
  /* greedy row packing — when a tile would overshoot the row, it either
     stays or opens the next row, whichever lands the row height closer
     to the target. stops one wide frame from crushing a row into a
     tiny strip, and keeps neighbouring rows at comparable sizes. */
  const rows = [];
  let row = [], arSum = 0;
  items.forEach(it => {
    if (row.length && (arSum + it._ar) * target + gap * row.length >= W){
      const hWith    = (W - gap * row.length)       / (arSum + it._ar);
      const hWithout = (W - gap * (row.length - 1)) / arSum;
      if (Math.abs(hWith - target) < Math.abs(hWithout - target)){
        row.push(it);
        rows.push(row); row = []; arSum = 0;
        return;
      }
      rows.push(row); row = []; arSum = 0;
    }
    row.push(it); arSum += it._ar;
    if (arSum * target + gap * (row.length - 1) >= W){ rows.push(row); row = []; arSum = 0; }
  });
  if (row.length) rows.push(row);
  /* a sparse final row leaves a hole — fold it into the previous row,
     but only if that row stays a reasonable size afterwards */
  if (rows.length > 1){
    const last = rows[rows.length - 1];
    const fill = last.reduce((s, it) => s + it._ar, 0) * target + gap * (last.length - 1);
    if (fill < W * 0.55){
      const merged = [...rows[rows.length - 2], ...last];
      const hMerged = (W - gap * (merged.length - 1)) / merged.reduce((s, it) => s + it._ar, 0);
      if (hMerged >= target * 0.72) rows[rows.length - 2].push(...rows.pop());
    }
  }
  mount.innerHTML = "";
  rows.forEach((r, idx) => {
    const arTotal = r.reduce((s, it) => s + it._ar, 0);
    let h = (W - gap * (r.length - 1)) / arTotal;
    /* last row that still can't fill the width: cap the height so the
       leftover gap stays small instead of tile-sized */
    if (idx === rows.length - 1 && h > maxH) h = maxH;
    h = Math.round(h);
    const rowEl = document.createElement("div");
    rowEl.className = "jrow";
    r.forEach(it => {
      const tile = makeTile(it, Math.round(it._ar * h), h);
      tile.addEventListener("click", () => onTileClick(it));
      rowEl.appendChild(tile);
    });
    mount.appendChild(rowEl);
  });
}

(async function buildGallery(){
  const mount = $("#artGrid");
  if (!mount) return;
  const limit = parseInt(mount.dataset.limit || "0", 10);
  let filter = "all", query = "";

  /* chips generate themselves from whatever mediums exist in ART —
     a new medium word in data.js is automatically a new filter */
  const chipsBox = $("#artChips");
  if (chipsBox){
    const all = [...new Set(ART.flatMap(mediums))];
    chipsBox.innerHTML =
      '<button class="chip active" data-filter="all">all</button>' +
      all.map(m => '<button class="chip" data-filter="' + m + '">' + m + "</button>").join("");
  }

  const current = () => {
    let list = ART.filter(a => filter === "all" || mediums(a).includes(filter));
    if (query){
      list = list.filter(a =>
        (a.title + " " + (a.tags || "") + " " + (a.note || "") + " " + mediums(a).join(" "))
          .toLowerCase().includes(query));
    }
    return limit ? list.slice(0, limit) : list;
  };
  let lastW = 0;
  const render = () => {
    lastW = mount.clientWidth;
    if (!lastW) return; // not laid out yet (hidden tab etc.) — observer below retries
    const list = current();
    layoutJustified(mount, list, item => {
      if (!item._ok) return;
      lbList = list.filter(a => a._ok);
      lbIndex = lbList.indexOf(item);
      openLightbox(item);
    });
  };
  await measureArt(limit ? ART.slice(0, limit) : ART);
  render();
  /* re-layout whenever the mount's width actually changes — covers
     window resizes, scrollbar appearance, and background tabs that
     get their first real layout only when they become visible */
  let rt;
  const onSize = () => { clearTimeout(rt); rt = setTimeout(() => { if (mount.clientWidth !== lastW) render(); }, 120); };
  if ("ResizeObserver" in window) new ResizeObserver(onSize).observe(mount);
  window.addEventListener("resize", onSize);
  /* hidden tabs get no rendering frames, so RO stays silent until the
     tab is shown — catch that moment explicitly */
  document.addEventListener("visibilitychange", onSize);
  $$("#artChips .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      $$("#artChips .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      filter = chip.dataset.filter;
      render();
    });
  });
  /* search — wired and waiting; uncomment the input in art.html to enable */
  const search = $("#artSearch");
  if (search) search.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    render();
  });
})();

/* ---------- lightbox — stacks all frames of a post, links out.
   the open post is reflected in the url (#p/slug) so every artwork
   is deep-linkable without any extra links on the page. ---------- */
const lb = $("#lightbox");
const slugFor = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function openLightbox(item){
  if (!lb) return;
  const stack = $("#lbStack");
  /* images entries can be plain urls or { src, tag } — tag shows as a
     little chip on the frame ("final", "wireframe", "iteration"…) */
  const frames = [item.img, ...(item.images || [])]
    .map(f => typeof f === "string" ? { src: f } : f);
  stack.innerHTML = "";
  frames.forEach((f, i) => {
    const wrap = document.createElement("div");
    wrap.className = "lb-item";
    let media;
    if (isVideo(f.src)){
      media = document.createElement("video");
      media.src = f.src; media.controls = true; media.loop = true;
      media.muted = true; media.playsInline = true; media.autoplay = true;
    } else {
      media = document.createElement("img");
      media.src = f.src;
      media.alt = altFor(item) + (i ? " — image " + (i + 1) : "");
    }
    wrap.appendChild(media);
    if (f.tag){
      const chip = document.createElement("span");
      chip.className = "lb-tag";
      chip.textContent = f.tag;
      wrap.appendChild(chip);
    }
    const raw = document.createElement("a");
    raw.className = "lb-raw";
    raw.href = f.src; raw.target = "_blank"; raw.rel = "noopener";
    raw.textContent = "raw ↗";
    raw.title = "open the raw file in a new tab";
    wrap.appendChild(raw);
    stack.appendChild(wrap);
  });
  stack.scrollTop = 0;
  const extra = frames.length - 1;
  $("#lbTitle").textContent = item.title;
  $("#lbMeta").textContent = "// " + mediums(item).join("·") + " // " + item.year +
    (extra ? " // " + frames.length + " frames — scroll ↓" : "");
  $("#lbNote").textContent = item.note || item.tags || "";
  const links = $("#lbLinks");
  links.innerHTML = "";
  Object.entries(item.post || {}).forEach(([site, url]) => {
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = site + " ->";
    links.appendChild(a);
  });
  /* share — copies the /p/ stub url, which embeds the artwork on
     discord etc. (stubs are generated by scripts/gen-embeds.mjs) */
  const share = document.createElement("a");
  share.href = "p/" + slugFor(item.title);
  share.textContent = "share ->";
  share.addEventListener("click", e => {
    e.preventDefault();
    const url = new URL(share.getAttribute("href"), location.href).href;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    share.textContent = "copied!";
    setTimeout(() => { share.textContent = "share ->"; }, 1200);
  });
  links.appendChild(share);
  lb.classList.add("open");
  document.body.classList.add("no-scroll");
  history.replaceState(null, "", "#p/" + slugFor(item.title));
}
function closeLightbox(){
  lb.classList.remove("open");
  $("#lbStack").innerHTML = "";
  document.body.classList.remove("no-scroll");
  if (location.hash.startsWith("#p/"))
    history.replaceState(null, "", location.pathname + location.search);
}
function stepLightbox(dir){
  if (!lbList.length) return;
  lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
  openLightbox(lbList[lbIndex]);
}
if (lb){
  $("#lbClose").addEventListener("click", closeLightbox);
  $("#lbPrev").addEventListener("click", e => { e.stopPropagation(); stepLightbox(-1); });
  $("#lbNext").addEventListener("click", e => { e.stopPropagation(); stepLightbox(1); });
  /* the framed stack is the viewer — a click anywhere outside it
     (backdrop, gaps around the frame) closes */
  lb.addEventListener("click", e => {
    if (!e.target.closest(".lb-stack, .lb-nav, .close, .lb-head")) closeLightbox();
  });
  window.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });
  /* horizontal swipe = prev/next. vertical stays free for scrolling
     the stack, so no swipe-down-to-close. */
  let sx = null, sy = null;
  lb.addEventListener("touchstart", e => {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) stepLightbox(dx < 0 ? 1 : -1);
    sx = sy = null;
  }, { passive: true });
  /* deep link: #p/slug in the url opens that post on arrival */
  const deep = location.hash.match(/^#p\/(.+)/);
  if (deep){
    const item = ART.find(a => slugFor(a.title) === deep[1]);
    if (item){
      lbList = ART; lbIndex = ART.indexOf(item);
      openLightbox(item);
    }
  }
}

/* ---------- latest transmission — ART[0], no hands ---------- */
(function buildLatest(){
  const aside = $(".latest");
  const item = ART[0];
  if (!aside || !item) return;
  $("#latestStamp").textContent = mediums(item).join("·") + " // " + item.year;
  $("#latestTitle").textContent = item.title;
  $("#latestNote").textContent = item.note || item.tags;
  const img = $("#latestImg");
  img.alt = item.title + " — " + item.tags;
  img.onerror = () => { aside.style.display = "none"; };
  img.src = item.img;
  $("#latestFrame").addEventListener("click", () => {
    lbList = ART.filter(a => a._ok !== false); lbIndex = 0;
    openLightbox(item);
  });
})();

/* ---------- projects — flagship box + cards, all from data.js ---------- */
function projectStatsHtml(stats){
  return (stats || []).map(s => {
    if (s.key != null){
      return '<div class="mini-stat"><span>' + s.label + '</span>' +
        '<b data-stat-key="' + s.key + '"' +
        (s.compact ? " data-compact" : "") +
        (s.fmt ? ' data-fmt="' + s.fmt + '"' : "") + ">░░░</b></div>";
    }
    return '<div class="mini-stat"><span>' + s.label + "</span><b>" +
      (typeof s.value === "number" ? s.value.toLocaleString() : s.value) + "</b></div>";
  }).join("");
}
function projectLinksHtml(links){
  return (links || []).map(l =>
    '<a class="btn' + (l.solid ? " btn-solid" : "") + '" href="' + l.url +
    '" target="_blank" rel="noopener">' + l.label + "</a>").join("");
}
(function buildProjects(){
  const flagMount = $("#flagshipMount");
  const grid = $("#projectsGrid");
  if (!flagMount && !grid) return;
  PROJECTS.forEach(p => {
    if (p.flagship && flagMount){
      const el = document.createElement("div");
      el.className = "featured-proj rv";
      el.innerHTML =
        "<div>" +
          '<p class="eyebrow">// flagship — long-running playground</p>' +
          '<h3 class="chroma">' + p.name + "</h3>" +
          '<p class="desc">' + p.desc + "</p>" +
          '<div class="pills">' + p.pills.map((x, i) => '<span class="pill' + (i === 0 ? " hot" : "") + '">' + x + "</span>").join("") + "</div>" +
          '<div class="hero-cta">' + projectLinksHtml(p.links) + "</div>" +
        "</div>" +
        '<div class="mini-stats">' +
          projectStatsHtml(p.stats) +
          '<div class="mini-stat"><span>status</span><b data-stat="status" style="font-size:14px;font-family:var(--mono)">checking…</b></div>' +
        "</div>";
      flagMount.appendChild(el);
      observeLate(flagMount);
    } else if (!p.flagship && grid){
      const el = document.createElement("div");
      el.className = "proj rv";
      el.innerHTML =
        "<h3>" + p.name + "</h3>" +
        "<p>" + p.desc + "</p>" +
        '<div class="pills">' + (p.pills || []).map(x => '<span class="pill">' + x + "</span>").join("") + "</div>" +
        (p.stats && p.stats.length ? '<div class="mini-stats proj-stats">' + projectStatsHtml(p.stats) + "</div>" : "") +
        '<div class="hero-cta">' + projectLinksHtml(p.links) + "</div>";
      grid.appendChild(el);
    }
  });
  if (grid) observeLate(grid);
})();


/* ---------- marquee — shuffled every load, seamless loop ----------
   the track holds the line exactly twice and animates to -50%, so the
   moment the first copy scrolls out the second is already in place —
   no off-screen dead time. duration scales with content length. */
(function buildMarquee(){
  const track = $("#marqueeTrack");
  if (!track) return;
  const items = shuffle(MARQUEE);
  const line = items.map(m => m + ' <em>///</em> ').join("");
  track.innerHTML = line + line;
  track.style.animationDuration = Math.max(30, Math.round(items.join(" ").length * 0.22)) + "s";
})();

/* observe .rv elements created after the initial reveal pass */
function observeLate(root){
  const els = $$(".rv:not(.in)", root);
  if (reducedMotion || !("IntersectionObserver" in window)){
    els.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
}

/* ---------- number formatting + animation ---------- */
function fmtCompact(n){
  if (n >= 1e6) return (Math.floor(n / 1e5) / 10).toLocaleString() + "M";
  if (n >= 1e4) return Math.floor(n / 1e3) + "K";
  return n.toLocaleString();
}
/* the animation only runs once the number scrolls into view — data can
   arrive long before the reader does, so each element waits its turn */
function countUp(el, target, compact=false){
  if (!el) return;
  const fmt = compact ? fmtCompact : (v => v.toLocaleString());
  if (reducedMotion || !("IntersectionObserver" in window)){ el.textContent = fmt(target); return; }
  countUp.jobs = countUp.jobs || new Map();
  countUp.io = countUp.io || new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      countUp.io.unobserve(en.target);
      const run = countUp.jobs.get(en.target);
      countUp.jobs.delete(en.target);
      if (run) run();
    });
  }, { threshold: 0.5 });
  countUp.jobs.set(el, () => {
    const dur = 900, start = performance.now();
    (function step(t){
      const p = Math.min((t - start) / dur, 1);
      el.textContent = fmt(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  });
  countUp.io.observe(el);
}
/* ---------- sparkline — an array in the stats gist becomes a graph.
   single series on the site surface: one hue (cyan), 2px line, end dot,
   last value as text beside it. min/max/last live in the tooltip. ---------- */
function sparkline(el, arr, compact=false){
  const data = arr.filter(v => typeof v === "number");
  if (data.length < 2){ el.textContent = "░░░"; el.classList.add("live-err"); return; }
  const fmt = compact ? fmtCompact : (v => v.toLocaleString());
  const w = 96, h = 26, pad = 3;
  const min = Math.min(...data), max = Math.max(...data), span = (max - min) || 1;
  const x = i => pad + i * (w - 2 * pad) / (data.length - 1);
  const y = v => h - pad - (v - min) * (h - 2 * pad) / span;
  const pts = data.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  const last = data[data.length - 1];
  el.innerHTML =
    '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" role="img" ' +
      'aria-label="trend, latest ' + fmt(last) + '">' +
      '<polyline points="' + pts + '" fill="none" stroke="var(--cyan)" stroke-width="2" ' +
        'stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + x(data.length - 1).toFixed(1) + '" cy="' + y(last).toFixed(1) + '" r="2.5" fill="var(--cyan)"/>' +
    "</svg><span>" + fmt(last) + "</span>";
  el.title = "latest " + last.toLocaleString() + " · min " + min.toLocaleString() + " · max " + max.toLocaleString();
}

function statFail(id, srcId, label="offline // no answer"){
  const el = $(id); if (el){ el.textContent = "░░░"; el.classList.add("live-err"); }
  const src = $(srcId); if (src){ src.textContent = label; src.classList.add("off"); }
}

/* ---------- counted by the site, not by hand ---------- */
countUp($("#stArtworks"), ART.length);

/* ---------- live data: GitHub ---------- */
(async function github(){
  if ($("#stRepos")){
    try {
      const res = await fetch("https://api.github.com/users/" + SITE.githubUser);
      if (!res.ok) throw new Error(res.status);
      const u = await res.json();
      countUp($("#stRepos"), u.public_repos);
      countUp($("#stFollowers"), u.followers);
    } catch {
      statFail("#stRepos", "#stReposSrc");
      statFail("#stFollowers", "#stFollowersSrc");
    }
  }

  /* commit count on the flagship repo — the Link header on a
     per_page=1 commits request carries the total as the last page.
     if the api rate-limits, fall back to the shields.io badge json. */
  if ($("#stCommits")){
    try {
      const res = await fetch("https://api.github.com/repos/" + SITE.flagshipRepo + "/commits?per_page=1");
      if (!res.ok) throw new Error(res.status);
      const m = (res.headers.get("Link") || "").match(/page=(\d+)>; rel="last"/);
      if (!m) throw new Error("no link header");
      countUp($("#stCommits"), +m[1]);
    } catch {
      try {
        const res = await fetch(SITE.commitsBadge);
        if (!res.ok) throw new Error(res.status);
        const badge = await res.json();
        const n = parseInt(String(badge.value ?? badge.message ?? "").replace(/\D/g, ""), 10);
        if (!n) throw new Error("no number in badge");
        countUp($("#stCommits"), n);
        const src = $("#stCommitsSrc");
        if (src) src.textContent = "shields.io // live";
      } catch {
        $("#stCommits").textContent = MANUAL.commitsFallback;
        const src = $("#stCommitsSrc");
        if (src){ src.textContent = "counted by hand // cached"; src.classList.add("off"); }
      }
    }
  }

  const grid = $("#repoGrid");
  if (grid){
    try {
      const res = await fetch("https://api.github.com/users/" + SITE.githubUser + "/repos?sort=updated&per_page=6");
      if (!res.ok) throw new Error(res.status);
      renderRepos(await res.json());
    } catch {
      renderRepos([{ name: "Nirupama", description: "Discord bot with AI features — Python, Go, Postgres.", language: "Python", stargazers_count: 2, html_url: "https://github.com/Mistromy/Nirupama" }], true);
    }
  }
  function renderRepos(repos, cached=false){
    grid.innerHTML = "";
    repos.forEach(r => {
      const a = document.createElement("a");
      a.className = "repo";
      a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML =
        "<h3>" + r.name + (cached ? ' <span style="color:var(--concrete)">// cached</span>' : "") + "</h3>" +
        "<p>" + (r.description || "no description. it knows what it did.") + "</p>" +
        '<div class="repo-foot"><span class="lang">' + (r.language || "misc") + "</span>" +
        "<span>★ " + (r.stargazers_count ?? 0) + "</span></div>";
      grid.appendChild(a);
    });
  }
})();

/* ---------- live data: the stats pipe (nirupama's gist) ----------
   the gist api serves the current revision uncached — this is what
   survives a 10 s push interval. the raw url sits behind github's
   CDN (~5 min cache), so it's only the fallback. every element with
   data-stat-key gets filled, wherever it lives. */
(async function statsPipe(){
  const slots = $$("[data-stat-key]");
  const statusEls = $$('[data-stat="status"]');
  const fail = () => {
    slots.forEach(el => { el.textContent = "░░░"; el.classList.add("live-err"); });
    statusEls.forEach(el => el.textContent = "no answer");
    statFail("#stServers", "#stServersSrc");
    statFail("#stVisits", "#stVisitsSrc", "stats pipe // wire me");
  };
  /* every *.json file in the gist gets parsed and merged into one
     object — each project can own its file (no override risk between
     writers), the site reads them all in a single request. keep keys
     unique across files (prefix by project when in doubt). */
  async function fetchStats(){
    try {
      const res = await fetch(SITE.statsGistApi);
      if (!res.ok) throw new Error(res.status);
      const g = await res.json();
      const merged = {};
      Object.values(g.files || {}).forEach(f => {
        if (!f.filename.endsWith(".json") || !f.content || f.truncated) return;
        try { Object.assign(merged, JSON.parse(f.content)); } catch { /* one bad file shouldn't sink the rest */ }
      });
      if (!Object.keys(merged).length) throw new Error("no json files in gist");
      return merged;
    } catch {
      const res = await fetch(SITE.statsUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      return res.json();
    }
  }
  if (!SITE.statsUrl && !SITE.statsGistApi){ fail(); return; }
  let d;
  try { d = await fetchStats(); } catch { fail(); return; }

  slots.forEach(el => {
    const v = d[el.dataset.statKey];
    if (v == null){ el.textContent = "░░░"; el.classList.add("live-err"); return; }
    /* an array value renders as a sparkline instead of a number */
    if (Array.isArray(v)){ sparkline(el, v, el.dataset.compact != null); return; }
    if (el.dataset.fmt === "percent"){ el.textContent = (Math.round(v * 100) / 100) + "%"; return; }
    const compact = el.dataset.compact != null;
    countUp(el, v, compact);
    /* compact values keep the full number readable in the label */
    if (compact && v >= 1e4){
      const label = el.closest(".mini-stat, .stat")?.querySelector("span");
      if (label && !label.dataset.full){
        label.dataset.full = "1";
        label.textContent += " · " + v.toLocaleString();
      }
    }
  });

  if (d.visits != null){
    countUp($("#stVisits"), d.visits);
    const vs = $("#visits"); if (vs) vs.textContent = "VISITS // " + Number(d.visits).toLocaleString();
    const src = $("#stVisitsSrc"); if (src) src.textContent = "stats pipe // live";
  } else {
    statFail("#stVisits", "#stVisitsSrc", "stats pipe // wire me");
  }

  /* online = the gist was touched recently. shows its age, honestly. */
  const age = d.last_updated ? Math.floor(Date.now() / 1000) - d.last_updated : null;
  const stale = age == null || age > SITE.staleAfter;
  /* this is the BOT's heartbeat — it stays inside the project box.
     the sysbar dot belongs to the operator's presence (lanyard). */
  statusEls.forEach(el => {
    el.textContent = stale ? "offline?" : "online · " + fmtAge(age);
    el.style.color = stale ? "var(--signal)" : "var(--cyan)";
  });
})();

function fmtAge(s){
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  return Math.floor(s / 3600) + "h ago";
}

/* ---------- audio module — quiet by default, slider for the rest.
   state (volume, position, playing) survives page switches via
   sessionStorage. browsers block autoplay without a fresh gesture on
   the new page, so if resuming silently fails the button just waits —
   one click picks the track up where it left off. ---------- */
(function audio(){
  const wrap = $("#audio"), btn = $("#audioBtn");
  if (!wrap || !btn) return;
  if (!SITE.audio || !SITE.audio.src){ wrap.remove(); return; }
  const KEY = "mist_audio";
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch {}
  const player = new Audio(SITE.audio.src);
  player.loop = true;
  player.volume = saved.volume ?? SITE.audio.volume ?? 0.12;
  player.addEventListener("loadedmetadata", () => {
    if (saved.time) try { player.currentTime = saved.time; } catch {}
  });
  /* long titles auto-scroll back and forth inside the box */
  const titleBox = $("#audioTitle");
  titleBox.innerHTML = "<span>" + SITE.audio.title + "</span>";
  requestAnimationFrame(() => {
    const span = titleBox.firstChild;
    const over = span.scrollWidth - titleBox.clientWidth;
    if (over > 6){
      titleBox.classList.add("scrolling");
      titleBox.style.setProperty("--shift", "-" + over + "px");
    }
  });

  const save = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        volume: player.volume,
        time: player.currentTime || 0,
        playing: !player.paused,
      }));
    } catch {}
  };
  window.addEventListener("pagehide", save);
  setInterval(() => { if (!player.paused) save(); }, 3000);

  const vol = $("#audioVol");
  if (vol){
    /* --fill drives the coloured part of the slider track (css) */
    const paint = () => vol.style.setProperty("--fill", vol.value + "%");
    vol.value = Math.round(player.volume * 100);
    paint();
    vol.addEventListener("input", () => { player.volume = vol.value / 100; paint(); save(); });
  }
  const setUi = playing => {
    wrap.classList.toggle("playing", playing);
    btn.textContent = playing ? "❚❚" : "►";
  };
  let broken = false;
  player.onerror = () => { broken = true; $("#audioTitle").textContent = "no_signal.mp3"; };
  btn.addEventListener("click", async () => {
    if (broken){ $("#audioTitle").textContent = "add assets/track.mp3"; return; }
    if (player.paused){
      try { await player.play(); setUi(true); save(); }
      catch { $("#audioTitle").textContent = "blocked by browser"; }
    } else {
      player.pause(); setUi(false); save();
    }
  });
  /* was playing on the previous page — try to keep going */
  if (saved.playing && !broken){
    player.play().then(() => setUi(true)).catch(() => setUi(false));
  }
})();

/* ---------- the stack — b&w icon strip, hover pops + labels ---------- */
(function buildStack(){
  const strip = $("#stackGrid");
  if (!strip || typeof STACK === "undefined") return;
  STACK.forEach(t => {
    const el = document.createElement("div");
    el.className = "tool";
    el.setAttribute("aria-label", t.name + (t.sub ? " — " + t.sub : ""));
    if (t.icon){
      const img = document.createElement("img");
      img.src = t.icon;
      img.alt = "";
      img.loading = "lazy";
      /* dead url → text chip with the name instead of a hole */
      img.onerror = () => { img.remove(); el.classList.add("noicon"); };
      el.appendChild(img);
    } else {
      el.classList.add("noicon");
    }
    const label = document.createElement("span");
    label.className = "tool-label";
    label.innerHTML = t.name + (t.sub ? '<i>' + t.sub + "</i>" : "");
    el.appendChild(label);
    strip.appendChild(el);
  });
})();

/* ---------- pfp slot — pending stencil until the file exists ---------- */
(function pfp(){
  const img = $("#pfpImg");
  if (!img) return;
  const mark = () => img.closest(".pfp").classList.add("empty");
  /* the 404 may have fired before this script ran */
  if (img.complete && !img.naturalWidth) mark();
  img.onerror = mark;
})();
