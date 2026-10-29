# Non-destructive Mac integration and validation

This is a **local review procedure**, not a merge/deployment script. Stage 2 `81bca76` is the accepted design baseline. Review the newest `work/heritage-platform` commit in PR #1; keep PR #1 draft. No command below resets, stashes, switches, rebases or cleans the active simulator checkout. Do not copy application code or private configuration out of that checkout.

## 1. Record and pin the review

Run in a new Terminal window. Keep the simulator's existing terminals running. Paths containing spaces are quoted.

```sh
FASTONE_ACTIVE='/Users/abbyleighboden/Documents/f1-strategy-lab 4'
FASTONE_REVIEW='/Users/abbyleighboden/Documents/fastone-heritage-review'
FASTONE_EVIDENCE="$(mktemp -d "${TMPDIR:-/tmp}/fastone-heritage-review.XXXXXX")"
export FASTONE_ACTIVE FASTONE_REVIEW FASTONE_EVIDENCE

git -C "$FASTONE_ACTIVE" rev-parse --show-toplevel
git -C "$FASTONE_ACTIVE" status --porcelain=v1 -uall > "$FASTONE_EVIDENCE/active-status-before.txt"
git -C "$FASTONE_ACTIVE" diff --binary > "$FASTONE_EVIDENCE/active-unstaged-before.patch"
git -C "$FASTONE_ACTIVE" diff --cached --binary > "$FASTONE_EVIDENCE/active-staged-before.patch"
git -C "$FASTONE_ACTIVE" rev-parse HEAD > "$FASTONE_EVIDENCE/active-head-before.txt"
git -C "$FASTONE_ACTIVE" symbolic-ref -q HEAD > "$FASTONE_EVIDENCE/active-branch-before.txt" || true

git -C "$FASTONE_ACTIVE" fetch --no-tags origin \
  refs/heads/work/heritage-platform:refs/remotes/origin/work/heritage-platform
FASTONE_REVIEW_SHA="$(git -C "$FASTONE_ACTIVE" rev-parse refs/remotes/origin/work/heritage-platform)"
export FASTONE_REVIEW_SHA
printf '%s\n' "$FASTONE_REVIEW_SHA" > "$FASTONE_EVIDENCE/review-commit.txt"
git -C "$FASTONE_ACTIVE" worktree add --detach "$FASTONE_REVIEW" "$FASTONE_REVIEW_SHA"
cd "$FASTONE_REVIEW"
git status --short --branch
git diff --name-only 81bca76 HEAD
```

Check the SHA against PR #1 before continuing. An existing review directory causes `worktree add` to fail safely: use a new name rather than deleting or resetting it. Fetch updates Git's remote-tracking ref/object store; it does not edit the active index, branch or files. The review is detached at the fetched branch commit so later pushes cannot silently change the version under test. No rebase/merge with uncommitted simulator work occurs. If Git LFS pointers exist in this checkout, run the repository's normal LFS retrieval **inside the review**; if unavailable, record an asset blocker, not a pass.

The evidence directory contains local diffs: keep it private; do not upload it with credentials or unrelated work. Active development may continue changing files after these snapshots. Such differences are not automatically caused by this procedure.

## 2. Stage original assets without overwriting review files

Tracked originals may already exist in the worktree. For ignored/untracked original media, the helper copies only missing binary media under `frontend/public/{models,images,intro,fonts}`. It never copies TS/TSX, JSON engineering manifests, environment files, dependencies or backend caches. It requires a separate **detached worktree of the same repository**, rejects overlapping paths and symlinks, compares SHA-256 for existing files, and refuses different existing content before writing any asset.

```sh
python3 tools/copy_review_assets.py --source "$FASTONE_ACTIVE" --review "$FASTONE_REVIEW" \
  > "$FASTONE_EVIDENCE/assets-dry-run.json"
cat "$FASTONE_EVIDENCE/assets-dry-run.json"
python3 tools/copy_review_assets.py --source "$FASTONE_ACTIVE" --review "$FASTONE_REVIEW" --apply \
  > "$FASTONE_EVIDENCE/assets-staged.json"
```

