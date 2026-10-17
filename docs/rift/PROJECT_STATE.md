# Rift Lab state

## Current local repair — 2026-10-17

The sections below record the earlier release. Current branch `rift/vision-quick-mode` is a checkout of the same repository in this writable task workspace (`website/`). **No repair push or deployment has occurred.**

Implemented: real scoreboard pixels → layout/crops/portrait proposals → explicit review/search correction → existing shared draft/engine; manual/screenshot provenance; protected manual IDs and intentional unknowns; unsupported-image abstention; crop debugger/raw exports; optional local labelled crops. `/rift/quick` integrates the supplied design with real builds/runes, comparison/detail sheets, threats, purchase path and Copy/Full analysis. Existing detailed routes and manual controls remain. Scoreboard context is postgame; locked runes/spells are informational.

Actual defect: the old upload decoded only, then waited for a manually drawn crop. It had no automatic team pipeline. Wild Rift circle references fix artwork mismatch on the supplied fixture. See [RECOGNITION_STATUS.md](RECOGNITION_STATUS.md) for diagnosis, evidence and limits, and [QUICK_MODE_DESIGN.md](QUICK_MODE_DESIGN.md) for integration.

Validation: **49 TypeScript tests** including private real fixtures and derived-resolution/occlusion checks; **4 supplied Python evaluator tests**. Typecheck, affected-code lint, normalized snapshot integrity and local Next production build pass. First browser scan: 387.2 ms, ten correct proposals on **one development scoreboard**. Warm desktop n=20 p50 123.7 / p95 126.6 ms including rules/frame waits, not Android or React commit time. Website and single-character negatives populate no team. Removing Veigar removes his specific warning while items remain justified by other threats. Rules become `rift-rules-2` for survival-component priority, core-first Tier 3 timing and optional earlier Tier 2. Original game snapshots remain unchanged; visual artifacts have separate hash receipts.

Limits: independent held-out accuracy/calibration, automatic acceptance, physical Android timing, broad skin/UI coverage, ranked draft/loading detection, OCR/stat analytics, PWA/share target and multiuser sync remain unproven or unimplemented. Automatic acceptance coverage is 0%. Fixture pixels/private evidence are Git/Vercel excluded. Collect independent sessions/layouts and calibrate before enabling auto-accept.

Preview: `npm run dev -- --port 4181`, `/rift/quick`. Set `RIFT_FIXTURE_DIR` to the private extracted `fixtures` directory for portable tests. This checkout lacks ignored raw acquisition archives; use `npm run verify:rift-data -- --normalized-only`. Recognition documentation has reproduction commands.

## Earlier milestone and release record

2026-10-17 initial audit — M0 complete. Existing canonical site and read-only MMCM patterns inspected. The initial milestone made no deployment, cloud provisioning or MMCM modifications. Local MMCM infrastructure files/docs are accessible. A read-only named-profile AWS identity check returned an expired session; cloud access was not reauthenticated and live resource health is unverified.

## Built and validated

M1 complete locally: dashboard, draft, build, history and settings routes; searchable portraits, partial allies/enemies/bans, editable Max/Charles/additional profiles, role/objective/risk/queue/duo preferences, champion scores and component reasons. All eight initial pool champions have build templates; Swain has three archetypes. Output includes five majors + boots, legal five-rune pages, spell/item/rune reasons, conditional swaps, components/cost ledger, support occupancy and tier-3 gates. In-game input offers a next-major affordability aid using manually entered inventory/gold/time. Frozen advice records all inputs/candidates and the actually presented build ID; annotations remain distinct from observations. Export/import profiles, export/delete advice and local reset work. Projects links to `/rift`.

Final validation: **33 tests pass** (25 strategy/schema and 8 vision/diagnostic); strict TypeScript, targeted Rift/script lint, snapshot integrity and production Next build pass. All five routes return 200. Browser demonstration: Swain + Jinx example -> complete plan -> frozen history; searchable portrait correction; Charles profile; 390 x 844 mobile with no horizontal overflow/broken loaded images. Warm PC Node engine benchmark: 1000 samples, p50 0.0304 ms, p95 0.0648 ms; excludes UI/vision and is not an Android benchmark. See ENGINE_BENCHMARK.json.

