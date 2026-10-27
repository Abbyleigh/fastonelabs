# F1 Strategy Lab — strategy workbench

## Start

Double-click `Start F1 Strategy Lab.command` in this project folder, or run this single Terminal command:

```zsh
"$HOME/Documents/f1-strategy-lab 4/Start F1 Strategy Lab.command"
```

The launcher checks ports 8001 and 5173, reuses recognised running services, starts missing services, waits for readiness, and opens http://127.0.0.1:5173. It does not stop existing services. If another app occupies either port it explains the collision and exits. Keep the launcher window open while using services it started; Control+C stops only those services. Logs are in `logs/backend.log` and `logs/frontend.log`.

## Use

Choose **Strategy workbench** on the archive home screen. Set the shared race length, baseline pace, pit loss and tyre degradation. Each plan supports zero to three stops, individual pit laps and a compound for every stint. Stops happen at the end of the chosen lap, so the following lap uses the fresh compound.

Rain starts on the selected lap and stays at the chosen intensity. Safety car is disabled at lap 0; otherwise it lasts for the chosen number of laps, ending at the race finish if necessary. During those laps pit loss is 55% of normal. Both plans see the same conditions. Invalid inputs hide the comparison and disable saving/export until corrected.

Read the total time, cumulative-gap chart or lap-by-lap table. A positive A-minus-B gap means B leads; negative means A leads. Open the engineering viewer and select components for explanations connecting engineering to strategy. The existing explosion slider, rotation, wireframe, search, expanded view and missing-model fallback remain available.

## Save and share

Name a scenario and choose **Save in this browser**. The same name replaces its previous saved version; up to 30 scenarios are retained. These are local to this browser and origin. Clearing site storage removes them. Use **Export scenario JSON** for a portable copy; **Import scenario JSON** validates files before loading them. Load does not automatically save an imported file.

**Export race briefing** creates a Markdown document containing assumptions, both plans, comparison and per-lap timings. **Copy race briefing** provides a clipboard alternative if downloads are inconvenient. Neither action publishes anything online.

## What the estimates mean

This is a deterministic educational model with example coefficients, not a calibrated race prediction. No external live data drives the workbench. Tyre age increases lap time linearly and a stop resets age. Traffic, overtaking, fuel burn, temperature, track evolution, red flags and energy deployment are not simulated. Rain penalties are simplified. Safety-car laps use a shared minimum time. Plans do not automatically change tyres when rain starts. Tyre-rule notes prompt checking event rules and are not eligibility validation.

## Verification

From `frontend`, run `npm run build` and `node --test tests/strategyModel.test.mjs`. The latter checks pit boundaries, degradation, rain onset, safety-car pit savings, input validation, deterministic results and JSON round trips.

The pre-change backup lives in `backups/strategy-suite-20261027-203407`, with a manifest recording all files touched. It includes the viewer with its earlier upgrades and missing-model fix.

## Race planning upgrades

1. Select an event in the calendar and choose **Plan this Grand Prix**; event, season, round, circuit and date appear in the workbench.
2. For recorded race references, open a completed event's results and choose **Compare strategies for this race**. If available and within the model's supported range, the starting distance uses the winner's completed laps, and pace uses the winner's fastest lap plus an illustrative five-second margin. Completed distance may reflect a shortened race; it is not scheduled distance. Calendar-only plans retain example lap and pace assumptions until edited.
3. **Circuit assumptions** offers balanced, higher tyre wear and costly pit lane examples. These change pit loss and degradation only; they are not measured circuit settings. All condition fields remain editable. Restore race starting assumptions resets plans and conditions; detach removes metadata without changing plans.
4. The dry-baseline table compares the same pit plans with rain and safety car disabled. A positive change means current conditions add time. Compounds are unchanged, including any selected intermediate/wet tyres.
5. Event metadata now accompanies browser saves, JSON imports/exports and race briefings. Original scenarios without metadata remain compatible. Saved entries show circuit context.

Backup before these upgrades: `backups/race-planning-20261027-204125`. Validation: production build and all 12 model tests passed; browser checks covered calendar and results entry, reference seeding, assumption profile, baseline table and saving context.

## Strategy search and decision tools

- **Tyre-stint timelines** show compounds, inclusive lap ranges and stint lengths for both plans, with text labels alongside colours.
- **Search pit strategies** searches every feasible integer pit schedule for the two selected compound sequences and stop counts. A minimum stint length (1–20 laps) applies to every stint. Up to five schedules per source plan are ranked together. The search does not choose new compounds or validate regulatory eligibility. Negative gain means the minimum-stint constraint made that candidate slower than the original plan.
- Apply a ranked candidate to A or B. This updates the editor, comparison and timeline. Changes to conditions, plans or minimum stint length invalidate the displayed search. Save the scenario to retain an applied result.
- **Sensitivity checks** recalculate the same two plans for ±20% degradation, ±5 seconds pit loss, and rain starting three laps earlier/later. Supported bounds clamp the changes; some checks may therefore be identical. Rain timing has no effect with rain off. No probability or calibrated confidence is implied.
- **Strategy recommendation** describes the current leader and outcomes across the seven checks. It and the sensitivity table are automatically included in copied/exported briefings. Search results themselves are not saved; applying a result makes it part of the normal saved plan.

