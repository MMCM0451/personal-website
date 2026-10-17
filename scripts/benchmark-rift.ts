import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";
import { recommend } from "../lib/rift/engine";
import { defaultState } from "../lib/rift/state";
const { profiles, draft } = defaultState();
draft.enemies = ["miss-fortune", "veigar", "nunu-and-willump", "varus", "zyra"];
draft.allies[0] = "jinx";
for (let i = 0; i < 100; i++) recommend(profiles[0], draft);
const times = [];
for (let i = 0; i < 1000; i++) {
  const start = performance.now();
  recommend(profiles[0], draft);
  times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
const result = {
  measuredAt: new Date().toISOString(),
  runtime: process.version,
  platform: process.platform,
  scope:
    "Warm deterministic engine only, Node on development PC; not phone, UI, image decode, or recognition latency",
  samples: times.length,
  p50Ms: times[500],
  p95Ms: times[950],
  maxMs: times[999],
};
writeFileSync(
  "docs/rift/ENGINE_BENCHMARK.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(result);
