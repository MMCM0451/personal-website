// Immutable acquisition. Usage: node scripts/acquire-rift.mjs <new-snapshot-id> [patch]
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const id = process.argv[2];
const requestedPatch = process.argv[3] ?? "7.3b";
if (!/^\d+\.\d+[a-z]?$/.test(requestedPatch)) throw Error("Invalid patch");
if (!id || !/^[a-z0-9.-]+$/.test(id)) throw Error("Supply a new snapshot ID");
const root = path.resolve("lib/rift/data", id);
await mkdir(path.dirname(root), { recursive: true });
await mkdir(root); // Deliberately fails if a historical snapshot exists.
await mkdir(path.join(root, "sources"));
const assetDir = path.resolve("public/rift/assets", id);
await mkdir(assetDir, { recursive: true });
const receipts = [];
const save = (name, data) =>
  writeFile(path.join(root, name), JSON.stringify(data, null, 2) + "\n");
const strip = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([a-f0-9]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .trim();
async function get(url) {
  const res = await fetch(url);
  if (!res.ok) {
    await appendFile(
      path.join(root, "sources/failures.jsonl"),
      JSON.stringify({
        url,
        status: res.status,
        observedAt: new Date().toISOString(),
      }) + "\n",
    );
    throw Error(`${res.status} ${url}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  receipts.push({
    url,
    retrievedAt: new Date().toISOString(),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  });
  await appendFile(
    path.join(root, "sources/retrievals.jsonl"),
    JSON.stringify(receipts.at(-1)) + "\n",
  );
  return bytes;
}
function nextData(html) {
  const json = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  )?.[1];
  if (!json) throw Error("Riot page schema changed");
  return JSON.parse(json);
}
async function batches(values, fn, size = 5) {
  const out = [];
  for (let i = 0; i < values.length; i += size)
    out.push(...(await Promise.all(values.slice(i, i + size).map(fn))));
  return out;
}
const rosterPage = nextData(
  (
    await get("https://wildrift.leagueoflegends.com/en-us/champions/")
  ).toString(),
);
await save("sources/riot-roster.json", rosterPage);
const cards = rosterPage.props.pageProps.page.blades.find(
  (b) => b.type === "characterCardGrid",
).items;
const roster = await batches(cards, async (card) => {
  const slug = card.action.payload.url.match(/champions\/([^/]+)/)[1];
  const portrait = `/rift/assets/${id}/${slug}.webp`;
  const bytes = await get(card.media.url);
  await writeFile(
    path.join(assetDir, `${slug}.webp`),
    await sharp(bytes)
      .resize(112, 128, { fit: "cover" })
      .webp({ quality: 78 })
      .toBuffer(),
  );
  return {
    id: slug,
    name: card.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    aliases: [],
    portrait,
    portraitSource: card.media.url,
  };
});
if (
  roster.length < 100 ||
  new Set(roster.map((c) => c.id)).size !== roster.length
)
  throw Error("Unexpected roster");
await save("roster.json", roster);
const covered = [
  "swain",
  "vladimir",
  "mordekaiser",
  "dr-mundo",
  "evelynn",
  "ahri",
  "jinx",
  "caitlyn",
  "miss-fortune",
  "veigar",
  "nunu-and-willump",
  "varus",
  "zyra",
  "xayah",
  "yuumi",
  "lillia",
  "tryndamere",
  "lucian",
  "lux",
  "ekko",
  "malphite",
  "soraka",
  "leona",
  "yasuo",
  "garen",
  "vayne",
  "alistar",
];
const kits = await batches(
  covered.filter((slug) => roster.some((c) => c.id === slug)),
  async (slug) => {
    const url = `https://wildrift.leagueoflegends.com/en-us/champions/${slug}/`;
    const data = nextData((await get(url)).toString());
    const blades = data.props.pageProps.page.blades;
    await save(`sources/${slug}.json`, data);
    const abilityBlade = blades.find((b) =>
      b.groups?.some((g) => g.content?.description?.body),
    );
    return {
      id: slug,
      source: url,
      abilities: (abilityBlade?.groups ?? []).slice(0, 5).map((g, i) => ({
        slot: ["passive", "q", "w", "e", "r"][i],
        name: g.label,
        description: strip(g.content?.description?.body ?? ""),
      })),
    };
  },
);
await save("kits.json", kits);

const seeds = [
  "malignance",
  "rylais-crystal-scepter",
  "riftmaker",
  "rabadons-deathcap",
  "infinity-orb",
  "liandrys-torment",
  "bloodletters-curse",
  "morellonomicon",
  "oceanids-trident",
  "zhonyas-hourglass",
  "banshees-veil",
  "rod-of-ages",
  "ludens-echo",
  "lich-bane",
  "hextech-rocketbelt",
  "force-of-nature",
  "amaranths-twinguard",
  "thornmail",
  "sunfire-aegis",
  "titanic-hydra",
  "warmogs-armor",
  "heartsteel",
  "infinity-edge",
  "runaans-hurricane",
  "bloodthirster",
  "mortal-reminder",
  "guardian-angel",
  "rapid-firecannon",
  "yun-tal-wildarrows",
  "boots-of-speed",
  "boots-of-mana",
  "mercurys-treads",
  "plated-steelcaps",
  "berserkers-greaves",
  "ionian-boots-of-lucidity",
  "spellslingers-shoes",
  "chainlaced-crushers",
  "armored-advance",
  "gunmetal-greaves",
  "crimson-lucidity",
  "relic-shield",
];
const seen = new Set();
const items = [];
let queue = seeds;
while (queue.length) {
  const batch = [...new Set(queue)].filter((slug) => !seen.has(slug));
  queue = [];
  batch.forEach((slug) => seen.add(slug));
  await batches(batch, async (slug) => {
    const url = `https://www.wildriftmeta.com/items/${slug}/`;
    let html;
    try {
      html = (await get(url)).toString();
    } catch (e) {
      if (seeds.includes(slug)) throw e;
      console.warn(String(e));
      return;
    }
    const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
    const name = strip(main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
    const price = Number(strip(main).match(/(\d+) gold/)?.[1]);
    if (!name || !price) throw Error(`Cannot parse ${slug}`);
    const recipeHtml =
      main.match(
        /<aside class="side-panel"><h2>Build path<\/h2>([\s\S]*?)<\/aside>/,
      )?.[1] ?? "";
    const recipe = [...recipeHtml.matchAll(/href="\/items\/([^/]+)\//g)].map(
      (m) => m[1],
    );
    const stats = strip(
      main.match(
        /<h2>Item stats<\/h2>(?:\s*<\/div>){0,2}\s*<p[^>]*>([\s\S]*?)<\/p>/,
      )?.[1] ?? "",
    );
    const effect = strip(
      main.match(
        /<h2>What it does<\/h2>(?:\s*<\/div>){0,2}\s*<p[^>]*>([\s\S]*?)<\/p>/,
      )?.[1] ?? "",
    );
    if (!stats) throw Error(`Missing item stats ${slug}`);
    await save(`sources/item-${slug}.json`, {
      source: url,
      name,
      price,
      recipe,
      stats,
      effect,
    });
    items.push({
      id: slug,
      name,
      price,
      recipe,
      stats,
      source: url,
      status: "community",
    });
    queue.push(...recipe);
  });
}
items.sort((a, b) => a.id.localeCompare(b.id));
await save("items.json", items);
// Reference legal pages; guides are evidence for page structure, never win-rate labels.
const runePages = await batches(
  [
    "swain",
    "vladimir",
    "mordekaiser",
    "dr-mundo",
    "evelynn",
    "ahri",
    "jinx",
    "caitlyn",
  ],
  async (slug) => {
    const url = `https://www.wildriftfire.com/guide/${slug}`;
    const html = (await get(url)).toString();
    const block =
      html.match(
        /<div class="section runes">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/,
      )?.[1] ?? "";
    const runes = [
      ...block.matchAll(
        /<img class="([^"]+)" src="\/images\/runes\/([^"]+)\.png" alt="([^"]+)"/g,
      ),
    ]
      .slice(0, 5)
      .map((m) => ({ tree: m[1], id: m[2], name: strip(m[3]) }));
    if (runes.length !== 5) throw Error(`Rune schema ${slug}: ${runes.length}`);
    return { champion: slug, source: url, runes };
  },
);
await save("rune-pages.json", runePages);
for (const patch of new Set([
  "7-2",
  "7-2a",
  "7-2b",
  "7-2c",
  "7-2d",
  "7-2e",
  "7-3",
  "7-3a",
  "7-3b",
  requestedPatch.replace(".", "-"),
])) {
  const url = `https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-${patch}/`;
  try {
    const data = nextData((await get(url)).toString());
    await save(`sources/patch-${patch}.json`, data);
  } catch (error) {
    console.warn(`Preserved patch acquisition failure: ${error.message}`);
  }
}
await save("manifest.json", {
  id,
  game: "Wild Rift",
  patch: requestedPatch,
  createdAt: new Date().toISOString(),
  status: "partial-verification",
  roster: roster.length,
  kits: kits.length,
  items: items.length,
  receipts,
});
console.log(
  JSON.stringify({
    id,
    roster: roster.length,
    kits: kits.length,
    items: items.length,
    runePages: runePages.length,
  }),
);
