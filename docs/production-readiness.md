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
