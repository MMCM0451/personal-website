import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve("lib/rift/data/7.3b-2026-10-17.3");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json")));
const verifySources = !process.argv.includes("--normalized-only");
if (verifySources) {
  for (const receipt of manifest.receipts) {
    const bytes = await readFile(path.join(root, receipt.file));
    if (sha(bytes) !== receipt.sha256)
      throw Error(`Source hash mismatch: ${receipt.file}`);
  }
}
const files = [
  "roster.json",
  "kits.json",
  "items.json",
  "rune-pages.json",
  "manifest.json",
];
const integrity = [];
for (const file of files) {
  const bytes = await readFile(path.join(root, file));
  integrity.push({
    file: `lib/rift/data/7.3b-2026-10-17.3/${file}`,
    sha256: sha(bytes),
    bytes: bytes.length,
  });
}
const roster = JSON.parse(await readFile(path.join(root, "roster.json")));
for (const c of roster) {
  const file = `public${c.portrait}`;
  const bytes = await readFile(file);
  integrity.push({ file, sha256: sha(bytes), bytes: bytes.length });
}
const reviewFile = "lib/rift/data/7.3b-official-review-1.json";
const reviewBytes = await readFile(reviewFile);
integrity.push({
  file: reviewFile,
  sha256: sha(reviewBytes),
  bytes: reviewBytes.length,
});
const target = path.join(root, "integrity.json");
if (process.argv.includes("--record"))
  await writeFile(
    target,
    JSON.stringify(
      { recordedAt: new Date().toISOString(), files: integrity },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
else {
  const recorded = JSON.parse(await readFile(target));
  for (const f of recorded.files) {
    if (sha(await readFile(f.file)) !== f.sha256)
      throw Error(`Snapshot modified: ${f.file}`);
  }
}
console.log({
  sourcePagesVerified: verifySources ? manifest.receipts.length : 0,
  sourcePagesExpected: manifest.receipts.length,
  sourceArchiveStatus: verifySources ? "Local raw archive verified" : "Raw archive not checked; normalized release artifacts only",
  portraits: roster.length,
  hashedFiles: integrity.length,
  portraitBytes: integrity
    .filter((f) => f.file.startsWith("public/"))
    .reduce((s, f) => s + f.bytes, 0),
});
