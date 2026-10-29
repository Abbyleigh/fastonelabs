# Complete browser regression checklist — Heritage integration

Run on the original-asset Mac worktree using [the non-destructive procedure](heritage-mac-validation.md). **Not yet executed on the Mac.** Stage 2 is the visual baseline; do not redesign it during validation. Pass/fail/blocked are evidence states, not predictions.

## Test record

Record reviewed commit, source baseline commit, Mac/macOS, browser/version, GPU/WebGL2 availability, Node/Python/package resolutions, port pair, viewport, reduced-motion preference, provider/cache status, timestamp, reviewer and console/network errors. Keep screenshots local/private until media rights permit sharing. Record every row as **PASS / FAIL / BLOCKED / N/A with reason**; an untested row stays unchecked. External provider outages and missing binaries are BLOCKED, never PASS. No live AI spending is required.

Use desktop 1440×1000, tablet 834×1112, mobile 390×844 and narrow mobile 320×740, plus 200% browser zoom. Check Chrome and Safari on Mac; test an actual mobile browser if available. WebKit emulation is not an iPhone performance certification. Use a separate review browser profile so saved garage/strategy state in the simulator profile remains untouched.

## Shell and homepage

| ID | Action | Expected result | Evidence |
|---|---|---|---|
| H01 | Open `#home` directly and reload | Site shell loads; no page-level error or endless loading | Full-page screenshot, console |
| H02 | Use skip link, keyboard navigation, menus, Escape and browser back/forward | Visible focus; menus usable without hover; route matches selection; no trap | Keyboard notes |
| H03 | Inspect cinematic car presentation with original assets | Model/materials load; approved photograph/credit appears; no invented historical label; complete model framing | Desktop screenshot and failed-request inventory |
| H04 | Use car presentation and engineering entry controls | Labels and controls work; selected object/explanation matches; leaving route releases the page normally | Short interaction recording |
| H05 | Compare display type, body type and labels to accepted baseline | Barlow Condensed / DM Sans / IBM Plex Mono actually load or fallback is explicitly documented; no silent font-fidelity pass | Computed font / font network entries |
| H06 | Select weekend and season using the shared workspace | Selected race is retained across appropriate screens; labels are legible and provider failures are explicit | URL/context record |
| H07 | Reload with slow connection / blocked photo request | Meaningful fallback, no broken layout or accidental official endorsement | Failure screenshot |

## Race Centre and 2024 British GP replay

Exact target: `#replay?year=2024&round=12&name=British+Grand+Prix` (2024 round 12). Do not substitute the Stage 2 Australian GP reference capture. Keep all simulator code unchanged; record a failing case for its owning session.

| ID | Action | Expected result | Evidence |
|---|---|---|---|
| R01 | Reach Race Centre through navigation, then select 2024 British GP | Event/year/round match; replay is labelled recorded, not live | URL and workspace screenshot |
| R02 | Open the target deep link in a fresh tab and reload | Same recorded event; no fallback to a current race | URL and response provenance |
| R03 | Load first recorded minute | Map, timing and channel panels finish loading or explicitly show unavailable channels; real provider provenance remains visible | API status, timestamp, screenshot |
| R04 | Play/pause, speed controls, seek forward/back repeatedly | One clock drives visible state; pause stays still; repeat seek is deterministic; controls remain responsive | Short recording and race-state check result |
| R05 | Cross a minute boundary using next/previous and jump controls | Selected window, time labels and loaded data agree; no accidental event switch or stale state | Windows and request trace |
| R06 | Select multiple drivers, switch fan/analyst views and camera controls | Selected identity, timing and visible focus agree; original model/camera behaviour remains; no regression caused by heritage navigation | Driver selections, analyst screenshot |
| R07 | Inspect circuit alignment/model loading where supported | Original geometry/calibration and appearance match the simulator baseline; no 1950 museum layout imported here | Owner-reviewed screenshot; do not recalibrate |
| R08 | Open/close recorded pit wall and return from another page | Map/timing/channel state stays coherent; route context and expected play/pause behaviour remain | Interaction notes |
| R09 | Simulate unavailable data / 429 / slow response | Explicit error/retry/unavailable state; no unbounded request loop or fabricated telemetry | Sanitised network log |
| R10 | Test official highlights/F1 TV links without copying video | Correct external destination and restrictions/fallback; no claim that footage is local or licensed for redistribution | Link inventory only |
| R11 | AI disabled in review environment | No paid call; disabled/rejected state does not break recorded replay | Network POST status |

## Heritage Museum

| ID | Action | Expected result | Evidence |
|---|---|---|---|
| M01 | Open `#museum?section=origins` directly | Accepted Stage 2 navy/teal editorial catalogue, site shell intact | Desktop/tablet/mobile screenshots |
| M02 | Use race / machine / circuit entry points | Correct reviewed record opens and heading receives focus; back restores search focus | Focus/record IDs |
| M03 | Search by driver/car/circuit, filter kind/year, paginate and clear | Counts/results/pagination agree; empty and loading states are meaningful | Cases and screenshots |
| M04 | Inspect Alfa 158 claims, race results and standings | Citations present; partial rows labelled; unspecified weight basis and absent model stay explicit | Record/source IDs |
| M05 | Follow driver → constructor → car → circuit relationships | Correct connected identities and period; no full-career/full-season coverage implied | Click path |
| M06 | Open Silverstone 1950 circuit study; expand/collapse | Dated layout identity; missing lap length/geometry visible; no invented/modern track; ARIA expansion correct | Expanded screenshot and keyboard notes |
| M07 | Follow links to timeline, Alfetta exhibit, experiments and historical race views | Existing sections load with correct context; back/navigation work | URL list |
| M08 | Use timeline theme/decade/search and car collection search/select | Correct content and empty state; verified history and engineering interpretation remain distinguished | Filter cases |
| M09 | Open historical official Sketchfab embed only on request | No automatic third-party mesh download; source/creator/licence and approximate fidelity remain visible; blocked embed has a usable page | Network/credit screenshot |
| M10 | Compare generations and operate engineering lessons | Selected cars/specifications correct; unknown comparisons stay unknown; original teaching diagrams are labelled | Calculation inputs/results |
| M11 | Query public historian for known and unrelated questions | Sourced curated records or abstention; GET does not invoke AI; no secrets exposed | Response mode/source IDs |
| M12 | Simulate failed catalogue request and retry; type rapidly | Error/retry works; cancelled/stale results do not replace newer query | Request and final query |
| M13 | Navigate museum sections without available WebGL | Library-only containment is not assumed to protect all historic local-model embeds; record any other page failure for separate review | Exact exhibit and stack if failing |

