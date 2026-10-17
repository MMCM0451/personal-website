import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  championById,
  items,
  PATCH,
  runePages,
  runes,
} from "../../lib/rift/catalog";
import {
  itemEligibility,
  purchasePlan,
  recommend,
  validateBuild,
  validateCatalog,
  validateRunePage,
} from "../../lib/rift/engine";
import { defaultState, emptyDraft, parseState } from "../../lib/rift/state";
import type { Draft, Profile } from "../../lib/rift/types";
const max = defaultState().profiles[0];
const draft = (
  ids: string[] = [],
  selected: string | null = "swain",
): Draft => ({
  ...emptyDraft(),
  enemies: [...ids, ...Array(5 - ids.length).fill(null)],
  selected,
});
const check = (p: Profile, d: Draft) => {
  const rec = recommend(p, d);
  assert.ok(rec.builds.length > 0);
  for (const b of rec.builds) {
    assert.equal(b.items.length, 5);
    assert.equal(new Set([...b.items, b.boots]).size, 6);
    assert.deepEqual(
      validateBuild(rec.selected!, b.items, b.boots, b.runes, p.mode),
      [],
    );
    assert.ok(b.purchase.every((s) => s.inventory.length <= 6));
    assert.equal(
      b.purchase.reduce((sum, s) => sum + s.cost, 0),
      b.totalGold,
    );
    assert.equal(
      b.totalGold,
      b.items.reduce((sum, id) => sum + items[id].price, 0) +
        items[b.boots].price +
        (p.role === "support" && ["ranked", "pvp"].includes(p.mode)
          ? items["relic-shield"].price
          : 0),
    );
  }
  return rec;
};
test("catalog recipes have no cycles, missing parts or negative costs", () =>
  assert.deepEqual(validateCatalog(), []));
