import json
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode
from xml.sax.saxutils import escape

root = Path("geographic-data/silverstone")

reference = json.loads(
    (root / "silverstone-scene-reference.json").read_text()
)

calibration = json.loads(
    (root / "silverstone-openf1-transform.json").read_text()
)

url = "http://127.0.0.1:8000/api/track?" + urlencode({
    "year": 2024,
    "event": "British Grand Prix"
})

with urlopen(url, timeout=30) as response:
    track = json.load(response)

geographic = reference["coordinates"]
provider = track["coordinates"]

t = calibration["transform"]

a = t["real"]
b = t["imag"]
tx = t["offset_x"]
ty = t["offset_y"]

def transform(point):
    x, y = point

    if t["mirror_y"]:
        y = -y

    return [
        a*x - b*y + tx,
        b*x + a*y + ty
    ]

aligned = [transform(p) for p in provider]

all_points = geographic + aligned

xs = [p[0] for p in all_points]
ys = [p[1] for p in all_points]

minx, maxx = min(xs), max(xs)
miny, maxy = min(ys), max(ys)

width = 1200
height = 1000
margin = 90

scale = min(
    (width-2*margin)/max(maxx-minx, 1),
    (height-2*margin)/max(maxy-miny, 1)
)

def screen(point):
    x, y = point
    return (
        margin + (x-minx)*scale,
        height-margin-(y-miny)*scale
    )

def polyline(points):
    return " ".join(
        f"{screen(p)[0]:.2f},{screen(p)[1]:.2f}"
        for p in points
    )

def circle(point, colour, radius):
    x, y = screen(point)
    return (
        f'<circle cx="{x:.2f}" cy="{y:.2f}" '
        f'r="{radius}" fill="{colour}"/>'
    )

svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" '
    f'width="{width}" height="{height}" '
    f'viewBox="0 0 {width} {height}">',
    '<rect width="100%" height="100%" fill="#101723"/>',
    '<text x="40" y="45" fill="white" '
    'font-family="Arial" font-size="26">'
    'FastOne Labs — Silverstone Alignment</text>',
    f'<polyline points="{polyline(geographic)}" '
    'fill="none" stroke="#11afa5" '
    'stroke-width="6" stroke-linejoin="round"/>',
    f'<polyline points="{polyline(aligned)}" '
    'fill="none" stroke="#e26b90" '
    'stroke-width="3" stroke-linejoin="round"/>',
    circle(aligned[0], "#ffdf65", 8),
    circle(aligned[-1], "#ffffff", 6),
    '<text x="40" y="935" fill="#11afa5" '
    'font-family="Arial" font-size="20">'
    'Turquoise: geographic circuit</text>',
    '<text x="40" y="963" fill="#e26b90" '
    'font-family="Arial" font-size="20">'
    'Pink: calibrated OpenF1 lap</text>',
    '<text x="550" y="935" fill="#ffdf65" '
    'font-family="Arial" font-size="18">'
    'Yellow: first OpenF1 point</text>',
    '<text x="550" y="963" fill="white" '
    'font-family="Arial" font-size="18">'
    'White: last OpenF1 point</text>',
    '</svg>'
]

target = root / "silverstone-alignment-overlay.svg"

target.write_text("\n".join(svg))

print("\n🏁 FASTONE LABS — ALIGNMENT PREVIEW")
print("=" * 55)
print("Geographic points:", len(geographic))
print("OpenF1 points:", len(aligned))
print("Preview:", target)
print("\n✅ Overlay created.")
print("✅ Existing simulator unchanged.")
