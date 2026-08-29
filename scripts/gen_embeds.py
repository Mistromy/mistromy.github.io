#!/usr/bin/env python3
"""
gen_embeds.py — build /p/<slug>.html embed stubs from js/data.js.

Discord (and every other unfurler) fetches a URL server-side and never
runs JS — and a #hash is never even sent — so /#p/smart-juice can't
carry per-artwork og:image tags. These stubs can: /p/smart-juice serves
real og tags (the artwork as the embed image) and instantly redirects
humans to the live lightbox at art.html#p/smart-juice.

og:image points at the ORIGINAL image url (ArtStation's cdn, or this
site for local files) — unfurlers get the full-quality piece, and the
bytes are served by someone else's cdn. og:image:width/height are
stamped from the real file so Discord renders it large instead of
guessing.

Separately, and only for the gallery grid, each artwork gets ONE
downscaled tile in p/t/ — written twice, as .webp (what almost
everything loads) and .jpg (the universal fallback). Rows are ~300 px
tall, so 900 px covers 2x screens. This is the lighthouse fix: without
it the grid pulls multi-MB originals. Needs Pillow (present in CI);
without it the grid falls back to the originals and still works.

Data source:
  - default: local js/data.js
  - env DATA_JS_URL=<raw gist url> — for when data.js moves off-repo.

Runs automatically as a step in .github/workflows/deploy.yml, before
the pages upload. Manual: python scripts/gen_embeds.py
"""

import os
import re
import sys
import html
import io
import urllib.request
from pathlib import Path

BASE = "https://mistromy.github.io/"
# tile image: what the gallery grid actually loads (rows are ~300 px
# tall, so 900 px covers 2x screens) — this is the lighthouse fix.
# one size, two formats: webp for everyone, jpg for the stragglers.
TILE_MAX = 900
TILE_CAP = 160_000
# og:image types worth declaring — anything else, let the unfurler sniff
OG_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".png": "image/png", ".webp": "image/webp"}
UA = {"User-Agent": "Mozilla/5.0 (compatible; mist-embed-gen/1.0)"}

try:
    from PIL import Image
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False
    print("note: Pillow not installed — no gallery tiles, the grid will load originals")

root = Path(__file__).resolve().parent.parent

data_url = os.environ.get("DATA_JS_URL", "").strip()
if data_url:
    print(f"reading data.js from {data_url}")
    with urllib.request.urlopen(urllib.request.Request(data_url, headers=UA), timeout=30) as r:
        src = r.read().decode("utf-8")
else:
    src = (root / "js" / "data.js").read_text(encoding="utf-8")

m = re.search(r"const ART = \[(.*?)\n\];", src, re.S)
if not m:
    sys.exit("could not find the ART array in js/data.js")
block = m.group(1)

STR = r'"((?:[^"\\]|\\.)*)"'
unesc = lambda s: s.replace('\\"', '"').replace("\\'", "'")
slug = lambda t: re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", t.lower()))

titles = [(mm.start(), unesc(mm.group(1))) for mm in re.finditer(r"title:\s*" + STR, block)]
if not titles:
    sys.exit("no artworks found in ART")

out = root / "p"
tdir = out / "t"
out.mkdir(exist_ok=True)
if HAVE_PIL:
    tdir.mkdir(exist_ok=True)


def save_capped(im, dest: Path, cap: int, fmt: str):
    """write `im` as fmt, walking quality down until it fits the byte cap.
    the last quality wins even if it doesn't fit — a slightly fat tile
    beats a missing one."""
    opts = {"JPEG": dict(optimize=True, progressive=True), "WEBP": dict(method=5)}[fmt]
    buf = io.BytesIO()
    for q in (85, 78, 70, 62, 55):
        buf = io.BytesIO()
        im.save(buf, fmt, quality=q, **opts)
        if buf.tell() <= cap:
            break
    dest.write_bytes(buf.getvalue())
    return buf.tell()


def make_tiles(url: str, slug_: str):
    """fetch the original once, write the webp + jpg gallery tiles.
    returns (w,h) of the ORIGINAL — that's what og:image points at —
    or None if the source is unreachable."""
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        full = im.size
        tile = im.copy()
        tile.thumbnail((TILE_MAX, TILE_MAX))
        wb = save_capped(tile, tdir / f"{slug_}.webp", TILE_CAP, "WEBP")
        jb = save_capped(tile, tdir / f"{slug_}.jpg", TILE_CAP, "JPEG")
        print(f"  {slug_}: {full[0]}x{full[1]} -> tile {tile.size[0]}x{tile.size[1]} "
              f"(webp {wb // 1024} KB, jpg {jb // 1024} KB)")
        return full
    except Exception as e:  # a dead image shouldn't sink the run
        print(f"  tiles failed for {url}: {e}")
        return None


made = []
for i, (pos, title) in enumerate(titles):
    end = titles[i + 1][0] if i + 1 < len(titles) else len(block)
    seg = block[pos:end]
    img_m = re.search(r"img:\s*" + STR, seg)
    note_m = re.search(r"note:\s*" + STR, seg)
    if not img_m:
        continue
    img = unesc(img_m.group(1))
    if not img.startswith("http"):
        img = BASE + img
    note = unesc(note_m.group(1)) if note_m else ""
    s = slug(title)
    target = f"{BASE}art.html#p/{s}"

    # the embed always shows the original — full quality, and the bytes
    # come off artstation's cdn rather than this one. the tiles below are
    # only ever loaded by the gallery grid.
    og_image, size_tags = img, ""
    if HAVE_PIL:
        dims = make_tiles(img, s)
        if dims:
            size_tags = (f'<meta property="og:image:width" content="{dims[0]}">\n'
                         f'<meta property="og:image:height" content="{dims[1]}">\n')
    og_type = OG_TYPES.get(os.path.splitext(img.split("?")[0])[1].lower())
    if og_type:
        size_tags += f'<meta property="og:image:type" content="{og_type}">\n'

    t, n, im_ = html.escape(title, quote=True), html.escape(note, quote=True), html.escape(og_image, quote=True)
    (out / f"{s}.html").write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{t} — MIST</title>
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:title" content="{t} — art by Mist">
<meta property="og:description" content="{n}">
<meta property="og:image" content="{im_}">
{size_tags}<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#c22a6c">
<meta http-equiv="refresh" content="0;url={target}">
<script>location.replace({target!r});</script>
</head>
<body style="background:#150a11;color:#9b917f;font-family:monospace;padding:2rem">
redirecting to the archive… <a style="color:#5df2ff" href="{target}">click if nothing happens</a>
</body>
</html>
""", encoding="utf-8")
    made.append(s)

print(f"wrote {len(made)} stubs to p/" + (" (with webp+jpg tiles in p/t/)" if HAVE_PIL else ""))
for s in made:
    print(f"  {BASE}p/{s}")
