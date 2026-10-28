"""F1 Strategy Lab API - OpenF1 historical race data."""

from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json
import logging

from circuit_preview import load_circuit_preview
from race_replay import Unavailable as CircuitUnavailable
from fastapi import FastAPI, HTTPException, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / ".openf1-cache"
CACHE_DIR.mkdir(exist_ok=True)

OPENF1_URL = "https://api.openf1.org/v1"

app = FastAPI(
    title="F1 Strategy Lab API",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"]
)


@app.get("/api/health")
def health(details: bool = False):
    if not details:
        return {"status": "ok", "provider": "OpenF1"}
    from importlib.metadata import version
    return {"status":"ok","provider":"OpenF1","raceStateSchemaVersion":1,
            "sources":{"recorded":"OpenF1","archive":"Jolpica","simulation":"prototype adapter; not connected as a playable race"},
            "fastf1":{"version":version("fastf1"),"importerConnected":False},
            "liveTelemetryConnected":False}



def fetch_openf1(endpoint, params):
    """Fetch OpenF1 data with disk caching and rate-limit handling."""
    import hashlib
    import time

    query = urlencode(params)
    url = f"{OPENF1_URL}/{endpoint}?{query}"

    cache_key = hashlib.sha256(url.encode()).hexdigest()
    cache_file = CACHE_DIR / f"{cache_key}.json"

    # Reuse previously downloaded data.
    if cache_file.exists():
        with cache_file.open("r", encoding="utf-8") as file:
            cached=json.load(file)
        age=time.time()-cache_file.stat().st_mtime
        if (cached and (endpoint not in ('sessions','meetings') or age<21600)) or (not cached and age<3600):
            return cached

    request = Request(
        url,
        headers={"User-Agent": "F1StrategyLab/0.2"}
    )

    for attempt in range(3):
        try:
            # Space requests out to respect the free API.
            time.sleep(2)

            with urlopen(request, timeout=30) as response:
                data = json.load(response)

            # Save successful responses for future use.
            with cache_file.open("w", encoding="utf-8") as file:
                json.dump(data, file)

            return data

        except HTTPError as exc:
            if exc.code == 404:
                return []

            if exc.code == 429 and attempt < 2:
                retry_after = exc.headers.get("Retry-After")
                try:
                    delay = max(float(retry_after), 2 ** (attempt + 2))
                except (TypeError, ValueError):
                    delay = 2 ** (attempt + 2)

                logger.warning(
                    "OpenF1 rate limited; retrying after %s seconds",
                    delay
                )
                time.sleep(delay)
                continue

            raise RuntimeError(
                f"OpenF1 returned HTTP {exc.code}"
            ) from exc

        except (URLError, TimeoutError) as exc:
            raise RuntimeError(
                "OpenF1 network request failed"
            ) from exc



@lru_cache(maxsize=8)
def load_track(year: int, round_name: str):
    """Build a circuit outline from recorded lap coordinates."""

    meetings = fetch_openf1(
        "meetings",
        {"year": year}
    )

    event = next(
        (
            meeting for meeting in meetings
            if meeting["meeting_name"].casefold()
            == round_name.casefold()
        ),
        None
    )

    if event is None:
        raise ValueError("Grand Prix not found")

    sessions = fetch_openf1(
        "sessions",
        {
            "meeting_key": event["meeting_key"],
            "session_name": "Race"
        }
    )

    if not sessions:
        raise ValueError("Race session not found")

    session_key = sessions[0]["session_key"]

    laps = fetch_openf1(
        "laps",
        {"session_key": session_key}
    )

    valid_laps = [
        lap for lap in laps
        if lap.get("lap_duration") is not None
        and lap.get("date_start")
        and 40 < lap["lap_duration"] < 300
        and not lap.get("is_pit_out_lap", False)
    ]

    if not valid_laps:
        raise ValueError("No valid timed laps found")

    fastest = min(
        valid_laps,
        key=lambda lap: lap["lap_duration"]
    )

    driver_number = fastest["driver_number"]

    lap_start = datetime.fromisoformat(
        fastest["date_start"]
    )
    lap_end = lap_start + timedelta(
        seconds=fastest["lap_duration"]
    )

    positions = fetch_openf1(
        "location",
        {
            "session_key": session_key,
            "driver_number": driver_number,
            "date>": lap_start.strftime("%Y-%m-%dT%H:%M:%S"),
            "date<": lap_end.strftime("%Y-%m-%dT%H:%M:%S")
        }
    )

    positions = sorted(
        (
            point for point in positions
            if point.get("x") is not None
            and point.get("y") is not None
        ),
        key=lambda point: point["date"]
    )
    # Downsample for our browser track rendering.
    coordinates = [
        [float(point["x"]), float(point["y"])]
        for point in positions[::3]
    ]

    if len(coordinates) < 20:
        raise ValueError(
            "Insufficient position samples for this lap"
        )

    drivers = fetch_openf1(
        "drivers",
        {
            "session_key": session_key,
            "driver_number": driver_number
        }
    )

    acronym = (
        drivers[0].get("name_acronym")
        if drivers else None
    )

    return {
        "year": year,
        "event": event["meeting_name"],
        "session": "Race",
        "fastest_lap_driver": acronym or str(driver_number),
        "coordinates": coordinates,
        "sample_count": len(coordinates)
    }


