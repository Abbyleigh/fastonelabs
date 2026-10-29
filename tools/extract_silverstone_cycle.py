import json
import math
from pathlib import Path
from collections import defaultdict, deque

source = Path(
    "geographic-data/silverstone/raceway-candidates.geojson"
)

target = source.parent / "silverstone-cycle-candidate.geojson"

if target.exists():
    raise SystemExit(
        "Candidate already exists. Existing file preserved."
    )

features = json.loads(source.read_text())["features"]

def key(point):
    return tuple(round(v, 7) for v in point)

def distance(a, b):
    lat1, lon1 = math.radians(a[1]), math.radians(a[0])
    lat2, lon2 = math.radians(b[1]), math.radians(b[0])

    h = (
        math.sin((lat2-lat1)/2)**2
        + math.cos(lat1)*math.cos(lat2)
        * math.sin((lon2-lon1)/2)**2
    )

    return 12742000 * math.asin(min(1, math.sqrt(h)))

edges = {}
adj = defaultdict(set)

for i, feature in enumerate(features):
    points = feature["geometry"]["coordinates"]

    if len(points) < 2:
        continue

    a = key(points[0])
    b = key(points[-1])

    length = sum(
        distance(p, q)
        for p, q in zip(points, points[1:])
    )

    edges[i] = (a, b, length)

    adj[a].add(i)
    adj[b].add(i)

# Identify connected components.
unvisited = set(edges)
components = []

while unvisited:
    seed = next(iter(unvisited))
    stack = [seed]
    group = set()

    while stack:
        i = stack.pop()

        if i in group:
            continue

        group.add(i)
        unvisited.discard(i)

        a, b, _ = edges[i]

        for node in (a, b):
            stack.extend(adj[node] - group)

    components.append(group)

components.sort(key=len, reverse=True)

main = components[0]

# Degree counts, including parallel edges and self-loops.
degree = defaultdict(int)
incident = defaultdict(set)

for i in main:
    a, b, _ = edges[i]

    degree[a] += 1
    degree[b] += 1

    incident[a].add(i)
    incident[b].add(i)

remaining = set(main)

queue = deque(
    node for node, count in degree.items()
    if count == 1
)

while queue:
    node = queue.popleft()

    if degree[node] != 1:
        continue

    for i in list(incident[node]):
        if i not in remaining:
            continue

        remaining.remove(i)

        a, b, _ = edges[i]

        degree[a] -= 1
        degree[b] -= 1

        if degree[a] == 1:
            queue.append(a)

        if degree[b] == 1:
            queue.append(b)

cycle_length = sum(
    edges[i][2] for i in remaining
)

print("\n🏁 FASTONE LABS — GRAND PRIX CYCLE EXTRACTION")
print("=" * 60)

print("Main network segments:", len(main))
print("Closed-cycle segments:", len(remaining))
print("Removed branch segments:", len(main - remaining))

print(
    "\nExtracted cycle length:",
    round(cycle_length / 1000, 3),
    "km"
)

print("Reference GP length: 5.891 km")

difference = cycle_length - 5891

print(
    "Difference:",
    round(difference),
    "metres"
)

print("\nCycle sections:")

pit_segments = []

for i in sorted(remaining):
    props = features[i]["properties"]
    name = props.get("name") or "Unnamed"

    print(
        f"  {edges[i][2]:7.1f} m | "
        f"OSM {props.get('osm_id')} | {name}"
    )

    if "pit" in name.lower():
        pit_segments.append(name)

# Verify the retained graph really is one simple cycle.
cycle_nodes = set()

for i in remaining:
    a, b, _ = edges[i]
    cycle_nodes.update((a, b))

simple_cycle = (
    bool(remaining)
    and len(remaining) == len(cycle_nodes)
    and all(degree[node] == 2 for node in cycle_nodes)
)

print("\nSingle simple cycle:", simple_cycle)
print("Pit-labelled segments:", pit_segments)

if not simple_cycle:
    raise SystemExit(
        "\n⚠️ Extracted graph is not a single simple cycle. "
        "No candidate saved."
    )

result = {
    "type": "FeatureCollection",
    "metadata": {
        "source": "OpenStreetMap",
        "attribution": "© OpenStreetMap contributors",
        "licence": "ODbL 1.0",
        "status": "UNVERIFIED cycle candidate",
        "length_m": round(cycle_length, 2),
        "reference_gp_length_m": 5891,
        "difference_m": round(difference, 2),
        "contains_pit_labels": bool(pit_segments),
        "note": (
            "Automatically extracted topological cycle. "
            "Not yet validated as the 2024 Grand Prix route."
        )
    },
    "features": [
        features[i]
        for i in sorted(remaining)
    ]
}

target.write_text(
    json.dumps(result, indent=2)
)

print("\nSaved:", target)
print("✅ Existing simulator untouched.")
print("⚠️ Geographic route not yet approved for rendering.")
