# F1 Strategy Lab — Milestone 1: Interactive 3D Circuit

This starter converts real historical FastF1 position samples into a rendered **3D road ribbon** (not a real elevation/architectural model).

## Prerequisites
- Python 3.11+
- Node.js 20.19+ or 22.12+ (Vite 7)
- macOS terminal, modern browser with WebGL

## Run the backend (terminal 1)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```
Check http://127.0.0.1:8000/api/health

## Run the frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open http://127.0.0.1:5173. Downloading a race for the first time can be slow.

## Under the hood
- Python FastAPI uses FastF1 to obtain a fastest-lap reference path from the 2024 British GP.
- Vite proxies `/api` to the Python server.
- React Three Fiber draws a strip mesh from the path and positions the camera in 3D.
- OrbitControls supports drag-to-orbit and scroll-to-zoom.
- At this stage Y/elevation is deliberately set to a constant: this is a 3D *representation* of a 2D plan, not terrain or true track camber.
- Road width and start marker are illustrative, not measured; the box is NOT the exact starting line.

## Next milestones
Synchronised multiple-car positions, real time slider, telemetry panels, tyre strategies, ML predictions.