## Vehicle Library and Personal Garage

| ID | Action | Expected result | Evidence |
|---|---|---|---|
| V01 | Open `#library` with WebGL and original assets | Catalogue/profile/real model appear; no page boundary | Model ID, GL availability, screenshot |
| V02 | Filter model/season/constructor/size/engineering; produce zero results | Filters compose correctly; meaningful empty state; selected profile remains usable | Inputs/results |
| V03 | Select every installed car individually | Correct original livery and model; no loading spinner forever; attribution and approximate dimensions remain clear | Model ID + GLB/packed/labels request statuses |
| V04 | Use exterior, transparency, exploded and flow modes where enabled | Supported controls work; unavailable modes disabled; no fake internal detail or CFD claims | Modes and visible disclosures |
| V05 | Fit model and camera presets, fullscreen, rotate/reduced motion | Original viewer behaviour preserved; denied fullscreen returns useful state; reduced motion stops auto-rotation | Controls and short recording |
| V06 | Open comparison and change comparison car | Both independent profiles/previews work; no unsupported numerical performance ranking | Comparison screenshot |
| V07 | Disable WebGL in test browser and load library | “Interactive vehicle preview unavailable”; catalogue, metadata and credits survive; no whole-page error | Console error and contained fallback screenshot |
| V08 | Retry with graphics still blocked, then restore graphics and retry | Retry contains repeated failure; restored WebGL recovers preview; no storage loss | Automated runner log |
| V09 | Fail only comparison preview | Primary viewer, filters and both profiles remain usable | Automated runner log |
| V10 | Block a model/engineering label/packed chunk request separately | Existing model/map fallback is distinct from graphics failure; no wrong replacement car; HTML responses rejected as models | Request and visible fallback |
| V11 | Save/remove favourite; choose garage display; reload `#personal-garage` | Choices persist only in review profile; selection is not a race-performance change | Storage keys and resulting profile |
| V12 | Corrupt garage JSON and deny localStorage in test profile | Safe default/load and save-error message; no page crash | Reproduction steps, no real profile deletion |

## Engineering exhibits and cross-page integration

| ID | Action | Expected result | Evidence |
|---|---|---|---|
| E01 | Open existing homepage Engineering Explorer and museum innovations | Original assets load; no changed rendering/camera behaviour; museum teaching copy retains sources | Source/model IDs |
| E02 | Select front/rear wing and suspension explanations | Correct component/explanation; approximate surface grouping and unknown internals remain disclosed | Selected parts |
| E03 | Exercise aerodynamic sliders, generation comparison and fullscreen | Calculations update; no overflow; assumptions/units/caveats visible | Inputs/output values |
| E04 | Move home → replay → museum → library → home with browser back/forward | No page boundary, duplicated header, orphan loading state or wrong selected race | URL sequence and console |
| E05 | Repeat with reduced motion | No automatic animation required to understand/use museum; replay still obeys user play/pause | Preference, observed behaviour |

## Responsive/accessibility pass — repeat on H/R/M/V/E representative screens

- [ ] A01: At 1440, 834, 390 and 320px, document has no accidental horizontal overflow; wide result tables use their own labelled scroll area.
- [ ] A02: At 200% zoom, heading wrapping, buttons, labels, filters and navigation remain readable and operable; no clipped dialogs or sticky-header-hidden focus.
- [ ] A03: Touch controls and labels work without hover; controls are large enough to operate; no overlapping hit areas.
- [ ] A04: Tab/Shift-Tab order is sensible, focus visible, Enter/Space activate native controls, Escape exits menus/fullscreen, and focus returns sensibly.
- [ ] A05: Search/select controls have accessible names; loading/error states announce appropriately; circuit expansion exposes the correct controlled panel; hidden content is not tabbable.
- [ ] A06: Check text/control contrast with an accessibility tool; colour is not the sole evidence-status cue. Screenshots alone are insufficient.
- [ ] A07: Portrait/landscape orientation change and window resize retain usable canvas dimensions, filters and page position.
- [ ] A08: No active canvas/model/photo/iframe retry flood after leaving the route; monitor console/network and memory on repeated navigation.
- [ ] A09: Actual fonts, model/photo licences and captions load; no placeholder or omitted media is silently recorded as a visual pass.
- [ ] A10: Record Safari/WebGL context loss and mobile memory limits separately; library containment does not certify recovery from every possible GPU failure.

## Sign-off record and gates

Attach reviewed SHA, command exit codes, browser matrix, source/asset hash inventory, screenshots, failures and reviewer. Do not upload keys, full private prompts or unrelated local diffs. Complete automated suites and this browser matrix with original assets before proposing readiness. Keep unresolved owner-specific simulator failures documented; do not edit protected files. Passing private integration does not grant permission to publish data/media or enable public AI. See [merge/public-release gates](heritage-merge-readiness.md).
