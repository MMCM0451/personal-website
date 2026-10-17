# Local acceptance evidence — 2026-10-17

Use with the supplied acceptance checklist. **Implemented/verified does not mean representative real-world accuracy.** No repair deployment has occurred.

| Gate | Status and evidence |
| --- | --- |
| Diagnose actual failure | Verified in original browser upload: decoded file; all slots unchanged; crop button disabled; no automatic layout call |
| Image bytes → real recognition | Verified in CLI, browser and compiled local build; same scoreboard, ten correct proposals, review required |
| Negative and limited view | Website rejected in CLI/browser without changing draft; single-character fixture classified with no lineup slots in pixel tests |
| Confidence and correction | Null calibrated confidence, raw similarity/gap shown; top-three/search review; unconfirmed slots excluded from rules |
| Protect corrections | Unit tests plus browser: deliberately changed one reviewed ID, rescanned, 9 applied / 1 protected; explicit replacement restores it. Retention off during this intentional test |
| Repeat-selection/reset | Same file rescanned; reset cleared composition but kept Max/support preferences; cancellation is implemented with abort/generation protection |
| Shared strategy integration | Real screenshot → Swain/support full plan; removing Veigar removes specific tactic; other threats/items remain justified |
| Profiles/objectives | Browser Charles/Jinx/ADC/kills survived reload and rendered actual ADC loadout; Max restored |
| Item/rune/shop correctness | 49 tests cover legal five-major+boot builds, five rune slots, support occupancy/release, component credit, available gold, time gates, removed/changed items and modes |
| Purchase realism | 400g early boots, optional earlier Tier 2, core-first Tier 3 ≥10:00, accelerated Hourglass path; no active Stasis attributed to Armguard, no fabricated recall time |
| Detailed view | Existing draft/build/history/settings retained; Quick shares draft and selected candidate via persisted build choice |
| Layout UI | 390×844 inspected with real roster, five items/boots, five runes, two threats and purchase path; smaller/review/postgame states can scroll |
| Desktop timing | Real image first scan 387.2ms; warm n=20 p50 123.7 / p95 126.6ms including rules/frame waits. Compiled build observation 322.0ms to proposals. See raw benchmark JSON |
| Android / throttle / render duration | **Unverified**; desktop viewport is not Android hardware, frame waits are not React commit timing |
| Generalisation / skin accuracy | **Unverified**; one development scoreboard; derived resizes/covered crop are not independent sessions |
| Draft/loading support | **Not supported/validated**; real fixtures needed for distinct layout profiles |
| Privacy | No image POST/inference endpoint; same-origin reference GETs only. Supplied images/private evidence excluded from Git and Vercel; crop retention optional and local |
| Build/checks | Typecheck, affected lint, normalized integrity, 49 TS tests, four evaluator tests and local production build pass |

See RECOGNITION_FIXTURE_RESULTS.json for all evaluator fields and RECOGNITION_BENCHMARK.json for measured samples. Raw input pixels/overlays stay private. Additional visual-width/navigation checks are recorded in the final handover; unsupported layouts and mobile latency remain separate future gates.

## Final compiled-browser checks

`MOBILE_QA.json`: widths 360/390/430 have scrollWidth equal to clientWidth, zero broken images and minimum champion-target height 46px. At 390×844 the purchase card bottom is 779.8px, above fixed actions at 787px. At 360×740 it requires about 121px of vertical scrolling; at 430×932 it fits comfortably. These are desktop responsive checks, not physical-phone tests. A fresh compiled-build tab has no captured warning/error logs. All original routes plus `/rift/quick`, home and photos returned 200 locally.

Selected Aggressive AP carry in Quick → Full analysis retained the checked archetype and Electrocute/items; returning to Quick and Use engine recommendation restored the flexible candidate. Reset cleared all picks while preserving Max/support preferences. Final compiled real upload began from the empty draft and populated all ten reviewed screenshot picks; no enemy was manually entered in that demonstration. Screenshots used for handover are local UI proof only, not public fixture assets.
