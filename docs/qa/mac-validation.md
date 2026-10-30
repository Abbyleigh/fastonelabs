# Mac integration validation — isolated and reversible

Run each numbered step separately in a **new Terminal**, reading expected outputs before proceeding. No command switches, resets, rebases, cherry-picks, merges, stashes or cleans the active simulator. No command changes Cloudflare/Render or stops an existing server. Do not run `launch_lab.py`, asset-generation tools or `npm audit fix` in either tree for this review. Retain worktree/evidence for review; rollback means stopping only review processes and closing its browser.

## 1. Record the active checkout privately

```sh
FASTONE_ACTIVE='/Users/abbyleighboden/Documents/f1-strategy-lab 4'
FASTONE_REVIEW='/Users/abbyleighboden/Documents/fastone-heritage-qa-review'
FASTONE_EVIDENCE="$(mktemp -d "${TMPDIR:-/tmp}/fastone-heritage-qa.XXXXXX")"
export FASTONE_ACTIVE FASTONE_REVIEW FASTONE_EVIDENCE
git -C "$FASTONE_ACTIVE" rev-parse --show-toplevel
git -C "$FASTONE_ACTIVE" branch --show-current
git -C "$FASTONE_ACTIVE" status --porcelain=v1 -uall > "$FASTONE_EVIDENCE/status-before.txt"
git -C "$FASTONE_ACTIVE" diff --binary > "$FASTONE_EVIDENCE/unstaged-before.patch"
git -C "$FASTONE_ACTIVE" diff --cached --binary > "$FASTONE_EVIDENCE/staged-before.patch"
git -C "$FASTONE_ACTIVE" rev-parse HEAD > "$FASTONE_EVIDENCE/head-before.txt"
git -C "$FASTONE_ACTIVE" symbolic-ref -q HEAD > "$FASTONE_EVIDENCE/branch-before.txt"
lsof -nP -iTCP -sTCP:LISTEN > "$FASTONE_EVIDENCE/listeners-before.txt"
```

Expected: original path and `feat/stage9d-replay-smoothing` (if the owner has not intentionally changed it). If different, stop and establish the intended active checkout; never switch it to satisfy this guide. Evidence may contain private changes; do not upload it wholesale. Status/diffs do not capture ignored or untracked file contents; leave those files untouched. Save uncommitted work normally in the owning session if desired; this procedure never stashes it. Running servers remain running.

## 2. Fetch QA and pin a detached sibling worktree

```sh
git -C "$FASTONE_ACTIVE" fetch --no-tags origin \
  refs/heads/work/heritage-integration-qa:refs/remotes/origin/work/heritage-integration-qa
FASTONE_QA_SHA="$(git -C "$FASTONE_ACTIVE" rev-parse refs/remotes/origin/work/heritage-integration-qa)"
export FASTONE_QA_SHA
printf '%s\n' "$FASTONE_QA_SHA"
git -C "$FASTONE_ACTIVE" show -s --format='%H%n%P%n%s' "$FASTONE_QA_SHA"
```

Expected: compare displayed full SHA with the **separate draft QA PR** head before continuing. Its first parent is Stage 3 `433f33c27fcadb561dea1cdd5d041d82a076fc95` for the initial QA commit. If the remote head differs, review that change first. Fetch changes only shared objects/remote tracking; it does not alter active files/index/branch or server configuration.

```sh
printf '%s\n' "$FASTONE_QA_SHA" > "$FASTONE_EVIDENCE/qa-commit.txt"
git -C "$FASTONE_ACTIVE" worktree add --detach "$FASTONE_REVIEW" "$FASTONE_QA_SHA"
git -C "$FASTONE_REVIEW" status --short --branch
cd "$FASTONE_REVIEW"
```

Expected: detached HEAD, clean tracked files. If review directory already exists, stop and choose another sibling name; never delete/reset it. Any LFS retrieval must run only in the review worktree through the normal owner-approved mechanism. Unavailable LFS/original bytes are blockers, not invitations to create substitute files.

