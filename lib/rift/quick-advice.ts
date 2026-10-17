// View adapter over the one deterministic engine; never manufactures a loadout.
import { championById, items } from "./catalog";
import { tactics } from "./templates";
import type { BuildCandidate, Draft, Recommendation } from "./types";
// Short actions from the same reviewed kit/tactical facts, without numerical claims.
const shortActions: Record<string, string> = {
  veigar: "Stay outside Event Horizon; enter after the cage expires.",
  "nunu-and-willump": "Sidestep Snowball; interrupt Absolute Zero safely.",
  "miss-fortune": "Leave Bullet Time’s cone; approach with cover.",
  xayah: "Leave the feather line before her recall; track her ultimate.",
  yuumi: "Commit on a reachable host after its protection tools expire.",
  tryndamere: "Hold control or disengage until Undying Rage ends.",
  lillia: "Spread before her sleep setup; avoid a prolonged chase.",
  ekko: "Track his return position before committing a finishing combo.",
};
export function quickThreats(draft: Draft) {
  return draft.enemies
    .flatMap((id) => {
      if (!id || !championById[id].combat) return [];
      const c = championById[id],
        p = c.combat!;
      const property =
        p.cc >= 2
          ? "control"
          : p.burst >= 2
            ? "burst"
            : p.mobility >= 2
              ? "mobility"
              : p.dps >= 2
                ? "sustained damage"
                : "range";
      const generic =
        property === "control"
          ? `Wait for ${c.name}'s control spell before committing; preserve an exit.`
          : property === "burst"
            ? `Avoid entering ${c.name}'s full combo at low health; reassess survival before more damage.`
            : property === "mobility"
              ? `Hold control until ${c.name} spends mobility; avoid a prolonged chase.`
              : `Keep a safe approach to ${c.name}; use cover and allied follow-up.`;
      return [
        {
          championId: id,
          code: `THREAT_${id.toUpperCase().replaceAll("-", "_")}`,
          title: `${c.name} · ${property}`,
          action: shortActions[id] ?? tactics[id] ?? generic,
          severity: p.burst + p.cc + p.engage + (id === "veigar" ? 3 : 0),
          source: c.source,
          coverage: c.coverage,
        },
      ];
    })
    .sort(
      (a, b) =>
        b.severity - a.severity || a.championId.localeCompare(b.championId),
    );
}
function consumeCredit(target: string, held: string[]): number {
  const at = held.indexOf(target);
  if (at >= 0) {
    held.splice(at, 1);
    return items[target].price;
  }
  return items[target].recipe.reduce((n, id) => n + consumeCredit(id, held), 0);
}
export function nextPurchase(build: BuildCandidate, draft: Draft) {
  const contains = (parent: string, child: string): boolean =>
    parent === child || items[parent].recipe.some((id) => contains(id, child));
  for (const step of build.purchase) {
    if (step.action === "release") continue;
    if (draft.owned.some((held) => contains(held, step.item))) continue;
    // Never advance to Tier 3 solely because it appears in the full future plan.
    if (step.minMinute > draft.gameMinutes) continue;
    const held = [...draft.owned];
    const discount = items[step.item].recipe.reduce(
      (n, id) => n + consumeCredit(id, held),
      0,
    );
    const cost = items[step.item].price - discount;
    if (held.length >= 6)
      return {
        item: step.item,
        cost,
        affordable: false,
        note: "Inventory full. Review the quest slot or components before buying.",
      };
    return {
      item: step.item,
      cost,
      affordable: cost <= draft.gold,
      note: step.note,
    };
  }
  return null;
}
export function adviceDiff(before: Recommendation, after: Recommendation) {
  const old = new Set(
    quickThreats(before.input.draft).map((t) => t.championId),
  );
  const now = new Set(quickThreats(after.input.draft).map((t) => t.championId));
  return {
    removedThreats: [...old].filter((id) => !now.has(id)),
    addedThreats: [...now].filter((id) => !old.has(id)),
    buildsChanged:
      JSON.stringify(
        before.builds.map((b) => ({
          id: b.id,
          items: b.items,
          boots: b.boots,
          purchase: b.purchase,
        })),
      ) !==
      JSON.stringify(
        after.builds.map((b) => ({
          id: b.id,
          items: b.items,
          boots: b.boots,
          purchase: b.purchase,
        })),
      ),
    objectiveChanged:
      before.input.profile.objective !== after.input.profile.objective,
  };
}
