# Stage 3 — connected Cooper engineering history

## Scope and branch lineage

Remote branch `work/heritage-stage3-cooper` starts **exactly at `da2f41428bf251ed2886ec33f19474bbe514237b`**. Development stays there. The local workspace retains a source-snapshot Git history: its starting commit `696818a` represents that remote checkpoint; those local/remote commit IDs are not interchangeable. The new draft PR is stacked against `work/heritage-platform` so its diff contains Stage 3 only. The earlier draft integration review is not edited, merged or deployed.

No simulator, replay, camera, telemetry, calibration, main application navigation, shared/global CSS, dependency manifest, existing models or accepted Stage 2 stylesheet changes. All presentation additions are under `frontend/src/heritage/` and a new scoped `stage3.css`.

## Implemented behaviour

The original 1950 collection is still the default at `/api/heritage/entities`. A museum-local chapter control explicitly selects the Cooper collection; it resets query/type/year/paging/selection to avoid stale filters. The original title, cards and visual tokens remain intact, with a new chapter selector above them.

A second batch adds 19 sourced entities and 25 evidence-linked relationships: T51/T53, selected engine configurations, constructor/engine identity, Brabham/McLaren, three selected races, two seasons, a transition milestone, venues and four dated layout identities. Eight partial classification rows preserve fractional points and counted championship totals. This is a coherent second slice, not complete seasons or every Cooper derivative. See [research review](source-review.md).

### Query and storage path

1. Frontend requests `entities?...&collection=cooper-1959-1960`, or a detail path with the same bounded collection parameter.
2. FastAPI accepts only two enumerated collection IDs; no caller-supplied file path/URL is accepted. The two named stores are cached with a fixed two-entry LRU bound.
3. The packaged batch validates in Pydantic, then builds a read-only, process-local SQLite projection. Offline ingestion applies the same validation and atomic no-clobber publication to a new output file.
4. Bound SQL filters/links/results remain. ETags incorporate dataset digest and representation URL, so the old and new collections cannot cross-validate.
5. A detail response now optionally includes `layouts` and `exhibit`; generated TypeScript contracts and runtime validators cover the additive fields. Default original data remains available to old requests without new query parameters.

Chapter selection is museum component state, not a new global route or persistent deep link; reloading returns to the original chapter. No public request scrapes a publisher or invokes AI. The historian code and provider choices remain unchanged.

### Interactive engineering lesson

`staticBalance()` uses three assumed masses in a one-dimensional static equilibrium model. With axle positions 0 and 1, rear reaction fraction is `sum(m*x)/sum(m)`; front is its complement. The 400 kg chassis at 0.5 and 75 kg driver at 0.4 are assumptions, as are adjustable engine mass/position. Tests independently check moments, conservation, movement response and invalid inputs.

`EngineeringHistory.tsx` uses an original SVG free-body diagram, presets, keyboard-accessible ranges, live numerical outputs and an expandable assumptions/reference explanation. The narrative links directly to the milestone and T51/T53 records. It explicitly excludes real Cooper measurements, chassis geometry, dynamics, aero, grip and lap-time inference. Existing engineering sections are linked, not rewritten.

### Circuit evolution without invented maps

`Store.layouts()` resolves a venue from `layout-of` or a circuit ID and returns its first 100 linked layout identities in chronological order. Detail supplies their source records. The museum viewer adds a labelled selector and keeps dated layout evidence inside its own study; the surrounding record remains unchanged, as the UI explains. Silverstone 1950 and 1960 can be compared. Their dates prove reviewed event use, **not** surveyed shape differences, layout lifespans or coordinates. No modern circuit or simulator data is imported.

### Future historic exhibits

Two pending plans are stored and displayed. New backend/frontend asset metadata contracts enforce permission/fidelity/identity gates and preserve a metadata-only bridge to existing library IDs by exact path/hash. No meshes, renderer or automatic downloads are added. See [exhibit architecture](exhibit-architecture.md).

## Changed files and purpose

