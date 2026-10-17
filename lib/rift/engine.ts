import {
  championById,
  DATA_VERSION,
  items,
  PATCH,
  RULE_VERSION,
  runePages,
  runes,
} from "./catalog";
import { validateDraft, validateProfile } from "./state";
import { tactics, templates } from "./templates";
import { itemReasons, runeReasons, spellReasons } from "./explanations";
import {
  TRAITS,
  type BuildCandidate,
  type Champion,
  type Combat,
  type Draft,
  type Item,
  type Mode,
  type Profile,
  type PurchaseStep,
  type Reason,
  type Recommendation,
  type RunePage,
} from "./types";

const reason = (code: string, value: number, text: string): Reason => ({
  code,
  value: Math.round(value * 100) / 100,
  text,
});
const sortScore = <T extends { score: number }>(a: T, b: T) =>
  b.score - a.score;
function aggregate(ids: (string | null)[]): Combat {
  const known = ids.flatMap((id) =>
    id && championById[id]?.combat ? [championById[id].combat!] : [],
  );
  return Object.fromEntries(
    TRAITS.map((t) => [
      t,
      known.length ? known.reduce((sum, c) => sum + c[t], 0) / known.length : 0,
    ]),
  ) as Combat;
}
export function validateRunePage(page: RunePage, patch = PATCH): string[] {
  const ids = [page.keystone, ...page.primary, page.secondary];
  const errors: string[] = [];
  if (ids.length !== 5 || new Set(ids).size !== 5)
    errors.push("Five different runes required");
  if (ids.some((id) => !runes[id] || runes[id].patch !== patch))
    return [...errors, "Rune unavailable in patch"];
  if (runes[page.keystone].tree !== "keystone") errors.push("Illegal keystone");
  const primary = page.primary.map((id) => runes[id]);
  if (
    new Set(primary.map((r) => r.tree)).size !== 1 ||
    primary.some((r) => r.tree === "keystone") ||
    primary.some((r, i) => r.row !== i + 1)
  )
    errors.push("Primary tree requires rows 1, 2 and 3");
  if (
    runes[page.secondary].tree === primary[0].tree ||
    runes[page.secondary].tree === "keystone"
  )
    errors.push("Secondary rune must come from another minor tree");
  return errors;
}
export function itemEligibility(
  item: Item,
  champion: Champion,
  mode: Mode,
  patch: string,
  minute = 180,
): string[] {
  return [
    item.removed ? "Removed item" : "",
    item.patch !== patch ? "Patch mismatch" : "",
    !item.modes.includes(mode) ? "Unavailable in mode" : "",
    item.needsMana && champion.mana === false
      ? "Mana item on manaless champion"
      : "",
    item.minMinute > minute ? `Requires ${item.minMinute}:00` : "",
  ].filter(Boolean);
}
export function validateBuild(
  championId: string,
  majorIds: string[],
  bootId: string,
  page: RunePage,
  mode: Mode,
  patch = PATCH,
): string[] {
  const errors = validateRunePage(page, patch);
  const champion = championById[championId];
  if (!champion) return [...errors, "Unknown champion"];
  if (majorIds.length !== 5) errors.push("Exactly five major slots required");
  const ids = [...majorIds, bootId];
  if (new Set(ids).size !== 6) errors.push("Duplicate final item");
  const groups = new Set<string>();
  for (const [index, id] of ids.entries()) {
    const item = items[id];
    if (!item) {
      errors.push(`Unknown item ${id}`);
      continue;
    }
    if (item.kind !== (index === 5 ? "boots" : "major"))
      errors.push(`Invalid slot for ${id}`);
    errors.push(...itemEligibility(item, champion, mode, patch));
    for (const group of item.groups) {
      if (groups.has(group)) errors.push(`Passive conflict: ${group}`);
      groups.add(group);
    }
  }
  return errors;
}
export function validateCatalog(
  catalog: Record<string, Item> = items,
): string[] {
  const errors: string[] = [];
  const visit = (id: string, trail: string[]) => {
    if (trail.includes(id)) {
      errors.push(`Recipe cycle ${id}`);
      return;
    }
    const item = catalog[id];
    if (!item) {
      errors.push(`Missing component ${id}`);
      return;
    }
    if (!Number.isInteger(item.price) || item.price <= 0)
      errors.push(`Invalid price ${id}`);
    const cost = item.recipe.reduce(
      (sum, c) => sum + (catalog[c]?.price ?? Infinity),
      0,
    );
    if (cost > item.price) errors.push(`Negative combine cost ${id}`);
    for (const child of item.recipe) visit(child, [...trail, id]);
  };
  Object.keys(catalog).forEach((id) => visit(id, []));
  return [...new Set(errors)];
}

