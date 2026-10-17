import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { champions } from "../lib/rift/catalog";
async function main() {
  const manifest = JSON.parse(
    await readFile("lib/rift/data/visual-assets.json", "utf8"),
  );
  if (manifest.version !== "wr-guide-icons-2026-10-17")
    throw Error(
      "Snapshot already advanced. Choose new paths/version; no historical overwrite.",
    );
  const dir = "public/rift/assets/wr-circles-2026-10-17";
  await mkdir(dir, { recursive: true });
  const special: Record<string, string> = {
    "nunu-and-willump": "Nunu",
    "dr-mundo": "Dr. Mundo",
    "jarvan-iv": "Jarvan IV",
    "aurelion-sol": "Aurelion Sol",
    "master-yi": "Master Yi",
    "lee-sin": "Lee Sin",
    "xin-zhao": "Xin Zhao",
    "miss-fortune": "Miss Fortune",
    "twisted-fate": "Twisted Fate",
  };
  const titled = champions.map((c) => ({
    champion: c.id,
    title: `File:${special[c.id] ?? c.name} OriginalCircle WR.png`,
  }));
  for (let i = 0; i < titled.length; i += 40) {
    const batch = titled.slice(i, i + 40);
    const url = new URL("https://wiki.leagueoflegends.com/en-us/api.php");
    url.search = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url",
      titles: batch.map((x) => x.title).join("|"),
    }).toString();
    const response = await fetch(url);
    if (!response.ok) throw Error(`Wiki metadata ${response.status}`);
    const body = await response.json();
    const pages = Object.values(body.query.pages) as {
      title: string;
      imageinfo?: { url: string; descriptionurl: string }[];
    }[];
    for (let j = 0; j < batch.length; j += 6)
      await Promise.all(
        batch.slice(j, j + 6).map(async (row) => {
          const metadata = pages.find(
            (p) => p.title.toLowerCase() === row.title.toLowerCase(),
          );
          try {
            if (!metadata?.imageinfo?.[0])
              throw Error("No WR original circle in source");
            const source = metadata.imageinfo[0];
            const res = await fetch(source.url);
            if (!res.ok) throw Error(`HTTP ${res.status}`);
            const raw = Buffer.from(await res.arrayBuffer());
            const bytes = await sharp(raw)
              .flatten({ background: "#101725" })
              .resize(96, 96)
              .webp({ quality: 94 })
              .toBuffer();
            const local = `${dir}/${row.champion}.webp`;
            await writeFile(local, bytes);
            manifest.records[`wr:${row.champion}`] = {
              path: `/${local.slice(7)}`,
              url: source.url,
              descriptionUrl: source.descriptionurl,
              retrievedAt: new Date().toISOString(),
              sha256: createHash("sha256").update(bytes).digest("hex"),
              bytes: bytes.length,
              scope:
                "Explicit Wild Rift original-circle reference. Riot artwork via League of Legends Wiki. Skins not covered.",
            };
          } catch (e) {
            manifest.failures.push({
              key: `wr:${row.champion}`,
              title: row.title,
              error: String(e),
            });
          }
        }),
      );
  }
  manifest.version = "wr-circles-2026-10-17";
  await writeFile(
    "lib/rift/data/visual-assets.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        wrReferences: Object.keys(manifest.records).filter((k) =>
          k.startsWith("wr:"),
        ).length,
        missing: manifest.failures.filter((f: { key: string }) =>
          f.key.startsWith("wr:"),
        ),
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
