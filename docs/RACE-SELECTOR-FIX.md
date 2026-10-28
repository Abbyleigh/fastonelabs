# Race workspace selector fix — 28 October 2026

The season and Grand Prix controls previously only changed SiteShell's local workspace state. Replay, results, circuit and strategy pages kept their old route/props; the cinematic homepage's entry action also always opened Silverstone 2024. Strategy initialised its scenario once and did not react to a new race prop.

Selectors now resolve the destination for the actual selected event. Race tools remain in their current mode when supported. Upcoming events open circuit preview instead of an unavailable recorded replay/results/garage. Pre-2023 recorded replay selections open archived results. From home and non-race pages, selectors open the calendar with that event selected. URLs preserve both year and round. Changing season matches the previous circuit or Grand Prix name across that season's actual calendar, rather than assuming round numbers match; otherwise it selects the next upcoming or last event. In-flight calendar requests are cancelled when superseded, and provider errors expose a retry control. Explicit workspace changes bypass the cinematic entry delay.

Strategy and forecast pages remount for the selected season/round, so an old in-memory scenario cannot conceal the new race context. Race selection starts that race's assumptions; previously saved scenarios remain stored. The homepage Race Centre action now follows the selected workspace too.

Validation: full project check (53 backend + 43 frontend tests, contract generation check, TypeScript and production build); regression coverage for URL round trips, tool routing, unavailable replay handling and circuit matching; final production build and whitespace checks pass. Browser verification: home → 2024 calendar; Grand Prix → Silverstone; strategy → Hungary 2024; year → Hungary 2023 with its different correct round; replay changes to Hungary 2024; mobile strategy switches back to Silverstone with matching page context and URL. No console errors on the checked paths; mobile viewport/document widths both 390 px. Proof: task outputs `race-selector-fixed.jpg`.

Restoration point before this fix: `bf650cf`. No backend API or asset changes.
