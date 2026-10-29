import json
import math
import html
from pathlib import Path

source = Path(
    "geographic-data/silverstone/raceway-candidates.geojson"
)
target = source.parent / "silverstone-geographic-preview.svg"

data = json.loads(source.read_text())
features = data["features"]

width, height = 1400, 1050
margin = 95

points = [
    p
    for f in features
    for p in f["geometry"]["coordinates"]
]

lon0 = sum(p[0] for p in points) / len(points)
lat0 = sum(p[1] for p in points) / len(points)

coslat = math.cos(math.radians(lat0))

def project(p):
    return (
        (p[0] - lon0) * coslat,
        -(p[1] - lat0)
    )

projected = [project(p) for p in points]

xmin = min(p[0] for p in projected)
xmax = max(p[0] for p in projected)
ymin = min(p[1] for p in projected)
ymax = max(p[1] for p in projected)

scale = min(
    (width - 2 * margin) / max(xmax-xmin, 1e-12),
    (height - 2 * margin) / max(ymax-ymin, 1e-12)
)

def screen(p):
    x, y = project(p)
    return (
        margin + (x-xmin)*scale,
        margin + (y-ymin)*scale
    )

def category(name):
    name = name.lower()

    if "pit" in name:
        return "pit"
    if "stowe circuit" in name:
        return "alternative"
    if "national" in name:
        return "alternative"
    return "candidate"

colors = {
    "candidate": "#17c7c3",
    "alternative": "#ffb84d",
    "pit": "#ef6b91"
}

svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" '
    f'width="{width}" height="{height}" '
    f'viewBox="0 0 {width} {height}">',
    '<rect width="100%" height="100%" fill="#08111e"/>',
    '<text x="65" y="48" fill="white" '
    'font-size="29" font-family="Arial" font-weight="bold">'
    'FASTONE LABS | SILVERSTONE GEOGRAPHIC REFERENCE</text>',
    '<text x="65" y="77" fill="#9aacc4" '
    'font-size="15" font-family="Arial">'
    'OpenStreetMap raceway segments | Unverified Grand Prix selection'
    '</text>'
]

for f in features:
    coords = f["geometry"]["coordinates"]
    name = f["properties"].get("name", "")

    kind = category(name)
    color = colors[kind]

    path = " ".join(
        f"{x:.2f},{y:.2f}"
        for x, y in map(screen, coords)
    )

    svg.append(
        f'<polyline points="{path}" fill="none" '
        f'stroke="{color}" stroke-width="3" '
        f'stroke-linejoin="round" stroke-linecap="round" '
        f'opacity="0.88"/>'
    )

# Label distinctive named sections.
wanted = {
    "Hamilton Straight",
    "Hangar Straight",
    "Wellington Straight",
    "Vale",
    "Club",
    "Brooklands",
    "Woodcote",
    "Chapel Curve",
    "The Loop",
    "National Pit Straight"
}

seen = set()

for f in features:
    name = f["properties"].get("name", "")

    if name not in wanted or name in seen:
        continue

    seen.add(name)

    coords = f["geometry"]["coordinates"]
    midpoint = coords[len(coords)//2]
    x, y = screen(midpoint)

    label = html.escape(name)

    svg.append(
        f'<circle cx="{x:.1f}" cy="{y:.1f}" '
        f'r="4" fill="white"/>'
    )

    svg.append(
        f'<text x="{x+9:.1f}" y="{y-9:.1f}" '
        f'fill="white" font-size="15" '
        f'font-family="Arial" paint-order="stroke" '
        f'stroke="#08111e" stroke-width="5">'
        f'{label}</text>'
    )

svg.extend([
    '<rect x="55" y="920" width="800" height="94" '
    'rx="12" fill="#142338"/>',
    '<text x="75" y="948" fill="#17c7c3" '
    'font-family="Arial" font-size="17">'
    '● Candidate raceway segments</text>',
    '<text x="360" y="948" fill="#ffb84d" '
    'font-family="Arial" font-size="17">'
    '● Named alternative layouts</text>',
    '<text x="75" y="982" fill="#ef6b91" '
    'font-family="Arial" font-size="17">'
    '● Named pit lanes</text>',
    '<text x="360" y="982" fill="#aebed0" '
    'font-family="Arial" font-size="15">'
    'Colours are provisional, not a validated GP route</text>',
    '</svg>'
])

target.write_text("\n".join(svg))

print("\n🏁 FASTONE LABS GEOGRAPHIC PREVIEW")
print("=" * 55)
print("Mapped segments:", len(features))
print("Named sections:", len(seen))
print("Preview created:", target)
print("\n✅ Geographic preview generated.")
print("✅ No simulator files modified.")
