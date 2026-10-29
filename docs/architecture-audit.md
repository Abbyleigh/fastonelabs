# FastOne Labs architecture audit

Audit date: 29 October 2026. Starting checkpoint: `dd57d2596389c946a0e02db8a8636e3dbd7d95a0`, default branch `feat/f1-web-publication`. Work branch: `work/heritage-platform`.

## Access and evidence

The GitHub connection grants access to the private repository. The Mac directory and running Mac services are not accessible. Source is reconstructed at a fixed GitHub commit through the connector, rather than cloning Git history. An initial audit of `e7e8364` is superseded by the user's explicit `dd57d25` checkpoint, four commits later. All changed checkpoint source files are reloaded before implementation is reapplied. Large binary models/images are not downloaded.

A local source-snapshot commit permits isolated diffs; remote delivery uses the real `dd57d25` commit as parent and the real upstream tree as base, preserving every untouched file and asset. Local snapshot commits are not pushed as upstream history.

No AGENTS.md exists in the inspected tree. The newer checkpoint includes `RaceScenes.tsx`, `circuit/CircuitCoordinates.ts`, geographic reference files, commentary/cameras and other simulator work. All of these are outside the final edit set. Loading checkpoint source for the build does not change those files in the delivered patch.

## Existing architecture

| Area | Implementation | Finding |
|---|---|---|
| Frontend entry and application state | `frontend/src/main.tsx` | Hash navigation and deferred experiences; the checkpoint already introduces lazy routes. Preserve simulator ownership. |
| Navigation and shell | `navigation.ts`, `SiteShell.tsx`, `CinematicHome.tsx` | Existing screen union and museum routes; no new top-level route required. |
| Heritage | `HeritageMuseum.tsx`, `heritageData.ts`, `HistoricMedia.tsx`, `MuseumLabs.tsx` | Sourced editorial timeline, car exhibits, comparison and teaching experiments already exist. Do not duplicate them or call them a database. |
| Vehicles | `VehicleLibrary.tsx`, `VehicleAssets.ts`, `VehicleViewer.tsx`, engineering files | Existing filters, local favourites, creator credits, commercial/race eligibility and fidelity disclosures. |
| Driver careers | `DriverCareers.tsx`, `backend/careers.py` | Jolpica integration and explicit limitations; preserve provider contracts. |
| API | `backend/main.py`, specialist Python modules | FastAPI with synchronous network functions, disk caches and mocked-provider tests. Existing museum editorial lookup and optional Groq ID selection; no structured SQL historical catalogue. |
| Data providers | OpenF1, Jolpica, Wikimedia Commons, BBC | Distinct telemetry, results, images and news rights. Public accessibility does not unify licences. |
| Local services | `launch_lab.py`, `frontend/vite.config.ts` | Backend and Vite proxy target **8001**, frontend **5173**. The assignment's backend port 8000 is not this commit's configuration. |
| Demo | `demo/server.py`, `demo/share.py` | Loopback static build server plus API allowlist; separate optional tunnel. No tunnel is launched in this assignment. |
| Tests | `pytest.ini`, `backend/tests`, `frontend/tests` | pytest excludes nested reference sprint; Node 24 directly runs TypeScript model tests. |

## Implemented independent slice

`backend/heritage` provides validated curated input, a separate SQLite projection, read-only API and no network access during requests. The 1950 pilot has 10 linked records, five primary references and seven selected classification rows. A lazy-loaded component embeds in the museum Origins gallery. Existing archive and telemetry APIs stay in place.

The catalogue needs three small integration edits: `backend/main.py` registers a router; `HeritageMuseum.tsx` adds the lazy gallery; `demo/server.py` admits bounded catalogue routes and gains an import-safe main guard. Historian improvements also modify `museum.py`, its tests/setup documentation and local configuration helpers, and add a corpus validator. No package manifest, lockfile, global CSS, navigation union or simulator file changes.

## Priorities and integration risks

1. **Now:** validate the pilot, review its citations and coverage, deliver reproducible tests and integration instructions.
2. **Before public production:** reconcile missing binary fixtures, review Python advisories, establish data/asset permissions, and add edge rate limits and stable deployment.
3. **Next independent feature:** a second reviewed historical circuit/vehicle era with a distinct layout identity, then regulation/development entities supported by primary evidence. Do not generate an all-circuit catalogue from unchecked values.
4. **Later:** batch ingestion manifests, entity alias reconciliation, persistent catalogue selection and paginated classifications/relationships, external-source revision tracking and conflict resolution. Full careers, every circuit configuration and comprehensive 1950–present coverage are not implemented.
5. **Coordinate separately:** application-wide lazy routing, global visual changes and dependency updates overlap simulator development. Branch integration may conflict with later router registration or museum changes; cherry-pick/review the isolated commit, never overwrite the active Mac tree.

The early `e7e8364` snapshot produced a roughly 1.53 MB eager JavaScript bundle. Checkpoint `dd57d25` already splits routes; this work must not claim that upstream improvement. The added gallery is independently lazy-loaded (about 10.8 kB minified JS and 4.7 kB CSS in the measured build). The existing OrbitControls/vendor chunk still exceeds Vite's 500 kB warning threshold. No simulator bundle rewrite or numerical performance score is claimed.

## Historian regression found at the checkpoint

`museum.py` switches its provider to Groq but imports the undeclared `openai` SDK and ignores the existing injectable transport. Tests and setup scripts still target OpenAI Responses API variables. The baseline source-only backend suite shows two museum transport failures in addition to seven absent-asset failures. The patch preserves Groq, uses a bounded standard-library HTTP request with an injected offline transport, aligns setup variables, validates the corpus and adds bounded mutation-safe lexical retrieval caching. Public GET continues to avoid AI calls. No paid provider request runs in verification.
