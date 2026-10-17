import roster from "./data/7.3b-2026-10-17.3/roster.json";
import kits from "./data/7.3b-2026-10-17.3/kits.json";
import rawItems from "./data/7.3b-2026-10-17.3/items.json";
import rawPages from "./data/7.3b-2026-10-17.3/rune-pages.json";
import officialReview from "./data/7.3b-official-review-1.json";
import type {
  Champion,
  Combat,
  Item,
  Role,
  Rune,
  RunePage,
  RuneTree,
} from "./types";
import { MODES, TRAITS } from "./types";

export const PATCH = "7.3b";
export const DATA_VERSION = "7.3b-2026-10-17.3+official-review-1";
export const RULE_VERSION = "rift-rules-1";
// Authored 0..3 qualitative properties, based on WR kit descriptions, not win-rate data.
type Kit = [Partial<Record<Role, number>>, boolean, Partial<Combat>];
const traits: Record<string, Kit> = {
  swain: [
    { mid: 1, top: 0.7, support: 0.65, adc: 0.45 },
    true,
    {
      magic: 3,
      burst: 1.5,
      dps: 2.5,
      cc: 2,
      healing: 3,
      durability: 2,
      engage: 1,
      antiKite: 3,
      range: 1.5,
    },
  ],
  vladimir: [
    { mid: 1, top: 0.8 },
    false,
    {
      magic: 3,
      burst: 2.5,
      dps: 2,
      healing: 3,
      durability: 2,
      mobility: 1,
      antiKite: 2,
      range: 1,
    },
  ],
  mordekaiser: [
    { top: 1, mid: 0.55, jungle: 0.5 },
    false,
    {
      magic: 3,
      dps: 3,
      healing: 2,
      shields: 2,
      durability: 3,
      cc: 1.5,
      engage: 1,
      antiKite: 3,
      objectives: 2,
    },
  ],
  "dr-mundo": [
    { top: 1, jungle: 0.6 },
    false,
    {
      physical: 2,
      magic: 1,
      dps: 2,
      healing: 3,
      durability: 3,
      resistance: 2,
      engage: 1,
      antiKite: 2,
      objectives: 1,
    },
  ],
  evelynn: [
    { jungle: 1 },
    true,
    {
      magic: 3,
      burst: 3,
      mobility: 2.5,
      cc: 1.5,
      healing: 1,
      objectives: 2,
      range: 0.5,
    },
  ],
  ahri: [
    { mid: 1 },
    true,
    { magic: 3, burst: 2.5, mobility: 3, cc: 2, healing: 1, range: 2 },
  ],
  jinx: [
    { adc: 1 },
    true,
    {
      physical: 3,
      dps: 3,
      burst: 1,
      range: 3,
      cc: 1,
      objectives: 3,
      antiKite: 1,
    },
  ],
  caitlyn: [
    { adc: 1 },
    true,
    {
      physical: 3,
      dps: 2.5,
      burst: 1.5,
      range: 3,
      cc: 1.5,
      mobility: 1,
      objectives: 3,
    },
  ],
  "miss-fortune": [
    { adc: 1 },
    true,
    { physical: 3, magic: 0.5, burst: 2.5, dps: 2, range: 2.5, objectives: 2 },
  ],
  veigar: [
    { mid: 1, support: 0.5 },
    true,
    { magic: 3, burst: 3, cc: 3, range: 2 },
  ],
  "nunu-and-willump": [
    { jungle: 1 },
    true,
    {
      magic: 3,
      burst: 2,
      healing: 2,
      durability: 2,
      cc: 3,
      engage: 3,
      objectives: 3,
    },
  ],
  nunu: [
    { jungle: 1 },
    true,
    {
      magic: 3,
      burst: 2,
      healing: 2,
      durability: 2,
      cc: 3,
      engage: 3,
      objectives: 3,
    },
  ],
  varus: [
    { adc: 1 },
    true,
    {
      physical: 2,
      magic: 2,
      burst: 2,
      dps: 2.5,
      range: 3,
      cc: 2,
      objectives: 2,
    },
  ],
  zyra: [
    { support: 1, mid: 0.6 },
    true,
    { magic: 3, burst: 2, dps: 2, cc: 3, range: 3 },
  ],
  xayah: [
    { adc: 1 },
    true,
    { physical: 3, dps: 3, burst: 2, cc: 2, range: 2, objectives: 2 },
  ],
  yuumi: [
    { support: 1 },
    true,
    { magic: 1, healing: 3, shields: 3, cc: 1, range: 2 },
  ],
  lillia: [
    { jungle: 1, top: 0.6 },
    true,
    { magic: 3, dps: 3, mobility: 3, cc: 2.5, healing: 1, range: 1.5 },
  ],
  tryndamere: [
    { top: 1, jungle: 0.6 },
    false,
    {
      physical: 3,
      dps: 3,
      mobility: 2,
      healing: 2,
      objectives: 3,
      durability: 1,
    },
  ],
  lucian: [
    { adc: 1, mid: 0.5 },
    true,
    { physical: 3, burst: 2.5, dps: 3, mobility: 2, range: 1.5, objectives: 2 },
  ],
  lux: [
    { mid: 1, support: 1 },
    true,
    { magic: 3, burst: 3, cc: 2.5, shields: 2, range: 3 },
  ],
  ekko: [
    { mid: 1, jungle: 1 },
    true,
    { magic: 3, burst: 3, cc: 2, mobility: 3, healing: 2, shields: 1 },
  ],
  malphite: [
    { top: 1, mid: 0.5, support: 0.5 },
    true,
    { magic: 3, burst: 2, cc: 3, durability: 3, resistance: 3, engage: 3 },
  ],
  soraka: [{ support: 1 }, true, { magic: 1, healing: 3, cc: 1, range: 2 }],
  leona: [
    { support: 1 },
    true,
    { magic: 2, cc: 3, engage: 3, durability: 3, resistance: 3 },
  ],
  yasuo: [
    { mid: 1, top: 0.6 },
    false,
    { physical: 3, dps: 3, cc: 2, mobility: 3, shields: 1, objectives: 2 },
  ],
  garen: [
    { top: 1 },
    false,
    {
      physical: 3,
      burst: 2,
      dps: 2,
      healing: 2,
      durability: 3,
      resistance: 2,
      cc: 1,
    },
  ],
  vayne: [
    { adc: 1, top: 0.5 },
    true,
    { physical: 3, dps: 3, mobility: 2, cc: 1, range: 1.5, objectives: 2 },
  ],
  alistar: [
    { support: 1 },
    true,
    { magic: 2, cc: 3, engage: 3, durability: 3, healing: 1 },
  ],
};
const aliases: Record<string, string[]> = {
  "dr-mundo": ["mundo", "dr mundo"],
  "nunu-and-willump": ["nunu", "nunu & willump"],
  nunu: ["nunu & willump"],
  "miss-fortune": ["mf"],
  mordekaiser: ["morde"],
  "jarvan-iv": ["j4"],
};
export const champions: Champion[] = roster.map((c) => {
  const kit = traits[c.id];
  return {
    ...c,
    name: c.id === "dr-mundo" ? "Dr. Mundo" : c.name,
    aliases: aliases[c.id] ?? [],
    roles: kit?.[0] ?? {},
    mana: kit?.[1] ?? null,
    combat: kit
      ? (Object.fromEntries(TRAITS.map((t) => [t, kit[2][t] ?? 0])) as Combat)
      : null,
    abilities: kits.find((k) => k.id === c.id)?.abilities ?? [],
    source: `https://wildrift.leagueoflegends.com/en-us/champions/${c.id}/`,
    coverage: kit ? "kit-reviewed" : "roster-only",
  };
});
export const championById = Object.fromEntries(champions.map((c) => [c.id, c]));
export function findChampion(query: string) {
  const key = query.trim().toLowerCase();
  return champions.find(
    (c) =>
      c.id === key || c.name.toLowerCase() === key || c.aliases.includes(key),
  );
}
const major = new Set([
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
]);
const boot3 = [
  "spellslingers-shoes",
  "chainlaced-crushers",
  "armored-advance",
  "gunmetal-greaves",
  "crimson-lucidity",
];
const boot2 = [
  "boots-of-mana",
  "mercurys-treads",
  "plated-steelcaps",
  "berserkers-greaves",
  "ionian-boots-of-lucidity",
];
const effects: Record<string, string[]> = {
  morellonomicon: ["anti-heal"],
  "mortal-reminder": ["anti-heal", "armor-penetration"],
  thornmail: ["conditional-anti-heal", "armor"],
  "oceanids-trident": ["anti-shield"],
  "rylais-crystal-scepter": ["slow"],
  "zhonyas-hourglass": ["stasis"],
  "banshees-veil": ["spell-shield"],
  "force-of-nature": ["magic-resist", "healing-amplification"],
  "bloodletters-curse": ["magic-shred"],
  riftmaker: ["sustain"],
  "liandrys-torment": ["burn"],
  malignance: ["ultimate-zone"],
  "rabadons-deathcap": ["ap-scaling"],
};
export const items: Record<string, Item> = Object.fromEntries(
  rawItems.map((i) => {
    const isBoot = [...boot2, ...boot3, "boots-of-speed"].includes(i.id);
    const groups: string[] = [];
    if (["mortal-reminder", "seryldas-grudge", "terminus"].includes(i.id))
      groups.push("last-whisper");
    if (["rod-of-ages", "abyssal-mask"].includes(i.id)) groups.push("eternity");
    if (i.id === "relic-shield") groups.push("support-quest");
    const official = [
      "boots-of-speed",
      ...boot2,
      ...boot3,
      "yun-tal-wildarrows",
    ].includes(i.id);
    return [
      i.id,
      {
        ...i,
        patch: PATCH,
        status: official ? "official-crosscheck" : "community",
        kind: isBoot
          ? "boots"
          : i.id === "relic-shield"
            ? "support"
            : major.has(i.id)
              ? "major"
              : "component",
        modes: i.id === "relic-shield" ? ["ranked", "pvp"] : [...MODES],
        groups,
        effects: effects[i.id] ?? [],
        needsMana: /\d+ Mana\b/.test(i.stats),
        minMinute: boot3.includes(i.id) ? 10 : 0,
      } satisfies Item,
    ];
  }),
);
for (const [id, price] of Object.entries(officialReview.itemPrices)) {
  items[id] = {
    ...items[id],
    price,
    status: "official-crosscheck",
    source: officialReview.source,
  };
}
items["warmogs-armor"].effects.push(
  "Heart requires 1250 bonus health; check activation",
);
// Positions below are explicit page rows from current WR champion guide examples.
export const runes: Record<string, Rune> = {};
export const runePages: Record<string, RunePage> = {};
for (const page of rawPages) {
  page.runes.forEach((r, i) => {
    runes[r.id] = {
      ...r,
      tree: r.tree as RuneTree,
      row: i === 0 ? 0 : i === 4 ? (runes[r.id]?.row ?? 3) : i,
      patch: PATCH,
    };
  });
  runePages[page.champion] = {
    keystone: page.runes[0].id,
    primary: page.runes.slice(1, 4).map((r) => r.id) as [
      string,
      string,
      string,
    ],
    secondary: page.runes[4].id,
  };
}
// Secondary selections do not establish a row. Explicit corrections reviewed against WR rune trees.
const rows: Record<string, number> = {
  "legend-haste": 3,
  "legend-alacrity": 3,
  "legend-tenacity": 3,
  "bone-plating": 2,
  overgrowth: 3,
  "second-wind": 2,
  "absolute-focus": 2,
  "nimbus-cloak": 3,
  transcendence: 2,
  "axiom-arcanist": 1,
  "sudden-impact": 1,
  "chain-assault": 2,
  "eyeball-collector": 3,
};
for (const [id, row] of Object.entries(rows))
  if (runes[id]) runes[id].row = row;
for (const [id, name] of [
  ["electrocute", "Electrocute"],
  ["conqueror", "Conqueror"],
] as const)
  runes[id] = { id, name, tree: "keystone", row: 0, patch: PATCH };
