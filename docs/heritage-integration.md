# Heritage integration and verification

Start from checkpoint `dd57d25`, review the private `work/heritage-platform` branch and its pull request. Do not copy the whole reconstructed source snapshot over the active Mac project. The final commit changes only the files documented in `work-progress.md` and preserves upstream binary assets in Git.

## Isolated local review

From an existing clone, fetch the branch and create a separate checkout. These commands avoid switching or resetting the active simulator working tree:

```sh
git fetch origin work/heritage-platform
git worktree add --detach ../fastone-heritage-review origin/work/heritage-platform
```

Run the reviewed checkout's backend on the existing development convention, port **8001**. Its Vite config already proxies `/api` there. If those ports belong to the active simulator session, do not kill it; use the isolated browser check below, which starts its own loopback services on temporary ports. No new environment variable or frontend dependency is required for the catalogue.

Museum entry: `#museum?section=origins`. The research gallery appears before the existing origin exhibits, loading its own JS/CSS chunk. Existing museum car exhibits, historian, timeline, vehicle models and race APIs remain separate.

## Data and API

The packaged pilot is `backend/heritage/data/silverstone-1950.json`. The backend creates its process-local read-only SQLite view on the first catalogue request. After a reviewed seed update, restart the backend. No external network request is needed to use the pilot.

```sh
PYTHONPATH=backend python -m heritage.ingest backend/heritage/data/silverstone-1950.json /tmp/fastone-reviewed-catalog.sqlite
python tools/generate_heritage_contracts.py --check
python -m pytest -q backend/tests/test_heritage.py backend/tests/test_heritage_demo.py backend/tests/test_museum.py backend/tests/test_museum_resilience.py
```

Choose a new output filename for each ingestion. The importer intentionally refuses an existing SQLite path. Inspect `entities`, `claims`, `claim_sources`, `links` and `classifications` with any SQLite client. The standalone DB is a reproducible inspection artifact; the API does not yet switch its runtime source to that file.

Endpoints:

```text
GET /api/heritage/entities?kind=vehicle&year=1950&limit=6
GET /api/heritage/entities/alfa-158
```

The local demo proxy supports these two bounded GET route forms. It does not expose the importer or AI POST.

## Frontend and browser checks

```sh
cd frontend
npm ci
npm run build
npm test
```

Node 24 is used for the executed TypeScript tests. Complete asset tests require the original repository's model binaries and licensed photographs. Build artifacts are not committed.

`tools/check_heritage_browser.mjs` requires an externally installed Playwright and Chromium; it introduces no application dependency. Provide `PLAYWRIGHT_MODULE` if the module is outside normal Node resolution and `BROWSER_EXECUTABLE_PATH` if using an existing Chromium executable. `PYTHON` can select the backend virtualenv. Example from the repository root:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright BROWSER_EXECUTABLE_PATH=/absolute/path/to/chromium PYTHON=/absolute/path/to/python node tools/check_heritage_browser.mjs
```

The script starts temporary loopback backend/Vite instances, tests real API rendering and intercepted failure/loading cases, then stops only its own processes. It saves desktop, vehicle and 390px mobile gallery previews under `docs/previews`. Preview capture hides the sticky site header to show the isolated component; it does not change product styling. No automated browser traversal of simulator screens is performed.

## Existing optional historian

The configured provider at `dd57d25` is Groq. See `MUSEUM_AI_SETUP.md`. Public historical lookup never calls the provider. All provider tests use injected mock transports; no key, billing permission or live provider connectivity is assumed. The old editorial corpus remains separate from the new reviewed pilot.

## Review boundaries

No simulator, race-state/replay animation, circuit geometry, camera, vehicle-model, dependency, top-level navigation or global-style change is included. Review the small existing-file integrations for concurrent edits. Merge only after the full-asset regression checks and rights review pass; no production deployment follows automatically from this PR.
