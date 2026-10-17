// Pure pixel-only recognizer. No labels, filenames, strategy, DOM or network.
import type { Crop } from "./vision";
export const SCANNER_VERSION = "scoreboard-circle-2";
export const FEATURE_SIZE = 24;
export interface Raster {
  width: number;
  height: number;
  data: ArrayLike<number>;
}
export interface PortraitFeature {
  values: number[];
  texture: number;
}
export interface PortraitReference {
  champion: string;
  feature: PortraitFeature;
}
export type ScreenType =
  | "postgame_scoreboard"
  | "postgame_performance_single"
  | "unsupported";
export type ScanPhase =
  | "decoding"
  | "classifying-layout"
  | "locating-portraits"
  | "loading-references"
  | "recognizing-champions"
  | "needs-review"
  | "unsupported"
  | "error";
export interface ScanSlot {
  side: "ally" | "enemy";
  index: number;
  bbox: Crop;
  championId?: string;
  topCandidates: { championId: string; similarity: number }[];
  confidence: null; // No calibrated probability available. Deliberately never auto-accept.
  gap: number;
  status: "uncertain" | "unknown" | "user-corrected" | "accepted";
}
export interface ScanResult {
  screenType: ScreenType;
  imageMetadata: { width: number; height: number };
  slots: ScanSlot[];
  recognizerVersion: string;
  assetDatasetVersion: string;
  sourceHash?: string;
  timings: {
    decode: number;
    layout: number;
    references: number;
    crop: number;
    classify: number;
    total: number;
    rules?: number;
    render?: number;
  };
  outcome: "UNSUPPORTED_LAYOUT" | "SUCCESS_PARTIAL" | "LOW_CONFIDENCE";
  errors: string[];
  layoutEvidence: Record<string, number>;
}
const luminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;
function pixel(image: Raster, x: number, y: number): [number, number, number] {
  const at =
    (Math.max(0, Math.min(image.height - 1, Math.round(y))) * image.width +
      Math.max(0, Math.min(image.width - 1, Math.round(x)))) *
    4;
  return [image.data[at], image.data[at + 1], image.data[at + 2]];
}
function lum(image: Raster, x: number, y: number) {
  return luminance(...pixel(image, x, y));
}
export function portraitFeature(image: Raster, box: Crop): PortraitFeature {
  if (
    box.width < 4 ||
    box.height < 4 ||
    box.x < 0 ||
    box.y < 0 ||
    box.x + box.width > image.width + 0.01 ||
    box.y + box.height > image.height + 0.01
  )
    throw Error("Invalid portrait region");
  const values: number[] = [];
  for (let y = 0; y < FEATURE_SIZE; y++)
    for (let x = 0; x < FEATURE_SIZE; x++) {
      // Ignore circle border, rank badges and outside corners; grayscale is intentional.
      if (
        ((x + 0.5) / FEATURE_SIZE - 0.5) ** 2 +
          ((y + 0.5) / FEATURE_SIZE - 0.5) ** 2 >
        0.41 ** 2
      )
        continue;
      let value = 0;
      for (const dy of [0.25, 0.75])
        for (const dx of [0.25, 0.75])
          value +=
            lum(
              image,
              box.x + ((x + dx) * box.width) / FEATURE_SIZE,
              box.y + ((y + dy) * box.height) / FEATURE_SIZE,
            ) / 4;
      values.push(value);
    }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const texture =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return {
    values: values.map((v) => (v - mean) / (Math.sqrt(texture) + 0.015)),
    texture,
  };
}
export function makePortraitReferences(
  champion: string,
  image: Raster,
): PortraitReference[] {
  return [0, 0.04, 0.08]
    .flatMap((margin) =>
      [-0.025, 0, 0.025].map((dy) => ({
        champion,
        feature: portraitFeature(image, {
          x: image.width * margin,
          y: image.height * Math.max(0, Math.min(2 * margin, margin + dy)),
          width: image.width * (1 - 2 * margin),
          height: image.height * (1 - 2 * margin),
        }),
      })),
    )
    .filter((r) => r.feature.texture > 0.001);
}
export function rankPortrait(
  query: PortraitFeature,
  refs: PortraitReference[],
) {
  if (query.texture < 0.0015) return { topCandidates: [], gap: 0 };
  const best = new Map<string, number>();
  for (const ref of refs) {
    let dot = 0,
      aa = 0,
      bb = 0;
    for (let i = 0; i < query.values.length; i++) {
      const a = query.values[i],
        b = ref.feature.values[i];
      dot += a * b;
      aa += a * a;
      bb += b * b;
    }
    const similarity = (1 + dot / (Math.sqrt(aa * bb) || 1)) / 2;
    if (similarity > (best.get(ref.champion) ?? 0))
      best.set(ref.champion, similarity);
  }
  const ranked = [...best]
    .map(([championId, similarity]) => ({ championId, similarity }))
    .sort(
      (a, b) =>
        b.similarity - a.similarity || a.championId.localeCompare(b.championId),
    );
  return {
    topCandidates: ranked.slice(0, 3),
    gap: (ranked[0]?.similarity ?? 0) - (ranked[1]?.similarity ?? 0),
  };
}
export function locateScreenshot(image: Raster): {
  screenType: ScreenType;
  boxes: { side: "ally" | "enemy"; index: number; bbox: Crop }[];
  evidence: Record<string, number>;
} {
  // Fixed UI family, fitted without aspect distortion; centred black system bars tolerated.
  // Only this postgame family has real fixture evidence. Draft/loading deliberately absent.
  const scale = Math.min(image.width / 1536, image.height / 960);
  const ox = (image.width - 1536 * scale) / 2,
    oy = (image.height - 960 * scale) / 2;
  const pt = (x: number, y: number) =>
    pixel(image, ox + x * scale, oy + y * scale);
  let dark = 0,
    blue = 0,
    n = 0;
  for (let y = 20; y < 940; y += 24)
    for (let x = 20; x < 1516; x += 24) {
      const [r, g, b] = pt(x, y);
      dark += Number(luminance(r, g, b) < 0.45);
      blue += Number(b > r * 1.18 && b > g * 1.05);
      n++;
    }
  const boxes = (["ally", "enemy"] as const).flatMap((side, col) =>
    Array.from({ length: 5 }, (_, index) => ({
      side,
      index,
      bbox: {
        x: ox + (col ? 804 : 102) * scale,
        y: oy + (174 + 134 * index) * scale,
        width: 78 * scale,
        height: 78 * scale,
      },
    })),
  );
  // Radial edge/texture checks use the actual image, not identities or aspect alone.
  const ringStrengths = boxes.map(({ bbox }) => {
    let contrast = 0;
    for (let k = 0; k < 32; k++) {
      const angle = (k * Math.PI) / 16;
      const cx = bbox.x + bbox.width / 2,
        cy = bbox.y + bbox.height / 2;
      contrast +=
        Math.abs(
          lum(
            image,
            cx + Math.cos(angle) * bbox.width * 0.475,
            cy + Math.sin(angle) * bbox.height * 0.475,
          ) -
            lum(
              image,
              cx + Math.cos(angle) * bbox.width * 0.555,
              cy + Math.sin(angle) * bbox.height * 0.555,
            ),
        ) / 32;
    }
    return contrast;
  });
  const rings = ringStrengths.filter((v) => v > 0.035).length;
  const textures = boxes.filter(
    ({ bbox }) => portraitFeature(image, bbox).texture > 0.004,
  ).length;
  let redHeader = 0,
    cyanHeader = 0;
  for (let y = 40; y < 80; y += 4)
    for (let x = 555; x < 985; x += 4) {
      const [r, g, b] = pt(x, y);
      redHeader += Number(r > g * 1.5 && r > b * 1.1 && r > 110);
      cyanHeader += Number(b > r * 1.4 && g > r * 1.4 && b > 120);
    }
  const evidence: Record<string, number> = {
    dark: dark / n,
    blue: blue / n,
    rings,
    textures,
    redHeader,
    cyanHeader,
  };
  if (
    image.width >= 480 &&
    image.width / image.height > 1.4 &&
    dark / n > 0.72 &&
    blue / n > 0.35 &&
    rings >= 8 &&
    textures >= 8 &&
    redHeader >= 8 &&
    cyanHeader >= 15
  )
    return { screenType: "postgame_scoreboard", boxes, evidence };
  // Four aligned cyan performance bars distinguish this limited results view.
  const bars = [386, 474, 561, 649].filter((y) => {
    let count = 0;
    for (let x = 90; x < 390; x += 12) {
      const [r, g, b] = pt(x, y);
      count += Number(b > r * 1.3 && g > r * 1.3 && b > 100);
    }
    return count >= 15;
  }).length;
  evidence.performanceBars = bars;
  return {
    screenType: bars === 4 ? "postgame_performance_single" : "unsupported",
    boxes: [],
    evidence,
  };
}
export function scanRaster(
  image: Raster,
  refs: PortraitReference[],
  assetDatasetVersion: string,
  clock = () => performance.now(),
): ScanResult {
  const begin = clock();
  const layout = locateScreenshot(image);
  const layoutEnd = clock();
  let cropMs = 0,
    classifyMs = 0;
  const slots: ScanSlot[] = layout.boxes.map((box) => {
    let t = clock();
    const feature = portraitFeature(image, box.bbox);
    cropMs += clock() - t;
    t = clock();
    const rank = rankPortrait(feature, refs);
    classifyMs += clock() - t;
    return {
      ...box,
      ...rank,
      confidence: null,
      status: rank.topCandidates.length ? "uncertain" : "unknown",
    };
  });
  return {
    screenType: layout.screenType,
    imageMetadata: { width: image.width, height: image.height },
    slots,
    recognizerVersion: SCANNER_VERSION,
    assetDatasetVersion,
    timings: {
      decode: 0,
      layout: layoutEnd - begin,
      references: 0,
      crop: cropMs,
      classify: classifyMs,
      total: clock() - begin,
    },
    outcome: slots.length ? "LOW_CONFIDENCE" : "UNSUPPORTED_LAYOUT",
    errors: slots.length
      ? []
      : [
          layout.screenType === "postgame_performance_single"
            ? "Single champion performance view has no team lineup."
            : "Unsupported layout. Draft/loading layouts need separate real validation screenshots.",
        ],
    layoutEvidence: layout.evidence,
  };
}
