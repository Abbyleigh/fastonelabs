# Complete failure investigation

29 October 2026. Every observed failure is listed below, including 18 explicitly reported unittest subcases. Paths are relative to `frontend/public/`. No files were fabricated, tests skipped, assertions loosened or assets regenerated.

Primary classification for **each of the 25 rows**: **missing asset / unavailable fixture**. Secondary classification: **existing baseline failure**, reproduced at the `da2f414` snapshot in the same Python environment (108 pass / 23 reports); current `433f33c` snapshot is 129 / 23. No new failing identity appears. This establishes lineage, not acceptability. Original-asset correctness remains blocked.

`read_model_bytes` first checks for the original file. If absent it looks up the logical path in `packed-models.json`. Only two originals have packed alternatives. For the other missing files, that dictionary lookup raises `KeyError`; this is an unhelpful diagnostic, **not evidence of an invalid GLB or SQLite defect**. The packed alternatives themselves are absent. Engineering labels are independently absent. The missing bytes prevent later structure, licensing, hash and mesh assertions from being evaluated.

| ID | Test / subcase | Missing input | Observed exception |
|---|---|---|---|
| F01 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/aston-martin/2026/car.glb` | KeyError: absent manifest key |
| F02 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/cadillac/2026/car.glb` | KeyError: absent manifest key |
| F03 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/mclaren/2026/car.glb` | KeyError: absent manifest key |
| F04 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/mercedes/2026/car.glb` | KeyError: absent manifest key |
| F05 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/ferrari/2023/sf23.glb` | FileNotFoundError: packed/sf23.glb.gz.part0.bin |
| F06 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/ferrari/2026/car.glb` | KeyError: absent manifest key |
| F07 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/audi/2026/car.glb` | KeyError: absent manifest key |
| F08 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/haas/2026/car.glb` | KeyError: absent manifest key |
| F09 | `test_every_source_triangle_has_one_valid_inspection_group` | `models/cars/red-bull/2026/car.glb` | KeyError: absent manifest key |
| F10 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/aston-martin/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F11 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/cadillac/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F12 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/mclaren/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F13 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/mercedes/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F14 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/ferrari/2023/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F15 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/ferrari/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F16 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/audi/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F17 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/haas/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F18 | `test_groups_match_counts_and_keep_four_wheel_regions` | `models/cars/red-bull/2026/engineering-parts.bin` | FileNotFoundError: engineering-parts.bin |
| F19 | `EngineeringParts.test_mapping_bounds_are_finite_and_source_nodes_exist` | `models/cars/aston-martin/2026/car.glb` | KeyError: absent manifest key; stops at first model |
| F20 | `Models.test_archive_models_have_embedded_textures_and_identity` | `models/cars/packed/sf23.glb.gz.part0.bin` | FileNotFoundError; archive loop stops at Ferrari 2023 |
| F21 | `Models.test_car_has_named_assemblies_and_licence` | `models/cars/packed/f1-assembly.glb.gz.part0.bin` | FileNotFoundError |
| F22 | `Models.test_driver_is_valid_embedded_glb` | `models/drivers/racing-driver.glb` | KeyError: absent manifest key |
| F23 | `Models.test_hamilton_portrait_is_separate_from_full_body` | `models/drivers/portraits/hamilton.glb` | KeyError: absent manifest key |
| F24 | `fanExperience: catalogue thumbnails retain source, licence and exact original bytes` | `images/vehicles/ferrari-2023.jpg` | ENOENT; loop stops at first thumbnail |
| F25 | `packedModels: packed delivery retains byte-identical original GLBs within per-file hosting limits` | `models/cars/packed/f1-assembly.glb.gz.part0.bin` | ENOENT; loop stops at first part |

## Remediation per row and masked checks

For F01–F09: stage the **exact original** model or its existing manifest-matched distribution parts using the no-clobber helper; then rerun source SHA-256, triangle ownership, label length/code and entry-offset assertions. Ferrari 2023 can use its complete packed part sequence. Do not regenerate mappings to fit different bytes.

For F10–F18: stage the corresponding original `engineering-parts.bin`; confirm count, grouping codes, all four wheel regions and declared availability against the existing JSON. Even after labels arrive, F01–F09 must pass against original geometry.

F19 must then validate finite bounds and source-node names for **all nine** model folders. F20's first missing asset masks eight 2026 cars; verify all nine models, embedded textures and metadata. F21 checks 16 named assemblies and attribution. F22 checks embedded buffers, skeleton and BELAZ provenance. F23 checks portrait geometry, identity and absence of a misleading full-body path. These assertions are not yet exercised successfully.

F24 masks the rest of all nine thumbnails: copy each original JPEG, verify bytes and SHA-256 against `images/vehicles/ATTRIBUTION.json`, source, licence and size limits. F25 masks later parts and the second model: stage **all** chunks in `models/packed-models.json`, verify each length, compressed hash, decompressed length/hash and GLB header. Do not substitute direct GLBs for the packed delivery test.

Stop if any original is absent, differs from the expected hash, is an LFS pointer, or lacks permission to copy. Preserve its path and expected/actual hash for the owner. Access to the original Mac assets is required to close these rows. A pass in metadata-only tests cannot close them.

## Reproduce without suppressing failures

From an isolated checkout with its own dependencies:

```sh
python -m pytest -q --junitxml=/tmp/heritage-backend.xml > /tmp/heritage-backend.log 2>&1
# Record the exit code immediately; expected here: 1.
npm --prefix frontend test > /tmp/heritage-frontend.log 2>&1
# Expected here: 1. Never infer success from the last command in a compound shell block.
```

The console log is authoritative for subcases: this runtime's JUnit XML collapses them to seven parent cases. Counting only XML cases would hide 18 subcase reports. `pytest.ini` intentionally excludes a nested copied sprint test tree; it is not a second runnable project. All collected current suites were run, without excluding asset tests.

Environment findings: dependencies are ranged, not Python-locked; this installed pytest reports subcases separately. Existing Starlette/httpx deprecation warning is a dependency compatibility concern, not a failed assertion. Node emits an environment `http-proxy` configuration warning; it does not explain asset ENOENT. No observed failure is currently classified as a proven implementation defect, configuration-caused assertion failure or new regression. Those categories must be reconsidered when original bytes unlock the remaining assertions.