Read the dry-run first. Do not run asset generators, repacking, calibration, texture extraction or engineering-map generation to repair tests. If an asset conflicts, or tests reveal a hash/manifest mismatch, preserve both trees and record the paths and expected/actual hashes for coordinated review. Missing originals outside the allowlisted roots require explicit inventory first. The copy is not a licence grant; review-only copies do not approve distribution.

The helper uses atomic no-clobber file publication; it never replaces an existing asset. If an unexpected I/O error interrupts copying, earlier missing-file copies may remain in the review; rerun to verify them or leave the review intact. Originals stay read-only. Avoid editing source assets while they are being copied.

## 3. Isolate dependencies and record actual versions

Use the same Node and Python major/minor versions as the working Mac project where possible. The branch's TypeScript tests run under Node 24 in this environment. Do not upgrade the simulator's environment. Create a new review virtualenv; do not symlink its `node_modules`, virtualenv or cache directories to the active project.

```sh
python3 -m venv .venv-review
.venv-review/bin/python -m pip install -r backend/requirements.txt pytest httpx
npm --prefix frontend ci
git --version > "$FASTONE_EVIDENCE/git-version.txt"
node --version > "$FASTONE_EVIDENCE/node-version.txt"
.venv-review/bin/python --version > "$FASTONE_EVIDENCE/python-version.txt"
.venv-review/bin/python -m pip freeze > "$FASTONE_EVIDENCE/python-resolution.txt"
```

Python ranges currently prevent an exact reproducibility guarantee. Compare the resolved package versions with the working environment before attributing a dependency-related difference to this PR. The review environment has no API keys or copied `.env` files; leave AI disabled. `npm ci` writes only the review's `node_modules` from its lockfile; never use `npm audit fix` or an unreviewed lockfile update here.

## 4. Run each validation gate and record its actual exit code

From the review root, run commands individually. Redirect output to separate files if desired; record exit codes immediately. Do not let a pipeline through `tee` hide a failure.

```sh
.venv-review/bin/python -m pytest -q backend/tests
npm --prefix frontend test
.venv-review/bin/python tools/generate_heritage_contracts.py --check
.venv-review/bin/python tools/generate_race_contract.py --check
node tools/export_museum_knowledge.mjs --check
npm --prefix frontend run build
git diff --check
```

Expected: full suites pass with valid originals. Stage 1's historical seven-backend/two-frontend missing-asset failures are **not** accepted Mac baselines. Tests must validate GLB structure, packed bytes, engineering label counts/bounds and attribution. A genuine regression or missing asset blocks merge review. Save the command, exit code and trace; do not make fake fixtures. `tools/check_project.py` remains available but stops at the first failure and may select a pre-existing environment; individual commands above provide clearer evidence.

## 5. Launch separate loopback services

The active simulator may use 5173 and 8000/8001. Review defaults are **15173 and 18001**. Verify both are free; if occupied, select another free pair and use those ports consistently. Do not terminate the process occupying a port.

```sh
lsof -nP -iTCP:15173 -sTCP:LISTEN
lsof -nP -iTCP:18001 -sTCP:LISTEN
```

No output means no listener is found. In review Terminal A:

```sh
cd "$FASTONE_REVIEW"
env -u GROQ_API_KEY -u OPENAI_API_KEY MUSEUM_AI_ENABLED=0 RACE_ENGINEER_AI_ENABLED=0 \
  .venv-review/bin/python -m uvicorn main:app --app-dir backend \
  --host 127.0.0.1 --port 18001 --no-proxy-headers
```

In review Terminal B (set `FASTONE_REVIEW` again if this is a new shell):

```sh
FASTONE_REVIEW='/Users/abbyleighboden/Documents/fastone-heritage-review'
cd "$FASTONE_REVIEW"
env -u VITE_R2_BASE_URL FASTONE_REVIEW_API_PORT=18001 FASTONE_REVIEW_WEB_PORT=15173 \
  node frontend/node_modules/vite/bin/vite.js --config tools/heritage-review.vite.config.mjs
```

