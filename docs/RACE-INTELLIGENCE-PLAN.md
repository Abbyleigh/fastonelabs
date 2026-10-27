# Preservation audit and ordered implementation plan

## Gate 0 — audited 27 October 2026

Existing app: `/Users/abbyleighboden/Documents/f1-strategy-lab 4`. No Git repository existed. Created local `main`, committed the working source and licensed assets, tagged `baseline-before-gates-0-1`, and branched `feat/race-intelligence-gates-0-1`. No remote publishing or new app.

### Verified architecture

- Frontend: React 19, TypeScript, Vite 7, Three 0.180, React Three Fiber 9, Drei 10. `frontend/src/main.tsx` contains page switching, calendar, results, driver profiles and recorded replay. No router or persistent global shell yet.
- Backend: Python 3.12.16, FastAPI; `backend/main.py`, launched on 8001 without reload by `launch_lab.py`. Frontend dev server 5173; read-only demo proxy `demo/server.py` on 8765, Cloudflare tunnel remains separate.
- **Actual data path:** recorded replay/track/pit wall from OpenF1; archive, roster and forecasts from Jolpica. `race_replay.py` matches season/round to a finished session, loads 60-second position windows, bounds gaps and caches data. Coordinate units are provider units; XYZ does not establish verified road elevation. Pit-wall classification comes from recorded position updates, not visual driver order.
- FastF1 **3.9.0 installed**, cache exists, requirements permit 3.6–3.x; current production routes do not import it. Preserve installed version; implement its importer and lap cross-checks in Gate 2 rather than silently change providers now.
- Pure simulation prototype: `frontend/src/race/raceState.ts`; six tests, but no import from production UI. Kinematic following/passing and illustrative energy fields; no real pit service or validated 2026 regulation model.
- Strategy: `strategyModel.ts`, `StrategyWorkbench.tsx`, `StrategyTools.tsx`: deterministic A/B strategies, optimiser, paired uncertainty sampling, scenario save/export. These are estimates, not calibrated probabilities.
- Forecast: `backend/forecast.py` + `ForecastPage.tsx`, ridge baseline with earlier-round-only training and chronological holdouts. Calibration, immutable forecasts and benchmark registry are not complete.
- Drivers/engineering: real credited Commons photos; eight 2026 team car assets plus Ferrari 2023, common component geometry in garage/engineering, generic driver studies, Hamilton head-only asset. Model identities and licences tested. Real photographic garage backdrop is shared historical AlphaTauri 2021, with a rendered display floor; not a team-specific 360-degree environment.
- News/radio: BBC RSS with timestamps/stale cache; in-app publisher podcast audio, external commentary links; selected recorded team-radio clips in pit wall. No live telemetry feed connected.
- Circuit preview: same-circuit recorded reference with clearly illustrative surface/lighting. No verified track elevation, detailed pit lane or photogrammetric circuit environment.

### Baseline checks and gaps

29 frontend tests passed, 31 unittest-discovered backend checks passed, TypeScript/Vite build passed. Existing bundle-size warning remains. `pytest` was absent; installed 8.4.2 into the existing backend environment. Its initial collection found duplicate `test_api_contract.py` inside an old copied sprint artifact. Root `pytest.ini` restricts discovery to active tests and excludes that preserved artifact (no deletion). Corrected baseline: **33 pytest tests pass**, including the two existing function-style API source checks that unittest did not discover. Added `npm test` script. Development dependencies are separate from production requirements.

### Preservation/migration plan

1. Keep current endpoints, response shapes, pages, assets and launch scripts. Add modules/routes and small adapters only.
2. Share a versioned, nullable race-state contract across Python and TypeScript; retain the prototype's own state format behind an adapter. Generate frontend types/schema from the backend model and test golden cross-language fixtures.
3. Connect the existing replay cars, camera, map and current-state export to the contract using one replay clock. Preserve maximum two-second interpolation gaps; no inferred physical speed from uncalibrated coordinates.
4. Add source/quality visibility and read-only health/schema/state verification. Unknown lap, tyre, pit, energy and classification values remain null/unknown until supplied; simulations explicitly estimated.
5. Expand one provider at a time behind this interface. Roll back an unsuccessful increment by restoring its files from the baseline, not resetting unrelated work.

## Ordered implementation PR plan

These are local review units until a Git remote exists. No PR has been opened.

1. **Gate 0: protect and audit** — Git snapshot/tag/branch, pytest configuration, npm test, this audit and baseline smoke tests.
2. **Gate 1: shared race state** — frozen Python contract, generated readonly TypeScript/schema, OpenF1 ReplaySource, prototype SimulationSource, production replay adapters, source/quality status and JSON export, read-only state/schema/verification routes, deterministic seek/unknown-field/contract tests.
3. **Gate 2: accurate replay MVP** — preserve FastF1 3.9.0; cached importer/normalizer, completeness report, one verified British GP 2024 fixture, lap-position/gap reconciliation and discrepancy report; replay library, event seeking and additional cameras. First establish evidence before claiming 1:1 accuracy or full offline playback.
4. **Gate 3: racing mechanics** — extend existing stepper with real pit transitions, traffic, seeded uncertainty and explicit 2026 concept rules, test a complete Mexico 71-lap run. No private-team-physics claims.
5. **Gate 4: strategy + engineer** — bounded Monte Carlo service and deterministic tools, grounded analytical workspace. LLM only with backend credentials/spend controls and traceable outputs; no invented confidence.
6. **Gate 5: parallel universe** — immutable checkpoints, paired seeds/interventions, synchronised two-view renderer and delta report.
7. **Gate 6: prediction lab** — stored pre-event snapshots, walk-forward backtesting and trivial baselines, calibrated scores and source cutoffs.
8. **Gate 7: principal/drivers/chaos** — playable decision events, opponent policies, seeded incidents, audited post-race comparisons.
9. **Application shell/design increments** — shared event selector/URLs/sidebar and design tokens alongside Gates 2–7; preserve existing routes and controls. Overview first, then each analytical page. Planned items remain labelled Planned. Browser checks at 1440/820/390 px as pages change.
10. **Gate 8: commercial review only after separate approval** — no billing, accounts, payments, sportsbook or paid feeds in Gates 0/1.

## Gate 1 limits

A shared state and verification interface is groundwork, not completed FastF1 import, simulation physics, AI Engineer, parallel universes or calibrated predictions. Gate 2 must independently reconcile provider timing against FastF1; self-consistent seek tests are not real-world accuracy validation.
