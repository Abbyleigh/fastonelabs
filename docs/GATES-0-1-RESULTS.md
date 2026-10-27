# Gate 0 / Gate 1 — implementation result

27 October 2026. Integrated into the existing `/Users/abbyleighboden/Documents/f1-strategy-lab 4` app. No replacement app, remote publication, payments or gambling integration.

## Gate 0 delivered

- Existing code and licensed local assets committed on local `main` as `3730b04` and tagged `baseline-before-gates-0-1`.
- Active branch: `feat/race-intelligence-gates-0-1`.
- Audit/preservation plan and ordered local PR plan: `docs/RACE-INTELLIGENCE-PLAN.md`.
- Gate 0 commit: `40c7a3e`. Test discovery excludes the old copied sprint artifact without deleting it. Source caches remain on disk but are excluded from ongoing Git tracking. Environment files, virtualenvs, logs and dependencies are ignored.
- Original checks: 29 frontend + 31 unittest tests and production build passed. Added pytest to the existing environment and resolved duplicate artifact collection; corrected baseline is 33 pytest tests plus 29 frontend tests.

## Gate 1 delivered

- Frozen Pydantic race-state contract with immutable nested tuples/models, source kind, event/session identity, elapsed and UTC timestamps, car identity/classification, pose quality, nullable telemetry, tyres, pit and energy fields, units and limitations. Unknown structured flags/events are null, not invented empty histories.
- Backend generates readonly TypeScript types and JSON Schema. A check detects generation drift. Shared synthetic fixtures test backend/browser equivalence and are explicitly not historical accuracy evidence.
- `ReplaySource` converts existing OpenF1 replay windows to this contract. `SimulationSource` adapts a deterministic prototype checkpoint, labels estimates and refuses arbitrary future timestamps. Existing simulation engine was preserved, not replaced or presented as a fully playable race.
- Existing replay cars, follow camera and pit-wall map consume one state and replay clock. Recorded classification/interval channels populate state when available. Coordinates are provider units; speed is converted from supplied km/h into m/s, never estimated from raw XY.
- Shared quality panel reports sampled/interpolated/missing positions, prepares a frozen JSON download and checks recorded seeks. It does not claim FastF1 or official-timing accuracy.
- Additive GET routes: `/api/race-state`, `/api/race-state/schema`, `/api/race-state/verify`. Existing endpoint shapes preserved. `/api/health` retains its original default response; `?details=true` reports source connections and installed FastF1 version. Existing read-only demo proxy allows the new routes.
- FastF1 remains **3.9.0**, now pinned to preserve the installed version. It is installed but not connected to production ingestion. Explicit Pydantic v2 dependency and separate development requirements added.

## Verification actually run

`backend/.venv312/bin/python tools/check_project.py` passed:

- **48 pytest tests** passed, including existing assets/engineering/strategy-data tests and new state/API checks.
- **38 frontend tests** passed, including original prototype, strategies, garage, pit-wall tests and new cross-language/seek/immutability/clock checks.
- Generated schema/types match Python source.
- TypeScript and Vite production build passed.
- `git diff --check` passed.

Non-failing warnings: existing large production bundle; installed Starlette warns that its httpx TestClient adapter is deprecated. Existing production libraries were not upgraded to silence these warnings.

Actual provider verification: British Grand Prix 2024, round 12, window 1860s, local time 54s (recorded elapsed **1914s / 31:54**), driver 44. API and downloaded browser JSON both validate and match **exactly**, with 20 cars, 20 available interpolated positions and unique last-reported classifications. Repeated backend seeks return the same state hash:

`bc6439c0d3c63a299143e91a15f442f84257a883c1e7e5d1d06662e07d6b7b81`

Browser: selected season/race/window/driver, paused and sought using the real controls, invoked verification with mouse and keyboard, downloaded JSON, followed Hamilton, checked pit-wall map/telemetry. Desktop 1440px, tablet 820px and phone 390px checks passed with document width equal to viewport width. Browser errors from the final verification run: none. Temporary viewport overrides were reset.

Browser checks caught and resolved: a negative first animation-frame delta exposed by strict seek validation; a duplicate sibling key causing repeated state panels on window changes; pre-existing replay grid overflow on narrow screens. Final panel count is one after window changes.

## Exact files changed

Gate 0:
- `.gitignore`
- `pytest.ini`
- `backend/requirements-dev.txt`
- `frontend/package.json`
- `docs/RACE-INTELLIGENCE-PLAN.md`

Gate 1 additions:
- `backend/race_state.py`
- `backend/tests/test_state_api.py`
- `backend/tests/test_unified_race_state.py`
- `backend/tests/fixtures/race_state_contract.json`
- `backend/tests/fixtures/simulation_state_contract.json`
- `frontend/src/race/unifiedRaceState.ts` (generated)
- `frontend/src/race/unifiedRaceState.schema.json` (generated)
- `frontend/src/race/raceSources.ts`
- `frontend/src/race/RaceStateStatus.tsx`
- `frontend/tests/raceSources.test.mjs`
- `tools/generate_race_contract.py`
- `tools/check_project.py`
- `docs/GATES-0-1-RESULTS.md`
- `docs/WORK-BRIEF-2026-10-27.md` (user-supplied brief preserved)

Gate 1 edits:
- `backend/main.py` — new read-only state routes and optional detailed health.
- `backend/requirements.txt` — preserve FastF1 version and declare Pydantic v2.
- `demo/server.py` — read-only route allowlist extension.
- `frontend/src/main.tsx` — shared-state renderer/camera wiring, bounded replay clock and quality panel.
- `frontend/src/PitWall.tsx` — shared pose consumption and recorded-channel handoff.
- `frontend/src/style.css` — narrow grid/wrapping fixes.
- `README.md` — gate-check entry point.

## Visual / downloadable evidence

Saved in this chat's outputs folder:
- `gate1-desktop-1440.jpg`
- `gate1-tablet-820.jpg`
- `gate1-phone-390.jpg`
- `gate1-silverstone-state.json`

## Remaining scope / next gate

Gate 2: cached FastF1 3.9.0 importer, normalization/completeness reporting, British GP 2024 lap/classification/gap fixtures and explicit discrepancy checks against OpenF1, then replay library/event timeline and camera improvements. Current seek consistency is not validation of real-world reconstruction accuracy. No validated elevation, calibrated 2026 physics, full-race pit cycles, grounded LLM engineer, dual-universe UI, prediction calibration, persistent universal sidebar or accounts have been completed by this increment. Those remain in the ordered plan.

Rollback is available from local Git baseline/tag. Current source changes are reviewable independently of the original baseline. No existing source/asset files were deleted to implement Gate 1.
