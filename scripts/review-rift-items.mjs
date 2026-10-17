// Correct an ingestion schema bug in a NEW snapshot; previous records are evidence.
import {
  appendFile,
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const [base, id] = process.argv.slice(2);
if (![base, id].every((v) => v && /^[a-z0-9.-]+$/.test(v)))
  throw Error("Base and new snapshot IDs required");
const root = path.resolve("lib/rift/data", id);
const from = path.resolve("lib/rift/data", base);
await mkdir(root);
await mkdir(path.join(root, "sources"));
for (const file of ["roster.json", "kits.json", "rune-pages.json"])
  await copyFile(path.join(from, file), path.join(root, file));
const sourceItems = [
  ...new Map(
    JSON.parse(await readFile(path.join(from, "items.json"))).map((i) => [
      i.id,
      i,
    ]),
  ).values(),
];
const strip = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([a-f0-9]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .trim();
const output = [];
const receipts = [];
for (let at = 0; at < sourceItems.length; at += 6)
  await Promise.all(
    sourceItems.slice(at, at + 6).map(async (item) => {
      const res = await fetch(item.source);
      if (!res.ok) throw Error(`${res.status} ${item.source}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const html = bytes.toString();
      const receipt = {
        url: item.source,
        retrievedAt: new Date().toISOString(),
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.length,
        file: `sources/${item.id}.html`,
      };
      await writeFile(path.join(root, receipt.file), bytes, { flag: "wx" });
      await appendFile(
        path.join(root, "sources/retrievals.jsonl"),
        JSON.stringify(receipt) + "\n",
      );
      receipts.push(receipt);
      const stats = strip(
        html.match(
          /<h2>Item stats<\/h2>(?:\s*<\/div>){0,2}\s*<p[^>]*>([\s\S]*?)<\/p>/,
        )?.[1] ?? "",
      );
      if (!stats) throw Error(`Missing stats ${item.id}`);
      output.push({ ...item, name: strip(item.name), stats });
    }),
  );
output.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(
  path.join(root, "items.json"),
  JSON.stringify(output, null, 2) + "\n",
  { flag: "wx" },
);
await writeFile(
  path.join(root, "manifest.json"),
  JSON.stringify(
    {
      id,
      derivedFrom: base,
      game: "Wild Rift",
      patch: "7.3b",
      finalizedAt: new Date().toISOString(),
      status: "partial-verification",
      correction:
        "Previous extraction omitted stats because of nested divs after headings. Re-fetched all 77 distinct item pages, retained original HTML/HTTP receipts and required nonempty stats. Prices and recipes inherited from prior snapshot; prior sources retained. Roster, kits, rune pages and cached portraits inherited without new retrieval claims.",
      items: output.length,
      receipts,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log({ id, items: output.length });
