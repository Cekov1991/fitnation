#!/usr/bin/env python3
"""Regenerates public/og-image.png — the 1200x630 social share card.

Run when the tagline, brand colours, app icon or product screenshot change:

    python3 scripts/og-image/generate.py

Not part of `pnpm build`. The PNG is committed, so a normal build and deploy
never needs this. Edit the layout in the SVG template below — that is the source
of truth. The og.svg it writes alongside is a regenerable intermediate with the
fonts base64-inlined (~850KB), so it is gitignored, not hand-edited.

Requirements:
  * network on first run, to fetch the Poppins and Inter TTFs from Google Fonts
    (cached next to this script and gitignored — neither font is installed on a
    typical machine, and without them the text silently renders in Helvetica)
  * macOS, for `qlmanage` and `sips`. Both are only used for SVG -> PNG. On
    another platform, run this to get og.svg, then rasterize it with any tool
    that supports embedded @font-face, e.g.
        rsvg-convert -w 2400 og.svg -o out.png
    and crop the centre 2400x1260 band down to 1200x630.
"""
import base64, pathlib, platform, subprocess, sys, urllib.request

OG = pathlib.Path(__file__).parent
ASSETS = pathlib.Path(__file__).parents[2] / "src" / "assets"
OUT = pathlib.Path(__file__).parents[2] / "public" / "og-image.png"

# Pinned Google Fonts TTF URLs: Poppins 800 (headline) and Inter 500 (body),
# matching the webfonts loaded in src/routes/__root.tsx.
FONTS = {
    "poppins.ttf": "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDD4V1s.ttf",
    "inter.ttf": "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf",
}
for name, url in FONTS.items():
    dest = OG / name
    if not dest.exists():
        print(f"fetching {name}")
        dest.write_bytes(urllib.request.urlopen(url, timeout=30).read())

def b64(p): return base64.b64encode(pathlib.Path(p).read_bytes()).decode()

poppins, inter = b64(OG/"poppins.ttf"), b64(OG/"inter.ttf")
icon, shot = b64(ASSETS/"fitnation-icon.png"), b64(ASSETS/"dashboard.jpeg")

CYAN, ORANGE, NAVY, SKY = "#14B3C1", "#F86F33", "#1B3850", "#91D2EE"

# The canvas is square so the renderer does not letterbox, and the 1200x630
# design band is centred so a plain centred crop lands exactly on it.
# NOTE: clipPath coords are in the *translated* group's user space, so they use
# the design's own y values, not the +285 offset.
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="1200" viewBox="0 0 1200 1200">
<defs>
  <style>
    @font-face {{ font-family:'P'; font-weight:800; src:url(data:font/ttf;base64,{poppins}) format('truetype'); }}
    @font-face {{ font-family:'I'; font-weight:500; src:url(data:font/ttf;base64,{inter}) format('truetype'); }}
  </style>
  <linearGradient id="brand" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="{CYAN}"/><stop offset="1" stop-color="{ORANGE}"/>
  </linearGradient>
  <radialGradient id="glowA"><stop offset="0" stop-color="{CYAN}" stop-opacity="0.5"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowB"><stop offset="0" stop-color="{ORANGE}" stop-opacity="0.3"/><stop offset="1" stop-color="{ORANGE}" stop-opacity="0"/></radialGradient>
  <clipPath id="iconClip"><rect x="72" y="52" width="88" height="88" rx="25"/></clipPath>
  <clipPath id="phoneClip"><rect x="836" y="92" width="300" height="628" rx="40"/></clipPath>
</defs>

<rect width="1200" height="1200" fill="{NAVY}"/>
<g transform="translate(0,285)">
  <rect width="1200" height="630" fill="{NAVY}"/>
  <ellipse cx="170" cy="580" rx="520" ry="380" fill="url(#glowA)"/>
  <ellipse cx="1030" cy="90" rx="430" ry="330" fill="url(#glowB)"/>
  <rect x="0" y="0" width="1200" height="7" fill="url(#brand)"/>

  <image x="72" y="52" width="88" height="88" clip-path="url(#iconClip)" xlink:href="data:image/png;base64,{icon}"/>
  <text x="180" y="111" font-family="P" font-weight="800" font-size="42" fill="#FFFFFF">Fit Nation</text>

  <text x="72" y="292" font-family="P" font-weight="800" font-size="68" fill="#FFFFFF">Personalized</text>
  <text x="72" y="368" font-family="P" font-weight="800" font-size="68" fill="{CYAN}">workout plans</text>

  <text x="72" y="430" font-family="I" font-weight="500" font-size="27" fill="{SKY}">Built around your goal, level and schedule.</text>
  <text x="72" y="468" font-family="I" font-weight="500" font-size="27" fill="{SKY}">Every set tracked.</text>

  <rect x="72" y="514" width="412" height="60" rx="30" fill="url(#brand)"/>
  <text x="278" y="553" font-family="I" font-weight="500" font-size="25" fill="#FFFFFF" text-anchor="middle">Download on iOS and Android</text>

  <rect x="828" y="84" width="316" height="644" rx="48" fill="#102A3E"/>
  <image x="836" y="92" width="300" height="649" clip-path="url(#phoneClip)" preserveAspectRatio="xMidYMin slice" xlink:href="data:image/jpeg;base64,{shot}"/>
</g>
</svg>'''

(OG/"og.svg").write_text(svg)
print(f"wrote {OG/'og.svg'} ({len(svg):,} bytes, fonts inlined)")

if platform.system() != "Darwin":
    sys.exit("og.svg written. Rasterize it manually — see this script's docstring.")

# qlmanage letterboxes to a square, which is why the design band is centred in a
# square canvas above: a plain centred crop then lands exactly on it. Rendering
# at 2x and downsampling keeps the text edges clean.
tmp = OG / "og.svg.png"
tmp.unlink(missing_ok=True)
subprocess.run(["qlmanage", "-t", "-s", "2400", "-o", str(OG), str(OG/"og.svg")],
               check=True, capture_output=True)
if not tmp.exists():
    sys.exit("qlmanage produced no PNG — cannot rasterize.")
OUT.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(["cp", str(tmp), str(OUT)], check=True)
subprocess.run(["sips", "-c", "1260", "2400", str(OUT)], check=True, capture_output=True)
subprocess.run(["sips", "-z", "630", "1200", str(OUT)], check=True, capture_output=True)
tmp.unlink(missing_ok=True)

dims = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(OUT)],
                      capture_output=True, text=True).stdout
w = int([l for l in dims.splitlines() if "pixelWidth" in l][0].split(":")[1])
h = int([l for l in dims.splitlines() if "pixelHeight" in l][0].split(":")[1])
assert (w, h) == (1200, 630), f"expected 1200x630, got {w}x{h}"
print(f"wrote {OUT} ({w}x{h}, {OUT.stat().st_size:,} bytes)")
