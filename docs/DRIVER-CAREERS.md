# Driver Careers

Route: `#careers`, or `#careers?id=hamilton`. Available under Drivers & Cars → Driver careers, and from each existing driver profile.

The page covers current-season drivers and historical drivers through the all-time archive search. It presents sourced F1 Grand Prix wins, podiums, available qualifying P1 records, completed-season championship titles, team history, chronological breakthrough milestones, season-by-season standings and recent race results. Season selection opens a focused review. Milestone and recent-race links open existing race results; profile links retain the existing photos and Engineering viewer.

The existing read-only driver endpoint now accepts `career=true`. It paginates complete Grand Prix results and checks each represented season's standings. Data comes from Jolpica and uses existing disk caching. Sprint results and junior series are excluded and this limit is visible. Result records are not described as race starts. Qualifying position-one records are labelled available qualifying P1 records; coverage differs historically. Current-season leadership is not counted as a completed championship title; excluded/disqualified standings are not treated as titles. Missing championship records remain unknown, with an incomplete-coverage label. Standings points are used in the table because adjustments, sprints and historical scoring can differ from summed Grand Prix points.

Suggested goals are explicitly statistical next-win and next-podium benchmarks, including retired drivers. These are not invented personal ambitions or forecasts. No driver quotation is presented without a dated source. The page links to the provider's biographical reference for further reading. Full junior-series honours and sourced personal-goal interviews can be added separately.

Restoration point before this feature: `26a22cb`. Existing replay/data contracts, scene fallback and cinematic components are unchanged. Backend was restarted to load the added query option; the demo proxy uses the existing allowed endpoint and required no change.

Validation includes career aggregation, chronological firsts, excluded standings, provisional leadership, missing standings, pagination and empty careers, plus route round trips. Full project checks pass (53 backend + 42 frontend tests, generated contract, TypeScript and production build). Browser validation covers live Norris career/2024 season, historical search, layout bounds and navigation. As usual the build retains its existing large-bundle advisory.

Browser proof: `driver-careers-desktop.jpg` and `driver-careers-phone.jpg` in task outputs. Verified no horizontal overflow at 1440 and 390 pixels, functioning season selection and historical search (Ayrton and Bruno Senna), Senna’s three returned completed titles, current Norris career, and mobile Drivers & Cars → Driver careers navigation. No console errors in the checked page.
