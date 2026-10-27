# F1 RACE INTELLIGENCE — CHATGPT WORK IMPLEMENTATION BRIEF
**Detailed product and engineering specification | 27 October 2026**

## DIRECT INSTRUCTION TO CHATGPT WORK
Work on my **EXISTING** React + TypeScript + Three.js / React Three Fiber frontend and Python/FastAPI F1 simulator. We use **FastF1** for racing data. **DO NOT create a new disconnected app, delete the current project, or replace working components.** First inspect the current repository, running services, installed libraries, existing 3D scene, assets, FastF1 integration and API endpoints. Preserve functioning circuit selection, cameras, cars, race viewer, pit strategies, and any other capabilities you actually verify in source. Create a Git branch and baseline tests before modifying anything. If the repository or files are not accessible, request access to the existing code; do not claim implementation.

Our aim is a polished, technically serious **F1 Race Intelligence** experience: real historical 3D replay, hypothetical race simulation, explainable AI race engineering, strategy what-if scenarios, probability forecasting, and later commercial subscription products. Build and test incrementally, with verifiable deliverables; do not substitute screenshots for working code.

## SCOPE BOUNDARY: TWO SEPARATE TRACKS
**Track A — Core simulator (current primary work):** accurately rendered races, deterministic race state, replay engine, overtaking, tyres, 2026 energy/aero rules, pit strategy, AI Engineer, Parallel Universe, accuracy lab, AI Team Principal, driver twins and chaos simulation.

**Track B — Commercial/consumer platform (separate optional expansion):** premium pages, accounts, subscriptions, pricing, entitlements, usage metering, consumer predictions and future B2B API licensing. Build the UI architecture so Track B can integrate later; **do not introduce payments, sportsbook functionality, gambling accounts, odds feeds or real-money transactions into the core MVP.** Obtain approval before starting Track B backend monetisation or paid integrations. Betting-market analysis, if developed later, is probability research / historical or hypothetical virtual markets only, clearly delineated.

## DESIGN STANDARD — HIGHLY DETAILED AND FUNCTIONAL, NOT A WIREFRAME
Design at the standard of a **premium Formula One pit wall meets modern Bloomberg-like analytical workstation and high-end motorsport game**. Feel professional, high-density yet legible, striking and convincing, not a generic SaaS template. Dark graphite/near-black base, charcoal panels, subtle gradients, restrained team accent colours, cinematic track footage or original 3D rendering as hero, finely crafted typography, technical grid, subtle borders, deliberate spacing, micro-interactions. Strong visual hierarchy. Avoid overcrowded cards, tiny illegible labels, excessive glow and decoration.

Every main page must be detailed: real component compositions, purposeful chart legends, axis labels, tooltips, hovering and selection, table sort/filter, empty/loading/error states, contextual explanatory text, visible units, timestamps, provenance and confidence where applicable, keyboard accessibility, mobile responsive views. No static dummy buttons, fake calculated predictions, fabricated live data, or arbitrary fixed-value telemetry shown as real. If data is absent, show honest labelled demonstration fixtures / unsupported state. Use skeleton loaders where appropriate. Design desktop-first for intensive analysis, with tablet and mobile reductions and off-canvas panels. Provide responsive screenshots of key screens as progress evidence, but working functionality takes priority.

### Universal application shell
- Persistent compact left sidebar: Overview, Race Centre, Replay Library, Strategy Lab, AI Engineer, Parallel Universe, Prediction Lab, Team Principal, Drivers, Community (later), Account/Billing (later).
- Top control bar: season/year, Grand Prix/circuit, session, mode (**Recorded Replay** vs **Simulated Race** vs **Prediction**), current date/time, global search, help/settings, data source badge, and authenticated profile placeholder only if needed.
- Global race selector synchronized across pages and deep-linkable in URL.
- Consistent design system: tokens for colour, typography, spacing, radii, density, cards, chart palettes, statuses; accessible contrast. Visually distinguish original real data, interpolations, predicted outputs, and fictional simulations.
- Saving/exporting and deep links should genuinely work where implemented; unfinished features marked 'Planned', never presented as live.

## DETAILED PAGE SPECIFICATIONS

