export const ROLES = ["top", "jungle", "mid", "adc", "support"] as const;
export type Role = (typeof ROLES)[number];
export const MODES = ["ranked", "pvp", "aram", "aaa-aram"] as const;
export type Mode = (typeof MODES)[number];
export const OBJECTIVES = [
  "win",
  "kills",
  "carry",
  "mvp",
  "support",
  "practice",
] as const;
export type Objective = (typeof OBJECTIVES)[number];
export const STAGES = ["pre-lock", "loading", "in-game", "postgame"] as const;
export type Stage = (typeof STAGES)[number];
export const TRAITS = [
  "burst",
  "dps",
  "mobility",
  "cc",
  "magic",
  "physical",
  "healing",
  "shields",
  "resistance",
  "engage",
  "antiKite",
  "objectives",
  "durability",
  "range",
] as const;
export type Trait = (typeof TRAITS)[number];
export type Combat = Record<Trait, number>;
export interface Ability {
  slot: string;
  name: string;
  description: string;
}
export interface Champion {
  id: string;
  name: string;
  aliases: string[];
  portrait: string;
  roles: Partial<Record<Role, number>>;
  combat: Combat | null;
  mana: boolean | null;
  abilities: Ability[];
  source: string;
  coverage: "kit-reviewed" | "roster-only";
}
export interface PoolEntry {
  champion: string;
  proficiency: number;
  preference: number;
}
export interface Profile {
  id: string;
  name: string;
  role: Role;
  objective: Objective;
  risk: number;
  mode: Mode;
  queue: "solo" | "duo" | "team";
  duoPartner: string | null;
  pool: PoolEntry[];
  bootTiming?: "core-first" | "earlier-tier2";
}
export interface Draft {
  allies: (string | null)[];
  enemies: (string | null)[];
  bans: string[];
  selected: string | null;
  stage: Stage;
  patch: string;
  gameMinutes: number;
  gold: number;
  owned: string[];
  buildChoice?: string | null;
  slotEvidence?: Partial<Record<"allies" | "enemies", (SlotEvidence | null)[]>>;
}
export interface SlotEvidence {
  source: "manual" | "screenshot";
  corrected: boolean;
  sourceHash?: string;
  similarity?: number;
  recognizerVersion?: string;
}
export interface AppState {
  schema: 1;
  profiles: Profile[];
  activeProfile: string;
  draft: Draft;
  retainCrops: boolean;
}
export interface Reason {
  code: string;
  value: number;
  text: string;
}
export interface ChampionCandidate {
  champion: string;
  score: number;
  reasons: Reason[];
  warnings: string[];
}
export interface Item {
  id: string;
  name: string;
  price: number;
  recipe: string[];
  stats: string;
  source: string;
  status: "official-crosscheck" | "community";
  patch: string;
  kind: "major" | "component" | "boots" | "support";
  modes: Mode[];
  groups: string[];
  effects: string[];
  needsMana: boolean;
  minMinute: number;
  removed?: boolean;
}
export type RuneTree =
  | "keystone"
  | "Sorcery"
  | "Precision"
  | "Resolve"
  | "Domination"
  | "Inspiration";
export interface Rune {
  id: string;
  name: string;
  tree: RuneTree;
  row: number;
  patch: string;
}
export interface RunePage {
  keystone: string;
  primary: [string, string, string];
  secondary: string;
}
export interface BuildTemplate {
  id: string;
  name: string;
  champions: string[];
  family: "ap" | "ad" | "tank";
  items: string[];
  runeChampion: string;
  keystone?: string;
  objective: Partial<Record<Objective, number>>;
  risk: number;
  strategy: string;
  tradeoff: string;
}
export interface PurchaseStep {
  item: string;
  cost: number;
  total: number;
  action: "buy" | "combine" | "release";
  inventory: string[];
  minMinute: number;
  note: string;
}
export interface BuildCandidate {
  id: string;
  name: string;
  score: number;
  items: string[];
  boots: string;
  runes: RunePage;
  spells: [string, string];
  reasons: Reason[];
  tradeoff: string;
  strategy: string;
  warnings: string[];
  purchase: PurchaseStep[];
  totalGold: number;
  supportInventory: string[];
  alternatives: { item: string; replaces: string; condition: string }[];
  itemReasons: Record<string, string>;
  runeReasons: Record<string, string>;
  spellReasons: Record<string, string>;
}
export interface Recommendation {
  ruleVersion: string;
  dataVersion: string;
  patch: string;
  presentedBuild?: string;
  input: { profile: Profile; draft: Draft };
  champions: ChampionCandidate[];
  selected: string | null;
  builds: BuildCandidate[];
  threats: Combat;
  coverage: {
    knownEnemies: number;
    reviewedEnemies: number;
    totalSlots: number;
  };
  warnings: string[];
  tactics: string[];
}
export interface SavedAdvice {
  id: string;
  savedAt: string;
  recommendation: Recommendation;
  note: string;
}
