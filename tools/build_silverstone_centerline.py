import json
import math
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone

directory = Path("geographic-data/silverstone")

source = directory / "silverstone-cycle-candidate.geojson"
target = directory / "silverstone-gp-centerline.geojson"

if target.exists():
    raise SystemExit(
        "Existing centreline preserved. "
        "No overwrite performed."
    )

features = json.loads(source.read_text())["features"]

def key(point):
    return tuple(round(v, 7) for v in point)

def distance(a, b):
    lat1 = math.radians(a[1])
    lat2 = math.radians(b[1])

    dlat = lat2 - lat1
    dlon = math.radians(b[0] - a[0])

    h = (
        math.sin(dlat / 2)**2
        + math.cos(lat1)*math.cos(lat2)
        * math.sin(dlon / 2)**2
    )

    return 12742000 * math.asin(min(1, math.sqrt(h)))

adjacency = defaultdict(list)

for i, feature in enumerate(features):
    coords = feature["geometry"]["coordinates"]

    if len(coords) < 2:
        raise SystemExit("Invalid segment geometry.")

    adjacency[key(coords[0])].append(i)
    adjacency[key(coords[-1])].append(i)

if any(len(edges) != 2 for edges in adjacency.values()):
    raise SystemExit(
        "Circuit is not a simple closed cycle."
    )

# Begin at Hamilton Straight for a reproducible ordering.
start_index = next(
    (
        i for i, f in enumerate(features)
        if f["properties"].get("name") == "Hamilton Straight"
    ),
    None
)

if start_index is None:
    raise SystemExit("Hamilton Straight not found.")

start_coords = features[start_index]["geometry"]["coordinates"]

# Initial orientation is arbitrary; direction will be
# checked separately before enabling race replay.
ordered = list(start_coords)
used = {start_index}

start_node = key(ordered[0])
current_node = key(ordered[-1])

sequence = [
    features[start_index]["properties"].get("name")
    or "Unnamed"
]

while len(used) < len(features):
    candidates = [
        i for i in adjacency[current_node]
        if i not in used
    ]

    if len(candidates) != 1:
        raise SystemExit(
            "Ambiguous or missing connection at "
            + str(current_node)
        )

    i = candidates[0]

    coords = list(
        features[i]["geometry"]["coordinates"]
    )

    if key(coords[-1]) == current_node:
        coords.reverse()

    if key(coords[0]) != current_node:
        raise SystemExit(
            "Segment endpoints do not match."
        )

    ordered.extend(coords[1:])
    used.add(i)

    current_node = key(coords[-1])

    sequence.append(
        features[i]["properties"].get("name")
        or "Unnamed"
    )

if current_node != start_node:
    raise SystemExit(
        "Circuit did not return to its starting node."
    )

# The first and last points represent the same location.
if key(ordered[0]) != key(ordered[-1]):
    raise SystemExit("Circuit closure validation failed.")

length = sum(
    distance(a, b)
    for a, b in zip(ordered, ordered[1:])
)

result = {
    "type": "FeatureCollection",
    "metadata": {
        "circuit": "Silverstone",
        "layout": "Grand Prix candidate",
        "source": "OpenStreetMap",
        "attribution": "© OpenStreetMap contributors",
        "licence": "ODbL 1.0",
        "retrieved_from": str(source),
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "length_m": round(length, 2),
        "reference_length_m": 5891,
        "status": "geographically ordered; replay alignment unverified",
        "direction": "unverified",
        "start_finish": "unverified"
    },
    "features": [{
        "type": "Feature",
        "properties": {
            "name": "Silverstone Grand Prix centreline candidate",
            "segment_count": len(features),
            "length_m": round(length, 2),
            "ordered_sections": sequence
        },
        "geometry": {
            "type": "LineString",
            "coordinates": ordered
        }
    }]
}

target.write_text(
    json.dumps(result, indent=2)
)

print("\n🏁 FASTONE LABS — GEOGRAPHIC CENTRELINE")
print("=" * 58)

print("Connected segments:", len(features))
print("Coordinate points:", len(ordered))
print("Closed loop:", key(ordered[0]) == key(ordered[-1]))
print("Measured length:", round(length / 1000, 3), "km")
print("Official length: 5.891 km")

print("\nCircuit traversal order:")

for number, name in enumerate(sequence, 1):
    print(f" {number:02}. {name}")

print("\nSaved:", target)
print("✅ Single geographic centreline created.")
print("✅ Existing simulator unchanged.")
print("⚠️ Direction and start/finish still need validation.")