test("mechanics ingestion retains real mana/stat fields, not empty-schema fallbacks", () => {
  assert.match(items.malignance.stats, /500 Mana/);
  assert.equal(items.malignance.needsMana, true);
  assert.ok(
    itemEligibility(
      items.malignance,
      championById.vladimir,
      "ranked",
      PATCH,
    ).some((e) => e.includes("Mana")),
  );
  assert.equal(items["rylais-crystal-scepter"].needsMana, false);
  assert.ok(Object.values(items).every((i) => i.stats.length > 0));
});
test("official 7.3b overrides supersede stale community prices", () => {
  assert.equal(items["yun-tal-wildarrows"].price, 3000);
  assert.equal(items.thornmail.price, 2850);
  assert.match(
    items["yun-tal-wildarrows"].source,
    /wildrift.leagueoflegends.com/,
  );
});
test("partial draft keeps hidden slots null and is reproducible", () => {
  const d = draft(["xayah"]);
  const copy = structuredClone(d);
  const a = check(max, d);
  assert.deepEqual(d, copy);
  assert.deepEqual(a, recommend(max, d));
  assert.equal(a.coverage.knownEnemies, 1);
  assert.equal(a.input.draft.enemies.filter((x) => x === null).length, 4);
});
test("Swain + Jinx against MF, Veigar, Nunu, Varus, Zyra", () => {
  const d = draft([
    "miss-fortune",
    "veigar",
    "nunu-and-willump",
    "varus",
    "zyra",
  ]);
  d.allies[0] = "jinx";
  const r = check(max, d);
  assert.equal(r.coverage.reviewedEnemies, 5);
  assert.equal(r.builds.length, 3);
  assert.ok(r.tactics.some((t) => t.includes("cage")));
  assert.ok(r.champions[0].reasons.some((r) => r.code === "DAMAGE_MIX"));
});
test("Xayah + Yuumi surface feather tactics and separate anti-heal/anti-shield", () => {
  const r = check(max, draft(["xayah", "yuumi"]));
  assert.ok(r.tactics.some((t) => t.includes("feather")));
  for (const b of r.builds) {
    assert.ok(b.items.includes("morellonomicon"));
    assert.ok(b.items.includes("oceanids-trident"));
  }
});
test("Lillia, Tryndamere, Lucian, Lux, Ekko threats are reflected", () => {
  const r = check(
    max,
    draft(["lillia", "tryndamere", "lucian", "lux", "ekko"]),
  );
  assert.ok(r.threats.mobility > 1);
  assert.ok(r.tactics.some((t) => t.includes("Tryndamere")));
  assert.ok(
    r.champions.some((c) =>
      c.reasons.some((r) => r.code === "KITE" && r.value < 0),
    ),
  );
});
test("jungle Evelynn enforces role and Smite across compositions", () => {
  for (const ids of [
    ["jinx", "caitlyn"],
    ["malphite", "leona", "lux"],
  ]) {
    const r = check({ ...max, role: "jungle" }, draft(ids, "evelynn"));
    assert.equal(r.builds[0].spells[1], "Smite");
    assert.ok(r.champions.every((c) => championById[c.champion].roles.jungle));
  }
});
test("Vladimir heavy CC/burst avoids mana items and uses defensive boots", () => {
  const r = check(
    max,
    draft(["veigar", "lux", "ekko", "leona", "ahri"], "vladimir"),
  );
  for (const b of r.builds) {
    assert.equal(b.boots, "chainlaced-crushers");
    assert.ok(b.items.every((id) => !items[id].needsMana));
  }
});
test("all initial pool champions receive legal builds in reviewed roles", () => {
  for (const [id, role] of [
    ["swain", "mid"],
    ["vladimir", "mid"],
    ["mordekaiser", "top"],
    ["dr-mundo", "top"],
    ["evelynn", "jungle"],
    ["ahri", "mid"],
    ["jinx", "adc"],
    ["caitlyn", "adc"],
  ] as const)
    check({ ...max, role }, draft([], id));
});
test("role suitability excludes impossible pool roles", () => {
  const r = recommend({ ...max, role: "adc" }, draft([], null));
  assert.equal(r.champions.length, 1);
  assert.equal(r.champions[0].champion, "swain");
  const j = recommend({ ...max, role: "jungle" }, draft([], null));
  assert.equal(j.champions[0].champion, "evelynn");
});
test("objectives alter components and archetype preference", () => {
  const d = draft(["jinx"]);
  const kills = check({ ...max, objective: "kills", risk: 85 }, d);
  const win = check({ ...max, objective: "win", risk: 50 }, d);
  assert.equal(kills.builds[0].id, "ap-aggressive");
  assert.notEqual(kills.builds[0].id, win.builds[0].id);
  assert.notDeepEqual(kills.champions, win.champions);
});
test("all acquired rune pages satisfy current legal structure", () => {
  for (const p of Object.values(runePages))
    assert.deepEqual(validateRunePage(p), []);
});
test("illegal rune duplicates and same-tree secondary rejected", () => {
  const p = structuredClone(runePages.swain);
  p.secondary = p.primary[0];
  assert.ok(validateRunePage(p).length);
  p.secondary = "transcendence";
  assert.ok(validateRunePage(p).length);
});
test("rune row order matters independently of count", () => {
  const p = structuredClone(runePages.swain);
  p.primary.reverse();
  assert.ok(validateRunePage(p).some((e) => e.includes("rows")));
  assert.equal(runes["legend-haste"].row, 3);
});
test("five majors plus boots and removed/mismatched items are enforced", () => {
  const b = check(max, draft()).builds[0];
  assert.ok(
    validateBuild("swain", b.items.slice(0, 4), b.boots, b.runes, "ranked")
      .length,
  );
  assert.ok(
    validateBuild(
      "swain",
      [...b.items.slice(0, 4), "magnetic-blaster"],
      b.boots,
      b.runes,
      "ranked",
    ).length,
  );
  assert.ok(
    itemEligibility(
      { ...items["riftmaker"], removed: true },
      championById.swain,
      "ranked",
      PATCH,
    ).length,
  );
});
test("unknown patch never silently substitutes current builds", () => {
  const r = recommend(max, { ...draft(), patch: "7.4" });
  assert.equal(r.builds.length, 0);
  assert.ok(r.warnings.some((w) => w.includes("disabled")));
  assert.ok(validateRunePage(runePages.swain, "7.4").length);
});
test("support occupies a major slot until explicit late sale", () => {
  const r = check({ ...max, role: "support" }, draft());
  for (const b of r.builds) {
    assert.equal(b.supportInventory.length, 6);
    assert.ok(b.supportInventory.includes("relic-shield"));
    const release = b.purchase.findIndex((s) => s.action === "release");
    assert.ok(release > 0);
    assert.ok(b.purchase[release - 1].inventory.includes("relic-shield"));
    assert.ok(!b.purchase.at(-1)!.inventory.includes("relic-shield"));
  }
});
test("boot upgrade has a verified time gate and consumes prior boots", () => {
  const b = check(max, draft()).builds[0];
  assert.ok(
    itemEligibility(
      items[b.boots],
      championById.swain,
      "ranked",
      PATCH,
      9.99,
    ).some((e) => e.includes("10")),
  );
  assert.deepEqual(
    itemEligibility(items[b.boots], championById.swain, "ranked", PATCH, 10),
    [],
  );
  const upgrade = b.purchase.find((s) => s.item === b.boots)!;
  assert.equal(upgrade.minMinute, 10);
  assert.equal(
    upgrade.inventory.filter((id) => items[id].kind === "boots").length,
    1,
  );
});
test("components are credited exactly once and full inventory never exceeded", () => {
  const b = check(max, draft()).builds[0];
  const plan = purchasePlan(b.items, b.boots, false, "ranked");
  assert.ok(
    plan.some((s) => s.action === "combine" && s.cost < items[s.item].price),
  );
  assert.equal(plan.at(-1)!.inventory.length, 6);
  assert.deepEqual(
    new Set(plan.at(-1)!.inventory),
    new Set([...b.items, b.boots]),
  );
});
test("ARAM/AAA withholds unverified upgrades and Smite", () => {
  for (const mode of ["aram", "aaa-aram"] as const) {
    const r = check({ ...max, mode, role: "jungle" }, draft([], "evelynn"));
    assert.notEqual(r.builds[0].spells[1], "Smite");
    assert.equal(items[r.builds[0].boots].minMinute, 0);
    assert.ok(r.warnings.some((w) => w.includes("augments")));
  }
});
test("bans exclude pool picks and unknown kit does not fabricate coverage", () => {
  const d = draft(["aatrox"], null);
  d.bans = ["swain"];
  const r = recommend(max, d);
  assert.ok(!r.champions.some((c) => c.champion === "swain"));
  assert.equal(r.coverage.reviewedEnemies, 0);
  assert.equal(r.coverage.knownEnemies, 1);
});
test("a banned or enemy-locked selected champion cannot produce a ranked build", () => {
  const d = draft();
  d.bans = ["swain"];
  assert.equal(recommend(max, d).builds.length, 0);
  assert.equal(recommend(max, draft(["swain"])).builds.length, 0);
  assert.ok(recommend({ ...max, mode: "pvp" }, draft(["swain"])).builds.length);
});
test("MVP objective exposes uncertainty", () =>
  assert.ok(
    recommend({ ...max, objective: "mvp" }, draft()).warnings.some((w) =>
      w.includes("formula"),
    ),
  ));
test("runtime state validation rejects corrupt values and duplicate teams", () => {
  const st = defaultState();
  assert.deepEqual(parseState(st), st);
  assert.throws(() => parseState({ ...st, schema: 2 }));
  assert.throws(() =>
    parseState({
      ...st,
      draft: { ...st.draft, enemies: ["jinx", "jinx", null, null, null] },
    }),
  );
  assert.throws(() => recommend({ ...max, risk: NaN }, draft()));
  assert.throws(() =>
    parseState({
      ...st,
      profiles: [
        {
          ...max,
          pool: [{ champion: "pc-only", proficiency: 5, preference: 5 }],
        },
      ],
    }),
  );
});