Validation: production build and all 16 model tests passed, including exhaustive-search agreement, minimum-stint boundaries and worst-size runtime. Browser checks verified search, application to plan B, editor/timeline updates and stale-result invalidation. Pre-change backup: `backups/strategy-tools-20261027-204941`.

## Race-specific recorded replays

Select a completed event from 2023 onwards and choose **Load recorded 3D replay**, either on the calendar or the results page. The loader resolves the selected archive date to its own OpenF1 race session, reconstructs a circuit reference from a usable timed lap and loads positions for the session's driver roster. Unknown non-competitor tracking IDs are excluded.

Each excerpt contains up to 60 seconds of recorded positions. Use Previous/Next minute or **Jump to minute** to navigate. The displayed clock is elapsed from the earliest recorded first-lap start, falling back to the earliest usable lap if that is unavailable. It is not guaranteed to be the official race-start clock. Long laps, including red-flag interruptions, remain in the available recorded timeline; missing source timestamps cannot be reconstructed. Gaps longer than two seconds are not interpolated by the renderer.

Telemetry availability depends on the provider. No matching session, missing circuit samples, unavailable car positions or provider outages produce explicit messages. Races before 2023 retain results and strategy tools but do not get an invented replay. The app does not substitute Silverstone or another race when the selected race is unavailable.

Checked against British GP 2024 (session 9558) and Monaco GP 2024 (session 9523), including browser minute navigation and a 20-driver Monaco roster. Six new regression tests cover event matching, shared timestamps, offsets, caching, red-flag timing, malformed samples, unsupported/future/ambiguous sessions and non-competitor filtering. Pre-change backup: `backups/dynamic-replays-20261027-211910`.


## Real race viewing
Calendar selections, race results and 3D replays now include real-footage options. Full-race links open the official F1 TV home page; search the displayed season and Grand Prix name there. This is not a direct replay link or a shared subscription. Availability and delays depend on region and plan.

Verified official Formula 1 highlights are mapped for 2024 Monaco (round 8) and Britain (round 12). Players load only when opened, use youtube-nocookie.com, and include direct YouTube and Formula1.com fallbacks. Embedded playback was restricted in the test browser; external playback remains subject to publisher availability. Other completed races link to a race-specific search within Formula 1’s official YouTube channel, not an invented match. Upcoming races have no highlights button. Change race/year resets the player.

Verified sources: https://www.youtube.com/watch?v=aeCI0ObFY8M and https://www.youtube.com/watch?v=yPvoKz6tyJs. Further verified uploads can be added to frontend/src/RaceViewing.tsx by year/round. No broadcasts are downloaded or rehosted.


# Circuit previews and realistic-driver next steps

Completed circuit changes
- Recorded replays and circuit previews share textured asphalt, procedural grass, striped kerbs, illustrative barriers, sky lighting and shadows. Simple replay cars are grounded and cast shadows. Safety barriers are omitted where their sampled segments would cross the recorded road ribbon.
- Every calendar event has Explore circuit preview. The backend identifies the requested event by year/round, then resolves a past recorded event with the exact same circuit ID from 2023 onward. It never silently substitutes Silverstone or another circuit. The preview identifies both the requested event and reference event/year/date.
- Upcoming 2026 Mexico, Brazil, Las Vegas, Qatar and Abu Dhabi resolved successfully to their respective 2025 events; Silverstone 2024 resolves to British GP 2024. These are historical outlines, not verified future layouts or future race telemetry. No future car positions/results are generated.
- Preview controls: daylight/dusk visual study, automatic orbit, overview, low inspection view, expanded viewer with Escape close, and event-specific strategy planning.
- Historical lap rows with missing timestamp text are now skipped correctly instead of raising an AttributeError.

Limits
This remains a flat, illustrative environment around recorded lap coordinates. It is not photorealistic or surveyed; buildings, grandstands, accurate elevation, materials and venue-specific scenery have not been reconstructed. Existing 3D driver figures remain studies, not new realistic likenesses.

Asset research
The Silverstone and Yas Marina free listings by Dave Love SketchFab are tagged as ripped/extracted from a commercial game. No circuit GLB from those listings was downloaded or installed. A commercial Silverstone candidate exists at https://www.artstation.com/marketplace/p/Jgzbq/silverstone-circuit but has not been purchased or inspected. Its listing has view-count/project limits, so public-browser use must be confirmed with the seller. A licence label alone is not verification of provenance.

Recognisable drivers
The separate recognisable-driver-brief.md specifies the first character: Lewis Hamilton in agreed 2026 Ferrari clothing/helmet. The main missing work is a finished recognisable head/body and matching outfit, with browser-ready rigging and poses. Generic body purchase alone will not produce a likeness. No modelling commission or purchase was made.

Verification
Production build passes; 25 frontend and 20 backend tests pass. Tests cover future-event references, circuit identity mismatch, no unrelated-circuit substitution, missing telemetry, and null timestamp handling. Browser checks verified Mexico and Silverstone previews, lighting, camera/expanded controls and no console errors. Other four upcoming references were verified with actual data. The read-only demo API serves previews through its existing /api/track route.

Backup: backups/circuit-preview-20261027-221357.
