#!/usr/bin/env python3
"""
gen_embeds.py — build /p/<slug>.html embed stubs from js/data.js.

Discord (and every other unfurler) fetches a URL server-side and never
runs JS — and a #hash is never even sent — so /#p/smart-juice can't
carry per-artwork og:image tags. These stubs can: /p/smart-juice serves
real og tags (the artwork as the embed image) and instantly redirects
humans to the live lightbox at art.html#p/smart-juice.

Run from the repo root every time ART changes:
    python scripts/gen_embeds.py
Commit the p/ folder. That's it. The "share ->" button in the
fullscreen viewer copies these urls.
"""

import re
import sys
import html
from pathlib import Path

BASE = "https://mistromy.github.io/"

root = Path(__file__).resolve().parent.parent
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
out.mkdir(exist_ok=True)
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
    t, n, im = html.escape(title, quote=True), html.escape(note, quote=True), html.escape(img, quote=True)

    (out / f"{s}.html").write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{t} — MIST</title>
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:title" content="{t} — art by Mist">
<meta property="og:description" content="{n}">
<meta property="og:image" content="{im}">
<meta name="twitter:card" content="summary_large_image">
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

print(f"wrote {len(made)} stubs to p/:")
for s in made:
    print(f"  {BASE}p/{s}")
