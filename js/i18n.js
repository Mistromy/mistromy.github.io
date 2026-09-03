/* ============================================================
   MIST — language

   HOW IT WORKS, AND WHY THIS WAY

   English lives in the HTML, not in this file. Every translatable
   element carries data-i18n="key" and its English text is written
   out normally. On first run this file reads that text and caches
   it as the English dictionary.

   That ordering matters for three reasons:
     · with JavaScript off, the page is still a complete English
       page rather than a grid of empty boxes
     · crawlers and link unfurlers see real text, not placeholders
     · nothing can drift, because there is only one copy of the
       English string and it is the one on screen

   So this file only ever needs to hold POLISH. A key that is
   missing here falls back to the English in the HTML — a half
   translated page, which is honest, instead of a raw "intro.p1"
   staring at the visitor, which is broken.

   ADDING A STRING
     1. put data-i18n="some.key" on the element in the HTML
     2. add "some.key" to PL below
   That is the whole procedure. There is no build step.

   VALUES ARE HTML, NOT PLAIN TEXT. Markup inside a translated
   string is kept — which is why the <span class="pending"> and
   <em> tags below have to be carried across into the Polish. Drop
   one and that phrase loses its underline or its separator.

   pick() is here for later: when the project cards come back, any
   string in js/data.js may be written as { en: "...", pl: "..." }
   and run through it. Nothing on this page uses it yet.

   ⚠ THE POLISH BELOW IS A DRAFT, NOT A TRANSLATION.
     The lines marked ✏ are your voice and your jokes — a
     translated joke is a dead joke, so rewrite those rather than
     correct them.
   ============================================================ */

const PL = {
  "skip": "przejdź do treści",

  /* ---- the rail ---- */
  "nav.home": "Start",
  "nav.art": "Grafika",
  /* the indented children. keep them SHORT — the rail is 216px and
     these sit two indents in, so a long label wraps. */
  "nav.gallery": "Pełna galeria",
  "nav.projects": "Projekty",
  "nav.allprojects": "Pełna lista",
  "nav.socials": "Social media",
  "nav.about": "O mnie",
  "nav.labs": "Labs",
  "foot.contact": "kontakt",
  "foot.legal": "nota prawna",
  "crumb.home": "<- powrót",

  /* ---- subpages ----
     legal.html is deliberately NOT translated: a privacy notice
     that exists in two versions can disagree with itself, and the
     one a regulator reads should be the one that was written. */
  "art.h1": "Grafika",
  "art.sub": "2D i CGI, wszystko w jednym miejscu. Plakaty, Wnętrza i zewnętrza. Wszystko czego nie wstydzę się pokazać.",
  "labs.h1": "Labs",
  "labs.sub": "Głębsze analizy dla nerdów. Jak to właściwie działa. Architektura, matematyka, proces i rzeczy w trakcie — zarówno kod, jak i CGI.",
  "labs.empty": "Jeszcze nic nie opublikowałem. Pierwszy tekst w drodze.",
  /* ✏ "Oopsie Daisy" is a joke, not a phrase — replace it, don't translate it */
  "e404.h1": "O rajuśku!",
  "e404.sub": "Pod tym adresem nic nie ma. Może się przeniosło, może nigdy nie istniało — tak czy siak, wszystkie prace są jedne drzwi wstecz.",

  /* ---- masthead ---- */
  /* the spaces around the separators are literal and must survive a
     rewrite — the CSS no longer adds any margin of its own */
  "tagline": "Grafik CGI<em> &ensp;·&ensp; </em>Backend Dev<em> &ensp;·&ensp; </em>Student",

  /* ---- section headers ---- */
  "zone.art": "Grafika",
  "art.viewall": "Zobacz wszystko",

  /* ---- the viewer ----
     these are rendered by js/site.js, not by the HTML, so unlike
     every other key they have no English original on the page to
     fall back to — site.js carries its own. keep them short: the
     hint sits under the cursor. */
  "lb.dismiss": "Zamknij",
  "zoom.close": "Zamknij pełny rozmiar",
  /* the toolbar's two buttons. screen-reader labels only — the
     buttons themselves show − and +, which need no translating */
  "zoom.in": "Przybliż",
  "zoom.out": "Oddal",
  "zoom.hint": "przeciągnij · przewiń · ctrl+scroll przybliża · esc zamyka",
  "zoom.hint.touch": "przeciągnij · szczypnij · dotknij obok aby zamknąć",

  /* ---- the copy ----
     ✏ all three of these are your voice. the <span class="pending">
        wrappers must survive any rewrite — they are what gives
        those two phrases their underline. */
  "intro.p1": "<b>Mist</b>, znany też jako <b>sudomist</b> lub <b>Mistromy</b>, w zależności od tego, które nicki były wolne. Zajmuję się grafiką CGI, jak również programowaniem i od niedawna grafiką 2D.",
  "intro.p2": "Lubię udawać że wiem co robię, i czasami to chyba działa. Niektóre <span class=\"pending\">liczby poniżej</span> są całkiem duże.",
  "intro.p3": "Więcej o mnie <span class=\"pending\">również niżej</span>, dla pasjonatów i stalkerów.",
};

/* ------------------------------------------------------------
   the machinery — about thirty lines, and it never needs touching
   ------------------------------------------------------------ */
const I18N = (() => {
  const DICT = { pl: PL };
  const EN = {};                       /* filled from the DOM on first run */
  let lang = "en";

  /* localStorage throws outright in some privacy modes, so every
     touch of it is wrapped rather than feature-detected */
  const store = {
    get() { try { return localStorage.getItem("mist.lang"); } catch { return null; } },
    set(v) { try { localStorage.setItem("mist.lang", v); } catch { } },
  };

  const nodes = () => document.querySelectorAll("[data-i18n]");

  /* cache the English that is already on the page */
  function harvest() {
    nodes().forEach(el => { EN[el.dataset.i18n] ??= el.innerHTML; });
  }

  /* the lookup every other file uses. english always wins as the
     fallback, so a missing polish key degrades to english rather
     than to nothing. */
  function t(key) {
    if (lang !== "en" && DICT[lang]?.[key] != null) return DICT[lang][key];
    return EN[key] ?? "";
  }

  /* data.js values may be a plain string or { en, pl } */
  function pick(v) {
    if (v && typeof v === "object" && !Array.isArray(v)) return v[lang] ?? v.en ?? "";
    return v;
  }

  function apply(next) {
    lang = DICT[next] ? next : "en";
    document.documentElement.lang = lang;
    nodes().forEach(el => {
      const v = t(el.dataset.i18n);
      if (v) el.innerHTML = v;
    });
    document.querySelectorAll("#lang button").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    store.set(lang);
    /* anything rendered by JS re-renders itself on this */
    dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }

  function init() {
    harvest();
    document.querySelectorAll("#lang button").forEach(b =>
      b.addEventListener("click", () => apply(b.dataset.lang)));
    /* saved choice wins; otherwise take the hint from the browser
       and let the visitor override it. never lock someone into a
       language because of where they happen to be. */
    apply(store.get() || (navigator.language || "en").slice(0, 2));
  }

  return { init, t, pick, get lang() { return lang; } };
})();
