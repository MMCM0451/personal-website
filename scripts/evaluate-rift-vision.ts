// Private local fixtures only; expected labels never enter the recognizer.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";
import {
  makePortraitReferences,
  scanRaster,
  type Raster,
} from "../lib/rift/screenshot";
import assets from "../lib/rift/data/visual-assets.json";
async function raster(file: string): Promise<Raster> {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}
async function main() {
  const root = process.argv[2];
  if (!root) throw Error("Pass private fixture directory");
  const out = path.resolve("private/rift-evaluation");
  await mkdir(out, { recursive: true });
  const refs = (
    await Promise.all(
      Object.entries(assets.records)
        .filter(([k]) => k.startsWith("wr:"))
        .map(async ([key, record]) =>
          makePortraitReferences(
            key.slice(3),
            await raster(`public${record.path}`),
          ),
        ),
    )
  ).flat();
  for (const id of [
    "scoreboard_5v5_redacted",
    "site_ui_not_game_redacted",
    "postgame_single_champion_redacted",
  ]) {
    const file = path.join(root, `${id}.jpg`);
    const decodeStart = performance.now();
    const image = await raster(file);
    const decodeMs = performance.now() - decodeStart;
    const result = scanRaster(image, refs, assets.version);
    result.timings.decode = decodeMs;
    result.timings.total += decodeMs;
    result.sourceHash = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
    await writeFile(
      `${out}/${id}.actual.json`,
      JSON.stringify(result, null, 2),
    );
    // Diagnostic top-1 proposals are NOT accepted IDs. Separate export for evaluator.
    await writeFile(
      `${out}/${id}.proposals.json`,
      JSON.stringify(
        {
          ...result,
          slots: result.slots.map((s) => ({
            ...s,
            championId: s.topCandidates[0]?.championId,
          })),
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify(
        {
          id,
          layout: result.screenType,
          evidence: result.layoutEvidence,
          timings: result.timings,
          slots: result.slots.map((s) => ({
            side: s.side,
            index: s.index,
            candidates: s.topCandidates,
            gap: s.gap,
          })),
        },
        null,
        2,
      ),
    );
    const svg = `<svg width="${image.width}" height="${image.height}">${result.slots.map((s) => `<rect x="${s.bbox.x}" y="${s.bbox.y}" width="${s.bbox.width}" height="${s.bbox.height}" fill="none" stroke="lime" stroke-width="3"/>`).join("")}</svg>`;
    await sharp(file)
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toFile(`${out}/${id}.overlay.png`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
