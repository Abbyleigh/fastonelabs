import json
import math
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode

root = Path("geographic-data/silverstone")

reference = json.loads(
    (root / "silverstone-scene-reference.json").read_text()
)

url = "http://127.0.0.1:8000/api/track?" + urlencode({
    "year": 2024,
    "event": "British Grand Prix"
})

with urlopen(url, timeout=30) as response:
    track = json.load(response)

provider = track["coordinates"]
geographic = reference["coordinates"]

if len(provider) < 20 or len(geographic) < 20:
    raise SystemExit("Insufficient coordinates.")

# Convert two-dimensional coordinates to complex numbers.
def as_complex(points):
    return [
        complex(float(p[0]), float(p[1]))
        for p in points
    ]

# Resample a closed circuit at equal distances along its path.
def resample(points, count=160):
    points = as_complex(points)

    if abs(points[0] - points[-1]) > 1e-9:
        points.append(points[0])

    cumulative = [0.0]

    for a, b in zip(points, points[1:]):
        cumulative.append(
            cumulative[-1] + abs(b-a)
        )

    total = cumulative[-1]

    if total <= 0:
        raise ValueError("Zero-length circuit.")

    result = []
    index = 0

    for k in range(count):
        position = total * k / count

        while (
            index < len(cumulative)-2
            and cumulative[index+1] < position
        ):
            index += 1

        start = cumulative[index]
        end = cumulative[index+1]

        fraction = (
            (position-start)/(end-start)
            if end > start else 0
        )

        point = (
            points[index]
            + (points[index+1]-points[index])*fraction
        )

        result.append(point)

    return result, total

source, source_length = resample(provider)
target, target_length = resample(geographic)

n = len(source)

# Fit translation, uniform scale and rotation.
# Optional conjugation tests reflection.
def fit(a, b):
    mean_a = sum(a)/len(a)
    mean_b = sum(b)/len(b)

    centered_a = [p-mean_a for p in a]
    centered_b = [p-mean_b for p in b]

    denominator = sum(
        abs(p)**2 for p in centered_a
    )

    if denominator <= 0:
        raise ValueError("Degenerate coordinates.")

    coefficient = sum(
        y*x.conjugate()
        for x, y in zip(centered_a, centered_b)
    ) / denominator

    offset = mean_b - coefficient*mean_a

    error = math.sqrt(
        sum(
            abs(coefficient*x+offset-y)**2
            for x, y in zip(a, b)
        ) / len(a)
    )

    return error, coefficient, offset

results = []

for direction in ("forward", "reversed"):
    ordered = (
        source
        if direction == "forward"
        else list(reversed(source))
    )

    for mirrored in (False, True):
        points = [
            p.conjugate() if mirrored else p
            for p in ordered
        ]

        for shift in range(n):
            shifted = points[shift:] + points[:shift]

            error, coefficient, offset = fit(
                shifted, target
            )

            results.append({
                "error": error,
                "direction": direction,
                "mirrored": mirrored,
                "shift": shift,
                "scale": abs(coefficient),
                "rotation": math.degrees(
                    math.atan2(
                        coefficient.imag,
                        coefficient.real
                    )
                ),
                "translation": [
                    offset.real,
                    offset.imag
                ]
            })

results.sort(key=lambda r: r["error"])
best = results[0]

scene_scale = reference["metres_to_scene_units"]
error_metres = best["error"]/scene_scale

print("\n🏁 FASTONE LABS — CIRCUIT ALIGNMENT")
print("=" * 60)

print("OpenF1 points:", len(provider))
print("Geographic points:", len(geographic))

print("\nResampled points per circuit:", n)
print("OpenF1 path length (provider units):",
      round(source_length, 2))
print("Geographic path length (scene units):",
      round(target_length, 2))

print("\nBEST ALIGNMENT")
print("-" * 60)

print("Direction:", best["direction"])
print("Mirrored:", best["mirrored"])
print("Cyclic shift:", best["shift"])
print("Rotation:", round(best["rotation"], 3), "degrees")
print("Scale:", round(best["scale"], 8))
print("Translation:", [
    round(x, 3) for x in best["translation"]
])

print("\nAlignment RMS error:")
print("  Scene units:", round(best["error"], 3))
print("  Approximate metres:", round(error_metres, 1))

print("\nError as percentage of 5,891 m:")
print(
    " ",
    round(error_metres / 5891 * 100, 2),
    "%"
)

print("\n⚠️ This is a geometric best fit, not")
print("proof of start/finish or timing alignment.")
print("The provider lap is provisionally closed")
print("for shape comparison.")
print("\n✅ Read-only alignment test complete.")
print("✅ No simulator files modified.")
