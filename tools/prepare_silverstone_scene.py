import json
import math
from pathlib import Path

directory = Path("geographic-data/silverstone")

source = directory / "silverstone-gp-centerline.geojson"
target = directory / "silverstone-scene-reference.json"

if target.exists():
    raise SystemExit(
        "Scene reference already exists. "
        "Existing file preserved."
    )

data = json.loads(source.read_text())

coords = data["features"][0]["geometry"]["coordinates"]

if len(coords) < 100:
    raise SystemExit("Insufficient centreline coordinates.")

lon0 = sum(p[0] for p in coords[:-1]) / (len(coords)-1)
lat0 = sum(p[1] for p in coords[:-1]) / (len(coords)-1)

earth_radius = 6371000

def project(point):
    lon, lat = point

    east = (
        math.radians(lon-lon0)
        * earth_radius
        * math.cos(math.radians(lat0))
    )

    north = (
        math.radians(lat-lat0)
        * earth_radius
    )

    return [east, north]

projected = [project(p) for p in coords]

# Existing scene uses approximately 120 units
# across its longest geographic dimension.
xs = [p[0] for p in projected]
ys = [p[1] for p in projected]

minx, maxx = min(xs), max(xs)
miny, maxy = min(ys), max(ys)

centre_x = (minx+maxx)/2
centre_y = (miny+maxy)/2

scale = 120 / max(
    maxx-minx,
    maxy-miny,
    1
)

scene_coords = [
    [
        round((x-centre_x)*scale, 6),
        round(-(y-centre_y)*scale, 6)
    ]
    for x,y in projected
]

result = {
    "circuit": "Silverstone",
    "layout": "Grand Prix",
    "source": "OpenStreetMap",
    "attribution": "© OpenStreetMap contributors",
    "licence": "ODbL 1.0",
    "status": "scene-ready geographic reference; replay uncalibrated",
    "origin": {
        "longitude": lon0,
        "latitude": lat0
    },
    "projection": "local equirectangular east/north",
    "metres_to_scene_units": scale,
    "length_m": data["metadata"]["length_m"],
    "closed": scene_coords[0] == scene_coords[-1],
    "coordinates": scene_coords,
    "geographic_coordinates": coords
}

target.write_text(json.dumps(result, indent=2))

print("\n🏎️ FASTONE LABS — SCENE GEOMETRY")
print("=" * 55)
print("Geographic points:", len(coords))
print("Scene points:", len(scene_coords))
print("Closed loop:", result["closed"])
print("Scale:", round(scale, 6), "scene units/metre")
print("Saved:", target)

print("\n✅ Scene reference generated.")
print("✅ Original geographic data preserved.")
print("✅ Existing frontend and replay unchanged.")
