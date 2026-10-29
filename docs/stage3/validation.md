# Stage 3 — executed checks and remaining gates

29 October 2026. Results are from the source-only workspace, not the user's Mac. Dependencies/browser tooling are installed only in temporary tooling directories; application dependency manifests stay unchanged.

## Passing focused gates

| Gate | Executed result |
|---|---|
| Existing heritage/museum + review helper + new Stage 3 backend | **78 passed** (21 new Stage 3 checks); one existing Starlette/httpx deprecation warning |
| Relevant heritage frontend suite | **12 passed** (four new Stage 3 tests) |
| Real API + Chromium Stage 3 integration | **10 check groups passed** |
| TypeScript + Vite production build | **Passed**; existing vendor chunk warning remains |
| Generated heritage contract drift / whitespace | **Passed** |

Backend command:

```sh
python -m pytest -q backend/tests/test_heritage_stage3.py backend/tests/test_heritage.py \
  backend/tests/test_heritage_demo.py backend/tests/test_museum.py \
  backend/tests/test_museum_resilience.py backend/tests/test_review_assets.py
```

Frontend command from `frontend`:

```sh
node --test tests/heritageStage3.test.mjs tests/heritageCatalogue.test.mjs tests/heritage.test.mjs
npm run build
```

Browser command from repository root, using external Playwright/Chromium and a backend-capable Python environment:

```sh
PYTHON=/absolute/path/to/python \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
BROWSER_EXECUTABLE_PATH=/absolute/path/to/chromium \
node tools/check_heritage_stage3_browser.mjs
```

Groups cover: original default collection; Cooper selection/runtime contracts; keyboard/preset physics and assumptions; 1440/834/390/320px overflow; car→engine evidence and no supplied model; selected Aintree result/fractional points; Silverstone event-layout switching without a fabricated outline; engine filters/empty/clear; API error/retry; return/reset with no page JavaScript errors. Browser sessions and loopback services are isolated, and only owned processes are stopped. Component screenshots hide the sticky shell header solely during capture.

## Full-suite results and controlled baseline

The starting source snapshot for remote `da2f414` is checked out in a separate detached temporary worktree. The same Python environment runs both versions; a read-only symlink to installed frontend dependencies is used only by this disposable baseline's Node tests. No active simulator source is used or switched.

| Suite | Starting checkpoint in this runtime | Stage 3 in the same runtime |
|---|---|---|
| Python full `backend/tests` | **108 passed / 23 reported failures** | **129 passed / 23 reported failures** |
| Frontend full tests | **74 passed / 2 failed** | **78 passed / 2 failed** |

All 23 Python failure identities match after normalising worktree prefixes. This runtime reports 18 missing-asset subtest failures explicitly, plus five outer failures, across the same seven affected asset/engineering test methods. It must not be compared numerically to the older runtime's “seven failures” without explaining subtest reporting. Missing GLBs, packed binaries and engineering `.bin` labels are the cause. The frontend failures remain missing vehicle thumbnail bytes and packed GLB chunks. No fake assets are created to pass these tests.

The full run initially catches the older ingestion test's SQLite `user_version=1` assertion. It is updated to **2** for fresh projections containing the exhibit table; original seed count, foreign-key validation, byte-preserving no-overwrite refusal and new exhibit persistence are retained. After that intended format assertion change, the full failure identity set matches the starting checkpoint. No new simulator failure is hidden or waived.

## Not established here

- Full Mac original-asset correctness, Safari/physical-mobile GPU behaviour or actual web-font fidelity.
- Source/media commercial redistribution permission; all 14 source reuse states remain unreviewed.
- Measured historical circuit geometry, configuration lifespan or exact period vehicle mass/dimensions.
- Any historic model, approved reconstruction, actual GLB/assembly-byte verification or 3D rendering implementation.
- Production authentication/AI quotas, dependency advisory remediation, deployment or merge approval.

The previous integration-readiness public-AI, dependency and rights gates remain. This stage changes none of those runtime systems. Visual evidence and its limits are in [visual review](visual-review.md); source decisions are in [research review](source-review.md).
