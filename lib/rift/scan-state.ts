import { championById } from "./catalog";
import type { Draft } from "./types";
import type { ScanResult } from "./screenshot";
export function setManualSlot(
  draft: Draft,
  side: "allies" | "enemies",
  index: number,
  id: string | null,
): Draft {
  if (
    index < 0 ||
    index > 4 ||
    !Number.isInteger(index) ||
    (id && !championById[id])
  )
    throw Error("Invalid draft slot");
  const next = structuredClone(draft);
  next[side][index] = id;
  next.slotEvidence = {
    ...next.slotEvidence,
    [side]: Array.from({ length: 5 }, (_, i) =>
      i === index
        ? { source: "manual", corrected: true }
        : (next.slotEvidence?.[side]?.[i] ?? null),
    ),
  };
  return next;
}
export function applyReviewedScan(
  draft: Draft,
  result: ScanResult,
  reviewed: Record<string, string | null>,
  replace = false,
  swap = false,
) {
  if (result.screenType !== "postgame_scoreboard" || !result.slots.length)
    throw Error("UNSUPPORTED_LAYOUT: no team slots to apply");
  let next = structuredClone(draft);
  let applied = 0,
    protectedSlots = 0;
  for (const slot of result.slots) {
    const side = (slot.side === "ally") !== swap ? "allies" : "enemies";
    const id = reviewed[`${slot.side}:${slot.index}`];
    if (!id) continue;
    if (!championById[id]) throw Error("Unknown reviewed champion");
    const existing = next[side][slot.index];
    const evidence = next.slotEvidence?.[side]?.[slot.index];
    if (
      existing !== id &&
      ((existing && !evidence) ||
        evidence?.source === "manual" ||
        evidence?.corrected) &&
      !replace
    ) {
      protectedSlots++;
      continue;
    }
    next[side][slot.index] = id;
    const corrected =
      id !== slot.topCandidates[0]?.championId ||
      !!evidence?.corrected ||
      !!(existing && !evidence);
    next.slotEvidence = {
      ...next.slotEvidence,
      [side]: Array.from({ length: 5 }, (_, i) =>
        i === slot.index
          ? {
              source: "screenshot",
              corrected,
              sourceHash: result.sourceHash,
              similarity: slot.topCandidates.find((c) => c.championId === id)
                ?.similarity,
              recognizerVersion: result.recognizerVersion,
            }
          : (next.slotEvidence?.[side]?.[i] ?? null),
      ),
    };
    applied++;
  }
  for (const side of ["allies", "enemies"] as const)
    if (
      new Set(next[side].filter(Boolean)).size !==
      next[side].filter(Boolean).length
    )
      throw Error(
        "Duplicate champion in team. Correct the conflicting slot before applying.",
      );
  // Does not infer identity, assigned role, selected champion, mode or patch from an image.
  if (applied) next = { ...next, stage: "postgame" };
  return { draft: next, applied, protectedSlots };
}
