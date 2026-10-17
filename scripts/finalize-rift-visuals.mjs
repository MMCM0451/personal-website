import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const file = "lib/rift/data/visual-assets.json";
const manifest = JSON.parse(await readFile(file, "utf8"));
if(!Object.keys(manifest.records).some(k=>k.startsWith('champion:')))throw Error('Already finalized. Use new visual snapshot paths rather than overwriting this one.');
// Preserve the failed artwork experiment locally; do not ship unused PC square art.
await mkdir("private/art-baseline", { recursive: true });
const baseline = {};
for (const [key, row] of Object.entries(manifest.records)) {
  if (!key.startsWith("champion:")) continue;
  baseline[key] = row;
  await rename(
    `public${row.path}`,
    `private/art-baseline/${key.slice(9)}.webp`,
  );
  delete manifest.records[key];
}
await writeFile(
  "private/art-baseline/manifest.json",
  JSON.stringify(baseline, null, 2),
);
for (const id of [
  "armored-advance",
  "chainlaced-crushers",
  "crimson-lucidity",
  "gunmetal-greaves",
  "spellslingers-shoes",
]) {
  const source = `https://www.wildriftmeta.com/items/${id}/`;
  const htmlResponse = await fetch(source);
  if (!htmlResponse.ok) throw Error(`Icon source ${htmlResponse.status}`);
  const html = await htmlResponse.text();
  const relative = html.match(/<img class="hero-icon" src="([^"]+)"/)?.[1];
  if (!relative) throw Error(`Missing source icon ${id}`);
  const url = new URL(relative, source).href;
  const response = await fetch(url);
  if (!response.ok) throw Error(`Icon ${response.status}`);
  const bytes = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(96, 96)
    .webp({ quality: 90 })
    .toBuffer();
  const local = `/rift/assets/wr-guide-icons-2026-10-17/item-${id}.webp`;
  await writeFile(`public${local}`, bytes);
  manifest.records[`item:${id}`] = {
    path: local,
    url,
    descriptionUrl: source,
    retrievedAt: new Date().toISOString(),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    scope:
      "Wild Rift community item icon. Original WildRiftFire 404 retained in failures; recovered from source HTML. Mechanics remain governed by pinned snapshot.",
  };
}
await writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
console.log({
  records: Object.keys(manifest.records).length,
  wrReferences: Object.keys(manifest.records).filter((k) => k.startsWith("wr:"))
    .length,
  originalFailuresRetained: manifest.failures.length,
});