## 3. Inspect conflicts without applying code

```sh
git -C "$FASTONE_REVIEW" diff --name-status da2f41428bf251ed2886ec33f19474bbe514237b "$FASTONE_QA_SHA" \
  > "$FASTONE_EVIDENCE/heritage-stage3-qa-files.txt"
git -C "$FASTONE_ACTIVE" diff --name-status > "$FASTONE_EVIDENCE/simulator-unstaged-files.txt"
git -C "$FASTONE_ACTIVE" diff --cached --name-status > "$FASTONE_EVIDENCE/simulator-staged-files.txt"
git -C "$FASTONE_ACTIVE" ls-files --others --exclude-standard > "$FASTONE_EVIDENCE/simulator-untracked-files.txt"
git -C "$FASTONE_REVIEW" diff --stat HEAD "$(git -C "$FASTONE_ACTIVE" rev-parse HEAD)" \
  > "$FASTONE_EVIDENCE/committed-tree-comparison.txt"
cat "$FASTONE_EVIDENCE/heritage-stage3-qa-files.txt"
cat "$FASTONE_EVIDENCE/simulator-unstaged-files.txt"
cat "$FASTONE_EVIDENCE/simulator-staged-files.txt"
```

Expected: review-only comparisons; no merge result. Compare overlapping file names and inspect hunks, especially `main.tsx`, `backend/main.py`, `demo/server.py`, Vite/proxy configuration. Compare PR #1's diff separately in GitHub: it is deliberately **not changed** by QA. The committed-tree comparison is not a safe merge simulation of uncommitted work. Escalate semantic overlap to the simulator owner. Preserve all proxy configuration and untracked configuration files; never copy them into review.

## 4. Inventory/copy originals without overwriting

```sh
python3 tools/copy_review_assets.py --source "$FASTONE_ACTIVE" --review "$FASTONE_REVIEW" \
  > "$FASTONE_EVIDENCE/assets-dry-run.json"
cat "$FASTONE_EVIDENCE/assets-dry-run.json"
```

Expected: hashes, existing-equal and missing-file candidates only under binary-media allowlist. Read the complete output. Conflict, symlink or mismatched hash means **stop**. Source JSON/code/config/dependencies/caches must not be copied.

```sh
python3 tools/copy_review_assets.py --source "$FASTONE_ACTIVE" --review "$FASTONE_REVIEW" --apply \
  > "$FASTONE_EVIDENCE/assets-copied.json"
cat "$FASTONE_EVIDENCE/assets-copied.json"
```

Expected: only previously missing binary files published with no-clobber checks. Test all failures in [matrix](failure-matrix.md). A zero-copy report does not prove originals exist. Missing original/manifest mismatch: stop that test case and report file, expected/actual hash and exception. Do not repack or regenerate labels, thumbnails, models or geometry. An interrupted copy may leave completed copies in the review; originals are never overwritten. Avoid concurrent asset edits during copy.

## 5. Install separate dependencies

```sh
cd "$FASTONE_REVIEW"
python3 --version
node --version
python3 -m venv .venv-review
.venv-review/bin/python -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt
npm --prefix frontend ci
.venv-review/bin/python -m pip freeze > "$FASTONE_EVIDENCE/python-resolution.txt"
node --version > "$FASTONE_EVIDENCE/node-version.txt"
```

Expected: Python environment under review and a separate review `frontend/node_modules`; use supported Node 24 for direct TS Node tests (Work used 24.22.1/Python 3.12.14). If different, record and diagnose environment differences before interpreting failures. No symlinks to simulator dependencies. Python requirements have ranges, so the resolution is not guaranteed identical; save it. Never copy `.env` or provider keys. Review flags are always disabled even if the parent shell has keys. Security audit remediation is a separate owner-coordinated dependency change.

## 6. Run each gate, recording exit codes immediately

