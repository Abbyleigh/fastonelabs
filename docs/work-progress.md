# Heritage work progress and changelog

Date: 29 October 2026. Repository: `Abbyleigh/fastonelabs`. Work branch: `work/heritage-platform`. Starting checkpoint: `dd57d2596389c946a0e02db8a8636e3dbd7d95a0`. Review target: `feat/f1-web-publication`; no commit is made directly to that branch.

## Completed in this workstream

1. Inspect repository architecture and file ownership. Align the initial `e7e8364` audit to the user's newer `dd57d25` checkpoint before delivery. Preserve all checkpoint simulator, geography, rendering and model changes.
2. Implement an independent reviewed heritage slice: 1950 Silverstone, four drivers, constructor, season, circuit/layout identity and museum-described Alfa 158 configuration. Ten entities, five source references, seven partial classification rows. Distinguish unknown values, coverage and unreviewed source rights.
3. Add Pydantic validation, a separate SQLite schema/projection, safe offline ingestion, typed read-only endpoints, bounded search/detail responses, ETags and no upstream traffic per catalogue request.
4. Add a small lazy-loaded responsive research gallery inside the existing museum Origins page, with search/type/season filters, pagination, connected records, specifications, classifications, citations and loading/error/empty/retry states. Keep global navigation, dependencies and styling unchanged.
5. Repair historian provider/test/setup drift while preserving Groq. Remove the undeclared SDK requirement, validate the existing editorial corpus, pre-index terms, cache immutable retrieval IDs and bound provider/request sizes. Preserve public source-only lookup and local optional paid selection. Do not turn legacy editorial content into newly verified pilot data.
6. Extend only the local demo GET allowlist for the catalogue and test rejected paths. No public tunnel, deployment, domain purchase or credential entry occurs.
7. Run focused/full suites, build, contract checks, baseline comparisons, browser integration, visual previews and dependency audits. Document remaining asset failures and security/deployment gaps.

## Changed files and purpose

| File | Purpose |
|---|---|
| `backend/heritage/__init__.py` | Isolated catalogue package |
| `backend/heritage/models.py` | Entity, source, claim, period relationship, classification and batch contracts |
| `backend/heritage/migrations/001_catalog.sql` | Separate relational schema, constraints and indexes |
| `backend/heritage/data/silverstone-1950.json` | Small primary-source-reviewed pilot with coverage and rights flags |
| `backend/heritage/store.py` | SQLite projection, parameterised bounded reads, query-only cache |
| `backend/heritage/router.py` | Typed catalogue search/detail endpoints and conditional caching |
| `backend/heritage/ingest.py` | Offline validation and atomic no-clobber DB creation |
| `backend/main.py` | Register catalogue router; bound only the museum POST stream |
| `backend/museum.py` | Preserve Groq, fix transport, bound responses and cache immutable evidence IDs |
| `backend/museum_validation.py` | Validate inherited editorial corpus structure and citations |
| `backend/tests/test_heritage.py` | Catalogue API, evidence, ingestion, storage and regression tests |
| `backend/tests/test_heritage_demo.py` | Local proxy allowlist and denied-path tests |
| `backend/tests/test_museum.py` | Align existing provider transport assertions with checkpoint Groq implementation |
| `backend/tests/test_museum_resilience.py` | Corpus corruption, cache isolation, provider fallback and streamed-body checks |
| `demo/server.py` | Bounded catalogue GET paths and import-safe main guard |
| `frontend/src/HeritageMuseum.tsx` | Lazy-load/render the research gallery in Origins |
| `frontend/src/heritage/HeritageCatalogue.tsx` | Search, pagination, connected record views and request-state handling |
| `frontend/src/heritage/api.ts` | Runtime response guards, cancellation and safe same-origin requests |
| `frontend/src/heritage/contracts.ts` | Generated TypeScript contracts from Pydantic |
| `frontend/src/heritage/catalogue.css` | Scoped responsive gallery styling, focus and mobile heading isolation |
| `frontend/tests/heritageCatalogue.test.mjs` | Response validation and fetch/error/cancellation contract tests |
| `tools/generate_heritage_contracts.py` | Generate/check frontend/backend type alignment |
| `tools/check_heritage_browser.mjs` | Isolated real-API browser checks and previews |
| `tools/configure_museum_ai.py` | Align existing local setup prompts and variable with Groq |
| `tools/start_museum_backend.py` | Load the matching Groq museum variable |
| `docs/architecture-audit.md` | Architecture, checkpoint changes, risks and priorities |
| `docs/heritage-data-model.md` | Contracts, evidence statuses, storage and scaling limits |
| `docs/data-sources-and-licensing.md` | Provider coverage, rights, limits and future asset requirements |
| `docs/production-readiness.md` | Security findings and practical non-development-server deployment plan |
| `docs/MUSEUM_AI_SETUP.md` | Correct current provider setup and public/private boundaries |
| `docs/heritage-integration.md` | Separate checkout and reproducible verification instructions |
| `docs/test-results.md` | Executed results, baseline comparison and unresolved checks |
| `docs/work-progress.md` | This changelog and delivery status |