### PAGE 1 — OVERVIEW / COMMAND CENTRE (`/dashboard`)
Purpose: impressive overview on load and gateway to a specific Grand Prix.
- Hero with 3D track preview or rendered race scene, upcoming/selected event metadata, circuit name, location, session and local event timezone.
- Quick actions: Open Replay, Simulate Race, Ask Race Engineer, Compare Strategies; disable with precise explanations if not yet available.
- Four to six genuinely sourced KPI tiles: track length, laps, previous verified results, top sector/lap comparisons, forecast model version, replay data availability.
- Next-race module, weekend sessions, weather *only if authenticated data available*, predicted podium with uncertainty and timestamp, model track record, recent simulator runs.
- Latest model update notes and source data freshness. Clear separation between event facts, AI predictions and fan-generated scenarios.

### PAGE 2 — 3D RACE CENTRE (`/race/:eventId`)
**Primary product signature.** 3D track occupying 60–70% of desktop central area, with substantial readable surrounding analysis—not a token viewport.
- Cars on correctly mapped track, track elevation where available, overtakes and pit lane, realistic steering trajectory and orientation, multiple cameras (broadcast, helicopter, chase, cockpit-inspired, track map), team colours only where usage permissible; use permitted assets.
- Race mode indicator, session metadata, lap current/total, simulation/replay time, play/pause, seek, speed 0.25x/0.5x/1x/2x/5x, skip event, reset, select driver, full-screen.
- Left dock: sortable live timing tower P1–P20 when full race has that many, intervals, lap gaps, tyre compound and age, pits, sector flags, retired status, selected driver highlight.
- Right dock: selected driver details, telemetry charts for speed/throttle/brake/gear where supplied, tyre state if known or estimated and marked as such, energy estimate, race-engineer recommendations and sector comparison.
- Bottom expandable timeline: safety cars, flags, overtakes, pit stops, fastest laps, retirements; selecting an event seeks to it and updates all components.
- Track map overlay, layer toggles: racing line, estimated speed heatmap, sector colours, pit detection, track position quality.
- Clear synchronization and position interpolation policy. Historical positional data is imperfect: disclose interpolation and gaps, never call reconstruction exact 1:1 reality without evidence.

### PAGE 3 — REPLAY LIBRARY (`/replays`)
- Season/event/session searchable grid or informative table with verified source availability, date, number of drivers, lap data completeness, position samples, potential caveats.
- Filtering by season, venue, wet/dry where sourced, race/quali/sprint.
- Select race → import/cache → validated replay; streaming or progress states; reproducible playback with no network after cache, where technically possible.
- Compare two historical drivers on telemetry charts, lap selection and sector delta.
- Race result summary with citations/source provider indicators, no unlicensed video streaming.

### PAGE 4 — STRATEGY LAB (`/strategy`)
- Selected race + driver, interactive editable pit stops, tyre selection, lap ranges, assumptions and track-specific pit-loss estimate.
- Side-by-side strategy cards with predicted finish distribution, expected race-time delta, tyre degradation timeline, traffic exposure, pit-loss components, undercut/overcut options.
- Monte Carlo settings (run count, seed, scenarios) with resource caps; progress indicator, cancellation and reproducibility.
- Charts: lap-time vs lap, tyre wear curves, stint timeline (Gantt-style), position forecast bands, outcome histogram and probability calibration indicator.
- Explanations of drivers of recommendation and uncertainties.
- Recorded data not confused with simulation estimates.

### PAGE 5 — AI RACE ENGINEER (`/engineer`)
- Two-column or three-panel analytical chat workspace, not just a blank chatbot.
- Left: conversation with suggested prompts, clear source attribution, last refresh and model status.
- Middle: current race state, driver/tyre strategy details and recommendations.
- Right: generated scenario results, charts, proposed pit windows, confidence intervals, comparisons and 'Run in simulator' action.
- Prompt examples: 'Could Norris gain a place by pitting on lap 24?', 'Compare one-stop and two-stop at Mexico', 'What changes under safety car?'.
- Use structured deterministic tools (`get_race_state`, `simulate_strategy`, `compare_drivers`, `get_lap_telemetry`) beneath LLM explanation. Never invent available telemetry or claim a hypothetical outcome is fact.
- Conversational history tied to event and scenario snapshot. User can explicitly commit strategy intervention in simulated mode, not recorded replay.

### PAGE 6 — PARALLEL UNIVERSE (`/parallel`)
**Flagship premium experience.** Fork a real replay at timestamp T into simulated future branches from a clearly labelled estimated state, or fork an existing simulation exactly.
- Side-by-side two Three.js viewports, Universe A / Universe B, synchronised cameras and time controls, cloned immutable starting state, separate editable strategies.
- User picks pit lap, compound, driver aggression or energy deployment in either branch, clicks 'Run both'.
- Top differences: finishing position, predicted race time, podium/win probability, time gained/lost and assumptions.
- Bottom delta charts: positional evolution, stints, traffic heatmap, event timelines, outcome distributions.
- 'Explain the difference' opens AI Engineer with traceable scenario inputs and results.
- Reproducible seeds and versioned race state; branching preserves same baseline conditions; show stochastic variation honestly.
- Export scenario comparison link/report after implemented. Avoid overclaiming causal certainty.

