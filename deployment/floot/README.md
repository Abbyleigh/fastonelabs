# Floot publication handoff

Project: d62a36cf-828c-4e9c-9f92-00777143877d (F1 Race Intelligence).

Status on 28 October 2026: NOT PUBLISHED. The account reached its 100 daily build actions during source transfer. Reset reported by Floot: 29 October 2026 at 00:00 UTC. The Floot project is incomplete and must not be published until remaining source files are transferred and typecheck/runtime verification pass.

The complete prepared 33-file migration is saved in source.json. Original React source is preserved in frontend/src; the professional.css refinement passes npm run build. Backup tag: before-floot-publication-20261028.

Successfully written Floot files: components/PitWall.tsx, ForecastPage.tsx, NewsDesk.tsx, RaceApp.tsx, RaceViewing.tsx, SiteShell.tsx, StrategyWorkbench.tsx, StrategyTools.tsx, DriverMedia.tsx, CircuitWorld.tsx, DriverShowcase.tsx, EngineeringShowcase.tsx, CinematicHome.tsx, DriverCareers.tsx, EngineeringDetails.tsx, EngineeringCar.tsx; helpers/navigation.tsx, pitwallState.tsx, strategyModel.tsx, driverPortraits.tsx, garagePhoto.tsx, GarageAssets.tsx, raceState.tsx. Re-list before resuming to check actual state. Remaining files are in source.json. Design principles/base tokens and Three/R3F/Drei dependencies were also created.

67 assets were uploaded; mapping is embedded in helpers/assetUrl.tsx in source.json. Large legacy f1-assembly and Ferrari 2023 GLBs use existing demo asset URLs. Ferrari upload was refused by account storage quota; do not retry without a plan/storage change. Do not delete hosted assets without user authorization.

The data bridge uses the existing read-only public demo https://assign-some-petroleum-bless.trycloudflare.com. The Mac, backend8001 and demo8765/tunnel must remain online. This is not an independent backend deployment. Tunnel replacement requires updating the bridge and legacy model URLs.

Next: verify quota reset or user-reported plan change, list files, transfer missing prepared files, typecheck, fix any migration errors, inspect preview and model/data loading on desktop/mobile, checkpoint, get publish status, then use publish_app. A publish form alone does not mean published. Verify completed deployment and live URL before reporting success.
