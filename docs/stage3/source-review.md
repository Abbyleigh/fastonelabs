# Stage 3 — Cooper evidence and reuse review

Review date: 29 October 2026. Scope: selected 1959–60 Cooper history with a referenced 1958 milestone and 1950 Silverstone context. The packaged batch contains 19 entities, 25 relationships, eight selected classification rows, two pending exhibit plans and 14 sources. All source reuse states stay **unreviewed**. Evidence verification is not permission for redistribution or commercial use.

## Reviewed primary references

Each URL, publisher and check date is retained in `backend/heritage/data/cooper-1959-1960.json`; claims/links/results cite their own source IDs. Source IDs below match the data exactly. Pages are reviewed manually; no automated scraper, full table, article prose, photo or model is imported. Current pages are mutable: a check date is not a pinned publisher revision. Restricted raw source snapshots are not copied into Git.

| Source ID | Primary publisher / page | What is used / limits |
|---|---|---|
| cooper-history | [Cooper Car Company](https://www.coopercarcompany.com/cooper-history) | Marque history for T51 and championship association; not dimensional data |
| brabham-history | [Formula 1 Hall of Fame](https://www.formula1.com/en/information/drivers-hall-of-fame-jack-brabham.3XK2XWdL0moCmnSC55m84J) | Transition and Brabham context, including Moss's 1958 Cooper victory; no universal invention claim |
| goodwood-t51 | [Goodwood's T51 account](https://api.goodwood.com/grr/event-coverage/goodwood-revival/stirling-moss-race-winning-cooper-t51-returned-to-goodwood/) | Behind-driver placement and nominal four-cylinder/2.5-litre description; no period weighing sheet or serial-specific test result |
| sd-t53 | [San Diego Automotive Museum](https://sdautomuseum.org/explore/exhibits/formula-one-stories/1961-cooper-t53/) | Historical T53 frame/suspension/engine account; title labels a 1961 exhibit while text discusses 1960. That distinction remains in source notes and claims |
| silverstone-history | [Circuit operator history](https://www.silverstone.co.uk/about/history-grand-prix) | Identifies Brabham/T53 for the 1960 event; no survey coordinates |
| f1-monaco-1959 | [Official result](https://www.formula1.com/en/results/1959/races/169/monaco/race-result) | Winner only; published nine points retained |
| f1-british-1959 | [Official result](https://www.formula1.com/en/results/1959/races/173/great-britain/race-result) | Aintree, selected Brabham/McLaren rows; McLaren's fractional 4.5 points retained |
| f1-british-1960 | [Official result](https://www.formula1.com/en/results/1960/races/184/great-britain/race-result) | Silverstone, winner only; not a full classification |
| f1-drivers-1959 | [Official final standings](https://www.formula1.com/en/results/1959/drivers) | Selected winner's counted points; no sum-all-races reconstruction |
| f1-constructors-1959 | [Official final standings](https://www.formula1.com/en/results/1959/team) | Selected constructor/engine winner, not every Cooper pairing |
| f1-drivers-1960 | [Official final standings](https://www.formula1.com/en/results/1960/drivers) | Selected winner and McLaren identity/position context |
| f1-constructors-1960 | [Official final standings](https://www.formula1.com/en/results/1960/team) | Selected winner only |
| f1-race-1950 | [Existing official result source](https://www.formula1.com/en/results/1950/races/94/great-britain/race-result) | Existing 1950 event identity for comparison, not copied modern geometry |
| f1-first-race | Existing first-race editorial source, carried unchanged from the original seed | Retained source for the 1950 venue context; not used to supply new Cooper measurements |

## Decisions that avoid false precision

- **Aintree is not Silverstone.** The two British GP records use the venues supplied for those event years.
- A circuit `coverage_start`/`coverage_end` spans reviewed records, not proof of every intervening layout. Silverstone 1950/1960 are dated event identities, not a claimed pair of different measured shapes or layout introduction/retirement dates.
- The shared engine record is named **Coventry Climax — selected 2.5-litre configurations**. Goodwood supplies T51 cylinder/capacity context; the museum explicitly names FPF for its T53 account. The data does not infer identical engines, revisions or a serial-specific T51 designation from the combination of those sources.
- A surviving T51 auction example is described with a later 2.7-litre Tasman-specification installation. It is **not used to fill period 1959 specifications**. No power, mass or dimensions are guessed from that example.
- Museum approximate T53 output is not promoted to measured event power. Missing measurements remain null and `missing`; no unverified claim is marked `verified` merely to fill a page.
- Period sources use “rear-engined”; the reviewed claim is behind-driver placement. The interactive mass positions are assumptions, not measured axle-relative Cooper coordinates. Cooper is not described as the inventor of all mid-engine racing machinery.

## Original education, not historic telemetry

The beam diagram and three-mass equilibrium implementation are original project teaching material. The physical principle is cited to [OpenStax, University Physics Volume 1 §12.2](https://openstax.org/books/university-physics-volume-1/pages/12-2-examples-of-static-equilibrium). No textbook diagram or passage is reproduced. Assumed masses/positions are not stored as historical entity claims or used for lap times, telemetry, handling coefficients or comparative performance.

## Rights and unresolved gaps

No general redistribution grant is established for the publisher pages. Existing [source-rights policy](../data-sources-and-licensing.md) and [production gates](../production-readiness.md) still apply. No new images, third-party meshes, official typefaces, audio or video enter the branch. Future geometry requires its own dated coordinates, accuracy evidence and reuse permission. Future historic assets require creator/attribution, file identity, permitted use and fidelity/assembly review; a creator licence alone does not clear all depicted marks or personality rights.
