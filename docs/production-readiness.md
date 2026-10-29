# Production readiness — heritage workstream

Reviewed 29 October 2026 from checkpoint `dd57d25`. No domain, server, certificate, tunnel or external deployment is created. Existing simulator/rendering code and dependency manifests remain untouched.

## Findings and priorities

| Priority | Evidence | Required action |
|---|---|---|
| Before public AI | Museum POST relies on loopback client/origin checks. A local reverse proxy can make remote requests appear loopback. | Block museum/race-engineer POST at the public edge. Keep AI disabled until authenticated users, enforceable quotas and spending limits exist. CORS is not authentication. |
| Before production | No application-wide request rate limit is present; existing archive searches can fan out to multiple provider requests. | Add edge quotas, concurrency limits, bounded provider queues and cost controls in a coordinated infrastructure change. The new catalogue performs no provider requests. |
| Dependency review | `pip-audit -r backend/requirements.txt` reports three advisory entries for resolved `msgpack==1.1.2`, including a duplicate identifier. | Review the two distinct advisory identities below and prepare a compatible constrained update with the simulator owner. No shared dependency update is made here. |
| Data/asset permissions | Jolpica terms are non-commercial; OpenF1 FAQ limits intended usage; pilot source reuse remains unreviewed. | Complete rights decisions before broader redistribution or commercial use. Verified factual evidence and a permitted dataset licence are distinct. |
| Recovery | Existing provider caches write within the backend source directory; locking/atomicity and freshness vary. | Mount private writable cache storage, set disk bounds, atomic writes, TTL and stale-status metadata. Do not serve cache directories as web content. |
| Reproducibility | Frontend has a lockfile. Python requirements contain ranges; this environment's audit resolves newer versions than the Mac may use. | Record and review a Python lock/constraints set; rerun audits on the actual deployed resolution. |
| Tests/assets | The source-only connector snapshot omits large binary models and photographs required by existing asset tests. | Run the complete regression suite with original assets before merging/releasing. Do not fake model files to make tests green. |

## Secret and API review

A targeted scan of the reconstructed source snapshot for common private-key/token patterns finds no matches. That is not a Git-history, live configuration or all-secret-pattern audit. `.env` files are ignored; the Mac's real environment and credentials are not inspected. Never put credentials in browser `VITE_*` variables, frontend source, response bodies or logs.

The newer museum provider integration uses Groq with an undeclared SDK in the checkpoint. This patch removes the SDK requirement, aligns the helper with `GROQ_API_KEY`, bounds response bytes and keeps paid calls optional/local. Provider exceptions never become user-visible credential-bearing messages. The museum POST now rejects oversized streamed bodies before buffering them in full.

Existing CORS allows only local Vite origins, GET methods and no credentials. Same-origin hosting avoids expanding it. An unauthenticated server-to-server client does not obey browser CORS. New catalogue IDs, filters, paging, years, sources and response models are bounded/typed; SQLite queries bind values and the projection is read-only. Offline ingestion refuses overwrite and arbitrary public uploads/URLs are not exposed.

## Dependency evidence

`npm audit --json` on the unchanged frontend lock reports zero vulnerabilities at the time checked. That does not prove all runtime logic is secure.

The Python requirements audit resolves `msgpack==1.1.2` through FastF1. Its report contains:

- `PYSEC-2026-3625` / `GHSA-6v7p-g79w-8964` / `CVE-2026-57585`, duplicated by the advisory service; reported fix 1.2.1.
- `CVE-2026-114613` / `GHSA-j586-36cw-2gc2`, reported fix 1.2.3. The upstream advisory itself describes an affected-version range discrepancy, so confirm applicability and compatibility before declaring remediation.

These involve MessagePack parsing/memory safety or denial of service. The new heritage code does not parse MessagePack. No finding proves an exploit path through the current UI. The dependency change overlaps the simulator owner and is deliberately left for review. Primary advisory: https://github.com/msgpack/msgpack-python/security/advisories/GHSA-j586-36cw-2gc2 . Audit outputs record the resolver's selection, not a scan of the user's Mac.

## Practical deployment sequence

1. Review/merge the isolated branch after complete-asset regression checks and source/asset permissions review. Select hosting/domain only with the owner's approval.
2. Build the frontend with `npm ci` and `npm run build` in a reproducible build environment. Serve **only `frontend/dist`** through a production static host or reverse proxy. Do not expose Vite development or preview servers, the repository root, Python caches, ignored environment files or model source tooling.
3. Run FastAPI in a supervised unprivileged process/container on a private interface, without `--reload`. The current local configuration uses port 8001. Use per-release source and writable private cache directories. Start with one worker and measure memory/CPU before increasing it: each worker owns its catalogue cache and model/provider state.
4. Terminate HTTPS at a managed platform or reviewed reverse proxy. Point the approved domain's DNS there, issue a valid certificate, verify HTTP→HTTPS redirection and renewal, and keep the backend port firewalled. Proxy only intended GET API paths. Explicitly deny public museum/race-engineer AI POST and other unreviewed endpoints. Trust forwarded headers only from the real proxy.
5. Apply timeouts, request-body limits, connection limits and per-client quotas. Coordinate limits for existing slower telemetry endpoints; do not hide provider outages with unbounded retries. Preserve status codes and conditional-GET/cache headers. Cache fingerprinted build assets immutably; revalidate HTML; use catalogue ETags/max-age. Do not accidentally cache private AI responses.
6. Add `nosniff`, an appropriate referrer policy and a tested framing/CSP policy. Existing third-party model embeds/assets require an explicit origin inventory; test a report-only CSP before enforcing it. Enable HSTS only after domain/certificate/redirect validation.
7. Health-check both static delivery and `/api/health`, then smoke-test `/api/heritage/entities`, a detail record, museum public retrieval, blocked AI POST, navigation, assets and an existing race-state contract. Record error rates, provider 429s, cache sizes, resource use and retention limits without logging secrets/full private prompts.
8. Retain the previous immutable build/commit and catalogue revision. Roll back the release atomically; do not attempt an in-place destructive database rollback. The catalogue can be rebuilt from its validated packaged JSON. Test recovery before public launch.