```sh
.venv-review/bin/python -m pytest -q --junitxml="$FASTONE_EVIDENCE/backend.xml" \
  > "$FASTONE_EVIDENCE/backend.log" 2>&1
printf 'backend exit: %s\n' "$?"
```

```sh
npm --prefix frontend test > "$FASTONE_EVIDENCE/frontend.log" 2>&1
printf 'frontend exit: %s\n' "$?"
```

```sh
.venv-review/bin/python tools/generate_heritage_contracts.py --check
.venv-review/bin/python tools/generate_race_contract.py --check
node tools/export_museum_knowledge.mjs --check
npm --prefix frontend run build
git diff --check
```

Expected: **all exit 0 with genuine matching originals**; examine each command's output. Work environment results were backend 129 passes / 23 failure reports and frontend 79 passes / 2 failures after one QA test, all missing bytes; those are not acceptable Mac passes. Pytest 8 may report seven parent methods instead of 23 subcase/outer reports; inspect actual failure identities. Do not weaken tests. Check the full logs for failures hidden behind a first missing asset. Do not use a `tee` pipeline without capturing the command's own status.

## 7. Run isolated automated regressions before manual servers

```sh
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" node tools/check_heritage_review_config.mjs
```

Expected: 3 groups passed. This uses 15173/18001 and fails on collisions; if occupied, select unused ports with both `FASTONE_REVIEW_WEB_PORT` / `FASTONE_REVIEW_API_PORT`. Do not kill the existing listener.

```sh
FASTONE_BROWSER_TOOLS="$(mktemp -d "${TMPDIR:-/tmp}/fastone-qa-browser.XXXXXX")"
export FASTONE_BROWSER_TOOLS
npm install --prefix "$FASTONE_BROWSER_TOOLS" playwright
node "$FASTONE_BROWSER_TOOLS/node_modules/playwright/cli.js" install chromium
```

```sh
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" \
PLAYWRIGHT_MODULE="$FASTONE_BROWSER_TOOLS/node_modules/playwright" \
FASTONE_REVIEW_SCREENSHOTS="$FASTONE_EVIDENCE/stage2" node tools/check_heritage_browser.mjs
```

```sh
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" \
PLAYWRIGHT_MODULE="$FASTONE_BROWSER_TOOLS/node_modules/playwright" \
FASTONE_REVIEW_SCREENSHOTS="$FASTONE_EVIDENCE/stage3" node tools/check_heritage_stage3_browser.mjs
```

```sh
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" \
PLAYWRIGHT_MODULE="$FASTONE_BROWSER_TOOLS/node_modules/playwright" node tools/check_vehicle_library_browser.mjs
```

Expected: 13 original museum, 10 Stage 3, 7 library groups. Each starts/stops only its own ephemeral loopback services, isolated browser storage and explicitly disabled AI environment. Screenshots go to evidence, preserving accepted tracked captures. Browser installation is external tooling only. These tests do not validate all original models, replay correctness or Safari. Run [profile](performance.md) if needed; software-GL numbers are not Mac-native GPU budgets.

## 8. Launch manual review services on unused ports

```sh
lsof -nP -iTCP:15173 -sTCP:LISTEN
lsof -nP -iTCP:18001 -sTCP:LISTEN
```

Expected: no output (lsof may exit 1 for no match). Any listener: choose another free pair, never terminate it. In **review Terminal A**:

```sh
FASTONE_REVIEW='/Users/abbyleighboden/Documents/fastone-heritage-qa-review'
cd "$FASTONE_REVIEW"
env -u GROQ_API_KEY -u OPENAI_API_KEY MUSEUM_AI_ENABLED=0 RACE_ENGINEER_AI_ENABLED=0 \
  .venv-review/bin/python -m uvicorn main:app --app-dir backend \
  --host 127.0.0.1 --port 18001 --no-proxy-headers
```

Expected: listening only on 127.0.0.1:18001. In **review Terminal B**:

