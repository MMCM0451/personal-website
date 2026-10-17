import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  describe,
  evaluateCorrections,
  GRID,
  recognise,
  validateCrop,
} from "../../lib/rift/vision";
const pixels = (inverse = false) =>
  new Uint8Array(
    Array.from({ length: GRID * GRID * 4 }, (_, i) =>
      i % 4 === 3
        ? 255
        : ((Math.floor(i / 4) * 13 + Math.floor(i / 48) * 73) % 255) *
            (inverse ? -1 : 1) +
          (inverse ? 255 : 0),
    ),
  );
test("descriptor rejects wrong size and corrupt pixels", () => {
  assert.throws(() => describe([1]));
  const p = [...pixels()];
  p[0] = NaN;
  assert.throws(() => describe(p));
});
test("blank and transparent slots abstain instead of assigning champions", () => {
  const d = describe(new Uint8Array(GRID * GRID * 4));
  assert.equal(recognise(d, []).decision, "empty");
  assert.deepEqual(recognise(d, []).candidates, []);
});
test("ambiguous templates require correction and stable candidate ties", () => {
  const q = describe(pixels());
  const r = recognise(q, [
    { champion: "xayah", descriptor: q },
    { champion: "ahri", descriptor: q },
  ]);
  assert.equal(r.decision, "uncertain");
  assert.equal(r.candidates[0].champion, "ahri");
  assert.equal(r.gap, 0);
});
test("synthetic identity ranks correctly but still requires explicit confirmation", () => {
  const q = describe(pixels());
  const r = recognise(q, [
    { champion: "swain", descriptor: q },
    { champion: "jinx", descriptor: describe(pixels(true)) },
  ]);
  assert.equal(r.candidates[0].champion, "swain");
  assert.equal(r.decision, "confirm");
  assert.equal(r.candidates[0].similarity, 1);
});
test("multiple templates per identity do not crowd out alternative candidates", () => {
  const q = describe(pixels());
  const r = recognise(q, [
    { champion: "swain", descriptor: q },
    { champion: "swain", descriptor: q },
    { champion: "jinx", descriptor: describe(pixels(true)) },
  ]);
  assert.equal(r.candidates.length, 2);
});
test("empty reference set and single reference never imply calibrated confidence", () => {
  const q = describe(pixels());
  assert.equal(recognise(q, []).decision, "uncertain");
  assert.equal(
    recognise(q, [{ champion: "swain", descriptor: q }]).decision,
    "uncertain",
  );
});
test("out of bounds, partial and tiny crops fail validation", () => {
  assert.throws(() =>
    validateCrop({ x: -1, y: 0, width: 10, height: 10 }, 100, 100),
  );
  assert.throws(() =>
    validateCrop({ x: 95, y: 0, width: 10, height: 10 }, 100, 100),
  );
  assert.throws(() =>
    validateCrop({ x: 0, y: 0, width: 2, height: 2 }, 100, 100),
  );
  validateCrop({ x: 10, y: 10, width: 40, height: 40 }, 100, 100);
});
test("evaluation never reports synthetic-only or absent data as real accuracy", () => {
  const result = recognise(describe(pixels()), []);
  const evaluation = evaluateCorrections([
    {
      champion: "swain",
      evidenceKind: "reference-test",
      matchGroup: "test",
      layout: "other",
      recognition: result,
    },
  ]);
  assert.equal(evaluation.realCrops, 0);
  assert.equal(evaluation.top1, null);
  assert.equal(evaluation.top3, null);
  assert.equal(evaluation.referenceTestCrops, 1);
});
