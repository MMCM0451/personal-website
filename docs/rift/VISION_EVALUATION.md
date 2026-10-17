# Vision evaluation

**Current repair results:** see [RECOGNITION_STATUS.md](RECOGNITION_STATUS.md). One supplied real scoreboard now yields ten correct reviewed proposals; two non-lineup fixtures yield no slots. The new scoreboard detector and browser measurements supersede the initial baseline below. Confidence calibration, held-out generalisation and Android timing remain absent. The following is the historical starting-point evaluation.

No real user screenshots were supplied at project start. Real-world accuracy, skin robustness and phone latency are **unmeasured**. Two seconds warm / five seconds fallback are targets, not achieved benchmarks.

Baseline pipeline: local decode -> user identifies layout/crop -> resize/normalise portrait -> template distances -> confidence/gap gate -> top candidates -> explicit confirmation -> structured draft. Automatic slot/layout detection is deferred until representative examples exist. Official roster images are portrait cards rather than guaranteed in-client icons; expect domain mismatch. Low texture/partial crops and ambiguous matches must remain unknown. No hidden enemy inference.

Persist labelled crop evidence only when opted in; default no screenshot retention/upload. Export/delete controls. Corrections include dimensions, crop coordinates, layout, proposed candidates, confirmed identity, algorithm/reference version and timestamp. Split evaluation by match/device, preventing crops from the same screenshot leaking across train/test. Assess ranked/loading/postgame separately across resolutions, skins, greyscale, borders, overlays, similar champions and empty slots. Report top-1/top-3, precision at auto-accept threshold, abstention/coverage, false accepts, decode/reference/inference latency (cold/warm p50/p95), bytes and device/browser.

Synthetic self-matches test numerical implementation only. They cannot establish recognition quality on screenshots. A compact MobileNetV3-small/ONNX model is an investigated next option, not an installed capability; add only if held-out evidence improves on template matching within download/runtime budget. Postgame OCR and automatic metrics require reviewed observations before analytics.

## Implemented baseline and observed checks

`portrait-grid-1`: 12x12 luminance-normalised descriptor with a small colour term, distance ranking, three crop variants per reference champion, top-three distinct champion candidates. Low-texture threshold 0.001; strong-template threshold 0.9 similarity and 0.035 runner-up gap. These thresholds are uncalibrated. **Every** result still requires confirmation. Landscape/portrait aspect is only a hint; layouts and crops are user specified. No verified automatic slot map exists.

The browser check used the local official Swain portrait as input, not a real match screenshot. Swain ranked first at 88.7% similarity and correctly remained uncertain. The slot changed only after pressing Confirm Swain. Retention stayed off, so this test did not enter the real labelled dataset.

| Measurement | Observed value | Scope |
| --- | --- | --- |
| Decode | 8 ms | One reference-image smoke check in desktop IAB, 390px emulated viewport |
| Cold reference preparation | 145 ms | 142 local portraits -> 426 descriptors |
| Cold classifier | 3.7 ms | One crop, excludes decode/crop/confirmation |
| Warm reference preparation / classifier | 7 ms / 2.9 ms | One repeat in the same PC browser |
| Reference download bytes | 502,854 | Sum of 142 cached WebP file sizes; excludes JS/HTTP overhead |
| Real screenshot top-1/top-3, false accepts, Android p50/p95 | Unmeasured | No supplied real screenshot dataset or physical-phone run |

These two pipeline observations are not a latency distribution or evidence that the two/five-second end-to-end target is met. Eight numerical/diagnostic tests cover invalid pixels/crops, blanks, ties, identity self-match, reference deduplication and missing real data. No model weights are downloaded.

Opt-in crop evidence contains a hash of the original file (not its name/full pixels), working dimensions/crop, source/match group, optional device label, user-asserted real-vs-reference kind, layout, pre-correction ranking and confirmed identity. Keep reference tests separate. Correction diagnostics explicitly describe a selected set; even non-null rates do not establish representative held-out accuracy. Export/delete is local. No user dataset is shipped with the site.