The additional config affects this review invocation only, proxies `/api` to the review backend, uses strict frontend port selection and binds loopback. Uvicorn does not use `--reload`; private backend caches are created under the review checkout. If ports change, change the backend `--port` and both review environment variables. Review-port AI POST requests may be rejected by existing local-origin guards; this is expected. Do not broaden origins or enable paid AI for this check.

In a separate browser profile/incognito window, open the loopback review address shown by Vite. Do not use your simulator tab or its localStorage. Follow [the complete browser checklist](heritage-browser-regression.md); it includes the 2024 British GP at round **12**, not the 2025 Australian GP used as a Stage 2 reference capture. No tunnel, public host, proxy to the active backend or Vite-public exposure is needed.

Before starting manual review services, the dedicated proxy configuration can be checked with:

```sh
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" node tools/check_heritage_review_config.mjs
```

This smoke test starts/stops its own review services. Run it while 15173/18001 are free; do not run it against an already-started review service or the active simulator. If ports are busy, stop only your own review terminals or supply a different pair through `FASTONE_REVIEW_API_PORT` / `FASTONE_REVIEW_WEB_PORT`. It deliberately verifies that a second frontend is refused on an occupied port.

## 6. Optional isolated browser automation

Install Playwright into a dedicated external tooling directory if needed, not the application's package manifest. Example:

```sh
FASTONE_BROWSER_TOOLS="$(mktemp -d "${TMPDIR:-/tmp}/fastone-browser-tools.XXXXXX")"
npm install --prefix "$FASTONE_BROWSER_TOOLS" playwright
node "$FASTONE_BROWSER_TOOLS/node_modules/playwright/cli.js" install chromium
PLAYWRIGHT_MODULE="$FASTONE_BROWSER_TOOLS/node_modules/playwright" \
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" node tools/check_heritage_browser.mjs
PLAYWRIGHT_MODULE="$FASTONE_BROWSER_TOOLS/node_modules/playwright" \
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" node tools/check_vehicle_library_browser.mjs
```

These runners use their own local services and browser storage; only the processes they start are stopped. The library regression intentionally injects graphics failures, then requires real WebGL recovery (software rendering is sufficient). Expected injected console errors are separate from unexplained errors. These focused scripts are not the complete race-replay, camera or full-media validation; use the manual matrix too. Generated screenshots update only the review worktree. Do not commit changed captures over the accepted design baseline without review.

## 7. Check active checkout and retain evidence

```sh
git -C "$FASTONE_ACTIVE" status --porcelain=v1 -uall > "$FASTONE_EVIDENCE/active-status-after.txt"
git -C "$FASTONE_ACTIVE" diff --binary > "$FASTONE_EVIDENCE/active-unstaged-after.patch"
git -C "$FASTONE_ACTIVE" diff --cached --binary > "$FASTONE_EVIDENCE/active-staged-after.patch"
git -C "$FASTONE_ACTIVE" rev-parse HEAD > "$FASTONE_EVIDENCE/active-head-after.txt"
git -C "$FASTONE_ACTIVE" symbolic-ref -q HEAD > "$FASTONE_EVIDENCE/active-branch-after.txt" || true
diff -u "$FASTONE_EVIDENCE/active-head-before.txt" "$FASTONE_EVIDENCE/active-head-after.txt"
diff -u "$FASTONE_EVIDENCE/active-branch-before.txt" "$FASTONE_EVIDENCE/active-branch-after.txt"
diff -u "$FASTONE_EVIDENCE/active-status-before.txt" "$FASTONE_EVIDENCE/active-status-after.txt"
cmp "$FASTONE_EVIDENCE/active-unstaged-before.patch" "$FASTONE_EVIDENCE/active-unstaged-after.patch"
cmp "$FASTONE_EVIDENCE/active-staged-before.patch" "$FASTONE_EVIDENCE/active-staged-after.patch"
```

If nobody changes the simulator during review, these comparisons should match. Status records do not hash ignored/untracked contents; the asset helper's hashes prove what is copied, not every file on the Mac. Concurrent simulator edits naturally change evidence; investigate without resetting either checkout. Keep the worktree/evidence for review. Stop only the two review processes with Ctrl-C in their own terminals. No worktree removal, cleanup, merge, deploy or branch switch is included.
