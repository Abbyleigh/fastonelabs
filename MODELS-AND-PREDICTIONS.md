Current behaviour: Engineering uses the same selected car as the garage. See the final section for the latest component-grouping details.

# Driver garage, real photos and predictions

The app now contains a detailed 2026 concept-car GLB and an original helmeted racing-driver GLB. The car is by Qvist_designs under CC BY 4.0, adapted by APEX into selectable assemblies. Credits and licence links appear in the viewer and accompany the file. It is not official team CAD. The driver is a personalised study model, not a scan or exact likeness.

The 22 drivers from the latest archived race have selected Wikimedia Commons racing-photo entries, with author, licence and source links. These are archive photos; the pictured car/team/year can differ from the latest race. Older archive profiles use a conservative photo lookup and show an unavailable state when no suitable photo can be retrieved.

## See the new features

- Open a driver profile for the real-photo gallery and 3D garage. Use **Driver model** to view the helmeted figure. Component selection, explosion amount, rotation, wireframe and expanded view remain available.
- Select an event on the calendar and choose **AI race forecast** for the results-trained finishing-order model. At least four earlier races and 60 result records are required. The current example trains through round 18 for round 19.
- Open **Strategy workbench** for the **Strategy uncertainty forecast**. It runs 200 paired assumption samples with your two plans. These shares are scenario outcomes, not calibrated real-race probabilities.

## Installing another model

Use self-contained binary glTF (`.glb`) files with embedded textures, Y-up orientation and appropriate reuse rights. The installer accepts files below 150 MB. Car disassembly needs separate mesh objects with semantic names such as `frontWing`, `rearWing`, `floor`, `chassis`, `wheel`, `suspension` and `engineCover`. A one-piece car can display, but will not gain separate physical components merely by being installed.

Open Terminal, then:

```zsh
cd "$HOME/Documents/f1-strategy-lab 4"
```

To install a Hamilton-specific driver model downloaded to Downloads:

```zsh
python3 install_model.py --driver hamilton "$HOME/Downloads/hamilton.glb"
```

To replace the shared car model, supplying the creator's credit:

```zsh
python3 install_model.py --car "$HOME/Downloads/car.glb" --creator "Creator name" --license "Licence name"
```

Use the real creator and licence terms from your model's source. The installer also accepts `--source` with an HTTPS source-page URL. Keep any required original attribution/change notices with redistributed assets.

The installer backs up the existing asset, validates the GLB and embedded resources, rebuilds the frontend, and restores its previous files if the build fails. Refresh the app afterwards. A driver-specific file takes priority over the generic helmeted model.

Installed paths:

- `frontend/public/models/cars/f1-assembly.glb`
- `frontend/public/models/cars/model-info.json` — visible car credits
- `frontend/public/models/drivers/racing-driver.glb` — shared study driver
- `frontend/public/models/drivers/hamilton.glb` — example optional profile-specific file

## Prediction limits

The race model fits ridge regression to earlier rounds of the selected season. Features are starting-position input, five-race driver form and ten-result team form. When available, qualifying position acts as a starting-position proxy; otherwise the last earlier race's grid is an estimate. Penalties, weather, upgrades, circuit-specific pace and actual future entries are not inferred. A chronological holdout error is displayed. Simulated win/podium frequencies and 80% position ranges are uncalibrated.

Strategy uncertainty uses the existing educational tyre model. It varies degradation ±20%, pit loss ±5 seconds, rain onset ±3 laps and rain intensity ±10 percentage points when rain is enabled. Safety-car timing stays fixed. Bounds can make samples overlap. It is not a tyre model trained on telemetry.

Validation: production build; 17 strategy tests; four forecast tests; two model-asset tests; one racing-photo catalogue test. Browser checks verified photo loading, the car and driver renders, race forecasts and strategy uncertainty. Backup before changes: `backups/profiles-predictions-20261027-205309`.

Model source: https://sketchfab.com/3d-models/f1-2026-concept-polygon-model-ea3bde709b1e4dc9b0ec8557d106ed42
Licence: https://creativecommons.org/licenses/by/4.0/


## Combined garage presentation
The garage opens with Car & driver: the assembled concept car, helmeted cockpit figure, and a standing driver at illustrative relative scale. Engineering retains component inspection/disassembly. Driver model opens the larger figure. Study helmet colour applies to generic standing and cockpit figures; Reset restores the profile colour. Profile-specific GLBs keep their original materials. Rigged driver instances use SkeletonUtils cloning to preserve separate skeletons. These changes do not add authentic team geometry or a real driver likeness.


## Downloaded and identity-matched models (27 October 2026)
Installed: Redgrund Ferrari SF23 (2023); Dave Love SketchFab Ferrari SF-26 and Mercedes W17 (2026); BELAZ generic rigged driver; Sroxyn Lewis Hamilton Head (2023 release). All source listings report CC BY 4.0; individual credits/source/limitations accompany assets. The car catalogue explicitly matches driver ID, constructor and season. 2026 Hamilton/Leclerc match Ferrari, Russell/Antonelli match Mercedes; other profiles keep the concept fallback. Original car liveries and driver outfits are retained, so painted race numbers and helmets are not automatically driver-specific. Models represent creator-labelled exteriors, not official CAD.

Car & driver provides a Display car selector for manual archive comparison. Engineering always retains the component-separated concept because downloaded cars use unnamed mesh groups. Generic driver has a skeleton but no animation. Its pose, original clothing and face are not a named driver's likeness. Hamilton head study is separate from the full-body driver and includes historical suit collar details; its eye detail is incomplete. It is not a finished contemporary full-body avatar.

