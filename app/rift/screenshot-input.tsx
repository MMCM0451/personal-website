"use client";
/* eslint-disable @next/next/no-img-element -- Local immutable reference artwork. */
import { useEffect, useRef, useState } from "react";
import { champions, championById } from "@/lib/rift/catalog";
import { scanScreenshot } from "@/lib/rift/screenshot-browser";
import { applyReviewedScan } from "@/lib/rift/scan-state";
import { exportJSON, updateState, useRift } from "@/lib/rift/storage";
import { saveCorrection } from "@/lib/rift/vision-browser";
import type { ScanPhase, ScanResult } from "@/lib/rift/screenshot";
import { recommend } from "@/lib/rift/engine";
import q from "./quick.module.css";
const phases: Record<ScanPhase, string> = {
  decoding: "Decoding image…",
  "classifying-layout": "Checking screen layout…",
  "locating-portraits": "Locating team portraits…",
  "loading-references": "Loading local portrait references…",
  "recognizing-champions": "Matching portrait pixels…",
  "needs-review": "Review portrait matches",
  unsupported: "Unsupported screenshot",
  error: "Scan failed",
};
export default function ScreenshotInput({
  compact = false,
  onApplied,
}: {
  compact?: boolean;
  onApplied?: () => void;
}) {
  const { state } = useRift();
  const [phase, setPhase] = useState<ScanPhase | null>(null),
    [scan, setScan] = useState<ScanResult | null>(null),
    [image, setImage] = useState<HTMLCanvasElement | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, string | null>>({}),
    [message, setMessage] = useState(""),
    [replace, setReplace] = useState(false),
    [swap, setSwap] = useState(false),
    [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null),
    [reviewOpen, setReviewOpen] = useState(false);
  const [benchmark, setBenchmark] = useState<Record<string, unknown> | null>(
      null,
    ),
    [benchRunning, setBenchRunning] = useState(false);
  const overlay = useRef<HTMLCanvasElement>(null),
    abort = useRef<AbortController | null>(null),
    input = useRef<HTMLInputElement>(null);
  const selectedFile = useRef<File | null>(null);
  const busy =
    benchRunning ||
    (phase !== null &&
      !["needs-review", "unsupported", "error"].includes(phase));
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!image || !scan || !overlay.current) return;
    const canvas = overlay.current;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    ctx.strokeStyle = "#b4ff9f";
    ctx.fillStyle = "#b4ff9f";
    ctx.lineWidth = Math.max(2, image.width / 500);
    ctx.font = `${Math.max(12, image.width / 80)}px sans-serif`;
    for (const slot of scan.slots) {
      const b = slot.bbox;
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.fillText(`${slot.side} ${slot.index + 1}`, b.x, b.y - 5);
    }
  }, [image, scan, reviewOpen]);
  async function select(file: File) {
    selectedFile.current = file;
    setBenchmark(null);
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setMessage("");
    setScan(null);
    setReviewed({});
    setImage(null);
    setActive(null);
    setReplace(false);
    setSwap(false);
    try {
      const output = await scanScreenshot(file, setPhase, controller.signal);
      if (controller.signal.aborted) return;
      setImage(output.canvas);
      setScan(output.result);
      setReviewOpen(output.result.slots.length > 0);
    } catch (e) {
      if (controller.signal.aborted) return;
      setPhase("error");
      setMessage(
        e instanceof Error
          ? e.message
          : "Image could not be scanned. Use manual entry.",
      );
    }
  }
  async function measure() {
    if (!selectedFile.current || busy) return;
    const controller = new AbortController();
    abort.current = controller;
    setBenchRunning(true);
    try {
      const rows: (ScanResult["timings"] & {
        rules: number;
        render: number;
      })[] = [];
      for (let i = 0; i < 20; i++) {
        const output = await scanScreenshot(
          selectedFile.current,
          setPhase,
          controller.signal,
        );
        const start = performance.now();
        const profile = state.profiles.find(
          (p) => p.id === state.activeProfile,
        )!;
        recommend(profile, state.draft);
        const rules = performance.now() - start;
        const renderStart = performance.now();
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const render = performance.now() - renderStart;
        rows.push({
          ...output.result.timings,
          rules,
          render,
          total: output.result.timings.total + rules + render,
        });
      }
      const percentile = (key: keyof (typeof rows)[number], p: number) => {
        const values = rows.map((r) => r[key]).sort((a, b) => a - b);
        return values[Math.ceil(values.length * p) - 1];
      };
      const keys = Object.keys(rows[0]) as (keyof (typeof rows)[number])[];
      setBenchmark({
        scope:
          "20 repeated scans of the same selected image, warmed templates, desktop browser. Render is two animation-frame boundaries after rule computation, not React commit timing. Not independent screenshots, mobile hardware or CPU throttling.",
        sourceHash: scan?.sourceHash,
        samples: rows.length,
        p50: Object.fromEntries(keys.map((k) => [k, percentile(k, 0.5)])),
        p95: Object.fromEntries(keys.map((k) => [k, percentile(k, 0.95)])),
        rows,
      });
    } catch (e) {
      if (!controller.signal.aborted) setMessage(String(e));
    } finally {
      setBenchRunning(false);
    }
  }
  function choose(key: string, id: string | null) {
    setReviewed((prev) => ({ ...prev, [key]: id }));
    setActive(null);
    setQuery("");
  }
  function apply() {
    if (!scan) return;
    try {
      let count = 0,
        protectedSlots = 0;
      updateState((st) => {
        const result = applyReviewedScan(
          st.draft,
          scan,
          reviewed,
          replace,
          swap,
        );
        count = result.applied;
        protectedSlots = result.protectedSlots;
        return { ...st, draft: result.draft };
      });
      let feedback = `${count} reviewed picks applied to the shared draft. ${protectedSlots} manual/corrected slots protected.`;
      if (state.retainCrops && image)
        for (const slot of scan.slots) {
          const id = reviewed[`${slot.side}:${slot.index}`];
          if (!id) continue;
          const crop = document.createElement("canvas");
          crop.width = 96;
          crop.height = 96;
          const b = slot.bbox;
          crop
            .getContext("2d")!
            .drawImage(image, b.x, b.y, b.width, b.height, 0, 0, 96, 96);
          try {
            saveCorrection({
              champion: id,
              layout: scan.screenType,
              team: (slot.side === "ally") !== swap ? "allies" : "enemies",
              slot: slot.index,
              image: scan.imageMetadata,
              crop: b,
              cropData: crop.toDataURL("image/webp", 0.8),
              recognition: {
                decision: "uncertain",
                gap: slot.gap,
                reason: "User reviewed screenshot proposal",
                algorithm: scan.recognizerVersion,
                candidates: slot.topCandidates.map((c) => ({
                  champion: c.championId,
                  similarity: c.similarity,
                })),
              },
              sourceHash: scan.sourceHash!,
              matchGroup: scan.sourceHash!,
              deviceLabel: "",
              evidenceKind: "screenshot",
            });
          } catch {
            feedback += " Crop retention failed; draft changes remain.";
            break;
          }
        }
      setMessage(feedback);
      setReviewOpen(false);
      if (count) onApplied?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "STATE_NOT_APPLIED");
    }
  }
  const appliedNotice = /^[1-9]\d* reviewed picks applied/.test(message);
  const captureTitle =
    !busy && appliedNotice
      ? "Reviewed composition applied"
      : phase
        ? phases[phase]
        : "Scan a screenshot";
  const captureSubtitle = busy
    ? "On this device · no upload"
    : appliedNotice
      ? "Local pixels → reviewed draft · tap to inspect"
      : scan?.slots.length
        ? `${scan.slots.length} portrait regions · confirmation required`
        : "Scoreboard supported · draft/loading unvalidated";
  return (
    <section className={q.capture} aria-label="Screenshot recognition">
      <div className={q.captureBar}>
        {compact && scan?.slots.length && !busy ? (
          <button
            className={q.captureMain}
            onClick={() => setReviewOpen(!reviewOpen)}
            aria-expanded={reviewOpen}
          >
            <strong>{captureTitle}</strong>
            <small>{captureSubtitle}</small>
          </button>
        ) : (
          <div>
            <strong>{captureTitle}</strong>
            <small>{captureSubtitle}</small>
          </div>
        )}
        <button type="button" onClick={() => input.current?.click()}>
          {busy ? "New image" : "Scan ↗"}
        </button>
        <input
          ref={input}
          className={q.fileInput}
          aria-label="Scan screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void select(f);
          }}
        />
      </div>
      {busy && (
        <button
          onClick={() => {
            abort.current?.abort();
            setPhase(null);
            setMessage("Scan cancelled. Manual picks unchanged.");
          }}
        >
          Cancel scan
        </button>
      )}
      {scan && !scan.slots.length && (
        <p role="status" className={q.warning}>
          {scan.errors.join(" ")} Your composition has not changed. Use the
          portrait strips for manual entry.
        </p>
      )}
      {scan?.slots.length && !compact ? (
        <button
          className={q.textButton}
          onClick={() => setReviewOpen(!reviewOpen)}
        >
          {reviewOpen ? "Hide review" : "Review / correct matches"}
        </button>
      ) : null}
      {reviewOpen && scan && (
        <div className={q.review}>
          <p>
            Pixel matches are proposals, not calibrated probabilities. Confirm
            only identities you can check. Unconfirmed slots stay unknown to the
            engine.
          </p>
          <div className={q.row}>
            <span>Left blue side → {swap ? "opponents" : "your team"}</span>
            <button onClick={() => setSwap(!swap)}>Swap team sides</button>
          </div>
          {(["ally", "enemy"] as const).map((side) => (
            <div key={side}>
              <b>{(side === "ally") !== swap ? "Your team" : "Opponents"}</b>
              <div className={q.reviewSlots}>
                {scan.slots
                  .filter((s) => s.side === side)
                  .map((slot) => {
                    const key = `${side}:${slot.index}`,
                      id = reviewed[key],
                      proposal = slot.topCandidates[0];
                    return (
                      <button
                        className={id ? q.confirmed : q.unconfirmed}
                        key={key}
                        onClick={() => {
                          setActive(key);
                          setQuery("");
                        }}
                        aria-label={`Review ${side} ${slot.index + 1}: ${id ? championById[id].name : "unknown"}`}
                      >
                        {proposal && (
                          <img
                            src={
                              championById[id ?? proposal.championId].portrait
                            }
                            alt=""
                            width={40}
                            height={44}
                          />
                        )}
                        <span>
                          {id
                            ? championById[id].name
                            : proposal &&
                                proposal.similarity >= 0.9 &&
                                slot.gap >= 0.08
                              ? `${championById[proposal.championId].name} ?`
                              : "?"}
                        </span>
                        <small>
                          {proposal
                            ? `${(proposal.similarity * 100).toFixed(1)} similarity`
                            : "Unknown"}
                        </small>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          {active && (
            <div
              className={q.correction}
              role="group"
              aria-label="Correct screenshot slot"
            >
              <b>Confirm a candidate or search</b>
              <div className={q.row}>
                {scan.slots
                  .find((s) => `${s.side}:${s.index}` === active)
                  ?.topCandidates.map((c) => (
                    <button
                      key={c.championId}
                      onClick={() => choose(active, c.championId)}
                    >
                      {championById[c.championId].name}
                      <small>
                        {(c.similarity * 100).toFixed(1)} similarity
                      </small>
                    </button>
                  ))}
              </div>
              <input
                aria-label="Search screenshot correction"
                placeholder="Search any champion…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <div className={q.searchResults}>
                  {champions
                    .filter((c) =>
                      [c.name, c.id, ...c.aliases].some((v) =>
                        v.toLowerCase().includes(query.toLowerCase()),
                      ),
                    )
                    .slice(0, 20)
                    .map((c) => (
                      <button key={c.id} onClick={() => choose(active, c.id)}>
                        {c.name}
                      </button>
                    ))}
                </div>
              )}
              <button onClick={() => choose(active, null)}>Keep unknown</button>
            </div>
          )}
          <button
            onClick={() =>
              setReviewed((prev) => ({
                ...Object.fromEntries(
                  scan.slots
                    .filter(
                      (s) =>
                        (s.topCandidates[0]?.similarity ?? 0) >= 0.9 &&
                        s.gap >= 0.08,
                    )
                    .map((s) => [
                      `${s.side}:${s.index}`,
                      s.topCandidates[0].championId,
                    ]),
                ),
                ...prev,
              }))
            }
          >
            I checked the strong proposals
          </button>
          <label className={q.check}>
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />{" "}
            Replace conflicting manual/corrected picks
          </label>
          <button
            className={q.primary}
            disabled={!Object.values(reviewed).some(Boolean)}
            onClick={apply}
          >
            Apply reviewed picks
          </button>
          <p className={q.meta}>
            A scoreboard is postgame evidence. Mode, role and your own champion
            stay as entered; rune advice becomes retrospective.
          </p>
        </div>
      )}
      {scan && (!compact || reviewOpen || !scan.slots.length) && (
        <details className={q.debug}>
          <summary>Scan evidence & timings</summary>
          <p>
            {scan.screenType} · {scan.recognizerVersion} ·{" "}
            {scan.assetDatasetVersion}
          </p>
          <p>
            {Object.entries(scan.timings)
              .map(([k, v]) => `${k} ${v.toFixed(1)}ms`)
              .join(" · ")}
          </p>
          <p>
            No automatic acceptance: confidence is uncalibrated. Strong review
            shortcut uses similarity ≥0.90 and margin ≥0.08. These are review
            filters, not a validated classifier threshold.
          </p>
          <output data-testid="scan-output" hidden>
            {JSON.stringify(scan)}
          </output>
          <canvas
            ref={overlay}
            aria-label="Screenshot crop debugger"
            className={q.overlay}
          />
          <button onClick={() => exportJSON(scan, "rift-recognizer-actual")}>
            Export raw recognizer JSON
          </button>
          <label className={q.check}>
            <input
              aria-label="Local correction retention"
              type="checkbox"
              checked={state.retainCrops}
              onChange={(e) =>
                updateState((st) => ({ ...st, retainCrops: e.target.checked }))
              }
            />{" "}
            Keep reviewed portrait crops locally (optional)
          </label>
          <button
            onClick={() =>
              exportJSON(
                {
                  ...scan,
                  slots: scan.slots.map((s) => ({
                    ...s,
                    championId: s.topCandidates[0]?.championId,
                  })),
                },
                "rift-proposals-not-accepted",
              )
            }
          >
            Export proposal diagnostics
          </button>
          <button disabled={busy} onClick={measure}>
            {benchRunning
              ? "Measuring 20 repeat scans…"
              : "Measure 20 warm scans"}
          </button>
          {benchmark && (
            <>
              <pre data-testid="scan-benchmark">
                {JSON.stringify(benchmark, null, 2)}
              </pre>
              <button
                onClick={() => exportJSON(benchmark, "rift-browser-benchmark")}
              >
                Export measured timings
              </button>
            </>
          )}
          <button
            onClick={() => {
              abort.current?.abort();
              selectedFile.current = null;
              setScan(null);
              setImage(null);
              setPhase(null);
              setReviewed({});
              setReviewOpen(false);
            }}
          >
            Release screenshot
          </button>
        </details>
      )}
      {!compact && (
        <p className={q.meta}>
          JPEG / PNG / WebP, max 15 MB. Full images stay in memory. Manual entry
          always works.
        </p>
      )}
      {!compact && (
        <label className={q.check}>
          <input
            type="checkbox"
            checked={state.retainCrops}
            onChange={(e) =>
              updateState((st) => ({ ...st, retainCrops: e.target.checked }))
            }
          />{" "}
          Keep reviewed portrait crops locally (optional)
        </label>
      )}
      {message &&
        (!compact ||
          !appliedNotice ||
          !message.includes("0 manual/corrected slots protected.")) && (
          <p role="status" className={q.notice}>
            {message}
          </p>
        )}
    </section>
  );
}
