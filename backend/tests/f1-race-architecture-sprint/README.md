# F1 Race Architecture Sprint — Milestone A

## Inspected sources
- `f1-mexico-overtaking-update.zip`: `frontend/src/main.tsx`, `StrategyLab.tsx`, `style.css`.
- `f1-strategy-lab-3d-starter.zip`: `backend/main.py`, `backend/requirements.txt`, `frontend/package.json`.
- No access to your actual working copy on the Mac. **Do not overwrite existing source files.** `inspected-main.tsx.reference` is a read-only reference for the audited snapshot.

## Findings
- Single `main.tsx` currently mixes React UI, replay import, old toy lap prediction, car movement, and visual passing logic.
- `predictProgress` derives lap position; `lateralRaceOffset` fakes visual passes. The timing tower and car motion are not computed from one authoritative race state.
- Day 4 StrategyLab is separate and is preserved unchanged.
- FastAPI exposes `/api/health` and `/api/track`; historical FastF1 loading can fail for external authentication reasons.
- The available snapshot contains no automated test suite.

## Install: Milestone A only (additions, not replacements)
1. Back up the project or commit your existing files (`git status`, `git add .`, `git commit -m 'Working Mexico baseline'`).
2. Copy `frontend/src/race/raceState.ts` to `~/Documents/f1-strategy-lab/frontend/src/race/raceState.ts` (new directory and file).
3. Copy `frontend/tests/raceState.test.mjs` to `~/Documents/f1-strategy-lab/frontend/tests/raceState.test.mjs`.
4. Copy `backend/tests/test_api_contract.py` to `~/Documents/f1-strategy-lab/backend/tests/test_api_contract.py`.
5. DO NOT replace `main.tsx`, `style.css`, `StrategyLab.tsx`, `backend/main.py`, or package manifests. Your visible simulator should remain identical at Milestone A.

## Commands
```
cd ~/Documents/f1-strategy-lab/frontend
node --experimental-strip-types --test tests/raceState.test.mjs
npm run build
cd ../backend
python -m pytest -q tests/test_api_contract.py
```
Requires Node supporting TS type stripping (Node 22.16+ was used in our sandbox); if your local Node is older we will use an installed TypeScript runner in the next milestone.

## Model scope and next integration step
- RaceState (version 1): unique ID, lap, metres into lap, lateral offset, speed, tyre state, energy/active aero mode, pit phase, race position, gaps and timestamp.
- `stepRace` is a deterministic educational prototype with following gaps and passing; no tyre change transition, pit loss, race-control flags, mapped straight zones, FIA legality, tyre model calibration, or wheel-to-wheel physics yet.
- `toCarView` is a read-only adapter returning progress and lateral offset compatible with the existing `DemoCar` positioning props. Don't switch over without verifying current local `DemoCar` and camera signatures.
- Snapshot and restore preserve state deterministically. For long replays use a fixed step size (e.g., 0.2s) and persist both initial snapshot and scenario inputs.
- Race start lights, authentic 2026 energy rules, real overtaking detection point, SC/VSC and pit events are deferred until next verified milestones.

## 2026 rules note
2026 Straight/Corner Active Aero is NOT old DRS. Boost draws on electrical energy; Overtake Mode has distinct eligibility rules. This first module stores flags only; it does not falsely assert FIA-accurate eligibility or deployment.

## Verification performed in sandbox
Six frontend engine/adapter tests pass with Node v22.16.0.
Full Vite build of your actual Mac project, browser interaction, and actual FastAPI/pytest against your Mac checkout are NOT verified.
