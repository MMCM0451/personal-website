import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyDraft,
  defaultProfile,
  parseState,
  defaultState,
} from "../../lib/rift/state";
import { applyReviewedScan, setManualSlot } from "../../lib/rift/scan-state";
import { recommend, purchasePlan, validateBuild } from "../../lib/rift/engine";
import {
  adviceDiff,
  nextPurchase,
  quickThreats,
} from "../../lib/rift/quick-advice";
import { items } from "../../lib/rift/catalog";
import type { ScanResult } from "../../lib/rift/screenshot";
const result: ScanResult = {
  screenType: "postgame_scoreboard",
  imageMetadata: { width: 1536, height: 960 },
  recognizerVersion: "test",
  assetDatasetVersion: "test",
  sourceHash: "a".repeat(64),
  slots: [
    {
      side: "enemy",
      index: 0,
      bbox: { x: 1, y: 1, width: 50, height: 50 },
      topCandidates: [{ championId: "veigar", similarity: 0.96 }],
      confidence: null,
      gap: 0.2,
      status: "uncertain",
    },
  ],
  timings: {
    decode: 0,
    layout: 0,
    crop: 0,
    references: 0,
    classify: 0,
    total: 0,
  },
  outcome: "LOW_CONFIDENCE",
  errors: [],
  layoutEvidence: {},
};
test("uncertain proposals do not enter rules until explicit review", () => {
  const before = emptyDraft();
  assert.deepEqual(applyReviewedScan(before, result, {}).draft, before);
  const applied = applyReviewedScan(before, result, { "enemy:0": "veigar" });
  assert.equal(applied.draft.enemies[0], "veigar");
  assert.equal(applied.draft.stage, "postgame");
  assert.equal(applied.draft.slotEvidence?.enemies?.[0]?.source, "screenshot");
});
test("manual correction is protected across scans; replacement is explicit", () => {
  const draft = setManualSlot(emptyDraft(), "enemies", 0, "lux");
  assert.equal(
    applyReviewedScan(draft, result, { "enemy:0": "veigar" }).protectedSlots,
    1,
  );
  assert.equal(
    applyReviewedScan(draft, result, { "enemy:0": "veigar" }).draft.enemies[0],
    "lux",
  );
  assert.equal(
    applyReviewedScan(draft, result, { "enemy:0": "veigar" }, true).draft
      .enemies[0],
    "veigar",
  );
});
test("an intentional manual unknown is protected until replacement is allowed", () => {
  const draft = setManualSlot(emptyDraft(), "enemies", 0, null);
  assert.equal(
    applyReviewedScan(draft, result, { "enemy:0": "veigar" }).draft.enemies[0],
    null,
  );
  assert.equal(
    applyReviewedScan(draft, result, { "enemy:0": "veigar" }).protectedSlots,
    1,
  );
});
test("unsupported scans, invalid IDs and duplicate teams never mutate draft", () => {
  const draft = emptyDraft();
  assert.throws(() =>
    applyReviewedScan(draft, { ...result, screenType: "unsupported" }, {}),
  );
  assert.throws(() =>
    applyReviewedScan(draft, result, { "enemy:0": "invented" }),
  );
  draft.enemies[1] = "veigar";
  assert.throws(() =>
    applyReviewedScan(draft, result, { "enemy:0": "veigar" }),
  );
  assert.equal(draft.enemies[0], null);
});
test("mirror teams allowed and user-side swap does not invent own champion", () => {
  const draft = emptyDraft();
  draft.enemies[0] = "veigar";
  const out = applyReviewedScan(
    draft,
    result,
    { "enemy:0": "veigar" },
    false,
    true,
  );
  assert.equal(out.draft.allies[0], "veigar");
  assert.equal(out.draft.selected, null);
});
test("old local saves migrate without evidence or boot preference; invalid evidence rejected", () => {
  const st = defaultState();
  assert.equal(parseState(st).schema, 1);
  st.draft = setManualSlot(st.draft, "allies", 0, "swain");
  assert.equal(
    parseState(st).draft.slotEvidence?.allies?.[0]?.source,
    "manual",
  );
  const raw = structuredClone(st) as unknown as {
    draft: { slotEvidence: unknown };
  };
  raw.draft.slotEvidence = { enemies: [{ source: "magic" }] };
  assert.throws(() => parseState(raw));
});
test("removing Veigar removes only its specific threat; engine remains deterministic", () => {
  const p = defaultProfile(),
    d = emptyDraft();
  d.selected = "swain";
  d.enemies = ["veigar", "miss-fortune", "nunu-and-willump", "varus", "zyra"];
  const before = recommend(p, d);
  const after = recommend(p, { ...d, enemies: [null, ...d.enemies.slice(1)] });
  assert.deepEqual(adviceDiff(before, after).removedThreats, ["veigar"]);
  assert.ok(
    !quickThreats(after.input.draft).some((t) => t.championId === "veigar"),
  );
  assert.ok(after.tactics.every((t) => !t.includes("Veigar")));
  assert.deepEqual(recommend(p, d), before);
});
test("early 400g boots, urgent Stasis before greedy AP, Tier 3 after core and ≥10:00", () => {
  const d = emptyDraft();
  d.selected = "swain";
  d.enemies = ["veigar", "lux", "ekko", "ahri", "evelynn"];
  const b = recommend(defaultProfile(), d).builds[0];
  assert.equal(b.purchase.find((s) => s.item === "boots-of-speed")?.cost, 400);
  assert.ok(
    b.purchase.findIndex((s) => s.item === "zhonyas-hourglass") <
      b.purchase.findIndex((s) => s.item === "rabadons-deathcap"),
  );
  assert.ok(
    b.purchase.findIndex((s) => s.item === "seekers-armguard") <
      b.purchase.findIndex((s) => s.item === "zhonyas-hourglass"),
  );
  const upgrade = b.purchase.find((s) => s.item === b.boots)!;
  assert.equal(upgrade.minMinute, 10);
  assert.ok(
    b.purchase
      .slice(0, b.purchase.indexOf(upgrade))
      .filter((s) => items[s.item].kind === "major").length >= 4,
  );
  assert.equal(
    validateBuild("swain", b.items, b.boots, b.runes, "ranked").length,
    0,
  );
});
test("next-purchase component credit, gold and boot gate are respected", () => {
  const d = emptyDraft();
  d.selected = "swain";
  d.stage = "in-game";
  const b = recommend(defaultProfile(), d).builds[0];
  d.owned = ["amplifying-tome"];
  d.gold = 400;
  const next = nextPurchase(b, d)!;
  assert.equal(next.item, "boots-of-speed");
  assert.equal(next.cost, 400);
  assert.equal(next.affordable, true);
  d.owned = [...b.items, items[b.boots].recipe[0]];
  d.gameMinutes = 9;
  assert.equal(nextPurchase(b, d), null);
  d.gameMinutes = 10;
  assert.equal(nextPurchase(b, d)?.item, b.boots);
  assert.equal(
    nextPurchase(b, d)?.cost,
    items[b.boots].price - items[d.owned[5]].price,
  );
});
test("support inventory never exceeds six even with accelerated defense", () => {
  const majors = [
    "malignance",
    "rylais-crystal-scepter",
    "riftmaker",
    "rabadons-deathcap",
    "zhonyas-hourglass",
  ];
  const steps = purchasePlan(
    majors,
    "chainlaced-crushers",
    true,
    "ranked",
    [],
    { urgentStasis: true },
  );
  assert.ok(steps.every((s) => s.inventory.length <= 6));
  assert.ok(steps.some((s) => s.action === "release"));
  assert.equal(steps.at(-1)?.inventory.length, 6);
  assert.equal(
    steps.at(-1)?.total,
    majors.reduce((sum, id) => sum + items[id].price, 0) +
      items["chainlaced-crushers"].price +
      items["relic-shield"].price,
  );
});
