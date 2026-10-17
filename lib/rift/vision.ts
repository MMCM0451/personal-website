// Independent, browser-compatible numerical baseline. No strategic inference here.
export const VISION_VERSION = "portrait-grid-1";
export const GRID = 12;
export interface Descriptor {
  values: number[];
  texture: number;
}
export interface Reference {
  champion: string;
  descriptor: Descriptor;
}
export interface Recognition {
  decision: "confirm" | "uncertain" | "empty";
  candidates: { champion: string; similarity: number }[];
  gap: number;
  reason: string;
  algorithm: string;
}
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function validateCrop(crop: Crop, width: number, height: number) {
  if (
    ![crop.x, crop.y, crop.width, crop.height, width, height].every(
      Number.isFinite,
    ) ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width < 4 ||
    crop.height < 4 ||
    crop.x + crop.width > width + 0.01 ||
    crop.y + crop.height > height + 0.01
  )
    throw Error("Crop outside image bounds or too small");
}
export function describe(rgba: ArrayLike<number>): Descriptor {
  if (rgba.length !== GRID * GRID * 4) throw Error("Expected 12 x 12 RGBA");
  const lum: number[] = [];
  const color: number[] = [];
  for (let i = 0; i < rgba.length; i += 4) {
    const alpha = rgba[i + 3] / 255;
    if (
      ![rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]].every(
        (v) => Number.isFinite(v) && v >= 0 && v <= 255,
      )
    )
      throw Error("Invalid pixels");
    lum.push(
      ((0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]) / 255) *
        alpha,
    );
    color.push(
      (rgba[i] / 255) * alpha,
      (rgba[i + 1] / 255) * alpha,
      (rgba[i + 2] / 255) * alpha,
    );
  }
  const mean = lum.reduce((s, x) => s + x, 0) / lum.length;
  const texture = lum.reduce((s, x) => s + (x - mean) ** 2, 0) / lum.length;
  const norm = Math.sqrt(texture) + 0.04;
  const values = lum.map((x) => (x - mean) / norm);
  // Small colour term leaves some tolerance for dim/greyscale portraits.
  for (let i = 0; i < color.length; i += 3)
    values.push(
      (color[i] - color[i + 1]) * 0.35,
      (color[i + 2] - color[i + 1]) * 0.35,
    );
  return { values, texture };
}
export function recognise(
  query: Descriptor,
  references: Reference[],
): Recognition {
  if (
    !query.values.length ||
    !query.values.every(Number.isFinite) ||
    !Number.isFinite(query.texture)
  )
    throw Error("Invalid descriptor");
  if (query.texture < 0.001)
    return {
      decision: "empty",
      candidates: [],
      gap: 0,
      reason: "Low-detail or empty crop. Keep this slot unknown.",
      algorithm: VISION_VERSION,
    };
  const best = new Map<string, number>();
  for (const ref of references) {
    if (ref.descriptor.values.length !== query.values.length)
      throw Error("Descriptor version mismatch");
    const error =
      query.values.reduce(
        (sum, v, i) => sum + (v - ref.descriptor.values[i]) ** 2,
        0,
      ) / query.values.length;
    const similarity = Math.max(0, 1 - Math.sqrt(error) / 2);
    best.set(ref.champion, Math.max(best.get(ref.champion) ?? 0, similarity));
  }
  const ranked = [...best]
    .map(([champion, similarity]) => ({ champion, similarity }))
    .sort(
      (a, b) =>
        b.similarity - a.similarity || a.champion.localeCompare(b.champion),
    );
  const gap =
    ranked.length >= 2 ? ranked[0].similarity - ranked[1].similarity : 0;
  const confident =
    ranked.length >= 2 && ranked[0].similarity >= 0.9 && gap >= 0.035;
  return {
    decision: confident ? "confirm" : "uncertain",
    candidates: ranked.slice(0, 3),
    gap,
    reason: confident
      ? "Strong template similarity; confirm identity before applying."
      : "Uncertain crop. Choose a candidate or search manually; this slot has not changed.",
    algorithm: VISION_VERSION,
  };
}

export interface EvaluationExample {
  champion: string;
  evidenceKind: "screenshot" | "reference-test";
  matchGroup: string;
  layout: string;
  recognition: Recognition;
}
export function evaluateCorrections(examples: EvaluationExample[]) {
  const real = examples.filter((e) => e.evidenceKind === "screenshot");
  const strong = real.filter((e) => e.recognition.decision === "confirm");
  return {
    scope:
      "Recorded pre-correction predictions on user-labelled crops. Selection-biased diagnostics, not held-out or representative real-world accuracy.",
    realCrops: real.length,
    referenceTestCrops: examples.length - real.length,
    matchGroups: new Set(real.map((e) => e.matchGroup)).size,
    top1: real.length
      ? real.filter((e) => e.recognition.candidates[0]?.champion === e.champion)
          .length / real.length
      : null,
    top3: real.length
      ? real.filter((e) =>
          e.recognition.candidates.some((c) => c.champion === e.champion),
        ).length / real.length
      : null,
    strongCoverage: real.length ? strong.length / real.length : null,
    strongWrong: strong.filter(
      (e) => e.recognition.candidates[0]?.champion !== e.champion,
    ).length,
    layouts: Object.fromEntries(
      [...new Set(real.map((e) => e.layout))].map((layout) => [
        layout,
        real.filter((e) => e.layout === layout).length,
      ]),
    ),
  };
}