Downloaded assets were checked for self-contained GLB resources. Build, 15 backend tests and one frontend identity-matching test pass. Visual checks: 2023 Ferrari, 2026 Mercedes matched to Antonelli, Hamilton head front view, and 2026 Ferrari matched to Hamilton. Backup: backups/downloaded-models-20261027-214827.

Remaining: matching downloadable assets for other teams/seasons, validated full-body named-driver likenesses, year-specific suit/helmet liveries and seated rigs. Those must not be represented by silently relabelling the generic avatar or a different-season car.


# Race-grid garage build

Open a completed event, then choose **Explore this race’s 3D garage**. The garage uses that event’s actual archived entries and season, includes driver/team search, and links each entry to its photos and career profile.

Installed 2026 team representations: Ferrari, Mercedes, McLaren, Red Bull, Aston Martin, Audi, Cadillac and Haas. This covers 16 of the 22 entries in the 2026 United States Grand Prix archive. The 2023 Ferrari SF23 remains selectable separately. Original liveries and painted numbers remain unchanged; a team/season match is not a claim of per-driver livery accuracy or official CAD provenance.

Drivers: original helmeted team-colour study is the default, with a selector for the BELAZ generic rigged person. Helmet colour is adjustable. Hamilton retains a separate historical head study, whose eyes are incomplete. No full-grid facial likenesses, authentic suit/helmet sets, seated animations or motion capture have been added.

All downloaded car listings report CC BY 4.0. Asset folders include creator/source/licence metadata; the viewer shows attribution. Models load on selection rather than downloading all eight teams at startup. Engineering retains the separated concept for component descriptions and explosion controls. Existing missing-model detection is unchanged.

Validation: production build; 25 frontend tests; 15 backend tests; all six newly installed cars inspected in-browser. Fixed a React/3D scene-label removal error found while changing drivers: labels now render in the regular viewer interface, and loading uses a 3D wireframe placeholder. Repeated model-switching check on the final build reported no new browser errors. Demo server serves new GLBs and credits successfully.

Backup: backups/full-grid-garage-20261027-215703.

## Remaining model gaps

Williams, Alpine and Racing Bulls use the concept fallback. Searches did not establish suitable free downloadable representations for these three. Marketplace candidates exist for Williams and Alpine; purchasing and any public-web distribution rights need resolving before installation. No purchases were made. Finished full-body current-driver likenesses also need appropriately licensed assets or commissioned modelling. A generic avatar, historical head or game-specific livery is not treated as a finished likeness.

## Installed model credits

- Aston Martin AMR26 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/a50d1c7bc086455c9412470d93fc3fc7

- Audi R26 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/32bf228264b047669b100b0f1b8769ac

- Cadillac MAC-26 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/95bcd37aa7c649779efc33b90b6c023e

- Ferrari SF-26 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/e5ca6cecdc42449283f4bed27360f2a7

- Haas VF-26 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/1f41e03886724bc6acd16c92402989bc

- McLaren MCL40 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/96214ad5624f42a0861f77008f8d29e7

- Mercedes W17 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/b806f1e70aa343219e7158169549b97b

- Red Bull RB22 — Dave Love SketchFab, CC BY 4.0: https://sketchfab.com/3d-models/0a3d24a58e0549d591a5a48c22eec383


## Garage inspection and export
Added night/bright-studio lighting, adjustable camera distance, numbered original study suit, correct front-view orientation for downloaded cars, and credited PNG capture with preview and download link. PNG download was verified in the in-app browser (norris-2026-garage.png), and the saved image inspected. Blob downloads replace direct data-URL downloads, which did not complete in that browser. Export includes creator/source/CC BY licence URL and generic-figure disclaimer. No new third-party driver likenesses or additional team models were installed during this inspection pass.

Final validation: production build and all 40 tests pass. Final browser check showed no new errors. Backup: backups/garage-inspection-20261027-220250.


# One selected car throughout the garage and Engineering

Engineering now uses the same selected car model, fitting, livery and material textures as Car & driver. Selection persists when changing tabs; the car selector is available in both views. Bodywork, wheels and supported front/rear-wing/suspension surface groups can be highlighted, isolated and animated apart. Changing cars resets the previous component selection and explosion state.

The nine installed team/season GLBs are unchanged. Offline grouping maps assign each original source triangle exactly once using connected surfaces, material names and conservative spatial grouping. No replacement wheels or bodywork, new internal geometry, changed UVs, or recoloured team liveries are introduced. Grouping is approximate inspection geometry, not a manufacturer’s mechanical assembly hierarchy. Wheel groups can include adjoining hub/brake/suspension details; other unseparated surfaces remain in Body.

Floor and internal power-unit groups are unavailable in these downloaded exteriors. Those buttons are labelled explanation only. Their text remains accessible, isolation is disabled and the same complete selected car stays visible. No concept car is substituted. An unavailable selected asset shows an error and asks the user to choose another model. The established missing-model detection for concept fallbacks remains unchanged.

All original model credits remain in the viewer and image exports. Per-model engineering-parts.json/bin maps include source SHA-256 and triangle counts; model-info.json records the added grouping. The maintained preparation helper is tools/prepare_engineering_parts.py (uses the existing backend NumPy/SciPy environment).

Validation: production build; 25 frontend tests and 23 backend tests pass. New integrity checks verify source hashes, every source triangle assigned once, contiguous map ranges, valid bounds/source nodes, taxonomy counts and all four wheel regions. Browser checks verified McLaren bodywork/wheels/explosion, Ferrari SF23 wheel isolation, Mercedes wheel isolation, unavailable-floor behaviour, changing selected car within Engineering, and credited PNG export. No browser errors reported. New map assets are served by the read-only demo server.

Backup: backups/consistent-engineering-20261027-222528.
