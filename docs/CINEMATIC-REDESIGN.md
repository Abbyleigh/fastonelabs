# Cinematic redesign — 27 October 2026

## Restoration

Protected baseline: Git tag `before-layout-redesign-20261027`, commit `f08b087`.
Work lives on `feat/editorial-layout-driver-showcase`. The baseline contains the full application and installed licensed assets. No API endpoints or race-state contracts changed. Do not reset a checkout containing newer work; recover the tag into a separate worktree when needed.

## Asset and architecture audit

The application uses React 19, R3F 9, Drei 10, Three 0.180, TypeScript, Vite and FastAPI. Existing pages include the season browser, recorded OpenF1 replay/pit wall, circuit preview, race results, driver directory/profiles, engineering garage, strategy A/B workbench and experimental prediction page. FastF1 is installed but existing ingestion remains OpenF1/Jolpica; this sprint does not claim a FastF1 migration.

The homepage, its launch transition and Engineering use the same installed 2026 McLaren MCL40 asset, credited to Dave Love SketchFab under CC BY 4.0. It is a creator representation, not manufacturer CAD. Original GLB: 20,253,204 bytes, 27 meshes/primitives, 276,844 triangles. Existing sidecar grouping identifies body, front wing, rear wing, wheels and suspension using original surface triangles. UVs and materials are preserved. These are approximate surface groups, not independent factory assemblies. Floor, battery, gearbox, cooling internals and hybrid equipment are not separately modelled; their guides are explicit about this. No invented internal geometry was added.

Race replay continues to use its existing lightweight stylised fleet. Its data consumers, camera, pit wall and shared recorded clock are unchanged. A high-detail hero model is not silently substituted for every replay car.

## Implemented

- Dark cinematic homepage with manipulable actual 3D car, introductory camera movement, slow orbit, controllable separation, scroll-driven separation opt-in, reassembly and selectable technical guides.
- Separations operate on the same original geometry as the full Engineering Explorer. Reduced-motion preferences make the separation immediate.
- Real 3D car launch into recorded Silverstone 2024 Race Centre, first entry only per app session, 2.2-second upper bound, Skip and Escape. Car wheel surface groups rotate about their own pivots. No audio autoplays. Navigation remains available if rendering fails.
- Shared responsive dropdown navigation for Race Centre, Strategy Lab, Drivers & Cars and Newsroom. Hash URLs retain page, event and selected driver, and support browser navigation. Season/Grand Prix workspace is shared with the calendar.
- Six-driver slow 12-second showcase with real licensed portraits, matched team/season cars, biography, sourced career statistics and general FIA regulation specifications. Portrait and model credits remain visible. Historical seasons without matching 3D assets say so.
- Pause, previous/next and direct driver controls. Autoplay pauses on hover, focus, hidden tab and off-screen, and respects reduced motion.
- Existing internal pages share the chrome and a short reduced-motion-aware entrance fade. Existing strategy, prediction, replay and news functionality remains accessible.
- Demand-rendered showcase models, capped pixel ratio/shadow costs, off-screen/hidden hero rendering suspension, low-FPS DPR reduction, scene failure boundary and saved effects preference.

## Validation

Automated project check: 48 backend tests + 42 frontend tests; generated race contract validation; TypeScript and production build. Added navigation round-trip, malformed URL and carousel pause/wrap tests. Browser checks cover desktop, tablet and phone, menus, component selection/reassembly, Race Centre entry, existing replay/pit wall, strategy and driver selection. Screenshots and measured results are recorded with final verification below.

Initial observed desktop five-second samples were 56–58 FPS in the development browser. This is a local measurement, not a cross-device 60 FPS guarantee. Large original GLB files remain a first-load cost. Production bundle retains Vite's large-chunk advisory; full geometry/texture compression and broader physical-device profiling remain work.

## Explicit limits / next stages

The uploaded video informs the mechanical separation choreography. This is a working first cinematic pass, not a claim of film-quality physically accurate disassembly. There is no manufactured battery/gearbox model, CFD, thermal simulation, true motion-blur postprocessing or photogrammetric track. A fully continuous high-detail hero-to-replay scene, cockpit/pit-garage transitions for new product modes, Team Principal management gameplay and a separate Parallel Universe race simulation are not implemented by this visual sprint. The existing A/B strategy comparison remains available. Predictive-model development and commercial subscription infrastructure remain separate milestones as requested.

Higgsfield was attempted for a concept in the earlier layout task, but generation was rejected because the connected account requires Basic or higher. No Higgsfield image/video was generated or used. The redesign is integrated directly in the existing repository using its licensed assets.

## Final browser verification

- Layout bounds: 1440/1440, 820/820 and 390/390 viewport/document pixels, respectively; no page-wide horizontal overflow.
- Autoplay observed advancing through featured drivers; manual next and Hamilton selection worked. Hamilton's car link opened the 2026 Ferrari SF-26, selected in the existing garage.
- Front-wing separation, technical guide and reassembly worked. Missing internal groups are marked guide-only.
- Race entry opens recorded Silverstone replay; Skip returns immediately to that destination. With effects disabled, no entry dialog appears.
- Recorded replay loaded classification, telemetry, weather and race-control messages; existing A/B strategy workbench opened with race context.
- A loading-indicator cleanup error found in the first browser pass was fixed by keeping its DOM outside the 3D portal. Final-bundle navigation and rendering produced no console errors in the tested path.
- Proof images: `cinematic-home-desktop.jpg`, `cinematic-engineering-desktop.jpg`, `cinematic-home-phone.jpg`, `cinematic-home-tablet.jpg`, `driver-showcase-phone.jpg` in the task's outputs directory.
- Final `tools/check_project.py`: all 90 tests, race-contract verification, TypeScript and production build passed. `git diff --check` passed.
