# Measured performance review

Production TypeScript/Vite build profiled using `tools/profile_heritage_qa.mjs`, three new browser contexts per route, 1440×1000, reduced motion, Chromium software GL, external fonts/media blocked, loopback API/static preview. Node 24.22.1, Python 3.12.14. These measurements describe the source snapshot on this shared host, **not** Mac GPU speed or CDN performance. Cold browser context does not mean cold operating-system/build/server cache. Local transfers were uncompressed preview responses and exclude document bytes; they are not gzip CDN download budgets.

| Metric | Museum default chapter | Vehicle Library procedural study |
|---|---|---|
| Time to tested element, three runs | 951 / 946 / 918 ms (catalogue data ready) | 232 / 171 / 202 ms (canvas element exists) |
| JS heap after explicit GC then idle | 3.99 MiB each | 7.88 / 7.48 / 7.40 MiB |
| Idle main-thread TaskDuration | 0.60 / 0.36 / 0.44 ms | 1426.78 / 1778.66 / 1508.81 ms |
| Actual measured idle wall window | 2005 / 2003 / 2003 ms | 2001 / 2042 / 2003 ms |
| Canvas count | 0 | 1 |
| Local resource transfer sum | 478,267 bytes | 456,608 bytes |
| Uncaught page errors | 0 | 0 |

Ready conditions differ; do not interpret the library as rendering a complete heavy asset faster than the museum. Heap is JS only, **not** GPU texture/geometry, browser resident memory or retained native allocations. Three contexts are insufficient for a leak conclusion. The library's high idle task duty under software GL supports a rendering optimisation investigation, not a universal hardware benchmark. Existing viewer uses continuous R3F Canvas rendering, contact shadows, controls and scene update hooks even at rest. Do not alter shared render loops/camera without owner coordination.

## Bundle and API

Build succeeds with existing >500 kB chunk warning. Selected minified / gzip sizes from Vite:

| Chunk | Minified kB | gzip kB |
|---|---:|---:|
| Shared OrbitControls/3D dependency chunk | 900.82 | 243.58 |
| Main | 355.30 | 113.62 |
| EngineeringShowcase | 135.78 | 43.61 |
| HeritageMuseum | 38.86 | 13.49 |
| VehicleViewer | 34.67 | 11.88 |
| HeritageCatalogue | 22.85 | 7.61 |

The warning is concentrated in shared 3D dependencies, not the catalogue alone. Existing lazy museum/library/scene boundaries work; current museum default does not create a WebGL context. Global chunk splitting can affect simulator load order/cache and is deferred to a coordinated performance change. Exact output file sizes are recorded in [bundle evidence](evidence/bundles.json).

50 sequential warm loopback GETs each (single worker, no production load simulation): original collection 7,490 response bytes, median 1.82 ms / p95 6.66 ms; Cooper 14,895 bytes, median 1.79 ms / p95 8.38 ms. Both conditional requests return 304. SQLite caches only two projections per process; SQL uses bound parameters and bounded rows. Frontend search debounces/aborts stale requests, list pagination is six cards. No measured need for indexing/virtualisation at 29 total records. Source-size limit is 20 MiB, much larger than current data; scale limits need re-evaluation before expanding.

Demo proxy discards conditional headers and ETags (source inspection); production edge caching remains unverified. Payload list/detail sources repeat within detail responses but current measured size does not justify a new protocol.

## Asset loading and context failures

The actual WebGL creation failure is `WebGLRenderer` / R3F `CanvasImpl`: `Error creating WebGL context`. It reproduces with a procedural car, independent of missing GLB bytes. Injected failure plus real software-GL recovery, retry, comparison isolation and personal garage containment all pass. Actual Mac hardware context limits, disabled acceleration, memory pressure and context loss need direct browser evidence; no single GPU root cause is proved for every machine.

`decodePackedModel` fetches all parts concurrently, concatenates, hashes, decompresses and creates a GLB blob URL. This may hold chunks, compressed bytes, decompressed bytes, parser arrays and GPU copies concurrently. Its process-wide resource cache retains successful blob URLs and has no eviction/revocation policy; Three loader caches may retain geometry. This is a retention risk across repeated model choices, not a measured leak here. Original model bytes are missing, so decode/parse peaks and GPU upload timings cannot be measured honestly. No fabricated meshes used.

## Prioritised measured follow-ups

1. **Before integration sign-off:** original-model Mac test: record cold/warm fetch/decode/parse/upload, Activity Monitor memory, GPU/context status; switch all models and compare mode repeatedly, then leave/re-enter route. Check memory plateaus and canvases/contexts release. Record model hashes and use Safari too. Any missing original stops that asset case.
2. **Owner-reviewed optimisation:** prototype demand rendering while idle, explicit invalidation for controls/fit/explosion and animation when enabled, and evaluate shadow cost. Acceptance: unchanged visuals/interaction plus lower idle CPU on actual Mac; current software-GL duty is the evidence for prioritising this. No renderer change in QA.
3. **Owner-reviewed loader lifecycle:** ref-count/revoke unused blob URLs and GLTF disposal only after consumers release them. Regression-test multi-view reuse, retry, unmount/re-entry and cache ownership before adopting. Avoid prematurely disposing shared simulator assets.
4. **Release pipeline:** immutable hashed JS, Brotli/gzip, verified content types/HEAD for parts, cache-policy/ETag tests through actual Cloudflare/Render ingress. Preserve per-file hosting limits and exact hashes. Do not change chunks or replace source assets to silence warnings.

Rerun from the isolated review root after `npm --prefix frontend run build`:

```sh
PYTHON="$FASTONE_REVIEW/.venv-review/bin/python" \
PLAYWRIGHT_MODULE="$FASTONE_BROWSER_TOOLS/node_modules/playwright" \
node tools/profile_heritage_qa.mjs > "$FASTONE_EVIDENCE/performance.json"
```

If Chromium is not Playwright-managed, supply `BROWSER_EXECUTABLE_PATH`. This runner starts only its own loopback services and closes them. It blocks external resource requests intentionally; remove that policy only in a separately authorised original-media performance run and label the changed methodology. [Raw samples](evidence/performance.json).
