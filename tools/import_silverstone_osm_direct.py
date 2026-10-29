from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import math
import socket
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

output = Path("geographic-data/silverstone")
output.mkdir(parents=True, exist_ok=True)

target = output / "raceway-candidates.geojson"

if target.exists():
    raise SystemExit(
        "Geographic data already exists. "
        "Existing file preserved."
    )

# Small geographic tiles around Silverstone.
tiles = [
    (-1.040, 52.065, -1.020, 52.080),
    (-1.020, 52.065, -1.000, 52.080),
    (-1.040, 52.055, -1.020, 52.065),
    (-1.020, 52.055, -1.000, 52.065),
]

nodes = {}
ways = {}

for index, (west, south, east, north) in enumerate(tiles, 1):
    url = (
        "https://api.openstreetmap.org/api/0.6/map"
        f"?bbox={west},{south},{east},{north}"
    )

    print(f"Downloading map tile {index}/{len(tiles)}...", flush=True)

    try:
        request = Request(
            url,
            headers={
                "User-Agent": "FastOneLabs-Research/1.0"
            }
        )

        with urlopen(request, timeout=12) as response:
            root = ET.fromstring(response.read())

    except (HTTPError, URLError, TimeoutError, socket.timeout) as exc:
        print(f"⚠️ Tile {index} unavailable: {exc}")
        continue

    for node in root.findall("node"):
        nodes[node.attrib["id"]] = (
            float(node.attrib["lon"]),
            float(node.attrib["lat"])
        )

    for way in root.findall("way"):
        tags = {
            tag.attrib["k"]: tag.attrib["v"]
            for tag in way.findall("tag")
        }

        if tags.get("highway") != "raceway":
            continue

        refs = [
            ref.attrib["ref"]
            for ref in way.findall("nd")
        ]

        ways[way.attrib["id"]] = (refs, tags)

features = []

for way_id, (refs, tags) in ways.items():
    if not all(ref in nodes for ref in refs):
        continue

    coords = [nodes[ref] for ref in refs]

    if len(coords) < 2:
        continue

    features.append({
        "type": "Feature",
        "properties": {
            "osm_id": way_id,
            "name": tags.get("name", ""),
            "tags": tags
        },
        "geometry": {
            "type": "LineString",
            "coordinates": coords
        }
    })

if not features:
    raise SystemExit(
        "\n❌ No complete raceway segments retrieved. "
        "No geographic file created."
    )

collection = {
    "type": "FeatureCollection",
    "metadata": {
        "source": "OpenStreetMap API",
        "attribution": "© OpenStreetMap contributors",
        "licence": "ODbL 1.0",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "status": "unverified and potentially incomplete",
        "tiles_requested": len(tiles),
        "note": (
            "This dataset may be incomplete and may contain "
            "multiple track layouts. Not approved for replay."
        )
    },
    "features": features
}

target.write_text(json.dumps(collection, indent=2))

print("\n🏁 SILVERSTONE IMPORT")
print("=" * 45)
print("Raceway segments:", len(features))
print("Saved:", target)
print("\n✅ Existing simulator untouched.")
print("⚠️ Geographic coverage requires verification.")
