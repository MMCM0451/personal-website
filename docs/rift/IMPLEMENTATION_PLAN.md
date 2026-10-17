# Implementation plan

## 2026-10-17 repair execution

1. Reproduce the released crop-only failure with a real upload — done.
2. Implement pixel-based scoreboard layout/crop/reference matching and export actual outputs — done; one real scoreboard yields 10/10 proposals, mandatory review, two non-lineup negatives abstain.
3. Merge reviewed/corrected picks into the existing draft with provenance and protected manual edits — done.
4. Integrate `/rift/quick` from the supplied concept using the same engine and full-analysis state; test inventory/purchase/stage semantics — done locally.
5. Validate tests/build, mobile widths and real browser upload/correction/persistence; document measured limits and private evidence — current handover pass. No production push.
6. Next gate: independent scoreboard sessions, real partial ranked draft and full loading screens; separate layout tests, confidence calibration and Android latency. No automatic acceptance or CNN upgrade before sufficient evidence.

The earlier plan below remains historical context. Current evidence is in RECOGNITION_STATUS.md.

1. **M0 audit/sources**: inspect site and MMCM read-only, verify current Wild Rift patch, establish pinned roster/items/runes and uncertainty. Write architecture/source/rule/vision/state documents before app code.
2. **M1 manual vertical slice**: typed inputs, runtime validation, versioned traits/templates, deterministic champion scoring and legal build/rune/purchase plans; Max/Charles/editable profiles, visible picks/bans/stages, mobile portraits, saved recommendations/export/delete. Test partial drafts, mode/role/objectives, threats, support inventory, costs, rune rows and patch failures; typecheck/build; local desktop/mobile demonstration.
3. **M2 vision baseline**: local screenshot selection, adjustable slot crops, lightweight template ranker, explicit correction/confirmation and opt-in labelled data. Unit tests unknown/ambiguous crops. Benchmark algorithm and clearly separate synthetic checks from unavailable real-screen accuracy. No claim of automatic layout support without examples.
4. **M3 evidence/analytics**: obtain consented ranked/loading/postgame screenshots across resolutions, skins/overlays; split by match/device. Evaluate held-out coverage/error/latency; only add ONNX/CNN if justified. Reviewed multi-image postgame facts, KDA/KP, annotations and uncertainty estimates, mode-separated summaries.
5. **M4 release**: review current patch mechanics, broaden kit coverage, Riot registration/asset review, isolated optional cloud and PWA/share target. Publish only after explicit approval; verify canonical `/rift` after release.

Acceptance: local `/rift` supports role/objective + partial enemy entry -> top pool candidates -> explained five-item/boots/five-rune plan with purchase steps, without LLM. A live maxma.me URL is a separate deployment milestone. Complete checks before marking a milestone done; keep partial capability explicit.

2026-10-17 handover: M0 and M1 complete locally. M2 manual-crop baseline/correction/evidence workflow implemented and tested; automatic layout and real-world evaluation are pending real screenshots. 33 tests, typecheck, targeted lint, source integrity and production build pass. M3/M4 remain planned. See PROJECT_STATE and VISION_EVALUATION for exact limits and measured values.