M2 baseline implemented: local PNG/JPEG/WebP input, bounded decode, touch crop and keyboard percentage controls, 426 templates derived from 142 portraits, top-three candidates, low-detail abstention, mandatory explicit confirmation/correction into the draft. Opt-in 96px crop retention includes source hash, match group, device label, layout, synthetic/real assertion, pre-correction predictions and versions. Export/delete and selected-set diagnostics preserve null real-accuracy rates when no real data exists. Real-screen automatic layout detection/accuracy are still unvalidated, so M2 is **partial**, not production-recognition complete.

## Data and limits

Active data version: `7.3b-2026-10-17.3+official-review-1`. 142 locally cached portraits (502,854 bytes), 27 qualitative kits with five official ability descriptions each, 8 build champions, 77 distinct items/components. These are partially verified mechanics, not an exhaustive official database. Community recipes/stats are provisional; official 7.3b overrides correct Yun Tal to 3000, Thornmail to 2850, and document Warmog's Heart's 1250 bonus-health trigger. Eight rune-page structures validate. Raw item HTML, HTTP receipts and integrity hashes are retained.

Prior snapshots preserve failures and corrections: spirit-visage item 404 (excluded), patch 7-2e URL 404 (latest patch sources recovered); `.2` extraction missed stats because of nested HTML, corrected by a new `.3` acquisition. `.2` recovery manifest distinguishes artifact save times/hashes from lost original HTTP receipts. New acquisition journals HTTP receipts incrementally and rejects empty stat extraction. No historical files were silently overwritten during correction.

Recommendations are uncalibrated authored heuristics, not observed win rates or Riot MVP scoring. Unknown slots/kits are never invented. ARAM/AAA use base-item planning with explicit unmodelled modifiers/augments; unverified tier-3 timing is withheld. Support evolution is represented as a retained quest slot, not simulated quest earnings. In-game aid is not a complete inventory re-optimiser. No postgame OCR, multi-image match analytics, PWA/share target, authentication, sync, trained CNN or cloud backend exists. Browser storage is not backup.

The initial repository-wide lint run found three pre-existing errors outside Rift (`app/page.tsx`, `app/about/page.tsx`, `app/photos/gallery.tsx`); affected Rift/script/navigation/project lint passes. The initial six production dependency advisories were addressed in the authorised release pass below.

## Handover

Run `npm.cmd run dev` and open `http://localhost:3000/rift`. Validate with `npm.cmd run test:rift`, `npm.cmd run typecheck`, `npm.cmd run verify:rift-data`, `npm.cmd run build`; benchmark with `npm.cmd run benchmark:rift`. A fresh clone without local raw captures uses `npm.cmd run verify:rift-data -- --normalized-only`. The initial local milestone did not commit/push/deploy; the owner subsequently authorised the production release below. No new AWS resources or MMCM changes were made.

Next recommended milestone: collect consented ranked/loading/postgame screenshots through the local crop workflow; group by match/device and evaluate held-out coverage/false accepts/latency on Android before automatic layout detection or any model upgrade. Then implement reviewed postgame facts and mode-separated analytics. Riot registration/asset-policy requirements remain documented; no registration or legal acceptance was performed. The personal beta remains explicit about its experimental scope.

## Authorised production release — 2026-10-17

Max requested deployment and direct access from the existing site. Release entrypoint: `https://www.maxma.me/rift`; `/rift/draft`, `/rift/build`, `/rift/history`, `/rift/settings` are generated routes. Main navigation now links directly to Rift, with a mobile header layout that avoids overflow; Projects also links to the application. Footer identifies the personal beta and experimental recognition.

Release validation: 33 tests, strict TypeScript, affected-code lint, full local source verification, normalized-only verification and Next production build pass. Mobile 390px navigation to `/rift` works with no horizontal overflow. Next and its ESLint config updated to 16.4.2, bundled sharp is 0.35.5, and `npm audit --omit=dev` reports zero advisories. Five remaining high audit entries are the development-only braces/fast-glob/ESLint chain; npm's proposed forced fix would downgrade the framework lint configuration, so no forced downgrade was applied.

GitHub `main` was confirmed aligned with origin before release; its existing Vercel integration reported success for the prior production commit. The release uses that same integration, with commit deployment status and canonical production URLs verified in the deployment task before reporting success. Raw acquisition folders are excluded from Git/Vercel uploads and retained locally; no browser screenshots/corrections are included in the release.