@app.get("/api/track")
def track(year: int = 2024, event: str = "British Grand Prix", preview_year: int | None = None, preview_round: int | None = None):
    if preview_year is not None or preview_round is not None:
        if preview_year is None or preview_round is None or not 2023 <= preview_year <= datetime.now().year or not 1 <= preview_round <= 30:
            raise HTTPException(status_code=400,detail="Choose a valid preview season and round together.")
        try:
            return load_circuit_preview(fetch_openf1,jolpica,preview_year,preview_round)
        except CircuitUnavailable as exc:
            raise HTTPException(status_code=404,detail=str(exc)) from exc
        except Exception as exc:
            logger.exception("Circuit preview unavailable")
            raise HTTPException(status_code=503,detail="Circuit preview data is temporarily unavailable. Please try again later.") from exc
    if not 2023 <= year <= 2026:
        raise HTTPException(status_code=400, detail="Choose a year from 2023 to 2026")

    try:
        return load_track(year, event)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to load race track")
        raise HTTPException(
            status_code=503,
            detail="OpenF1 race data is currently unavailable"
        ) from exc


# Replay endpoints must be at the module level, not inside track().
REPLAY_SESSION_KEY = 9558
REPLAY_START = datetime.fromisoformat("2024-07-07T15:25:00+00:00")
REPLAY_END = "2024-07-07T15:26:00"

DRIVER_DETAILS = {
    44: ("HAM", "Hamilton", "#27F4D2"),
    1: ("VER", "Verstappen", "#3671C6"),
    4: ("NOR", "Norris", "#FF8700"),
    16: ("LEC", "Leclerc", "#E80020"),
    55: ("SAI", "Sainz", "#E80020"),
}


def replay_positions(driver_number=None):
    """Fetch a shared UTC window, optionally selecting one driver."""
    params = {
        "session_key": REPLAY_SESSION_KEY,
        "date>": "2024-07-07T15:25:00",
        "date<": REPLAY_END,
    }
    if driver_number is not None:
        params["driver_number"] = driver_number

    try:
        return fetch_openf1("location", params)
    except Exception as exc:
        logger.exception("Failed to fetch OpenF1 replay coordinates")
        raise HTTPException(
            status_code=503, detail="OpenF1 replay data is currently unavailable"
        ) from exc


def to_samples(positions, driver_number):
    """Map recorded UTC coordinates onto one shared 0–60 second timeline."""
    samples = []
    for point in positions:
        if point.get("driver_number") != driver_number:
            continue
        if point.get("x") is None or point.get("y") is None:
            continue
        try:
            timestamp = datetime.fromisoformat(point["date"].replace("Z", "+00:00"))
            elapsed = (timestamp - REPLAY_START).total_seconds()
            if 0 <= elapsed <= 60:
                samples.append({
                    "time": round(elapsed, 3),
                    "x": float(point["x"]),
                    "y": float(point["y"]),
                    "z": float(point.get("z") or 0),
                })
        except (ValueError, TypeError, KeyError):
            logger.warning("Skipping malformed location sample")
    return sorted(samples, key=lambda sample: sample["time"])


