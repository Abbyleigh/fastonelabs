# Executed validation — 29 October 2026

Checkpoint: `dd57d25`. Environment: Linux, Python 3.12.14, Node 24.22.1, Vite 7.3.7. Source-only connector checkout; existing large binary assets are not downloaded. Python packages resolve within the repository's ranges; the Mac environment is not tested.

| Check | Baseline at dd57d25 | Heritage branch result |
|---|---|---|
| Full backend pytest | 54 pass, 9 fail | **101 pass, 7 fail** |
| Full frontend Node suite | 71 pass, 2 fail | **74 pass, 2 fail** |
| Focused heritage + museum backend suite | Not present in full at baseline | **52 pass** |
| New frontend catalogue contract tests | Not present | **3 pass** |
| TypeScript + Vite production build | Early source baseline builds; checkpoint changed upstream bundle splitting | **Pass**, existing vendor-size warning remains |
| Generated Pydantic → TypeScript contract check | Not present | **Pass** |
| Browser integration | Not present | **10 checks pass**, desktop and 390px mobile |
| Offline SQLite import | Not present | **Pass**: 10 entities, 7 classifications; no overwrite |
| Frontend npm audit | Same unchanged lockfile | **0 advisories** at audit time |
| Python requirements audit | Unchanged shared requirements | **3 entries in msgpack**, including duplicate advisory identity; see production-readiness |
| Whitespace validation | — | `git diff --check` passes |

## Remaining full-suite failures

All seven remaining backend failures are in `test_engineering_parts.py` (3) and `test_model_assets.py` (4). They require original model GLBs, engineering mapping binaries or packed-model parts absent from this source-only checkout. The two frontend failures require vehicle photographs and packed-model binaries (`fanExperience.test.mjs` and `packedModels.test.mjs`). No missing asset is replaced or changed. These same asset failures reproduce from a separate untouched `dd57d25` source snapshot with the same installed frontend dependencies.

The two additional baseline museum failures come from checkpoint provider/test drift. The branch repairs the Groq implementation and transport tests; they now pass. Model/photograph failures are not suppressed, skipped or declared resolved. Full-asset testing and simulator browser regression are still required before release. The definition of done for the entire project is not met by this pilot alone.

## Focused backend coverage

Input bounds, literal SQL search, paging/filtering, race/qualifying separation, partial coverage, unknown records, missing specifications, source rights metadata, representation-specific ETags/304, invalid source/entity/link/classification batches, finite numbers, foreign keys, no-clobber ingestion, shared drives/ties, read-only storage, concurrent reads, existing health/race API route presence, OpenAPI and demo allowlist behaviour.

Museum coverage includes corpus version/references/URL/record validation, immutable bounded caching, correct Groq request transport and model selection, public GET isolation, unknown evidence IDs, incomplete/oversized/malformed provider responses, generic fallback without exception leakage, local request restrictions and a streamed 2 KiB body limit. Provider calls are mocked. No live AI request, upstream scraping benchmark or paid service test runs.

## Browser execution

`tools/check_heritage_browser.mjs` starts a real local FastAPI process and Vite instance on temporary ports, then uses headless Chromium. Checks: real catalogue rendering; pagination; vehicle values/citations/missing data; empty results; partial race/qualifying rows; 390px layout; HTTP failure/retry; loading and stale-search cancellation; keyboard filter navigation; no JavaScript page errors.

Visual inspection catches and fixes inheritance of generic flex header rules in the nested mobile gallery. The scoped fix leaves global styling unchanged. Screenshots isolate the component by hiding the sticky shell header during capture. They show no added third-party images or reconstructed models.

The browser runtime is installed in temporary environment storage, not added to application dependencies. The ordinary Playwright download fails in this environment; an available npm-packaged Chromium is extracted for execution. This environment workaround does not alter project source or production browser requirements.

## Reproduction

See `heritage-integration.md` for commands. The full suites deliberately return non-zero here because of absent original assets. Do not replace these results with a blanket “all tests pass” statement.

## Stage 2 executed validation (2026-10-29)

- `python -m pytest -q tests/test_heritage.py tests/test_heritage_demo.py tests/test_museum.py tests/test_museum_resilience.py` (backend): **52 passed**, one existing Starlette/httpx deprecation warning.
- `node --test tests/heritageCatalogue.test.mjs tests/heritage.test.mjs` (frontend): **8 passed**.
- `npm run build`: **passed**; existing 500kB vendor chunk warning remains.
- `BROWSER_EXECUTABLE_PATH=/tmp/fastone-chromium node tools/check_heritage_browser.mjs`: **13 check groups passed**, real local API. New groups exercise 1440/834/390px responsive columns and document overflow, circuit evidence expand/collapse with no fabricated map, existing Alfetta exhibit navigation and reduced-motion transitions. Original ten groups remain.
- `git diff --check`: **passed**.

The full asset-dependent suites are not rerun for these frontend-only changes. The earlier Stage 1 full-suite missing-asset results remain historical evidence, not a new Stage 2 execution claim. Google Fonts fail to load in this environment; visible typography uses fallbacks. The library reference route shows an existing error boundary and is explicitly recorded as blocked. The cloud browser cannot access the workspace loopback; local Chromium executes the actual screenshot checks.

Responsive and before/after screenshots: `docs/previews/stage2/`. See `heritage-stage2-design.md` for captured steps, decisions and evidence limitations. Component screenshots hide the sticky header to prevent screenshot-only occlusion; `museum-context.png` retains the full shell. Source snapshots are captured without invented car images or track geometry.
