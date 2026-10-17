import type { BuildTemplate } from "./types";

export const templates: BuildTemplate[] = [
  {
    id: "ap-aggressive",
    name: "Aggressive AP carry",
    champions: ["swain"],
    family: "ap",
    items: [
      "malignance",
      "infinity-orb",
      "rabadons-deathcap",
      "bloodletters-curse",
      "zhonyas-hourglass",
    ],
    runeChampion: "swain",
    keystone: "electrocute",
    objective: { kills: 18, carry: 12 },
    risk: 85,
    strategy:
      "Play around fog and allied crowd control. Commit after enemy escape tools are spent; reserve an exit.",
    tradeoff:
      "Higher burst and AP scaling, less sustained durability. This does not turn Swain into a mobile assassin.",
  },
  {
    id: "ap-drain",
    name: "Sustained drain fighter",
    champions: ["swain"],
    family: "ap",
    items: [
      "rylais-crystal-scepter",
      "riftmaker",
      "liandrys-torment",
      "amaranths-twinguard",
      "rabadons-deathcap",
    ],
    runeChampion: "swain",
    objective: { win: 7, support: 12 },
    risk: 30,
    strategy:
      "Fight front to back near allies. Extend combat while keeping targets in range, then convert the won fight into an objective.",
    tradeoff:
      "Slower burst spike; needs time in combat and access to targets. Anti-heal and disengage reduce sustain.",
  },
  {
    id: "ap-flex",
    name: "Flexible carry battlemage",
    champions: ["swain"],
    family: "ap",
    items: [
      "malignance",
      "rylais-crystal-scepter",
      "riftmaker",
      "rabadons-deathcap",
      "zhonyas-hourglass",
    ],
    runeChampion: "swain",
    objective: { win: 10, carry: 9, mvp: 7 },
    risk: 55,
    strategy:
      "Use controlled catches and extended skirmishes. Reassess the third purchase against the enemy carry who is actually ahead.",
    tradeoff:
      "Balances damage, control and survival; gives up the peak damage or durability of a specialised path.",
  },
  {
    id: "ap-vladimir",
    name: "Scaling blood mage",
    champions: ["vladimir"],
    family: "ap",
    items: [
      "hextech-rocketbelt",
      "riftmaker",
      "rabadons-deathcap",
      "infinity-orb",
      "zhonyas-hourglass",
    ],
    runeChampion: "vladimir",
    objective: { carry: 12, win: 7 },
    risk: 50,
    strategy:
      "Preserve health and farm toward AP spikes. Track hard control before committing to a multi-target ultimate.",
    tradeoff:
      "Scaling costs early pressure. Pool is an escape window, not permanent CC immunity.",
  },
  {
    id: "ap-juggernaut",
    name: "AP duelist",
    champions: ["mordekaiser"],
    family: "ap",
    items: [
      "rylais-crystal-scepter",
      "riftmaker",
      "liandrys-torment",
      "amaranths-twinguard",
      "rabadons-deathcap",
    ],
    runeChampion: "mordekaiser",
    objective: { carry: 8, win: 8 },
    risk: 45,
    strategy:
      "Trade in extended melee fights. Isolate a valuable reachable target and protect the objective approach.",
    tradeoff:
      "Vulnerable to kiting and ranged pressure; spending on durability delays AP.",
  },
  {
    id: "tank-scaling",
    name: "Health and frontline",
    champions: ["dr-mundo"],
    family: "tank",
    items: [
      "heartsteel",
      "sunfire-aegis",
      "titanic-hydra",
      "force-of-nature",
      "warmogs-armor",
    ],
    runeChampion: "dr-mundo",
    objective: { win: 10, support: 8 },
    risk: 35,
    strategy:
      "Take measured short trades, build health, and draw pressure while staying close enough for the team to follow.",
    tradeoff:
      "Health stacking can be punished by percent-health damage and anti-heal; stacking takes time.",
  },
  {
    id: "ap-pick",
    name: "Magic pick and burst",
    champions: ["evelynn", "ahri"],
    family: "ap",
    items: [
      "lich-bane",
      "infinity-orb",
      "rabadons-deathcap",
      "bloodletters-curse",
      "banshees-veil",
    ],
    runeChampion: "evelynn",
    objective: { kills: 15, carry: 10 },
    risk: 80,
    strategy:
      "Approach from vision denial, wait for a vulnerable target, and keep a mobility tool for the exit.",
    tradeoff:
      "High pick threat; poor value when forced to hit the frontline or face-check crowd control.",
  },
  {
    id: "ap-control",
    name: "Safe spell pressure",
    champions: ["ahri"],
    family: "ap",
    items: [
      "ludens-echo",
      "infinity-orb",
      "rabadons-deathcap",
      "bloodletters-curse",
      "zhonyas-hourglass",
    ],
    runeChampion: "ahri",
    objective: { win: 12, support: 5 },
    risk: 45,
    strategy:
      "Clear safely and create picks with charm. Save a dash to reposition after the initial combo.",
    tradeoff:
      "Safer repeat pressure, with less single-target burst than a committed pick build.",
  },
  {
    id: "ad-crit",
    name: "Crit teamfight carry",
    champions: ["jinx", "caitlyn"],
    family: "ad",
    items: [
      "yun-tal-wildarrows",
      "infinity-edge",
      "runaans-hurricane",
      "mortal-reminder",
      "bloodthirster",
    ],
    runeChampion: "jinx",
    objective: { carry: 14, kills: 7, win: 9 },
    risk: 55,
    strategy:
      "Keep a frontline between you and engage. Hit the safest available target and turn takedowns into turret or neutral-objective pressure.",
    tradeoff:
      "Crit and Yun Tal need time to scale. Front-loaded protection may be more valuable when behind.",
  },
  {
    id: "ad-range",
    name: "Range and survival",
    champions: ["jinx", "caitlyn"],
    family: "ad",
    items: [
      "yun-tal-wildarrows",
      "infinity-edge",
      "rapid-firecannon",
      "mortal-reminder",
      "guardian-angel",
    ],
    runeChampion: "caitlyn",
    objective: { win: 11, mvp: 7 },
    risk: 25,
    strategy:
      "Use range to contribute without crossing the enemy engage line. Preserve escape tools for divers.",
    tradeoff:
      "Range and revive insurance sacrifice sustained lifesteal and multi-target damage.",
  },
];

export const tactics: Record<string, string> = {
  veigar:
    "Respect Veigar’s cage boundary. Tenacity does not make crossing the cage safe; wait for it to expire or reposition around it.",
  xayah:
    "Track Xayah’s feather line and ultimate. Avoid committing into a prepared feather recall.",
  yuumi:
    "Focus a reachable host after protection tools are committed. Anti-heal and anti-shield solve different problems.",
  tryndamere:
    "Track Tryndamere’s ultimate and hold crowd control or disengage until it ends; avoid spending everything into his survival window.",
  "miss-fortune":
    "Avoid narrow approaches into Miss Fortune’s ultimate; use cover or interrupt when safe.",
  lillia:
    "Do not chase Lillia through prolonged movement loops. Spread before her sleep setup.",
  ekko: "Track Ekko’s return position and ultimate availability before using a finishing combo.",
};
