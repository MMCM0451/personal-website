// Private real images are never committed. Tests explicitly skip when fixtures are absent.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";
import assets from "../../lib/rift/data/visual-assets.json";
import {
  makePortraitReferences,
  scanRaster,
  type Raster,
} from "../../lib/rift/screenshot";
const root =
  process.env.RIFT_FIXTURE_DIR ??
  path.resolve("../rift-handoff/rift-lab-codex-handoff/fixtures");
const available = existsSync(path.join(root, "scoreboard_5v5_redacted.jpg"));
const real = {
  skip: !available
    ? "Private real fixture directory missing; set RIFT_FIXTURE_DIR"
    : false,
};
async function raster(input: Buffer | string): Promise<Raster> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
const refsPromise = Promise.all(
  Object.entries(assets.records)
    .filter(([k]) => k.startsWith("wr:"))
    .map(async ([k, v]) =>
      makePortraitReferences(k.slice(3), await raster(`public${v.path}`)),
    ),
).then((r) => r.flat());
test("all shipped visual assets match source receipts; 142 WR references available", async () => {
  assert.equal(
    Object.keys(assets.records).filter((k) => k.startsWith("wr:")).length,
    142,
  );
  for (const row of Object.values(assets.records)) {
    const bytes = await readFile(`public${row.path}`);
    assert.equal(bytes.length, row.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), row.sha256);
  }
});
function truthId(name: string) {
  const alias: Record<string, string> = {
    "Nunu & Willump": "nunu-and-willump",
  };
  return alias[name] ?? name.toLowerCase().replaceAll(" ", "-");
}
test(
  "REAL scoreboard: pixels -> layout -> ten top proposals, all review-only",
  real,
  async () => {
    const image = await raster(path.join(root, "scoreboard_5v5_redacted.jpg"));
    const result = scanRaster(image, await refsPromise, assets.version);
    const truth = JSON.parse(
      await readFile(
        path.join(root, "scoreboard_5v5_redacted.expected.json"),
        "utf8",
      ),
    );
    assert.equal(result.screenType, "postgame_scoreboard");
    assert.equal(result.slots.length, 10);
    for (const t of truth.slots) {
      const slot = result.slots.find(
        (s) => s.side === t.side && s.index === t.index,
      )!;
      assert.equal(slot.topCandidates[0]?.championId, truthId(t.championName));
      assert.equal(slot.championId, undefined);
      assert.equal(slot.confidence, null);
    }
  },
);
test(
  "REAL website negative and limited postgame view cannot populate teams",
  real,
  async () => {
    for (const [id, screen] of [
      ["site_ui_not_game_redacted", "unsupported"],
      ["postgame_single_champion_redacted", "postgame_performance_single"],
    ] as const) {
      const result = scanRaster(
        await raster(path.join(root, `${id}.jpg`)),
        await refsPromise,
        assets.version,
      );
      assert.equal(result.screenType, screen);
      assert.equal(result.slots.length, 0);
    }
  },
);
test(
  "DERIVED resolution checks are not independent real screenshots",
  real,
  async () => {
    const input = path.join(root, "scoreboard_5v5_redacted.jpg");
    const baseline = scanRaster(
      await raster(input),
      await refsPromise,
      assets.version,
    );
    for (const width of [768, 960, 1920]) {
      const buffer = await sharp(input).resize({ width }).jpeg().toBuffer();
      const result = scanRaster(
        await raster(buffer),
        await refsPromise,
        assets.version,
      );
      assert.equal(result.screenType, "postgame_scoreboard");
      assert.deepEqual(
        result.slots.map((s) => s.topCandidates[0]?.championId),
        baseline.slots.map((s) => s.topCandidates[0]?.championId),
      );
    }
  },
);
test(
  "DERIVED covered portrait abstains; no forced uniqueness or invented identity",
  real,
  async () => {
    const blank = Buffer.from(
      '<svg width="1536" height="960"><rect x="102" y="174" width="78" height="78" fill="#15203a"/></svg>',
    );
    const input = await sharp(path.join(root, "scoreboard_5v5_redacted.jpg"))
      .composite([{ input: blank }])
      .png()
      .toBuffer();
    const result = scanRaster(
      await raster(input),
      await refsPromise,
      assets.version,
    );
    assert.equal(result.screenType, "postgame_scoreboard");
    assert.equal(result.slots[0].topCandidates.length, 0);
    assert.equal(result.slots[0].status, "unknown");
  },
);
test("blank light and dark images reject; no aspect-only detection", async () => {
  for (const fill of [0, 255]) {
    const data = new Uint8Array(768 * 480 * 4).fill(fill);
    const result = scanRaster(
      { data, width: 768, height: 480 },
      await refsPromise,
      assets.version,
    );
    assert.equal(result.screenType, "unsupported");
    assert.equal(result.slots.length, 0);
  }
});