### PAGE 7 — PREDICTION ACCURACY LAB (`/predictions`)
- Next upcoming race forecast page and historical model evidence page. No claims about actual future outcomes.
- Driver win/podium/top-10/head-to-head probabilities with forecast date, source data cutoff, model version, sample size, credible uncertainty and top model factors.
- Interactive probability chart, predicted grid/finish distributions, lap/strategy probabilities and explanations.
- Historical walk-forward backtesting (training data strictly predates evaluated race); reliability/calibration plots, Brier score, log loss, classification/finish-position MAE as applicable; compare against naïve baselines and earlier model versions.
- Predictions snapshot immutably before actual results, avoid hindsight leakage. Results match verified actual data; prominent 'Model estimated' labels.
- Optional future virtual-market-research module only: mathematical fair decimal odds `1/p`, fictional stakes, historical hypothetical payouts and ROI studies with assumptions, explicitly **no placement of real-money bets**.

### PAGE 8 — HUMAN VS AI TEAM PRINCIPAL (`/team-principal`)
- Select constructor, simulation difficulty, event/session, scenario rules.
- Race control screen with driver radios (generated, labelled as simulation), tyre and gap monitors, detailed opponent behaviour, strategy alerts, actionable pit/hold/compound controls, pause-and-decide events.
- Opponent team strategy agents and replayable saved runs.
- Post-race decision audit: compare baseline vs decisions, time effects and risk, strategy score with uncertainty, shareable replay.
- No fake human rivalry or unverifiable 'beat the real team' claims.

### PAGE 9 — DRIVERS / CIRCUIT INTELLIGENCE (`/drivers`, `/circuits`)
- Driver profiles: pace, tyre management, reliability, pass attempts, wet-weather performance; proper confidence intervals and sample counts; adjustable simulation traits, not asserted personality facts.
- Historical comparisons by similar conditions; visuals that distinguish fact from model estimates.
- Circuit pages: track map, sectors, pit lane, typical overtaking zones, weather context if available, energy and tyre effects with data-source labeling.
- Chaos engine scenarios: realistic probabilistic weather changes, safety cars, VSC, reliability, red flags, strategy changes and distributions; seeded reproducibility.

## LATER COMMERCIAL PAGES — DESIGN/PLANNING ONLY UNTIL APPROVED
**Pricing (`/pricing`)**: Free, Race Engineer (£5.99/month proposed), Pit Wall Pro (£11.99/month proposed). Clear comparison grid, tooltips, usage limits, features that actually exist, VAT and terms clarity, billing annual/monthly if implemented. Prices are hypotheses, not final.
**Account (`/account`)**: Saved simulations, favourites, model usage, API access if entitled, settings, export/delete data.
**Billing (`/billing`)**: Subscription status/invoices/payment management via established provider, webhook-verified entitlement, cancellations, invoices. NEVER store payment card information directly.
**Future B2B (`/developers`)**: API documentation, versioned prediction endpoints, rate limits, keys, sandbox fixtures, audit logs, uptime, licensing enquiry; only after permissions and real platform reliability.
**Community (`/challenges`)**: Equal-condition race strategy puzzles, season challenges, leaderboards and shared scenarios, no real-money competitions or rewards.

## BACKEND ARCHITECTURE TO IMPLEMENT INCREMENTALLY
- Keep existing frontend/backend folder layout and dependencies unless audit supports targeted restructuring. Prefer adapters, new modules, schema migrations and backwards-compatible endpoints.
- Unified typed RaceState: immutable timestamp / session ID / race ID; car IDs and classification, track-distance progress, lateral offset, speed, lap, stint, tyre type/age, pit phase, energy estimate, flags, events, source kind, uncertainty and quality indicators.
- Isolate real `ReplaySource` and generated `SimulationSource`; identical consumer state/renderer contract.
- FastF1 importer with caching, dataframe normalization, unit conversion, data completeness report, coordinate interpolation, provenance, rate-safe reads and graceful errors. Preserve FastF1 version. The MIT library licence doesn't itself grant commercial rights to all data it retrieves or to F1 trademarks/footage.
- Pure deterministic race stepper initially kinematic, with physically sensible passing, pit stops, traffic and tyre degradation. Model 2026-era boost/overtake/active-aero concepts rather than relying on legacy DRS logic. Do not pretend to have private team physics.
- Strategy service evaluates one-stop/multi-stop counterfactuals with monte carlo uncertainty. Parallel branch service stores stable baseline, version, seed and interventions.
- Explainable AI Engineer with tool calling grounded on concrete simulation outputs; backend model credentials only, sanitised prompts, rate and spend controls.
- Prediction service uses time-valid features and forecast snapshots, historical backtests, model registry/metadata, reproducibility, calibration. Fallback baseline before advanced ML.
- Store datasets as Parquet + SQLite initially, optional PostgreSQL as scale justifies; API endpoints and WebSockets for race updates; never stream huge raw pandas frames directly to browsers.
- Performance: instantiate 3D cars efficiently, decouple fixed simulation time steps from render FPS; lower fidelity mode, lazy-load analysis-heavy views.