```sh
FASTONE_REVIEW='/Users/abbyleighboden/Documents/fastone-heritage-qa-review'
cd "$FASTONE_REVIEW"
env -u VITE_R2_BASE_URL FASTONE_REVIEW_API_PORT=18001 FASTONE_REVIEW_WEB_PORT=15173 \
  node frontend/node_modules/vite/bin/vite.js --config tools/heritage-review.vite.config.mjs
```

Expected: 127.0.0.1:15173, strict port, review API only. If ports changed, update all three occurrences consistently. Do not start Cloudflare/tunnel, alter shared Vite config or proxy to the simulator backend. Fresh terminals must re-enter the actual chosen review path if different.

## 9. Manual browser and media sign-off

Use a separate browser profile/incognito at `http://127.0.0.1:15173`. Follow **every row** of [complete regression checklist](../heritage-browser-regression.md), plus Cooper chapter/slider keyboard/engine links/4.5 points/Silverstone 1950–60 selector/return reset. Record PASS/FAIL/BLOCKED and evidence, never assume unattended automation covers the manual matrix.

Required: homepage original cinematic assets, Race Centre, `#replay?year=2024&round=12&name=British+Grand+Prix`, deterministic seeks and minute boundaries, library all original models and comparison, engineering exhibits, historian curated GET, desktop1440/tablet834/mobile390/narrow320, zoom200%, keyboard/reduced motion and Safari. Preserve active simulator browser/localStorage. Provider failure is BLOCKED; no fake telemetry. Keep both AI endpoints disabled. Record actual font loading, console/network, model hashes/permissions, decode/parse/memory/context metrics. Stop any missing-original case and report it; do not change replay/calibration to make a screenshot look right.

## 10. Verify preservation and rollback by leaving review isolated

Stop only review Terminals A/B with **Ctrl-C in those terminals**. Close only review browser windows. Do not run process-wide kill commands or remove worktrees/files.

In the original evidence Terminal:

```sh
git -C "$FASTONE_ACTIVE" status --porcelain=v1 -uall > "$FASTONE_EVIDENCE/status-after.txt"
git -C "$FASTONE_ACTIVE" diff --binary > "$FASTONE_EVIDENCE/unstaged-after.patch"
git -C "$FASTONE_ACTIVE" diff --cached --binary > "$FASTONE_EVIDENCE/staged-after.patch"
git -C "$FASTONE_ACTIVE" rev-parse HEAD > "$FASTONE_EVIDENCE/head-after.txt"
git -C "$FASTONE_ACTIVE" symbolic-ref -q HEAD > "$FASTONE_EVIDENCE/branch-after.txt"
lsof -nP -iTCP -sTCP:LISTEN > "$FASTONE_EVIDENCE/listeners-after.txt"
cmp "$FASTONE_EVIDENCE/head-before.txt" "$FASTONE_EVIDENCE/head-after.txt"
cmp "$FASTONE_EVIDENCE/branch-before.txt" "$FASTONE_EVIDENCE/branch-after.txt"
cmp "$FASTONE_EVIDENCE/status-before.txt" "$FASTONE_EVIDENCE/status-after.txt"
cmp "$FASTONE_EVIDENCE/unstaged-before.patch" "$FASTONE_EVIDENCE/unstaged-after.patch"
cmp "$FASTONE_EVIDENCE/staged-before.patch" "$FASTONE_EVIDENCE/staged-after.patch"
```

Expected: no output/exit0 for unchanged active work, original servers still running; compare listener lists manually because unrelated processes may change. If the owner worked concurrently, differences are expected evidence to inspect, never justification to reset. Ignored/untracked contents were never copied except explicit read-only binary inputs; this snapshot is not a full disk-integrity proof. Leave detached worktree/dependencies/evidence intact for review. Nothing has been integrated into the active branch, so rollback requires no Git undo, cleanup or server restart. No merge/deploy is authorised by completing this checklist.
