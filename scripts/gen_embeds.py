#!/usr/bin/env python3
"""
gen_embeds.py — build /p/<slug>.html embed stubs from js/data.js.

Discord (and every other unfurler) fetches a URL server-side and never
runs JS — and a #hash is never even sent — so /#p/smart-juice can't
carry per-artwork og:image tags. These stubs can: /p/smart-juice serves
real og tags (the artwork as the embed image) and instantly redirects
humans to the live lightbox at art.html#p/smart-juice.

WhatsApp only shows LARGE previews for jpeg/png images under ~300 KB,
which ArtStation's /large/ webps are not. So when Pillow is available
(it is in CI), each artwork also gets a small JPG thumbnail in p/t/
and the og:image points there — big embeds everywhere. Without Pillow
the stub falls back to the original image URL (Discord still works).

Data source:
  - default: local js/data.js
  - env DATA_JS_URL=<raw gist url> — for when data.js moves off-repo.

Runs automatically via .github/workflows/gen-embeds.yml (on push +
cron + manual). Manual: python scripts/gen_embeds.py
"""

import os
import re
import sys
import html
import io
import urllib.request
from pathlib import Path

BASE = "https://mistromy.github.io/"
# embed image: as large as whatsapp's large-preview rules allow
# (jpeg/png, < ~300 KB) — clicking the preview should feel full-size
EMBED_MAX = 1600
EMBED_CAP = 290_000
# tile image: what the gallery grid actually loads (rows are ~300 px
# tall, so 900 px covers 2x screens) — this is the lighthouse fix
TILE_MAX = 900
TILE_CAP = 160_000
UA = {"User-Agent": "Mozilla/5.0 (compatible; mist-embed-gen/1.0)"}

try:
    from PIL import Image
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False
    print("note: Pillow not installed — using original image urls (whatsapp previews stay small)")

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


def save_capped(im, dest: Path, max_px: int, cap: int):
    """resize + walk quality down until the jpg fits the byte cap."""
    im2 = im.copy()
    im2.thumbnail((max_px, max_px))
    buf = io.BytesIO()
    for q in (85, 78, 70, 62, 55):
        buf = io.BytesIO()
        im2.save(buf, "AVIF", quality=q, optimize=True, progressive=True)
        if buf.tell() <= cap:
            break
    dest.write_bytes(buf.getvalue())
    return im2.size


def make_thumbs(url: str, slug_: str):
    """fetch once, write the embed jpg and the tile jpg. (w,h) of the
    embed image, or None if the source is unreachable."""
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        dims = save_capped(im, tdir / f"{slug_}.avif", EMBED_MAX, EMBED_CAP)
        save_capped(im, tdir / f"{slug_}.s.avif", TILE_MAX, TILE_CAP)
        return dims
    except Exception as e:  # a dead image shouldn't sink the run
        print(f"  thumbs failed for {url}: {e}")
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

    og_image, size_tags = img, ""
    if HAVE_PIL:
        dims = make_thumbs(img, s)
        if dims:
            og_image = f"{BASE}p/t/{s}.avif"
            size_tags = (f'<meta property="og:image:width" content="{dims[0]}">\n'
                         f'<meta property="og:image:height" content="{dims[1]}">\n'
                         f'<meta property="og:image:type" content="image/avif">\n')

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

print(f"wrote {len(made)} stubs to p/" + (" (with thumbnails in p/t/)" if HAVE_PIL else ""))
for s in made:
    print(f"  {BASE}p/{s}")