The bundled `demo/server.py` remains a local demo utility, not production hosting. This change only extends its GET allowlist to bounded catalogue paths; no share tunnel is run.

Primary deployment guidance: https://vite.dev/guide/static-deploy.html and https://fastapi.tiangolo.com/deployment/https/ .

## Integration-readiness re-review — 29 October 2026

This review does not deploy or change runtime security/dependencies. [Private merge gates and public-release gates are tracked separately](heritage-merge-readiness.md). Local-only private review keeps both AI enable flags off and does not copy credentials. A successful Mac regression is not production security approval.

### AI ingress: fail closed at the real public boundary

Exact endpoints: `POST /api/museum/historian` and `POST /api/race-engineer/ask`. Both accept loopback clients with no Origin header; neither authenticates an end user, enforces per-user spending or implements account quotas. A reverse proxy can present requests as loopback depending on forwarded-header settings. Setting CORS origins is not a defence against server-to-server requests.

Default release posture: keep AI flags disabled, keep keys server-only, and deny both public POST routes at the edge. Check canonical paths, trailing-slash redirects, decoded/normalised paths, any mounted prefix and every public ingress/alternative backend address. Explicitly allow reviewed GET retrieval; do not proxy arbitrary methods to the backend. Negative tests must run through the real edge with absent/spoofed Origin and forwarded-client headers and must prove zero provider calls. No edge configuration is installed by this work.

If public AI is later approved, require authenticated/authorised accounts, server-enforced per-account and aggregate quotas, concurrency limits, maximum provider cost/token budgets and a kill switch, strict input/body bounds, timeouts, safe error logging and abuse monitoring. Add CSRF protections where cookie credentials apply. Trust forwarding headers only from the actual private proxy. Test 401/403, 413, 429, expired sessions, unauthorised users, forged headers and fail-closed provider outages without live paid calls.

Two owner-coordinated concerns remain in the existing Race Engineer: it buffers `await request.body()` before the 2048-byte check, and its enabled path imports `openai` despite no such package in `backend/requirements.txt`. Museum streaming bounds and SDK-free transport do not repair that separate route. No Race Engineer/simulator code or shared dependency declaration changes here.

### Fresh dependency audit

Executed again in a new temporary Python environment and against the unchanged frontend lock:

- `npm audit --json`: **0 vulnerabilities** in the locked frontend tree at this check.
- `python -m pip_audit -r backend/requirements.txt --format json`: **three entries in one package**, resolved `msgpack==1.1.2`. The audit service repeats `PYSEC-2026-3625` twice (fix reported 1.2.1), plus `CVE-2026-114613` (fix reported 1.2.3).
- The [maintainer advisory for GHSA-j586-36cw-2gc2](https://github.com/msgpack/msgpack-python/security/advisories/GHSA-j586-36cw-2gc2) reproduces 1.2.2, reports a fix in 1.2.3, and explicitly says the earliest affected range needs confirmation. Do not infer that the old resolved 1.1.2 is cleared merely from a narrower advisory metadata field. The public database flags versions before 1.2.3.

Remediation proposal only: resolve a reviewed constraints set in an isolated dependency branch, evaluate a patched msgpack version against FastF1 3.9.0 and the Mac Python version, run the complete original-asset/replay regression, inspect transitive changes and rerun the audit. Do not run exploit payloads in the active simulator process, use `pip install --upgrade` there, or claim remediation without a new resolution and evidence. Main heritage endpoints use JSON/SQLite; no reachable MessagePack exploit is demonstrated here. The requirement finding remains open.

### Remaining release evidence

The current source-only library failure is now traced to missing WebGL context, not an inferred corrupt model. Per-preview failure containment is tested, but original models, packed chunks, engineering maps, fonts and photographs still need full Mac validation. Other direct viewer consumers remain outside this isolated fix. Asset hash/attribution tests and visual checks both matter: a successful build alone proves neither integrity nor rights.

Before any production review, inventory all served models/images/video/fonts/embeds and their source/reuse rights, validate immutable build/rollback, cache permissions and disk bounds, and record tested HTTPS/security headers/CSP origins. Host only `frontend/dist`; do not expose Vite, source roots, private cache/evidence folders or environment files. There is no deployment or domain action in this assignment.
