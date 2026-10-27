"""F1 Strategy Lab: first milestone API."""
from functools import lru_cache
from pathlib import Path

import fastf1
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / ".fastf1-cache"
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

app = FastAPI(title="F1 Strategy Lab API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@lru_cache(maxsize=4)
def load_track(year: int, round_name: str):
    """Load once per event and derive the circuit from a real timed lap."""
    session = fastf1.get_session(year, round_name, "R")
    session.load(laps=True, telemetry=True, weather=False, messages=False)
    fastest = session.laps.pick_fastest()
    if fastest is None or fastest.empty:
        raise ValueError("No valid fastest lap was found")

    positions = fastest.get_pos_data()
    if positions.empty:
        raise ValueError("Position data is unavailable")

    # Keep a reasonable number of points for a browser SVG.
    points = positions[["X", "Y"]].dropna().iloc[::3]
    coords = [[round(float(x), 2), round(float(y), 2)] for x, y in points.itertuples(index=False, name=None)]
    if len(coords) < 2:
        raise ValueError("Not enough position samples to draw a track")

    return {
        "year": year,
        "event": str(session.event["EventName"]),
        "session": "Race",
        "fastest_lap_driver": str(fastest["Driver"]),
        "coordinates": coords,
        "sample_count": len(coords),
    }


@app.get("/api/track")
def track(year: int = 2024, event: str = "British Grand Prix"):
    if not 2018 <= year <= 2026:
        raise HTTPException(status_code=400, detail="Choose a year from 2018 to 2026")
    try:
        return load_track(year, event)
    except Exception as exc:
        # Keep internal exception details out of public API responses.
        raise HTTPException(status_code=503, detail="Race data unavailable. Check the event name, year and FastF1 connectivity.") from exc