## EXECUTION PLAN / GATES
**Gate 0 — Audit and protect:** inspect existing repository, list working features, test commands, asset usage, current API contracts. Create Git branch, tag/snapshot baseline, write smoke/regression tests and migration plan. No deletion/rewrite.
**Gate 1 — Unified race state:** race-state types, backend schema, adapters to original UI, replay data provenance, health and verification endpoints. Tests passing.
**Gate 2 — Accurate replay MVP:** one verified historical Grand Prix, matching validated lap ordering and timing, camera controls, event timeline, speed controls, replay library listing, honest missing-data UI.
**Gate 3 — Racing mechanics:** plausible independent car evolution, pit cycles, overtaking and 2026 energy concepts; test Mexico full 71 laps, valid classification, determinism.
**Gate 4 — Strategy Lab + AI Engineer:** quantified Monte Carlo strategy decisions, backend grounded chat tools and detailed working UI.
**Gate 5 — Parallel Universe:** checkpoint/fork, dual viewer, reliable side-by-side comparison.
**Gate 6 — Prediction Lab:** historical train/test discipline, forecasting, model quality and scoring reports.
**Gate 7 — Team Principal + Drivers/Chaos:** playable AI rivals, weather and incident distributions and validation.
**Gate 8 — Commercial review (separate approval):** customer discovery, pricing tests, licensing/commercial data due diligence, then optional subscription implementation. Keep real-money gambling out of scope.

## ACCEPTANCE TESTS & DEFINITION OF DONE
- `npm run build`, TypeScript checking, frontend unit tests and Python `pytest` all pass after each gate; verify any originally working scripts still work.
- Browser screenshots and real interactions for dashboard, Race Centre, Strategy, AI Engineer, Parallel Universe, Prediction Lab on desktop (1440px), tablet (~820px) and phone (~390px) as screens are developed; accessibility basics, keyboard interactions, labelled inputs.
- Actual replay: seek twice to same timestamp → same ordered race state, no erroneous teleporting; cross-check driver lap positions/gaps against recorded FastF1 fixtures and flag discrepancies.
- Simulation: full 71-lap race completes with valid ordering, independent overtakes and pit service, sane lap counts, no negative speeds/tyre ages.
- Parallel: same snapshot+seed+interventions → identical output; different interventions produce traceable results; recorded history stays immutable.
- AI: every quantified conclusion backed by a specific tool response; missing data identified, model uncertain estimates explained; no invented model confidence.
- Predictions: time-safe historical splits, immutable pre-event snapshots, calibrated metrics compared to trivial baselines; never claim predictive betting profitability on invented examples.
- Every table/chart/control meaningful; API and loading errors handled; no misleading paid-feature promises.
- Provide progress after each gate with list of exact files changed, tests run/results, visual proof when relevant, regressions and next gate. Do not claim done if code was not actually run.

## FIRST TASK FOR CHATGPT WORK — DO THIS NOW
1. Inspect my existing project/source/repository. Determine actual architecture and existing working features, file paths, tests and data ingestion. If access missing, identify exactly which folder/repo to connect.
2. Make a short preservation plan and an ordered implementation PR plan using this brief.
3. Start **Gate 0 and Gate 1** on the real codebase, without touching monetisation or gambling functionality.
4. Do not simply generate a separate demo webpage; deliver integrated code in the existing simulator, run build/tests and report results.

## PRIMARY TECHNICAL REFERENCES
- https://docs.fastf1.dev/
- https://github.com/theOehrly/Fast-F1
- Official 2026 F1/FIA sporting and technical regulations when implementing the new energy and overtaking systems.
