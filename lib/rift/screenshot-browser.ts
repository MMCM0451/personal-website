"use client";
import assets from "./data/visual-assets.json";
import { decodeScreenshot } from "./vision-browser";
import {
  locateScreenshot,
  makePortraitReferences,
  scanRaster,
  type Raster,
  type PortraitReference,
  type ScanPhase,
} from "./screenshot";
let cachedReferences: Promise<PortraitReference[]> | undefined;
export function canvasRaster(canvas: HTMLCanvasElement): Raster {
  return {
    width: canvas.width,
    height: canvas.height,
    data: canvas
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(0, 0, canvas.width, canvas.height).data,
  };
}
async function loadReferenceAssets() {
  if (cachedReferences) return cachedReferences;
  cachedReferences = (async () => {
    const rows = Object.entries(assets.records).filter(([key]) =>
      key.startsWith("wr:"),
    );
    if (rows.length < 100)
      throw Error(
        "REFERENCE_ASSETS_MISSING: Wild Rift portrait library incomplete",
      );
    const refs: PortraitReference[] = [];
    for (let i = 0; i < rows.length; i += 16) {
      const batch = await Promise.all(
        rows.slice(i, i + 16).map(async ([key, record]) => {
          const response = await fetch(record.path, { cache: "force-cache" });
          if (!response.ok) throw Error(`REFERENCE_ASSETS_MISSING: ${key}`);
          const bitmap = await createImageBitmap(await response.blob());
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
          bitmap.close();
          return makePortraitReferences(key.slice(3), canvasRaster(canvas));
        }),
      );
      refs.push(...batch.flat());
    }
    return refs;
  })();
  try {
    return await cachedReferences;
  } catch (e) {
    cachedReferences = undefined;
    throw e;
  }
}
export async function scanScreenshot(
  file: File,
  onPhase: (phase: ScanPhase) => void,
  signal?: AbortSignal,
) {
  const start = performance.now();
  const phase = async (p: ScanPhase) => {
    signal?.throwIfAborted();
    onPhase(p);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    signal?.throwIfAborted();
  };
  await phase("decoding");
  const decodeStart = performance.now();
  const canvas = await decodeScreenshot(file);
  const raster = canvasRaster(canvas);
  const decode = performance.now() - decodeStart;
  await phase("classifying-layout");
  const layout = locateScreenshot(raster);
  await phase("locating-portraits");
  let refs: PortraitReference[] = [];
  let referenceMs = 0;
  if (layout.boxes.length) {
    await phase("loading-references");
    const t = performance.now();
    refs = await loadReferenceAssets();
    referenceMs = performance.now() - t;
  }
  await phase("recognizing-champions");
  const result = scanRaster(raster, refs, assets.version);
  result.timings.decode = decode;
  result.timings.references = referenceMs;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  signal?.throwIfAborted();
  result.sourceHash = Array.from(new Uint8Array(digest), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
  result.timings.total = performance.now() - start;
  onPhase(result.slots.length ? "needs-review" : "unsupported");
  return { canvas, result };
}
