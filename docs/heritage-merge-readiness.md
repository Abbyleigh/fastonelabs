# Heritage integration readiness — PR #1

Status: **DRAFT — not approved for merge or deployment.** Stage 2 `81bca76` remains the accepted design baseline. Current work adds preview failure containment, review tooling and evidence/checklists, not new eras or a simulator revision.

## Completed in this environment

- [x] Reproduce exact Vehicle Library failure: `CanvasImpl` / `WebGLRenderer` throws “Error creating WebGL context” with procedural study selected; no missing asset is required.
- [x] Add library-only per-preview DOM error boundary and retry; preserve catalogue/profile/credits; leave viewer/rendering/camera/model code untouched.
- [x] Seven real-browser library regression groups pass: failure containment, search/favourites, failed retry, successful WebGL recovery, isolated comparison failure, 390px layout and personal garage.
- [x] Five asset-helper tests pass against disposable real Git worktrees, covering no writes on dry-run, missing-only copy, metadata preservation, conflict preflight, symlink refusal and active/overlapping destination refusal.
- [x] Relevant frontend tests (12), focused heritage backend tests (52) and production build pass.
- [x] Prepare detached-worktree Mac procedure, private evidence capture, no-clobber binary-only asset copy and separate loopback Vite proxy configuration.
- [x] Re-audit unchanged frontend lock and Python requirements; document advisories and current primary-source licensing concerns.

## Private merge-review blockers — still open

- [ ] Run the complete backend/frontend suites on the Mac's full original-asset review worktree. Do not waive asset failures as the expected Mac result.
- [ ] Complete the full browser matrix, including **2024 British GP / round 12**, actual fonts, original models, photos, engineering labels and mobile/Safari behaviour. Record reviewed SHA and evidence.
- [ ] Confirm accepted Stage 2 design fidelity with original fonts/assets; no design changes are authorised by this checklist.
- [ ] Compare the final branch diff with the simulator owner's current committed baseline; confirm only intended files change and obtain coordination for any shared-file conflicts. Do not rebase onto or overwrite uncommitted simulator work.
- [ ] Confirm active Mac checkout branch/HEAD/index/working edits remain as expected; account separately for concurrent edits by the other session.
- [ ] Review the narrow `VehicleLibrary.tsx` wrapper integration and library regression evidence. Other direct `VehicleViewer` consumers, including historic local-model exhibits, are not changed by this containment fix.
- [ ] Resolve or explicitly document per-source/per-asset permitted uses for the intended private integration; retain unknown/unreviewed rights rather than relabelling them approved.
- [ ] Owner explicitly approves ending draft/review and any later merge. This assignment does neither.

## Public release / commercial / AI gates — not implemented or approved

| Blocker | Evidence / risk | Closure evidence |
|---|---|---|
| Public AI ingress | Museum and Race Engineer POST use client loopback/origin checks, not user authentication; a loopback reverse proxy can admit internet traffic if misconfigured | Edge denies these POST routes including normalisation/mount variants; or reviewed auth, authorisation, quotas, hard spending/concurrency limits, timeouts and CSRF protection where cookie sessions apply; negative tests from outside the edge |
| Buffered Race Engineer body | Existing route buffers `request.body()` before checking 2048 bytes; museum route bounds streaming | Edge body/connection limits and owner-reviewed bounded stream handling; race-engineer code stays untouched here |
| Undeclared optional Race Engineer SDK | `backend/race_engineer.py` imports `openai` only on enabled path; requirements do not declare it | Simulator-owner dependency/transport decision, isolated tests and clean-environment optional-path validation; no paid call required |
| Python advisories | Fresh requirements audit resolves msgpack 1.1.2, reports two distinct advisory identities (three service entries) | Reproducible resolved constraints, compatibility-tested remediation with simulator owner and fresh audit; do not silently update shared requirements |
| Provider/data rights | Jolpica CC BY-NC-SA; OpenF1 intended uses do not constitute unrestricted commercial redistribution permission; pilot verification sources unreviewed | Recorded permitted use, terms version, attribution/ShareAlike compliance where applicable and any required grants |
| Media/branding | Creator mesh licence does not itself clear team marks, driver rights, thumbnails, broadcast footage or official fonts | Per-file rights ledger with author/source/licence/version/derivatives/allowed uses; no guessed historic reconstructions; brand review of intended public presentation |
| Production infrastructure | No app-wide edge quotas/auth, full security-header/CSP/HTTPS validation or reproducible Python lock | Separate reviewed production plan and external-hosting approval; serve built dist, keep backend private, protect caches/secrets, validate backup/rollback |

Missing historical coordinates do **not** block this accepted evidence-only circuit study: unverified geometry stays explicit. They block any future claim of a measured historical map. Private integration sign-off does not automatically close public-release or commercial gates.

## Review documents

- [Mac worktree and validation procedure](heritage-mac-validation.md)
- [Complete browser regression matrix](heritage-browser-regression.md)
- [Exact library diagnosis and isolated fix](vehicle-library-investigation.md)
- [Production readiness](production-readiness.md)
- [Source/licensing inventory](data-sources-and-licensing.md)
- [Executed results](test-results.md)
