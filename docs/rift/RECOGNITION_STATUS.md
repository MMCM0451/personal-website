# Recognition repair: measured status

2026-10-17. Local branch `rift/vision-quick-mode`. **Not deployed.**

## Actual failure

The released `vision-input.tsx` file handler only decoded and hashed the image. No layout/slot detector was called. Matching stayed disabled until a manually drawn crop existed, and confirmation applied only one chosen slot. This was a crop tool, not screenshot-to-team recognition. Browser reproduction with the real scoreboard decoded 1536×960, left all team slots empty and had no console error. No provider or LLM was involved.

The references were tall Riot website cards. A subsequent square-art experiment ranked 5/10 scoreboard crops correctly, exposing artwork mismatch. Explicit **Wild Rift original-circle** references rank 10/10 correctly on this fixture. The failed shared-art experiment is preserved privately and is not used at runtime.

## Implemented

File → byte/type/size validation → EXIF-aware decode → aspect-preserving resize → content/geometric layout gate → circle crops → grayscale template correlation → review/correction → shared `Draft` → existing `recommend()`.

`lib/rift/screenshot.ts` is pure pixel math, with browser decode/reference preparation separate. Version `scoreboard-circle-2`, visual snapshot `wr-circles-2026-10-17`. Game data remains `7.3b-2026-10-17.3+official-review-1`; purchase changes bump rules to `rift-rules-2`.

The layout gate checks dark/blue content, score-header colour anchors, repeated circle edges and texture. A 1536×960 UI family is fitted without stretching; centred letterboxing is possible. This profile was developed on these supplied images and is **not an independently validated general screen classifier**. Crop features use a 24×24 grayscale grid, an inner circular mask and crop variants. Filenames, hashes, labels and predetermined champion IDs never determine recognition.

142 WR references / **564,692 bytes**, 1,278 descriptors prepared cold. UI imagery: 77 items / 257,312 bytes; 23 runes / 108,328 bytes. All 242 shipped artifacts have URLs, retrieval clocks, byte counts and SHA-256 receipts. No model weights or remote inference.

## Real fixture evaluation

Expected labels enter tests/evaluator only. Raw outputs/overlays are ignored under `private/rift-evaluation/`. Supplied evaluator and its tests are retained in `scripts/vision/`.

| Real input | Actual screen result | Top-choice proposals | Automatic accepted / wrong |
| --- | --- | --- | --- |
| 5v5 scoreboard | `postgame_scoreboard` | 10 correct, 0 wrong, 0 missing | 0 / 0; all require review |
| Website screenshot | `unsupported` | No slots | 0 / 0 |
| Single-champion results | `postgame_performance_single` | No lineup slots | 0 / 0 |

Scoreboard proposals: Teemo, Xin Zhao, Zed, Jinx, Swain / Varus, Nunu & Willump, Zyra, Miss Fortune, Veigar. Top-1/top-3 are both 10/10 **on one development screenshot**. Seven grayscale portraits in it work; that does not establish broad grayscale/skin robustness. Derived resizes to widths 768, 960 and 1920 pass, but are not additional real samples. Covering one portrait in a derived test yields unknown.

Similarity 0.9615–0.9955; runner-up gaps 0.1434–0.2966. These are **not probabilities**. `confidence: null`, automatic coverage **0%**, automatic precision **undefined**. The ≥0.90 similarity / ≥0.08 margin shortcut requires an explicit user review action. It is not a calibrated acceptance threshold. Low/ambiguous proposals need per-slot candidate/search confirmation; unreviewed IDs stay out of rules.

The supplied evaluator reports 10 correct / 0 wrong / 0 unknown on the separate **proposal diagnostic**. On raw accepted output before confirmation it reports 0 correct / 0 wrong / 10 unknown. This distinction prevents proposal quality from being reported as automatic acceptance.

## Browser integration evidence

Actual upload matched the CLI pixel proposals. Review/apply populated the existing draft with screenshot provenance. The player explicitly selected Swain/support; the engine rendered five major items, boots, five legal runes, threats and a costed purchase plan. Own champion, role, mode and patch are not guessed from the screenshot.

Manual identities, corrected IDs and intentional manual unknowns are protected on later scans unless replacement is enabled. Team-side swap and top-three/search correction work. Conflicting duplicate identities cause an error, not a forced alternate prediction. File re-selection, cancel, unsupported layout, decode and missing-asset failures retain manual fallback.

Scoreboard application marks **postgame**. Rune/spell advice is informational; `Plan next game with these picks` explicitly returns to planning. Loading/in-game displays also state that locked runes cannot change. No OCR, metrics or purchase-order inference from final items is implemented.