@app.get("/api/replay/sample")
def replay_sample():
    """Return one driver's recorded 2024 Silverstone movement."""
    driver_number = 55
    samples = to_samples(replay_positions(driver_number), driver_number)
    if len(samples) < 2:
        raise HTTPException(status_code=404, detail="Replay positions unavailable")

    return {
        "session_key": REPLAY_SESSION_KEY,
        "driver_number": driver_number,
        "driver": "SAI",
        "samples": samples,
        "sample_count": len(samples),
    }


@app.get("/api/replay/multi")
def replay_multi(year: int | None = None, round: int | None = None, start: float = 0, pitwall_driver: int | None = None):
    """Five drivers synchronised to the same 60-second historical window."""
    if year is not None or round is not None:
        if year is None or round is None or not 1950<=year<=datetime.now(timezone.utc).year or not 1<=round<=30:
            raise HTTPException(status_code=400,detail='Choose a valid season and round together.')
        from race_replay import load_replay,Unavailable
        try:
            if pitwall_driver is not None:
                from pitwall import load_pitwall
                return load_pitwall(fetch_openf1,jolpica,year,round,start,pitwall_driver)
            return load_replay(fetch_openf1,jolpica,year,round,start)
        except Unavailable as error:
            raise HTTPException(status_code=404,detail=str(error)) from error
        except ValueError as error:
            raise HTTPException(status_code=400,detail=str(error)) from error
        except HTTPException:
            raise
        except Exception as error:
            logger.exception('Could not load selected race replay')
            raise HTTPException(status_code=503,detail='The telemetry provider is unavailable or rate limited. Try this event again shortly.') from error
    positions = replay_positions()
    drivers = []
    for number, (code, name, color) in DRIVER_DETAILS.items():
        samples = to_samples(positions, number)
        if len(samples) < 2:
            logger.warning("No usable location data for driver %s", number)
            continue
        drivers.append({
            "driver_number": number,
            "code": code,
            "name": name,
            "color": color,
            "samples": samples,
            "sample_count": len(samples),
        })

    if not drivers:
        raise HTTPException(
            status_code=404, detail="No multi-driver replay data available"
        )

    return {
        "session_key": REPLAY_SESSION_KEY,
        "event": "British Grand Prix",
        "year": 2024,
        "duration": 60,
        "drivers": drivers,
    }


# Dynamic schedule: refresh frequently so upcoming races and changes are reflected.
# This endpoint deliberately does not use the immutable telemetry cache.
from datetime import timezone
from time import monotonic
from threading import Lock

_calendar_cache = {}
_calendar_lock = Lock()


