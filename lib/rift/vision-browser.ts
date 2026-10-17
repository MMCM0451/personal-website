"use client";
import { champions, DATA_VERSION } from "./catalog";
import {
  describe,
  GRID,
  recognise,
  validateCrop,
  VISION_VERSION,
  type Crop,
  type Descriptor,
  type Recognition,
  type Reference,
} from "./vision";

let references: Promise<Reference[]> | undefined;
function descriptor(image: CanvasImageSource, crop: Crop): Descriptor {
  const canvas = document.createElement("canvas");
  canvas.width = GRID;
  canvas.height = GRID;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw Error("Canvas unavailable");
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    GRID,
    GRID,
  );
  return describe(ctx.getImageData(0, 0, GRID, GRID).data);
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(Error("Reference portrait unavailable"));
    image.src = src;
  });
}
export async function loadReferences() {
  if (references) return references;
  references = (async () => {
    const out: Reference[] = [];
    for (let i = 0; i < champions.length; i += 8) {
      out.push(
        ...(
          await Promise.all(
            champions.slice(i, i + 8).map(async (c) => {
              const image = await loadImage(c.portrait);
              return [0, 0.12, 0.24].map((margin) => {
                const width = image.naturalWidth * (1 - margin * 2);
                const height = width;
                return {
                  champion: c.id,
                  descriptor: descriptor(image, {
                    x: image.naturalWidth * margin,
                    y: (image.naturalHeight - height) / 2,
                    width,
                    height,
                  }),
                };
              });
            }),
          )
        ).flat(),
      );
    }
    return out;
  })();
  try {
    return await references;
  } catch (error) {
    references = undefined;
    throw error;
  }
}
export async function decodeScreenshot(file: File): Promise<HTMLCanvasElement> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 15_000_000
  )
    throw Error("Use PNG, JPEG or WebP below 15 MB.");
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 30_000_000) {
    bitmap.close();
    throw Error("Image exceeds 30 megapixels.");
  }
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw Error("Canvas unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}
export async function matchCrop(
  canvas: HTMLCanvasElement,
  crop: Crop,
): Promise<{
  result: Recognition;
  referenceMs: number;
  inferenceMs: number;
  references: number;
  cropData: string;
}> {
  validateCrop(crop, canvas.width, canvas.height);
  const referenceStart = performance.now();
  const refs = await loadReferences();
  const referenceMs = performance.now() - referenceStart;
  const start = performance.now();
  const result = recognise(descriptor(canvas, crop), refs);
  const inferenceMs = performance.now() - start;
  const thumb = document.createElement("canvas");
  thumb.width = 96;
  thumb.height = 96;
  const ctx = thumb.getContext("2d")!;
  ctx.drawImage(canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, 96, 96);
  return {
    result,
    referenceMs,
    inferenceMs,
    references: refs.length,
    cropData: thumb.toDataURL("image/webp", 0.8),
  };
}
export interface Correction {
  id: string;
  confirmedAt: string;
  champion: string;
  layout: string;
  team: "allies" | "enemies";
  slot: number;
  image: { width: number; height: number };
  crop: Crop;
  cropData: string;
  recognition: Recognition;
  algorithm: string;
  dataVersion: string;
  labelSource: "user-confirmed";
  sourceHash: string;
  matchGroup: string;
  deviceLabel: string;
  evidenceKind: "screenshot" | "reference-test";
}
const KEY = "rift-lab.corrections.v1";
export function readCorrections(): Correction[] {
  const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  if (!Array.isArray(raw) || raw.length > 200)
    throw Error("Invalid correction store");
  const valid = raw.every(
    (r) =>
      typeof r.id === "string" &&
      typeof r.champion === "string" &&
      champions.some((c) => c.id === r.champion) &&
      typeof r.cropData === "string" &&
      r.cropData.length < 100_000 &&
      r.cropData.startsWith("data:image/webp;base64,") &&
      r.labelSource === "user-confirmed" &&
      typeof r.sourceHash === "string" &&
      /^[a-f0-9]{64}$/.test(r.sourceHash) &&
      typeof r.matchGroup === "string" &&
      r.matchGroup.length <= 100 &&
      typeof r.deviceLabel === "string" &&
      r.deviceLabel.length <= 100 &&
      ["screenshot", "reference-test"].includes(r.evidenceKind),
  );
  if (!valid) throw Error("Invalid labelled examples");
  return raw as Correction[];
}
export function saveCorrection(
  record: Omit<
    Correction,
    "id" | "confirmedAt" | "algorithm" | "dataVersion" | "labelSource"
  >,
) {
  const previous = readCorrections();
  if (previous.length >= 200)
    throw Error(
      "Correction store full. Export and delete before collecting more.",
    );
  const correction: Correction = {
    ...record,
    id: crypto.randomUUID(),
    confirmedAt: new Date().toISOString(),
    algorithm: VISION_VERSION,
    dataVersion: DATA_VERSION,
    labelSource: "user-confirmed",
  };
  localStorage.setItem(KEY, JSON.stringify([...previous, correction]));
}
export function deleteCorrections() {
  localStorage.removeItem(KEY);
}
