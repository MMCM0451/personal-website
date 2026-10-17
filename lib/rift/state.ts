import { PATCH, championById, items } from "./catalog";
import {
  MODES,
  OBJECTIVES,
  ROLES,
  STAGES,
  type AppState,
  type Draft,
  type Profile,
} from "./types";

export function emptyDraft(): Draft {
  return {
    allies: Array(5).fill(null),
    enemies: Array(5).fill(null),
    bans: [],
    selected: null,
    stage: "pre-lock",
    patch: PATCH,
    gameMinutes: 0,
    gold: 0,
    owned: [],
    buildChoice: null,
  };
}
export function defaultProfile(id = "max", name = "Max"): Profile {
  return {
    id,
    name,
    role: "mid",
    objective: "win",
    risk: 50,
    mode: "ranked",
    queue: "solo",
    duoPartner: null,
    pool: [
      "swain",
      "vladimir",
      "mordekaiser",
      "dr-mundo",
      "evelynn",
      "ahri",
    ].map((champion, i) => ({
      champion,
      proficiency: i === 0 ? 5 : 3,
      preference: Math.max(1, 5 - i),
    })),
  };
}
export function defaultState(): AppState {
  const charles = {
    ...defaultProfile("charles", "Charles"),
    role: "adc" as const,
    pool: [
      { champion: "jinx", proficiency: 4, preference: 5 },
      { champion: "caitlyn", proficiency: 3, preference: 4 },
    ],
  };
  return {
    schema: 1,
    profiles: [defaultProfile(), charles],
    activeProfile: "max",
    draft: emptyDraft(),
    retainCrops: false,
  };
}
function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Expected an object");
}
function member<T extends string>(
  value: unknown,
  values: readonly T[],
): asserts value is T {
  if (!values.includes(value as T))
    throw Error(`Invalid choice: ${String(value)}`);
}
function number(value: unknown, min: number, max: number) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw Error("Number outside allowed range");
}
function champion(value: unknown, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || !championById[value])
    throw Error("Unknown champion");
}
export function validateProfile(value: unknown): asserts value is Profile {
  object(value);
  if (
    typeof value.id !== "string" ||
    !/^[a-z0-9-]{1,64}$/.test(value.id) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 60
  )
    throw Error("Invalid profile identity");
  member(value.role, ROLES);
  member(value.mode, MODES);
  member(value.objective, OBJECTIVES);
  member(value.queue, ["solo", "duo", "team"]);
  number(value.risk, 0, 100);
  if (value.bootTiming !== undefined)
    member(value.bootTiming, ["core-first", "earlier-tier2"]);
  if (value.duoPartner !== null && typeof value.duoPartner !== "string")
    throw Error("Invalid duo partner");
  if (!Array.isArray(value.pool) || value.pool.length > 150)
    throw Error("Invalid champion pool");
  for (const p of value.pool) {
    object(p);
    champion(p.champion);
    number(p.proficiency, 1, 5);
    number(p.preference, 1, 5);
  }
  if (new Set(value.pool.map((p) => p.champion)).size !== value.pool.length)
    throw Error("Duplicate pool entries");
}
export function validateDraft(value: unknown): asserts value is Draft {
  object(value);
  for (const key of ["allies", "enemies"]) {
    const slots = value[key];
    if (!Array.isArray(slots) || slots.length !== 5)
      throw Error("Each team needs five slots");
    slots.forEach((c) => champion(c, true));
    if (new Set(slots.filter(Boolean)).size !== slots.filter(Boolean).length)
      throw Error("Duplicate champions within a team");
  }
  if (!Array.isArray(value.bans) || value.bans.length > 20)
    throw Error("Invalid bans");
  value.bans.forEach((c) => champion(c));
  if (value.slotEvidence !== undefined) {
    object(value.slotEvidence);
    for (const side of ["allies", "enemies"]) {
      const evidence: unknown = (value.slotEvidence as Record<string, unknown>)[
        side
      ];
      if (evidence === undefined) continue;
      if (!Array.isArray(evidence) || evidence.length !== 5)
        throw Error("Invalid slot evidence");
      const rows: unknown[] = evidence;
      for (const row of rows) {
        if (row === null) continue;
        object(row);
        member(row.source, ["manual", "screenshot"]);
        if (typeof row.corrected !== "boolean")
          throw Error("Invalid correction evidence");
        if (
          row.sourceHash !== undefined &&
          (typeof row.sourceHash !== "string" ||
            !/^[a-f0-9]{64}$/.test(row.sourceHash))
        )
          throw Error("Invalid source hash");
        if (row.similarity !== undefined) number(row.similarity, 0, 1);
        if (
          row.recognizerVersion !== undefined &&
          (typeof row.recognizerVersion !== "string" ||
            row.recognizerVersion.length > 100)
        )
          throw Error("Invalid recognizer version");
      }
    }
  }
  champion(value.selected, true);
  if (
    value.buildChoice !== undefined &&
    value.buildChoice !== null &&
    (typeof value.buildChoice !== "string" ||
      !/^[a-z0-9-]{1,80}$/.test(value.buildChoice))
  )
    throw Error("Invalid build choice");
  member(value.stage, STAGES);
  if (typeof value.patch !== "string" || value.patch.length > 32)
    throw Error("Invalid patch");
  number(value.gameMinutes, 0, 180);
  number(value.gold, 0, 100000);
  if (
    !Array.isArray(value.owned) ||
    value.owned.length > 6 ||
    value.owned.some((i) => typeof i !== "string" || !items[i])
  )
    throw Error("Invalid owned inventory");
}
export function parseState(value: unknown): AppState {
  object(value);
  if (value.schema !== 1) throw Error("Unsupported save version");
  if (
    !Array.isArray(value.profiles) ||
    value.profiles.length < 1 ||
    value.profiles.length > 30
  )
    throw Error("Invalid profiles");
  value.profiles.forEach(validateProfile);
  const ids = value.profiles.map((p) => p.id);
  if (
    new Set(ids).size !== ids.length ||
    !ids.includes(value.activeProfile as string)
  )
    throw Error("Invalid active profile");
  if (
    value.profiles.some(
      (p) =>
        p.duoPartner && (!ids.includes(p.duoPartner) || p.duoPartner === p.id),
    )
  )
    throw Error("Invalid duo relationship");
  validateDraft(value.draft);
  if (typeof value.retainCrops !== "boolean")
    throw Error("Invalid privacy choice");
  return JSON.parse(JSON.stringify(value)) as AppState;
}
