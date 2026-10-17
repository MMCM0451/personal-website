// Recovery for incomplete acquisition: never modifies existing source records.
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const id = process.argv[2];
if (!id || !/^[a-z0-9.-]+$/.test(id)) throw Error("Snapshot ID required");
const root = path.resolve("lib/rift/data", id);
for (const patch of ["7-3", "7-3a", "7-3b"]) {
  const target = path.join(root, "sources", `patch-${patch}.json`);
  try {
    await stat(target);
  } catch {
    const url = `https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-${patch}/`;
    const res = await fetch(url);
    if (!res.ok) throw Error(`${res.status} ${url}`);
    const html = await res.text();
    const data = JSON.parse(
      html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
      )[1],
    );
    await writeFile(target, JSON.stringify(data, null, 2) + "\n", {
      flag: "wx",
    });
  }
}
const artifacts = [];
for (const folder of ["", "sources"])
  for (const filename of await readdir(path.join(root, folder))) {
    if (!filename.endsWith(".json") || filename === "manifest.json") continue;
    const relative = path.join(folder, filename);
    const bytes = await readFile(path.join(root, relative));
    const metadata = await stat(path.join(root, relative));
    artifacts.push({
      file: relative.replaceAll("\\", "/"),
      savedAt: metadata.mtime.toISOString(),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    });
  }
const roster = JSON.parse(await readFile(path.join(root, "roster.json")));
const kits = JSON.parse(await readFile(path.join(root, "kits.json")));
const items = JSON.parse(await readFile(path.join(root, "items.json")));
await writeFile(
  path.join(root, "manifest.json"),
  JSON.stringify(
    {
      id,
      game: "Wild Rift",
      patch: "7.3b",
      finalizedAt: new Date().toISOString(),
      status: "partial-verification",
      roster: roster.length,
      kits: kits.length,
      items: items.length,
      acquisitionFailures: [
        "Initial acquisition HTTP 404: item spirit-visage; excluded. New attempt used force-of-nature.",
        "Second acquisition HTTP 404: patch URL 7-2e; normalized files retained; latest patch sources recovered.",
      ],
      clockNote:
        "savedAt is filesystem save time of extracted source JSON, not provider publication or original HTTP receipt. Original HTTP byte hashes were lost when acquisition stopped; hashes here cover retained JSON artifacts. Future acquisitions journal HTTP receipts incrementally.",
      artifacts,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log({
  id,
  roster: roster.length,
  kits: kits.length,
  items: items.length,
  artifacts: artifacts.length,
});