// Shop combines can directly buy missing components without holding every leaf in inventory.
// Only actually held components are credited; no sales value is invented.
export function purchasePlan(
  majorIds: string[],
  bootId: string,
  support: boolean,
  mode: Mode,
  owned: string[] = [],
  options: { urgentStasis?: boolean; earlierTier2?: boolean } = {},
): PurchaseStep[] {
  const inventory = [...owned];
  let total = 0;
  const steps: PurchaseStep[] = [];
  function credit(id: string): number {
    const at = inventory.indexOf(id);
    if (at >= 0) {
      inventory.splice(at, 1);
      return items[id].price;
    }
    return items[id].recipe.reduce((sum, c) => sum + credit(c), 0);
  }
  function acquire(id: string, note: string) {
    if (inventory.includes(id)) return;
    const item = items[id];
    if (!item) throw Error(`Unknown purchase ${id}`);
    const discount = item.recipe.reduce((sum, c) => sum + credit(c), 0);
    const cost = item.price - discount;
    if (cost < 0 || inventory.length >= 6)
      throw Error("Purchase cannot fit in inventory");
    inventory.push(id);
    total += cost;
    steps.push({
      item: id,
      cost,
      total,
      action: discount ? "combine" : "buy",
      inventory: [...inventory],
      minMinute: item.minMinute,
      note,
    });
  }
  if (support)
    acquire(
      "relic-shield",
      "Support start. Quest progression is earned in play, not purchased; retain its evolved quest item until the optional late sale.",
    );
  const first = items[majorIds[0]];
  const initial = first.recipe
    .flatMap((id) => (items[id].recipe.length ? items[id].recipe : [id]))
    .find((id) => items[id].price <= 500);
  if (initial && !support)
    acquire(
      initial,
      "Starting component; spend only what your mode actually grants.",
    );
  acquire(
    "boots-of-speed",
    "Early recall option: movement before committing to a full item.",
  );
  const tier2 = items[bootId].minMinute
    ? items[bootId].recipe.find((id) => items[id].kind === "boots")!
    : bootId;
  if (options.earlierTier2)
    acquire(
      tier2,
      "Earlier Tier 2 preference. This delays the first completed major item.",
    );
  const ordered =
    options.urgentStasis && majorIds.includes("zhonyas-hourglass")
      ? [
          majorIds[0],
          "zhonyas-hourglass",
          ...majorIds.slice(1).filter((id) => id !== "zhonyas-hourglass"),
        ]
      : majorIds;
  ordered.forEach((id, index) => {
    if (support && index === 4) {
      const at = inventory.indexOf("relic-shield");
      if (at >= 0) {
        inventory.splice(at, 1);
        steps.push({
          item: "relic-shield",
          cost: 0,
          total,
          action: "release",
          inventory: [...inventory],
          minMinute: 0,
          note: "Optional late sale of evolved quest item ONLY when you choose to give up its utility for the fifth major. No sale-gold credit assumed.",
        });
      }
    }
    const recipes =
      id === "zhonyas-hourglass" && options.urgentStasis
        ? [...items[id].recipe].reverse()
        : items[id].recipe;
    const component = recipes.find(
      (c) => !inventory.includes(c) && inventory.length < 6,
    );
    if (component)
      acquire(
        component,
        id === "zhonyas-hourglass" && options.urgentStasis
          ? "Accelerated survival path. Armguard is a component, not an active Stasis; finish Hourglass before the next greedy AP spike if burst is decisive."
          : `Recall option toward ${items[id].name}; complete when the remaining gold is affordable.`,
      );
    acquire(
      id,
      index === 0
        ? "First major power spike. Recall on a safe wave or before an objective; no fixed minute is assumed."
        : "Complete this spike when safe and affordable; adjust to who is actually ahead.",
    );
    if (index === 0)
      acquire(
        tier2,
        "Intermediate boots: upgrade for the matchup before continuing the core.",
      );
    if (index === 3 && tier2 !== bootId)
      acquire(
        bootId,
        mode === "ranked" || mode === "pvp"
          ? "Upgrade only at or after 10:00 and when affordable; otherwise continue core purchases."
          : "Timing unverified in this mode.",
      );
  });
  return steps;
}

