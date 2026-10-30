# Heritage integration QA — readiness scorecard

**Decision: ready for an isolated Mac validation; blocked for integration/merge sign-off and public release. Do not begin Stage 4.** Measurements/audits: 29 October 2026; final QA review: 30 October 2026. This is a source-snapshot assessment, not an examination of the original Mac or running Cloudflare/Render service. No merge, deployment, public publishing or simulator modification.

| Area | Status | Evidence / remaining gate |
|---|---|---|
| Heritage data/API/SQLite/contracts | PASS in Work | 129 backend passes overall; original/Cooper focused gates and contract generators pass. Bounded read-only projections and no-clobber ingest retained. |
| Full original asset integrity | BLOCKED | **23 backend reports plus two frontend failures**, every failure investigated; matching baseline is not a waiver. Original Mac bytes required. |
| Heritage desktop/mobile interactions | PASS in tested Chromium scope | 13 original museum + 10 Stage 3 groups, 1440/834/390/320px, reduced motion, retry/evidence/navigation. Actual fonts, Safari and manual accessibility pending. |
| Library failure containment | PASS in tested scope | 7 groups including forced context failure, real procedural WebGL recovery, independent comparison failure and personal garage. Heavy assets/context-loss/GPU limits unverified. |
| Simulator compatibility | BLOCKED sign-off | Protected implementation unchanged. Current local simulator/uncommitted diff inaccessible; branch lookup 404. Read-only owner comparison and full replay regression required. |
| Performance | CONDITIONAL | Production profile and API samples recorded. Museum idle low; software-GL library idle expensive. Original model/GPU memory/CDN timings unavailable. |
| Public API/AI security | BLOCKED public release | No authenticated AI quotas/spending control; edge config unknown, shared Engineer buffering/optional SDK concerns. Keep both AI flags disabled and public POST denied. |
| Dependencies | BLOCKED release review | npm 0; Python msgpack three advisory entries/two identities. Reviewed patched resolution required; no shared upgrades here. |
| Source/media permissions | BLOCKED public/commercial release | Historical facts sourced; reuse unreviewed. Original asset identity/terms and underlying branding/media rights require review. No fabricated or newly acquired assets. |
| Separate Mac procedure | READY to execute | Detached pinned worktree, no-clobber binary copy, isolated dependencies/ports/browser, private snapshots and non-destructive rollback. Not yet executed. |
| Existing PRs | PRESERVED | #1 at da2f414 and #3 at 433f33c remain unchanged drafts; QA has separate branch/draft targeting Stage 3. |

## Deliverables

- [All 25 failure rows, root causes, masked assertions and remediation](failure-matrix.md)
- [Integration boundary / simulator conflict audit and visual review](integration-audit.md)
- [Security, deployment and rights findings](security-and-licensing.md)
- [Measured performance, method, limits and priorities](performance.md)
- [Exact Mac Terminal procedure with expected outputs and rollback](mac-validation.md)
- [Full manual browser checklist](../heritage-browser-regression.md), with Stage 3 additions in the integration audit.

## Justified QA changes

`tools/review_environment.mjs` now supplies explicit disabled AI flags and removes provider keys in child environments for all three browser regressions and the review-config smoke tool. One new Node regression checks both flags, key removal, environment preservation and parent non-mutation. This closes a **review-harness isolation gap**, not public AI authentication.

The two screenshot-producing runners accept `FASTONE_REVIEW_SCREENSHOTS`, so review evidence can be saved outside accepted tracked screenshots. New `tools/profile_heritage_qa.mjs` measures a production preview/API on owned loopback ports with external resources blocked, captures heap/CPU/payload samples, then stops only its children. No application runtime, renderer, source data, scene, shared style/navigation, dependency manifest or deployment configuration changes.

## Executed validation

| Check | Result |
|---|---|
| Complete collected backend `python -m pytest -q` | **129 passed / 23 failure reports**, 1 dependency warning, exit1; 18 subcases + 5 outer failures across 7 parent methods |
| Baseline da2f414 full backend, same environment | **108 passed / same 23 reports**; all ordered failure identities match after path normalisation |
| Complete frontend `npm --prefix frontend test` | **79 passed / 2 failed**, exit1; includes one new QA test (pre-QA: 78/2) |
| Original museum browser runner | **13 groups passed** |
| Stage 3 browser runner | **10 groups passed** |
| Vehicle Library browser runner | **7 groups passed** |
| Review-config smoke | **3 groups passed** |
| Production TypeScript/Vite build | **PASS**; existing shared 900.82 kB 3D chunk warning |
| Heritage and race contract generation drift | **PASS** |
| Museum knowledge snapshot drift | **PASS** |
| Whitespace | **PASS** |
| Fresh dependency audits | npm **0**; pip-audit **3 entries / 2 identities**, one resolved package |
| Production preview profile | Six browser contexts and 100 warm API samples completed; no uncaught page errors |

Runtime: Node 24.22.1, Python 3.12.14, pytest 9.2.0, FastAPI 0.162.0 / Starlette 1.10.0 / httpx 0.28.1. Python dev requirements pin pytest 8.4.2 for fresh Mac installations; report formatting can differ, so use identity comparison. No tests intentionally skipped to pass; nested archived sprint copies are excluded by existing pytest configuration. Build does not validate asset existence/permissions. Asset-generating scripts were not run because they would overwrite metadata or require unavailable original bytes; these are not independent read-only tests.

[Raw logs and audit/profile JSON](evidence/) retain exact exceptions/results (checkout path normalised). JUnit collapses subcases, so the console failure list and [identity comparison](evidence/baseline-comparison.json) are supplied. Commands to reproduce are in each report and the Mac guide. Local browser tools are external and not added to the app manifest. QA uses no real provider key or paid AI call.

## Prioritised gates before merging

1. **P0 integration:** obtain original Mac bytes; close every failure and unlock masked checks. Stop/report unavailable or mismatched originals rather than creating replacements. Complete all-model/engineering/photo integrity checks.
2. **P0 integration:** owner reviews read-only committed/staged/unstaged/untracked comparisons against `feat/stage9d-replay-smoothing`; full 2024 British GP round 12 replay, homepage, library, engineering, fonts and Safari/mobile pass in isolated worktree. Preserve active proxy/server behaviour and uncommitted edits. No claim of conflict-free integration before this.
3. **P1 integration:** review any demo-host use: original intro route allowlist and API cache header behaviour have baseline defects; Vite-only review does not close them. Establish actual intended deployment architecture.
4. **P0 public release:** approved edge denies both AI POSTs or reviewed authentication/quotas/spend/body-limit implementation exists; verify through real ingress and direct backend. Do not enable flags for testing paid services.
5. **P1 public release:** reviewed dependency constraints/remediation and full regression; source/data/media rights and notices approved for actual intended use. Verify actual HTTPS/CSP/cache/body/rate/proxy limits and rollback artefact.
6. **P2 performance:** owner evaluates demand rendering and loader resource lifecycle using actual assets; retain accepted design and simulator semantics. Current profile is an optimisation priority, not permission to refactor shared rendering.

All tasks requiring Mac-only assets or uncommitted simulator access are explicitly **stopped/blocked at that boundary**. Remaining documentation and metadata/browser-only review are complete. Keep this QA PR and both existing PRs draft until the owner reviews evidence and authorises a later integration action. No automatic merge sequence is proposed.