| File | Purpose |
|---|---|
| `backend/heritage/base.py` | Shared strict metadata/identifier primitives |
| `backend/heritage/exhibits.py` | Future GLB/exhibit contracts and release-state validation |
| `backend/heritage/models.py` | Engine kind, typed relationships and cross-referenced exhibit plans |
| `backend/heritage/data/cooper-1959-1960.json` | Manually reviewed second research slice |
| `backend/heritage/migrations/001_catalog.sql` | Add engine to fresh projection entity check |
| `backend/heritage/migrations/002_historic_exhibits.sql` | Fresh projection exhibit table and SQLite format marker |
| `backend/heritage/store.py` | Explicit packaged collections, exhibit projection and same-venue layouts |
| `backend/heritage/router.py` | Bounded collection selection and additive detail contracts |
| `backend/tests/test_heritage.py` | Update the fresh SQLite format assertion from 1 to 2; preserve original count/atomicity/integrity checks |
| `backend/tests/test_heritage_stage3.py` | 21 data, API, ingestion, ETag and asset-gate checks |
| `frontend/src/heritage/contracts.ts` | Generated contracts |
| `frontend/src/heritage/api.ts` | Engine/layout/exhibit runtime response validation |
| `frontend/src/heritage/exhibitContracts.ts` | Incoming asset permission checks and library identity bridge |
| `frontend/src/heritage/engineeringModel.ts` | Pure, bounded static equilibrium calculation |
| `frontend/src/heritage/EngineeringHistory.tsx` | Interactive, sourced teaching experience |
| `frontend/src/heritage/HeritageCatalogue.tsx` | Museum-local chapter selection, linked lesson and pending exhibits |
| `frontend/src/heritage/HistoricalCircuit.tsx` | Multiple dated event-layout study selection |
| `frontend/src/heritage/stage3.css` | Additive scoped presentation only |
| `frontend/tests/heritageStage3.test.mjs` | Four physics/response/asset-identity regression tests |
| `tools/check_heritage_stage3_browser.mjs` | Real API/browser interactions and responsive screenshots |
| `docs/stage3/*`, `docs/work-progress.md` | Research, rights, architecture, visual/technical review and executed evidence |

## Integration risks and limits

This is a stacked draft, not a merge of the integration-readiness branch into the active simulator. Future concurrent edits to museum catalogue/API/contract files require coordination; renderer ownership is untouched. The existing local demo's bounded heritage GET forms support collection queries without expanding its route allowlist.

External fonts use fallbacks in this environment and original binary assets remain unavailable. Full Mac rendering/media integrity and source-rights decisions are still required. No geometry becomes verified and no pending model becomes approved because the UI is complete. No total project-hours figure is inferred; commits, check dates and executed results provide milestones for the later learning report.

## Review and reproduction

Fetch the Stage 3 branch and use another detached review worktree, never the active simulator checkout:

```sh
git fetch --no-tags origin refs/heads/work/heritage-stage3-cooper:refs/remotes/origin/work/heritage-stage3-cooper
git worktree add --detach ../fastone-heritage-stage3-review origin/work/heritage-stage3-cooper
```

Run these from the existing clone; a pre-existing destination causes safe refusal. Apply the existing [Mac safety/asset procedure](../heritage-mac-validation.md) **to this Stage 3 worktree**, not its older default branch name. Record the actual reviewed commit; retain separate dependencies, private evidence and loopback ports. The existing original-binary copy helper still refuses conflicts and overwrites; no asset generators run.

Then use the commands in [executed validation](validation.md). The default API remains the 1950 chapter. New requests include:

```text
GET /api/heritage/entities?collection=cooper-1959-1960&kind=engine
GET /api/heritage/entities/cooper-t51?collection=cooper-1959-1960
GET /api/heritage/entities/silverstone?collection=cooper-1959-1960
```

For standalone SQLite inspection, choose a new output path and use the existing importer with `backend/heritage/data/cooper-1959-1960.json`. Existing files are never upgraded or overwritten. Do not merge the stacked PR before its integration base is reviewed; do not enable AI/public hosting to test this collection.