@app.get("/api/calendar")
def race_calendar(year: int = 2026):
    current_year = datetime.now(timezone.utc).year
    if year < 2023 or year > current_year:
        raise HTTPException(status_code=400, detail="Choose an available season from 2023 onward")
    now = monotonic()
    with _calendar_lock:
        saved = _calendar_cache.get(year)
        if saved is not None and now - saved[0] < 21600:
            return saved[1]

    url = f"{OPENF1_URL}/meetings?{urlencode({'year': year})}"
    try:
        with urlopen(Request(url, headers={"User-Agent": "F1StrategyLab/0.3"}), timeout=25) as response:
            meetings = json.load(response)
    except HTTPError as exc:
        if exc.code == 404:
            meetings = []
        elif saved is not None:
            logger.warning("Calendar refresh failed, using cached season %s", year)
            return saved[1]
        else:
            raise HTTPException(status_code=503, detail="Calendar provider unavailable") from exc
    except (URLError, TimeoutError) as exc:
        if saved is not None:
            return saved[1]
        raise HTTPException(status_code=503, detail="Calendar provider unreachable") from exc

    utc_now = datetime.now(timezone.utc)
    races = []
    for m in meetings:
        if "Grand Prix" not in str(m.get("meeting_name", "")):
            continue
        try:
            start = datetime.fromisoformat(m["date_start"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(m["date_end"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            continue
        cancelled = m.get("is_cancelled", False)
        status = ("cancelled" if cancelled else "upcoming" if utc_now < start
                  else "completed" if utc_now > end else "in_progress")
        races.append({
            "meeting_key": m["meeting_key"],
            "name": m.get("meeting_name", "Grand Prix"),
            "circuit": m.get("circuit_short_name", "Unknown circuit"),
            "location": m.get("location", ""),
            "country": m.get("country_name", ""),
            "start": start.isoformat(),
            "end": end.isoformat(),
            "status": status,
            # Only this reference race is integrated into the current replay endpoints.
            "replay_ready": year == 2024 and m.get("meeting_key") == 1240,
        })
    races.sort(key=lambda r: r["start"])
    result = {"season": year, "races": races}
    with _calendar_lock:
        _calendar_cache[year] = (monotonic(), result)
    return result


# Milestone 6.1: 1950-present historical race archive and driver profiles.
# Jolpica is the results source; OpenF1 remains the telemetry source.
import hashlib
import re
import time

JOLPICA_URL = "https://api.jolpi.ca/ergast/f1"
JOLPICA_CACHE = ROOT / ".jolpica-cache"
JOLPICA_CACHE.mkdir(exist_ok=True)


def jolpica(path, params=None, cache_seconds=86400):
    params = params or {}
    url = f"{JOLPICA_URL}/{path.strip('/')}/?{urlencode(params)}"
    key = hashlib.sha256(url.encode()).hexdigest()
    file = JOLPICA_CACHE / f"{key}.json"
    if file.exists() and time.time() - file.stat().st_mtime < cache_seconds:
        return json.loads(file.read_text(encoding="utf-8"))["MRData"]
    req = Request(url, headers={"User-Agent": "F1StrategyLab/0.4 (local research application)", "Accept": "application/json"})
    for attempt in range(3):
        try:
            with urlopen(req, timeout=25) as r:
                payload = json.load(r)
            file.write_text(json.dumps(payload), encoding="utf-8")
            return payload["MRData"]
        except HTTPError as exc:
            if exc.code == 429 and attempt < 2:
                time.sleep(2 ** (attempt + 1))
                continue
            if file.exists():
                return json.loads(file.read_text(encoding="utf-8"))["MRData"]
            raise HTTPException(status_code=503, detail="Historical statistics provider is temporarily unavailable") from exc
        except (URLError, TimeoutError) as exc:
            if file.exists():
                return json.loads(file.read_text(encoding="utf-8"))["MRData"]
            raise HTTPException(status_code=503, detail="Historical statistics provider is unreachable") from exc
    raise HTTPException(status_code=503, detail="Historical API rate limited; retry later")


def driver_summary(d):
    return {"id": d.get("driverId"), "given_name": d.get("givenName", ""),
            "family_name": d.get("familyName", ""), "name": (d.get("givenName", "") + " " + d.get("familyName", "")).strip(),
            "nationality": d.get("nationality"), "birth_date": d.get("dateOfBirth"),
            "number": d.get("permanentNumber"), "code": d.get("code"), "info_url": d.get("url")}


@app.get("/api/archive/season")
def archive_season(year: int = 2026):
    if year < 1950 or year > datetime.now(timezone.utc).year:
        raise HTTPException(status_code=400, detail="Season is outside the World Championship era")
    data = jolpica(f"{year}/races", {"limit": 100}, cache_seconds=21600 if year == datetime.now(timezone.utc).year else 2592000)
    races = []
    today = datetime.now(timezone.utc)
    for race in data.get("RaceTable", {}).get("Races", []):
        day = race.get("date", "")
        try:
            date = datetime.fromisoformat(day + "T" + race.get("time", "12:00:00Z").replace("Z", "+00:00"))
            if date.tzinfo is None:
                date = date.replace(tzinfo=timezone.utc)
        except ValueError:
            date = datetime.fromisoformat(day + "T12:00:00+00:00")
        round_num = int(race["round"])
        circuit = race.get("Circuit", {})
        location = circuit.get("Location", {})
        races.append({"meeting_key": year * 100 + round_num, "round": round_num,
                      "name": race.get("raceName", "Grand Prix"), "circuit": circuit.get("circuitName", ""),
                      "location": location.get("locality", ""), "country": location.get("country", ""),
                      "start": date.isoformat(), "end": date.isoformat(),
                      "status": "completed" if date < today else "upcoming",
                      "replay_ready": year == 2024 and round_num == 12,"replay_supported":year>=2023})
    return {"season": year, "races": races}


@app.get("/api/archive/race/{year}/{round_num}")
def archive_race(year: int, round_num: int, forecast: bool = False):
    if not 1950 <= year <= datetime.now(timezone.utc).year or not 1 <= round_num <= 30:
        raise HTTPException(status_code=400, detail="Invalid race selection")
    if forecast:
        from forecast import forecast_race
        try:
            return forecast_race(jolpica, year, round_num)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
    data = jolpica(f"{year}/{round_num}/results", {"limit": 100}, cache_seconds=21600 if year == datetime.now(timezone.utc).year else 2592000)
    races = data.get("RaceTable", {}).get("Races", [])
    if not races:
        raise HTTPException(status_code=404, detail="Results not available; race may be upcoming")
    race = races[0]
    rows = []
    for r in race.get("Results", []):
        d = r.get("Driver", {})
        rows.append({"position": r.get("positionText"), "position_number": r.get("position"),
                     "driver": driver_summary(d), "constructor": r.get("Constructor", {}).get("name"),
                     "grid": r.get("grid"), "laps": r.get("laps"), "status": r.get("status"),
                     "time": r.get("Time", {}).get("time"), "points": r.get("points"),
                     "fastest_lap": r.get("FastestLap", {}).get("Time", {}).get("time")})
    circuit = race.get("Circuit", {})
    return {"season": int(race["season"]), "round": int(race["round"]),
            "name": race.get("raceName"), "date": race.get("date"), "time": race.get("time"),
            "circuit": circuit.get("circuitName"), "location": circuit.get("Location", {}),
            "results": rows, "winner": rows[0] if rows and rows[0]["position"] == "1" else None}


@app.get("/api/archive/drivers")
def archive_drivers(page: int = 0, search: str = ""):
    if page < 0 or page > 100:
        raise HTTPException(status_code=400, detail="Invalid page")
    # Jolpica's classic API has pagination but no full-text name search.
    # Load the directory a page at a time, cache each page, then filter locally.
    if len(search) > 80:
        raise HTTPException(status_code=400, detail="Search too long")
    if search.strip():
        all_drivers = []
        offset = 0
        while True:
            data = jolpica("drivers", {"limit": 100, "offset": offset}, cache_seconds=604800)
            batch = data.get("DriverTable", {}).get("Drivers", [])
            all_drivers.extend(batch)
            offset += len(batch)
            if not batch or offset >= int(data.get("total", 0)):
                break
        term = search.casefold().strip()
        matched = [driver_summary(d) for d in all_drivers if term in (d.get("givenName", "") + " " + d.get("familyName", "") + " " + d.get("driverId", "")).casefold()]
        return {"drivers": matched[page * 40:(page + 1) * 40], "total": len(matched), "page": page}
    data = jolpica("drivers", {"limit": 40, "offset": page * 40}, cache_seconds=604800)
    return {"drivers": [driver_summary(d) for d in data.get("DriverTable", {}).get("Drivers", [])],
            "total": int(data.get("total", 0)), "page": page}


def valid_driver_id(value):
    if not re.fullmatch(r"[a-zA-Z0-9_]+", value):
        raise HTTPException(status_code=400, detail="Invalid driver identifier")


@app.get("/api/archive/driver/{driver_id}")
def archive_driver(driver_id: str, media: bool = False, career: bool = False):
    valid_driver_id(driver_id)
    profile = jolpica(f"drivers/{driver_id}", {"limit": 1}, cache_seconds=604800)
    found = profile.get("DriverTable", {}).get("Drivers", [])
    if not found:
        raise HTTPException(status_code=404, detail="Driver not found")
    if media:
        from driver_media import find_media
        return find_media(driver_id, driver_summary(found[0])['name'])
    if career:
        from careers import load_career
        return {"driver": driver_summary(found[0]), **load_career(jolpica, driver_id)}
    result_info = jolpica(f"drivers/{driver_id}/results", {"limit": 1}, cache_seconds=86400)
    wins_info = jolpica(f"drivers/{driver_id}/results/1", {"limit": 1}, cache_seconds=86400)
    # Qualifying position 1 is pole; historical qualifying records are incomplete.
    poles_info = jolpica(f"drivers/{driver_id}/qualifying/1", {"limit": 1}, cache_seconds=86400)
    podiums = 0
    for pos in (1, 2, 3):
        p = jolpica(f"drivers/{driver_id}/results/{pos}", {"limit": 1}, cache_seconds=86400)
        podiums += int(p.get("total", 0))
    recent_total = int(result_info.get("total", 0))
    offset = max(0, recent_total - 12)
    history = jolpica(f"drivers/{driver_id}/results", {"limit": 12, "offset": offset}, cache_seconds=86400)
    races = []
    for r in reversed(history.get("RaceTable", {}).get("Races", [])):
        for res in r.get("Results", []):
            races.append({"season": int(r["season"]), "round": int(r["round"]), "race": r.get("raceName"),
                          "date": r.get("date"), "position": res.get("positionText"),
                          "constructor": res.get("Constructor", {}).get("name"), "points": res.get("points")})
    return {"driver": driver_summary(found[0]),
            "stats": {"classified_results": recent_total, "wins": int(wins_info.get("total", 0)),
                      "podiums": podiums, "qualifying_poles_recorded": int(poles_info.get("total", 0))},
            "recent_results": races,
            "limitations": "Results entries are not the same as race starts; historic qualifying pole coverage varies by era."}

@app.get('/api/news')
def f1_news():
    from news import load_news
    return load_news()


def read_race_state(year,round_num,start,time,driver=None):
    import math
    if not all(math.isfinite(t) for t in (start,time)) or start<0 or not 0<=time<=60:
        raise HTTPException(400,detail="Choose finite times within a recorded window.")
    if not 2023<=year<=datetime.now(timezone.utc).year or not 1<=round_num<=30:
        raise HTTPException(400,detail='Choose a supported recorded season and round.')
    from race_state import load_state
    from race_replay import Unavailable
    try:
        return load_state(fetch_openf1,jolpica,year,round_num,start,time,driver)
    except Unavailable as error:
        raise HTTPException(404,detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(400,detail=str(error)) from error
    except Exception as error:
        logger.exception('Race state unavailable')
        raise HTTPException(503,detail='Recorded state is temporarily unavailable.') from error


@app.get('/api/race-state/schema')
def race_state_schema():
    from race_state import UnifiedRaceState
    return UnifiedRaceState.model_json_schema(mode='serialization')


@app.get('/api/race-state')
def race_state_snapshot(year:int,round:int,start:float=0,time:float=0,driver:int|None=None):
    return read_race_state(year,round,start,time,driver)


@app.get('/api/race-state/verify')
def race_state_verify(year:int,round:int,start:float=0,time:float=0,driver:int|None=None):
    from race_state import verify,fingerprint
    state=read_race_state(year,round,start,time,driver)
    second=read_race_state(year,round,start,time,driver)
    return {**verify(state),'repeatSeekIdentical':fingerprint(state)==fingerprint(second)}

@app.get('/api/museum/historian')
def museum_historian(question: str = ''):
    # Public demo is always read-only retrieval. External AI is separately enabled,
    # loopback-only and not forwarded by demo/server.py.
    from museum import answer, ai_ready
    if not question:
        return {'mode': 'curated-retrieval', 'local_ai_configured': bool(ai_ready()), 'public_ai_enabled': False}
    try:
        return answer(question, allow_ai=False)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post('/api/museum/historian')
async def museum_historian_ai(request: FastAPIRequest):
    from museum import answer
    if request.client is None or request.client.host not in ('127.0.0.1', '::1'):
        raise HTTPException(status_code=403, detail='AI historian is only available locally until authenticated hosting is configured')
    if request.headers.get('content-type', '').split(';')[0].strip().lower() != 'application/json':
        raise HTTPException(status_code=415, detail='JSON required')
    origin = request.headers.get('origin')
    if origin and origin not in ('http://127.0.0.1:5173', 'http://localhost:5173'):
        raise HTTPException(status_code=403, detail='Use the local development app for AI requests')
    body = await request.body()
    if len(body) > 2048:
        raise HTTPException(status_code=413, detail='Question is too long')
    try:
        data = json.loads(body)
        from starlette.concurrency import run_in_threadpool
        return await run_in_threadpool(answer, data.get('question'), allow_ai=True)
    except (ValueError, AttributeError) as error:
        raise HTTPException(status_code=422, detail='Ask a question between 3 and 500 characters.') from error