function spells(profile: Profile): [string, string] {
  if (profile.mode === "aram" || profile.mode === "aaa-aram")
    return ["Flash", profile.objective === "kills" ? "Ignite" : "Ghost"];
  if (profile.role === "jungle") return ["Flash", "Smite"];
  if (profile.role === "support" || profile.objective === "support")
    return ["Flash", "Exhaust"];
  return ["Flash", profile.objective === "kills" ? "Ignite" : "Ghost"];
}
function builds(
  champion: Champion,
  profile: Profile,
  draft: Draft,
  enemy: Combat,
): BuildCandidate[] {
  const enemies = draft.enemies.flatMap((id) =>
    id && championById[id].combat ? [championById[id].combat!] : [],
  );
  const healing =
    enemies.some((c) => c.healing >= 2.5) ||
    enemies.filter((c) => c.healing >= 2).length >= 2;
  const shield = enemies.some((c) => c.shields >= 2.5);
  const resistant = enemies.some((c) => c.resistance >= 2);
  const aram = profile.mode === "aram" || profile.mode === "aaa-aram";
  const support = profile.role === "support" && !aram;
  return templates
    .filter((t) => t.champions.includes(champion.id))
    .map((template) => {
      const ids = [...template.items];
      const reasons: Reason[] = [
        reason("TEMPLATE", 0, template.strategy),
        reason(
          "OBJECTIVE",
          template.objective[profile.objective] ?? 0,
          `Fit for ${profile.objective} objective`,
        ),
        reason(
          "RISK",
          -Math.abs(template.risk - profile.risk) / 5,
          "Fit to your risk preference",
        ),
      ];
      const alternatives: BuildCandidate["alternatives"] = [];
      const addAlternative = (item: string, condition: string) => {
        if (!ids.includes(item))
          alternatives.push({ item, replaces: ids[ids.length - 1], condition });
      };
      function replace(item: string, code: string, text: string) {
        if (!ids.includes(item)) {
          const at = [4, 3, 2].find(
            (i) =>
              ![
                "morellonomicon",
                "oceanids-trident",
                "mortal-reminder",
                "bloodletters-curse",
              ].includes(ids[i]),
          );
          if (at !== undefined) {
            ids[at] = item;
            reasons.push(reason(code, 4, text));
          }
        }
      }
      if (healing && template.family === "ap")
        replace(
          "morellonomicon",
          "ANTI_HEAL",
          "Visible healing: trade a late damage slot for anti-heal. Consider Oblivion Orb on an earlier recall if healing is deciding fights.",
        );
      if (shield && template.family === "ap")
        replace(
          "oceanids-trident",
          "ANTI_SHIELD",
          "Heavy visible shields: shield reduction is a separate need from anti-heal.",
        );
      if (resistant && template.family === "ap")
        replace(
          "bloodletters-curse",
          "RESISTANCE",
          "Resistance stacking: repeated magic hits can benefit from magic resistance reduction.",
        );
      if (
        enemy.burst >= 2 &&
        template.family === "ap" &&
        !ids.includes("zhonyas-hourglass") &&
        !ids.includes("banshees-veil")
      )
        replace(
          "zhonyas-hourglass",
          "BURST_DEFENCE",
          "Burst threat: stasis can preserve a key fight window; it sacrifices damage.",
        );
      if (template.family === "ap") {
        addAlternative(
          "rabadons-deathcap",
          "Ahead and able to stay alive: favour AP scaling.",
        );
        addAlternative(
          "zhonyas-hourglass",
          "Dodge a decisive burst window; cannot cast while in stasis.",
        );
        addAlternative(
          "banshees-veil",
          "A single hostile spell prevents your entry; spell shields can be poked away.",
        );
        addAlternative(
          "morellonomicon",
          "Healing is actually sustaining the enemy; do not buy purely for low-impact healing.",
        );
        addAlternative(
          "oceanids-trident",
          "Shield-heavy enemy team; check who can apply shield reduction reliably.",
        );
      } else if (template.family === "ad") {
        addAlternative(
          "guardian-angel",
          "Dives threaten you before you can contribute. Revive needs nearby allies.",
        );
        addAlternative(
          "bloodthirster",
          "Safe sustained attacks make lifesteal valuable.",
        );
      } else
        addAlternative(
          "thornmail",
          "Enemy attack-based healing; its anti-heal needs its trigger, not merely proximity.",
        );
      let tier2 =
        template.family === "ad"
          ? "berserkers-greaves"
          : champion.mana
            ? "boots-of-mana"
            : "ionian-boots-of-lucidity";
      if (enemy.cc >= 1.5 || enemy.magic >= 2) {
        tier2 = "mercurys-treads";
        reasons.push(
          reason(
            "CC_BOOTS",
            3,
            "Magic/CC threat: Mercury’s Treads add resilience. Tenacity does not solve every control effect.",
          ),
        );
      } else if (enemy.physical >= 2 && enemy.dps >= 2) {
        tier2 = "plated-steelcaps";
        reasons.push(
          reason(
            "ATTACK_BOOTS",
            3,
            "Sustained physical attacks: consider attack mitigation over offensive boots.",
          ),
        );
      }
      const upgrades: Record<string, string> = {
        "boots-of-mana": "spellslingers-shoes",
        "mercurys-treads": "chainlaced-crushers",
        "plated-steelcaps": "armored-advance",
        "berserkers-greaves": "gunmetal-greaves",
        "ionian-boots-of-lucidity": "crimson-lucidity",
      };
      const boots = aram ? tier2 : upgrades[tier2];
      // Use this champion's reviewed legal example where available; keystone is independent of the minor tree.
      const page = runePages[champion.id] ?? runePages[template.runeChampion];
      const runes: RunePage = {
        ...page,
        primary: [...page.primary],
        keystone: template.keystone ?? page.keystone,
      };
      const warnings = validateBuild(
        champion.id,
        ids,
        boots,
        runes,
        profile.mode,
        draft.patch,
      );
      const candidate: BuildCandidate = {
        id: template.id,
        name: template.name,
        score: Math.round(50 + reasons.reduce((sum, r) => sum + r.value, 0)),
        items: ids,
        boots,
        runes,
        spells: spells(profile),
        reasons,
        strategy: template.strategy,
        tradeoff: template.tradeoff,
        warnings,
        purchase: [],
        totalGold: 0,
        supportInventory: support
          ? [...ids.slice(0, 4), "relic-shield", boots]
          : [],
        alternatives,
        itemReasons: Object.fromEntries(
          ids.map((id) => [
            id,
            itemReasons[id] ??
              "Review the item trigger and opportunity cost in the current client.",
          ]),
        ),
        runeReasons: Object.fromEntries(
          [runes.keystone, ...runes.primary, runes.secondary].map((id) => [
            id,
            runeReasons[id] ??
              "Reviewed legal baseline; exact benefit is not simulated.",
          ]),
        ),
        spellReasons: Object.fromEntries(
          spells(profile).map((id) => [id, spellReasons[id]]),
        ),
      };
      if (warnings.length === 0) {
        // Owned inventory is a separate next-purchase aid. The canonical full plan starts from zero.
        candidate.purchase = purchasePlan(
          ids,
          boots,
          support,
          profile.mode,
          [],
          {
            urgentStasis: enemy.burst >= 2,
            earlierTier2: profile.bootTiming === "earlier-tier2",
          },
        );
        candidate.totalGold = candidate.purchase.at(-1)?.total ?? 0;
      }
      return candidate;
    })
    .filter((c) => c.warnings.length === 0)
    .sort((a, b) => sortScore(a, b) || a.id.localeCompare(b.id));
}

