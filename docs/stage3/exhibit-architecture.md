# Stage 3 — future historic exhibit contract

The implementation supplies **metadata contracts and release gates**, not historic model bytes, a Blender importer or an exploded-view renderer. T51/T53 exhibit plans are `not-supplied`, have null assets and no assembly labels. No model is fetched by these new museum panels.

## Contract and storage

`backend/heritage/exhibits.py` defines `ExhibitPlan` and `HistoricAsset`. `base.py` holds shared bounded metadata primitives without importing simulator contracts. `Dataset.exhibits` defaults to an empty list, preserving original seed loading. SQLite stores each plan against a real vehicle foreign key. Fresh projections apply `001_catalog.sql` then `002_historic_exhibits.sql`, ending at SQLite `user_version=2`; logical JSON schema remains version 1 with additive optional fields.

The 001 entity kind check adds `engine`; a batch can use `powered-by` vehicle→engine and `developed-from` vehicle→vehicle links. These are new **fresh catalogue projection definitions**, not an in-place migration of a previous SQLite output or the simulator. Offline ingestion still rejects an existing output path. Rebuild a projection into a new file to inspect the new format; retain an old file if needed for review.

Future supplied assets require:

| Field / gate | Purpose |
|---|---|
| `/models/heritage/.../*.glb`, format GLB | Local museum namespace; no external URL, traversal, arbitrary executable loader or extra-buffer fetch |
| SHA-256 and positive bounded bytes | File identity / memory planning; actual byte verification remains a future loader responsibility |
| Creator, licence, attribution, modifications and source IDs | Track rights and credit separately from the historical record |
| Asset reuse `permitted` and cited source records also `permitted` | Fail closed when supplied media has unreviewed permission metadata |
| `permitted_uses`, separate commercial review | Private/public/commercial scopes do not imply one another |
| Fidelity `illustrative` / `approximate` / `validated` | Avoid presenting a teaching asset as an exact reconstruction |
| Measurement source IDs for `validated` | Require named dimensional evidence; metadata validation does not establish that the evidence is scientifically sufficient |
| Metres, Y-up | Explicit proposed Blender export convention, not automatic physical-scale certification |
| Exploded support + assembly-map SHA-256 + labels | Reject unsupported exploded-view claims; source-matched triangle/part verification is still required before a future renderer enables it |
| Optional `vehicle_library_id` | Metadata bridge only; it does not insert entries into the existing Vehicle Library |

Pydantic validates whole datasets before storage, including real vehicle/source references and per-asset release states. Frontend `exhibitContracts.ts` validates incoming plans, permissions and fidelity metadata. `libraryExhibitReference()` only returns an existing library ID when both path **and** SHA-256 match. It imports no viewer or renderer, changes no library entries and grants no new use permission.

## Proposed Blender / viewer review sequence

1. Author an original asset or obtain a documented grant for the intended scope; record reference/configuration evidence. Do not download restricted third-party models.
2. Export GLB under the museum namespace with units/axis documented. Keep a source checksum and export provenance; preserve attribution and modification history.
3. Verify actual bytes, GLB validity, referenced resources, dimensions, mesh/material budget and rights in an isolated asset review. Check dimensional references independently before `validated` fidelity.
4. If an exploded experience is intended, establish assembly boundaries and checksum-matched mapping. Connected exterior surfaces are not automatically authentic assemblies.
5. Review the existing `VehicleAsset` identity/rights metadata and use the bridge only for a truly matching file. Adapt a museum-only renderer separately; do not modify race asset selection, LODs, calibration, cameras or replay.
6. Run source/licence/GLB/assembly tests and accessible fallback/mobile checks before enabling display. No step occurs automatically because a JSON field says `supplied`.

No current plan supplies an authentic historical reconstruction. These gates deliberately leave original-asset authoring, measured circuit maps and renderer implementation open for a later authorised stage.
