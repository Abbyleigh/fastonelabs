# Vehicle Library error — diagnosis and isolated containment

Reviewed 29 October 2026 against Stage 2 `81bca76`. This corrects the earlier implication that absent model binaries explain the library's page-level error. The reproduced error occurs even for `original-study`, which has no external GLB.

## Exact failure

- Route: `#library`, fresh browser storage, selected `RI engineering study` / `original-study`.
- Chain: `VehicleLibrary` → `VehicleViewer` → React Three Fiber `Canvas` / `CanvasImpl` → Three.js `WebGLRenderer`.
- Browser: local headless Chromium 153, no usable hardware or configured software WebGL context. Original Stage 2 browser flags are `--no-sandbox --disable-dev-shm-usage`.
- Console error: `THREE.WebGLRenderer: Error creating WebGL context.`
- React error: `Error: Error creating WebGL context.` First frames: `new WebGLRenderer`, `createRenderer`, `configure`, `CanvasImpl`. React reports recovery via `PageBoundary`.
- Chromium diagnostic: `Could not create a WebGL context ... BindToCurrentSequence failed`.
- Visible effect before containment: the entire library is replaced by “This page could not open.” This is not evidence of a corrupt asset, a missing GLB or a broken Mac GPU.

The model `Boundary` in `VehicleViewer.tsx` sits **inside** the canvas. Canvas creation fails outside that child tree. `PageBoundary` therefore catches the error at page scope. Missing original assets remain a separate validation gap.

## Change and safety boundary

New DOM-only `VehiclePreviewBoundary.tsx` wraps each `VehicleViewer` invocation in `VehicleLibrary.tsx`, including comparison. A failure leaves search, favourites, selected-vehicle profile, citations and other previews available. Retry remounts the failed child only; it does not reload the page or clear saved garage state. Changing selected vehicle remounts the per-asset boundary through its key.

No `VehicleViewer`, Canvas props, Three.js rendering, replay, geometry, camera, calibration, assets or global boundary code changes. This is failure containment, not a WebGL driver fix. As with other React error boundaries, event-handler errors and asynchronous errors outside rendering/lifecycle are not covered; context loss after creation still needs the manual checklist.

## Regression reproduction

`tools/check_vehicle_library_browser.mjs` runs the real app with isolated loopback services and browser storage. It intercepts only the test browser's WebGL context creation to reproduce failure deterministically, then restores it to verify retry recovery using the real procedural viewer. Software GL launch flags apply only to this headless test runner, not production configuration or a user's browser.

```sh
PYTHON=/absolute/path/to/review/python \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
BROWSER_EXECUTABLE_PATH=/absolute/path/to/chromium \
node tools/check_vehicle_library_browser.mjs
```

Checks: contained canvas failure; preserved profile/citations; working search/favourites; retry while graphics remains unavailable; successful retry after graphics returns; independent failing comparison preview; 390px overflow; personal garage containment. A graphics-capable test browser is required for the recovery assertion; software GL suffices. No actual car asset is substituted or fabricated. Original models, shader appearance, camera framing and model-specific controls still require the Mac regression.
