from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
import json
import math
import time

output = Path("geographic-data/silverstone")
output.mkdir(parents=True, exist_ok=True)

raw_file = output / "osm-raw.json"
geo_file = output / "raceway-candidates.geojson"

if raw_file.exists() or geo_file.exists():
    raise SystemExit(
        "Existing Silverstone data found. "
        "Files preserved; no overwrite performed."
    )

# Geographic bounding box surrounding Silverstone Circuit.
south, west, north, east = (
    52.055, -1.045,
    52.090, -0.995
)

query = f"""
[out:json][timeout:60];
(
  way["highway"="raceway"]
    ({south},{west},{north},{east});
);
out geom;
"""

servers = [
    "https://overpass.nchc.org.tw/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

data = None
errors = []

for server in servers:
    try:
        print("Contacting:", server, flush=True)

        request = Request(
            server,
            data=urlencode({"data": query}).encode(),
            headers={
                "User-Agent": "FastOneLabs-GeographicResearch/1.0",
                "Accept": "application/json"
            },
            method="POST"
        )

        with urlopen(request, timeout=15) as response:
            data = json.load(response)

        if "elements" not in data:
            raise ValueError("Invalid Overpass response")

        print("Geographic data received.")
        break

    except (HTTPError, URLError, ValueError, TimeoutError) as exc:
        errors.append(f"{server}: {exc}")
        print("Server unavailable; trying alternative.")
        time.sleep(2)

if data is None:
    print("\nCould not retrieve geographic data:")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

def distance_m(a, b):
    radius = 6371000
    lat1, lon1 = a
    lat2, lon2 = b

    dlat = math.radians(lat2-lat1)
    dlon = math.radians(lon2-lon1)

    h = (
        math.sin(dlat/2)**2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon/2)**2
    )

    return 2*radius*math.asin(min(1, math.sqrt(h)))

features = []

for element in data["elements"]:
    if element.get("type") != "way":
        continue

    geometry = element.get("geometry", [])

    if len(geometry) < 2:
        continue

    tags = element.get("tags", {})

    coords = [
        [point["lon"], point["lat"]]
        for point in geometry
    ]

    length = sum(
        distance_m(
            (a[1], a[0]),
            (b[1], b[0])
        )
        for a, b in zip(coords, coords[1:])
    )

    features.append({
        "type": "Feature",
        "properties": {
            "osm_id": element["id"],
            "name": tags.get("name", ""),
            "highway": tags.get("highway", ""),
            "length_m": round(length, 1),
            "tags": tags
        },
        "geometry": {
            "type": "LineString",
            "coordinates": coords
        }
    })

features.sort(
    key=lambda feature:
        feature["properties"]["length_m"],
    reverse=True
)

collection = {
    "type": "FeatureCollection",
    "name": "Silverstone Raceway Candidates",
    "metadata": {
        "source": "OpenStreetMap via Overpass API",
        "licence": "ODbL 1.0",
        "attribution": "© OpenStreetMap contributors",
        "retrieved_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "status": "unverified geographic reference",
        "note": (
            "Raceway segments may include multiple layouts, "
            "service tracks or other motorsport facilities. "
            "Not yet validated as the 2024 F1 centreline."
        )
    },
    "features": features
}

raw_file.write_text(
    json.dumps(data, indent=2)
)

geo_file.write_text(
    json.dumps(collection, indent=2)
)

print("\n🏁 SILVERSTONE GEOGRAPHIC IMPORT")
print("=" * 55)
print("Raceway segments:", len(features))
print("Output:", geo_file)

print("\nLongest mapped segments:")

for feature in features[:12]:
    props = feature["properties"]

    print(
        f"  {props['length_m']:8.1f} m | "
        f"OSM {props['osm_id']} | "
        f"{props['name'] or 'Unnamed'}"
    )

print("\n✅ Geographic reference saved.")
print("✅ Existing replay files untouched.")
print("⚠️ Track alignment still requires validation.")
