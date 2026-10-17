// Explicit developer acquisition only. Runtime never contacts these hosts.
import { mkdir, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { champions, items, runes, PATCH } from "../lib/rift/catalog";

async function main() {
  try {
    await access("lib/rift/data/visual-assets.json");
    throw Error(
      "Visual snapshot exists. Use new snapshot paths and a new manifest; do not overwrite history.",
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  const version = "wr-guide-icons-2026-10-17";
  const dir = `public/rift/assets/${version}`;
  await mkdir(dir, { recursive: true });
  const manifest: {
    patch: string;
    version: string;
    retrievedAt: string;
    records: Record<string, unknown>;
    failures: unknown[];
  } = {
    patch: PATCH,
    version,
    retrievedAt: new Date().toISOString(),
    records: {},
    failures: [],
  };
  const aliases: Record<string, string> = {
    "nunu-and-willump": "nunu",
    "renata-glasc": "renata",
  };
  const jobs = [
    ...champions.map((c) => ({
      key: `champion:${c.id}`,
      url: `https://www.mobafire.com/images/champion/square/${aliases[c.id] ?? c.id}.png`,
    })),
    ...Object.keys(items).map((id) => ({
      key: `item:${id}`,
      url: `https://www.wildriftfire.com/images/items/${id}.png`,
    })),
    ...Object.keys(runes).map((id) => ({
      key: `rune:${id}`,
      url: `https://www.wildriftfire.com/images/runes/${id}.png`,
    })),
  ];
  for (let i = 0; i < jobs.length; i += 8) {
    await Promise.all(
      jobs.slice(i, i + 8).map(async (job) => {
        try {
          const response = await fetch(job.url, {
            signal: AbortSignal.timeout(20000),
          });
          if (!response.ok) throw Error(`HTTP ${response.status}`);
          const raw = Buffer.from(await response.arrayBuffer());
          const bytes = await sharp(raw)
            .resize(96, 96, { fit: "contain", background: "#101725" })
            .webp({ quality: 90 })
            .toBuffer();
          const file = `${job.key.replace(":", "-")}.webp`;
          await writeFile(`${dir}/${file}`, bytes);
          manifest.records[job.key] = {
            path: `/rift/assets/${version}/${file}`,
            url: job.url,
            sha256: createHash("sha256").update(bytes).digest("hex"),
            bytes: bytes.length,
            scope: job.key.startsWith("champion:")
              ? "Square artwork reference, also used by WildRiftFire guides; no PC mechanics imported. Skin coverage unvalidated."
              : "WildRiftFire Wild Rift imagery; mechanics remain governed by the existing patch snapshot.",
          };
        } catch (e) {
          manifest.failures.push({ ...job, error: String(e) });
        }
      }),
    );
  }
  await writeFile(
    "lib/rift/data/visual-assets.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        references: Object.keys(manifest.records).length,
        failures: manifest.failures,
      },
      null,
      2,
    ),
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