Three generated local previews (desktop, vehicle and mobile) accompany the completion report. They are reproducible using the browser script and are not included as binary files in the review commit.

## Validation and limitations

Focused backend: **52 passed**. Catalogue frontend tests: **3 passed**. Build and generated contracts pass. Browser: **10 checks pass**, with visual inspection. Full backend: **101 passed / 7 missing-asset failures**; full frontend: **74 passed / 2 missing-asset failures**. Untouched checkpoint comparison reproduces those asset failures and additionally shows the two historian regressions repaired here. See `test-results.md` for exact scope.

Python audit finds msgpack advisories; dependency changes remain coordinated work with the simulator owner. Existing vendor chunk size warning remains. Source reuse rights are explicitly unreviewed. No comprehensive historical circuit coverage, historic geometry, new model, semantic AI research, automated provider harvesting or commercial redistribution approval is claimed.

The patch is prepared for a private review pull request. No merge or deployment is performed. Any previous statement about the early baseline's eagerly bundled frontend is superseded by the checkpoint-aware audit; upstream route splitting is not credited to this patch.

## Decisions and next work

No approval is needed to inspect or review this branch. Public release, paid services, dependency updates overlapping simulator work and expanded third-party redistribution need separate review/authorisation. The recommended next independent task is a second primary-source-reviewed era/circuit slice, followed by paginated classification/relationship endpoints before bulk ingestion. Merge/release waits for complete-asset regressions and rights decisions.

## Learning record

The architecture separates evidence (what supports a value), uncertainty (what is known), coverage (what is included) and permission (what may be reused). SQL indexes/fkeys protect identity; Pydantic validates whole batches before storage; generated contracts prevent frontend drift; runtime guards and abortable requests protect rendering. The historian selects IDs rather than displaying generated facts. The tests verify these behaviours, not just compilation.

Milestones above reflect executed work in this assignment. Earlier project hours and unattended wall-clock time are not recoverable from this source snapshot, so no total development-hours figure is invented. Retain this changelog and review commit as evidence for the eventual technical learning report.

## Stage 2 — editorial museum integration (2026-10-29)

Priority changes from data expansion to presentation and integration. The work stays on `work/heritage-platform`, building on remote `9013088` / draft PR #1. The local source-snapshot parent is `8e89bba`; it contains the implementation from that remote checkpoint. No historical dataset grows in this stage.

Completed: site token and browser-reference review; editorial catalogue headings; navy/teal indexed research cards; race/machine/circuit entry points; source-field counts; collapsible coverage/rights disclosure; direct links into the existing timeline, Alfetta exhibit, engineering experiments and historical race views. `HistoricalCircuit.tsx` introduces an independent expandable circuit evidence study for the 1950 Silverstone layout. It explicitly shows unavailable geometry instead of drawing invented coordinates or reusing modern simulator geometry.

Changed source: `frontend/src/heritage/HeritageCatalogue.tsx`, new `frontend/src/heritage/HistoricalCircuit.tsx`, `frontend/src/heritage/catalogue.css`, `tools/check_heritage_browser.mjs`. Documentation: `heritage-stage2-design.md`, this changelog, `test-results.md`, `heritage-integration.md`; before/after and responsive preview evidence accompanies the review. Full design decisions and extension contract are in `heritage-stage2-design.md`.

Executed: **52 focused backend tests**, **8 relevant frontend tests**, **13 browser checks**, TypeScript/Vite production build and whitespace checks pass. Browser captures cover desktop 1440px, tablet 834px and mobile 390px; column counts, document/gallery overflow, circuit expansion/collapse, source-backed missing geometry, original exhibit navigation, keyboard navigation and reduced motion are exercised. Browser snapshots are inspected and recaptured after detecting sticky-header occlusion; component-only captures hide the header, while the museum-context capture retains the page shell.

Limits: Google Fonts fall back in this environment; original model/photo binaries remain absent. The vehicle library route opens its existing error boundary during reference capture; it is not counted as a successful visual audit. Race Centre capture shows available dashboard state, not validated replay/model fidelity. No simulator changes, global styles, routing, dependency, backend/data edits, migration, source-rights changes, paid calls, merge or deployment.

Next: inspect this branch on the complete local Mac checkout with real fonts and original assets, then source and license historically accurate layout coordinates before enabling a measured map. No bulk data expansion starts here. The earlier recommendation for a second era is superseded by this presentation/integration priority. No development-hours total is inferred from this session's wall-clock timestamps.