export function recommend(profile: Profile, draft: Draft): Recommendation {
  validateProfile(profile);
  validateDraft(draft);
  const enemy = aggregate(draft.enemies);
  const ally = aggregate(draft.allies.filter((id) => id !== draft.selected));
  const knownEnemies = draft.enemies.filter(Boolean).length;
  const reviewedEnemies = draft.enemies.filter(
    (id) => id && championById[id].combat,
  ).length;
  const warnings = [
    "Strategy scores are authored heuristics, not win probabilities. Item recipes are community sourced; confirm uncertain mechanics in the current client.",
  ];
  if (draft.patch !== PATCH)
    warnings.push(
      `No reviewed snapshot for ${draft.patch}; builds disabled. Active snapshot is ${PATCH}.`,
    );
  if (knownEnemies < 5)
    warnings.push(
      `${5 - knownEnemies} enemy slots unknown. Advice uses visible picks only.`,
    );
  if (reviewedEnemies < knownEnemies)
    warnings.push(
      `${knownEnemies - reviewedEnemies} visible enemy kits have no reviewed threat tags; matchup coverage is incomplete.`,
    );
  if (profile.mode === "aram" || profile.mode === "aaa-aram")
    warnings.push(
      "ARAM: rank only champions you were actually offered. No mode damage/healing modifiers or augments are modelled; tier-3 timing is unverified and upgrades are withheld.",
    );
  if (profile.objective === "mvp")
    warnings.push(
      "MVP preference uses damage, participation and survival proxies. Riot’s scoring formula is unknown.",
    );
  const candidates = profile.pool
    .flatMap((entry) => {
      const c = championById[entry.champion];
      const p = c.combat;
      if (
        !p ||
        !templates.some((t) => t.champions.includes(c.id)) ||
        draft.bans.includes(c.id) ||
        (draft.allies.includes(c.id) && c.id !== draft.selected) ||
        (profile.mode === "ranked" && draft.enemies.includes(c.id))
      )
        return [];
      const roleFit = c.roles[profile.role] ?? 0;
      if (
        (profile.mode === "ranked" || profile.mode === "pvp") &&
        roleFit === 0
      )
        return [];
      const reasons = [
        reason(
          "PROFICIENCY",
          entry.proficiency * 6,
          "Your editable proficiency estimate",
        ),
        reason("PREFERENCE", entry.preference * 2, "Your champion preference"),
        reason(
          "ROLE",
          profile.mode === "aram" || profile.mode === "aaa-aram"
            ? 12
            : roleFit * 20,
          `Suitability for ${profile.role}`,
        ),
      ];
      const objective =
        profile.objective === "kills"
          ? p.burst * 4 + p.mobility * 2
          : profile.objective === "carry"
            ? p.dps * 4 + p.objectives * 3
            : profile.objective === "support"
              ? p.cc * 4 + p.durability * 3
              : profile.objective === "mvp"
                ? p.dps * 2 + p.cc * 2 + p.durability * 2
                : profile.objective === "practice"
                  ? entry.preference * 6
                  : p.objectives * 2 + p.cc * 2 + p.durability * 2;
      reasons.push(
        reason(
          "OBJECTIVE",
          objective,
          `Contribution to your ${profile.objective} preference`,
        ),
      );
      reasons.push(
        reason(
          "RISK",
          (-(100 - profile.risk) / 100) * enemy.burst * (3 - p.durability) * 2,
          "Burst exposure at your chosen risk level",
        ),
      );
      reasons.push(
        reason(
          "KITE",
          -enemy.mobility * p.antiKite * 1.2,
          "Mobile enemies can escape sustained range",
        ),
      );
      reasons.push(
        reason(
          "CONTROL",
          -enemy.cc * (3 - p.mobility) * 0.7,
          "Enemy control limits access and escape",
        ),
      );
      if (draft.allies.some(Boolean)) {
        reasons.push(
          reason(
            "FOLLOW_UP",
            Math.min(ally.cc, p.burst + p.dps) * 2,
            "Allied crowd control can set up your damage",
          ),
        );
        if (ally.durability < 1)
          reasons.push(
            reason(
              "FRONTLINE",
              p.durability * 2,
              "Visible allies have little frontline durability",
            ),
          );
        if (ally.magic < ally.physical)
          reasons.push(
            reason(
              "DAMAGE_MIX",
              p.magic * 2,
              "Magic damage complements the visible physical damage",
            ),
          );
      }
      if (profile.queue !== "solo" && draft.allies.some(Boolean))
        reasons.push(
          reason(
            "PREMADE_SETUP",
            p.cc,
            "Coordinated setup can improve follow-up; no hidden duo pick is assumed",
          ),
        );
      const score =
        Math.round(reasons.reduce((sum, r) => sum + r.value, 0) * 100) / 100;
      return [
        {
          champion: c.id,
          score,
          reasons,
          warnings:
            roleFit < 0.8 &&
            profile.mode !== "aram" &&
            profile.mode !== "aaa-aram"
              ? ["Secondary/off-role heuristic: confirm your lane plan."]
              : [],
        },
      ];
    })
    .sort((a, b) => sortScore(a, b) || a.champion.localeCompare(b.champion))
    .slice(0, 3);
  const selected = draft.selected ?? candidates[0]?.champion ?? null;
  if (!candidates.length)
    warnings.push(
      "No covered, unbanned pool champion fits this role. Edit your pool or role; unsupported kits are not silently scored.",
    );
  if (selected && !(championById[selected].roles[profile.role] ?? 0))
    warnings.push(
      "Selected champion has no reviewed suitability for this role.",
    );
  if (selected && !templates.some((t) => t.champions.includes(selected)))
    warnings.push(
      "No reviewed build template is available for this champion; roster/kit coverage does not imply build coverage.",
    );
  const blockedSelection =
    selected &&
    (draft.bans.includes(selected) ||
      (profile.mode === "ranked" && draft.enemies.includes(selected)));
  if (blockedSelection)
    warnings.push(
      "Selected champion is banned or already picked by the ranked enemy team. Build advice withheld; correct the draft.",
    );
  if (
    profile.mode === "ranked" &&
    draft.allies.some((id) => id && draft.enemies.includes(id))
  )
    warnings.push(
      "A champion appears on both ranked teams. Correct the conflicting input.",
    );
  const tactical = draft.enemies.flatMap((id) =>
    id && tactics[id] ? [tactics[id]] : [],
  );
  if (enemy.cc >= 1.5)
    tactical.push(
      "Track the decisive control spell before entering. Tenacity reduces eligible durations; airborne and suppression effects need different answers.",
    );
  if (enemy.mobility >= 1.5)
    tactical.push(
      "Use allied control or wait for mobility cooldowns before committing. Avoid chasing away from the objective.",
    );
  if (profile.role === "jungle")
    tactical.push(
      "Carry Smite on the Rift, preserve objective access, and do not reuse pre-7.3 jungle-clear timings.",
    );
  return {
    ruleVersion: RULE_VERSION,
    dataVersion: DATA_VERSION,
    patch: draft.patch,
    input: JSON.parse(JSON.stringify({ profile, draft })),
    champions: candidates,
    selected,
    builds:
      selected && !blockedSelection && draft.patch === PATCH
        ? builds(championById[selected], profile, draft, enemy)
        : [],
    threats: enemy,
    coverage: { knownEnemies, reviewedEnemies, totalSlots: 5 },
    warnings,
    tactics: tactical,
  };
}
