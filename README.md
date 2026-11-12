# FastOne Labs 🏎️

**An F1 strategy and race-data project I'm building to explore simulation, telemetry and 3D visualisation.**

🌐 [Open FastOne Labs](https://fastonelabs.pages.dev)

I started this because I wanted to do more with racing data than look at lap times. The project brings together circuit visualisation, car positions and experiments with race strategy. It's also where I'm learning a lot about React Three Fiber, Python APIs and working with real-world datasets.

**Stack:** React · TypeScript · Vite · Three.js / React Three Fiber · Python · FastAPI · FastF1

## Running the code locally

This repository includes a historical milestone implementation. The live site and this checkout may not have identical features.

**Requirements:** Python 3.11+, Node.js 20.19+ or 22.12+, and a browser with WebGL.

Backend:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Check `http://127.0.0.1:8000/api/health`.

Frontend, in another terminal:
```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The first FastF1 data download can take a while.

## How this milestone works

- FastAPI and FastF1 load historical position samples from the 2024 British Grand Prix.
- Vite proxies frontend API requests to the Python backend.
- React Three Fiber renders a road ribbon and lets you orbit around the circuit.
- The circuit height is deliberately flat. It's a 3D view of a 2D track path, **not** a measured terrain, camber or elevation model.
- Road width and start marker are illustrative.

## Development notes

The race intelligence plan lives in [docs/RACE-INTELLIGENCE-PLAN.md](docs/RACE-INTELLIGENCE-PLAN.md), with earlier gate results in [docs/GATES-0-1-RESULTS.md](docs/GATES-0-1-RESULTS.md).

Run the project checks with the existing development environment:

```bash
backend/.venv312/bin/python tools/check_project.py
```

Development dependencies are listed in `backend/requirements-dev.txt`. The preserved FastF1 version is 3.9.0; OpenF1 and Jolpica are also used as data sources in the broader project.

I'm continuing to work on multi-car visualisation, timing and race-strategy features.