Browser diff: removing Veigar removes his cage tactic and Quick threat. Mean burst changes 2.30 → 2.125. Items, boots and first candidate's purchase sequence remain identical because remaining burst still triggers survival priority. The UI does not fabricate a build change for every edit. Website negative upload left the existing composition unchanged. Before/after raw advice is retained privately.

## Measured timing

Windows desktop IAB, 390×844 CSS viewport, no CPU/network throttle. Same real image; SHA-256 `767078ffaa5429682840a6a8f2532aaa55892f7666c85d83aac3ba6544c7150e`.

| Stage | First observed scan | Warm p50, n=20 | Warm p95, n=20 |
| --- | ---: | ---: | ---: |
| Decode/raster | 17.1 ms | 22.9 ms | 30.2 ms |
| Layout | 1.1 ms | 0.9 ms | 1.7 ms |
| References | 329.7 ms | 0.0 ms | 0.1 ms |
| Crop | 0.2 ms | 0.5 ms | 1.0 ms |
| Classification | 4.5 ms | 5.7 ms | 7.9 ms |
| Rules on current confirmed draft | Excluded | 0.3 ms | 0.5 ms |
| Two animation-frame waits after rules | Excluded | 24.5 ms | 29.2 ms |
| Total | 387.2 ms to proposals | 123.7 ms | 126.6 ms |

First scan includes cold in-memory reference preparation; browser HTTP cache was not independently cleared. Warm total includes actual decode, stage scheduling/hash, rules and two frame waits. Per-stage percentiles do not sum to total percentiles. Frame waits are **not React commit-duration measurement**. Confirmation time is excluded. No Android hardware, representative throttle, battery/memory-pressure or cold browser-cache distribution has been measured. The two-second Android p95 target remains unverified. Developer benchmark reruns the actual selected file and exports samples.

## Unsupported / unproven

- Ranked/blind draft and full loading screens: detector support **not implemented/validated**; use manual entry. No supplied real fixtures establish these layouts.
- Different scoreboard UI families, meaningful crop/reflow, skins, arbitrary bars/overlays and unusual aspect ratios: unvalidated; conservative rejection/correction expected.
- Single performance view: layout only, no champion identity/metrics extraction and no invented other nine picks.
- Independent confidence calibration: absent. Keep auto-accept disabled; 98% precision/90% coverage goals are not achieved claims.
- CNN/ONNX: not added. Correct reference domain solves this fixture; one screenshot does not justify training a model.
- Android share target/PWA, paste, offline cold navigation, OCR/history analytics and multiuser sync: not implemented. Already loaded rules and same-origin cached assets work locally; no offline-install guarantee.

## Reproduce privately

Keep images and expected JSON outside `public/` and source control. Set `RIFT_FIXTURE_DIR` to the extracted handoff's `fixtures` folder, then:

```powershell
npm run test:rift
npx tsx scripts/evaluate-rift-vision.ts $env:RIFT_FIXTURE_DIR
python scripts/vision/evaluate_recognition.py "$env:RIFT_FIXTURE_DIR\scoreboard_5v5_redacted.expected.json" private/rift-evaluation/scoreboard_5v5_redacted.proposals.json
python scripts/vision/evaluate_recognition.py "$env:RIFT_FIXTURE_DIR\scoreboard_5v5_redacted.expected.json" private/rift-evaluation/scoreboard_5v5_redacted.actual.json
python -m unittest discover -s scripts/vision -p test_evaluate_recognition.py
npm run typecheck
npm run verify:rift-data -- --normalized-only
npm run build
```

Private-fixture tests explicitly skip if files are absent; skipped CI tests establish no recognition quality. Raw screenshots, overlays, private outputs and failed reference art are Git/Vercel ignored. App screenshots stay in memory; corrected 96px crop retention is local, optional and off by default. Existing export/delete tools remain in detailed draft mode.

Next: independent scoreboard sessions and real draft/loading fixtures across reveal stages/devices/skins, grouped validation/test splits, calibration and physical Android measurement. Broader layout support and phone timing remain separate gates.

Final compiled-browser checks, exact fixture evaluator outputs and responsive geometry are recorded in QUICK_MODE_ACCEPTANCE_RESULTS.md, RECOGNITION_FIXTURE_RESULTS.json and MOBILE_QA.json. Selected build choice persists between Quick and full analysis. Slot badges: S screenshot proposal reviewed, C user edit, M manual entry.
