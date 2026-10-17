"use client";
/* eslint-disable @next/next/no-img-element -- Local pre-sized portraits, no remote optimizer. */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { champions, championById } from "@/lib/rift/catalog";
import {
  decodeScreenshot,
  matchCrop,
  readCorrections,
  saveCorrection,
  deleteCorrections,
} from "@/lib/rift/vision-browser";
import { exportJSON } from "@/lib/rift/storage";
import {
  evaluateCorrections,
  VISION_VERSION,
  type Crop,
} from "@/lib/rift/vision";
import s from "./rift.module.css";
import ScreenshotInput from "./screenshot-input";

type Match = Awaited<ReturnType<typeof matchCrop>>;
function ManualCropInput({
  retain,
  setRetain,
  confirm,
}: {
  retain: boolean;
  setRetain: (v: boolean) => void;
  confirm: (team: "allies" | "enemies", slot: number, id: string) => boolean;
}) {
  const [image, setImage] = useState<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [layout, setLayout] = useState("ranked");
  const [team, setTeam] = useState<"allies" | "enemies">("enemies");
  const [slot, setSlot] = useState(0);
  const [result, setResult] = useState<Match | null>(null);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [decodeMs, setDecodeMs] = useState(0);
  const [sourceHash, setSourceHash] = useState("");
  const [matchGroup, setMatchGroup] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [evidenceKind, setEvidenceKind] = useState<
    "screenshot" | "reference-test"
  >("screenshot");
  const canvas = useRef<HTMLCanvasElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    if (!image || !canvas.current) return;
    const ctx = canvas.current.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    if (crop) {
      ctx.fillStyle = "rgba(15,35,25,.4)";
      ctx.fillRect(0, 0, image.width, image.height);
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
      );
      ctx.strokeStyle = "#e2f58a";
      ctx.lineWidth = Math.max(2, image.width / 400);
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
    }
  }, [image, crop]);
  function point(e: PointerEvent<HTMLCanvasElement>) {
    const bounds = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          image!.width,
          ((e.clientX - bounds.left) / bounds.width) * image!.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          image!.height,
          ((e.clientY - bounds.top) / bounds.height) * image!.height,
        ),
      ),
    };
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!image || !start.current) return;
    const end = point(e);
    setCrop({
      x: Math.min(start.current.x, end.x),
      y: Math.min(start.current.y, end.y),
      width: Math.abs(end.x - start.current.x),
      height: Math.abs(end.y - start.current.y),
    });
    setResult(null);
    generation.current++;
  }
  async function recogniseCrop() {
    if (!image || !crop) return;
    setBusy(true);
    setMessage("");
    const ticket = ++generation.current;
    try {
      const next = await matchCrop(image, crop);
      if (ticket === generation.current) setResult(next);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Recognition failed. Use manual selection.",
      );
    } finally {
      setBusy(false);
    }
  }
  function apply(id: string) {
    if (!image || !crop || !result) return;
    if (!confirm(team, slot, id)) {
      setMessage(
        "That champion is already in this team; choose another slot or correct the earlier pick.",
      );
      return;
    }
    let message = `Confirmed ${championById[id].name} for ${team === "allies" ? "ally" : "enemy"} ${slot + 1}.`;
    if (retain) {
      try {
        saveCorrection({
          champion: id,
          layout,
          team,
          slot,
          image: { width: image.width, height: image.height },
          crop,
          cropData: result.cropData,
          recognition: result.result,
          sourceHash,
          matchGroup: matchGroup.trim() || sourceHash,
          deviceLabel: deviceLabel.trim(),
          evidenceKind,
        });
        message += " Labelled crop saved on this device.";
      } catch (error) {
        message += ` Draft updated, but crop was not saved: ${error instanceof Error ? error.message : "storage failed"}`;
      }
    }
    setMessage(message);
    setSlot(Math.min(4, slot + 1));
    setResult(null);
    setManual("");
  }
  const updateCrop = (key: keyof Crop, percent: number) => {
    if (!image) return;
    const current = crop ?? {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    };
    const limit = key === "x" || key === "width" ? image.width : image.height;
    const next = {
      ...current,
      [key]: (Math.max(0, Math.min(100, percent)) / 100) * limit,
    };
    if (next.x + next.width > image.width) next.width = image.width - next.x;
    if (next.y + next.height > image.height)
      next.height = image.height - next.y;
    setCrop(next);
    setResult(null);
    generation.current++;
  };
  return (
    <section className={s.vision} aria-label="Local screenshot recognition">
      <div className={s.sectionHead}>
        <div>
          <p className={s.eyebrow}>SCREENSHOT / EXPERIMENTAL BASELINE</p>
          <h3>Crop. Check. Confirm.</h3>
        </div>
        <span className={s.badge}>On-device</span>
      </div>
      <p className={s.muted}>
        Select a screenshot, then drag around one visible champion portrait.
        Layout detection and real-screen accuracy are unmeasured. Nothing is
        added to your draft until you confirm.
      </p>
      <label className={s.fileButton}>
        Choose screenshot
        <input
          aria-label="Choose screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setMessage("");
            setResult(null);
            setCrop(null);
            generation.current++;
            try {
              const start = performance.now();
              const decoded = await decodeScreenshot(file);
              setImage(decoded);
              setDecodeMs(performance.now() - start);
              const digest = await crypto.subtle.digest(
                "SHA-256",
                await file.arrayBuffer(),
              );
              setSourceHash(
                [...new Uint8Array(digest)]
                  .map((n) => n.toString(16).padStart(2, "0"))
                  .join(""),
              );
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Image could not be decoded.",
              );
              setImage(null);
            } finally {
              setBusy(false);
            }
            e.target.value = "";
          }}
        />
      </label>
      <p className={s.muted}>PNG / JPEG / WebP · max 15 MB · never uploaded</p>
      {image && (
        <>
          <div className={s.twoFields}>
            <label className={s.field}>
              Layout (user labelled)
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
              >
                <option value="ranked">Ranked draft</option>
                <option value="loading">Full loading screen</option>
                <option value="postgame">
                  Postgame scoreboard (portraits only)
                </option>
                <option value="other">Other layout</option>
              </select>
            </label>
            <label className={s.field}>
              Apply confirmed pick to
              <select
                value={`${team}:${slot}`}
                onChange={(e) => {
                  const [t, index] = e.target.value.split(":");
                  setTeam(t as typeof team);
                  setSlot(Number(index));
                }}
              >
                {(["enemies", "allies"] as const).flatMap((t) =>
                  Array.from({ length: 5 }, (_, i) => (
                    <option key={t + i} value={`${t}:${i}`}>
                      {t === "enemies" ? "Enemy" : "Ally"} {i + 1}
                    </option>
                  )),
                )}
              </select>
            </label>
          </div>
          <p className={s.muted}>
            {image.width} × {image.height} working pixels ·{" "}
            {image.width > image.height ? "Landscape" : "Portrait"} aspect is a
            hint, not a verified layout. Crop the face tightly; exclude names
            and borders.
          </p>
          <canvas
            ref={canvas}
            className={s.cropCanvas}
            width={image.width}
            height={image.height}
            aria-label="Screenshot crop area: drag around a portrait; percentage controls also available below"
            onPointerDown={(e) => {
              if (busy) return;
              start.current = point(e);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={move}
            onPointerUp={(e) => {
              move(e);
              start.current = null;
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              start.current = null;
            }}
          />
          <details className={s.details}>
            <summary>Precise crop controls (percent)</summary>
            <div className={s.cropControls}>
              {(["x", "y", "width", "height"] as const).map((key) => (
                <label className={s.field} key={key}>
                  {key}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={
                      crop
                        ? Math.round(
                            (crop[key] /
                              (key === "x" || key === "width"
                                ? image.width
                                : image.height)) *
                              1000,
                          ) / 10
                        : key === "width" || key === "height"
                          ? 100
                          : 0
                    }
                    onChange={(e) => updateCrop(key, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </details>
          <div className={s.actions}>
            <button
              className={s.primary}
              onClick={recogniseCrop}
              disabled={busy || !crop || crop.width < 4 || crop.height < 4}
            >
              {busy ? "Preparing references…" : "Match this portrait"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setImage(null);
                setCrop(null);
                setResult(null);
                setMessage("Screenshot released from this view.");
                generation.current++;
              }}
            >
              Remove screenshot
            </button>
          </div>
          {result && (
            <div className={s.recognitionResult}>
              <p>
                <b>
                  {result.result.decision === "confirm"
                    ? "Template match ready for review"
                    : result.result.decision === "empty"
                      ? "Keep unknown"
                      : "Needs your confirmation"}
                </b>
              </p>
              <p className={s.muted}>
                {result.result.reason} Similarity is not an accuracy
                probability; thresholds have not been calibrated on real
                screenshots.
              </p>
              <div className={s.recognitionCandidates}>
                {result.result.candidates.map((c) => (
                  <button key={c.champion} onClick={() => apply(c.champion)}>
                    <img
                      src={championById[c.champion].portrait}
                      width={56}
                      height={64}
                      alt=""
                    />
                    <span>
                      Confirm {championById[c.champion].name}
                      <small>
                        Similarity {(c.similarity * 100).toFixed(1)}%
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              <label className={s.field}>
                Correct with another champion
                <select
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                >
                  <option value="">Search by typing in this list…</option>
                  {champions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className={s.actions}>
                <button disabled={!manual} onClick={() => apply(manual)}>
                  Confirm correction
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setMessage(
                      "Slot left unchanged. Hidden or uncertain champions stay unknown.",
                    );
                  }}
                >
                  Leave slot unchanged
                </button>
              </div>
              <p className={s.muted}>
                Measured in this browser: image decode {decodeMs.toFixed(0)}ms ·
                reference preparation {result.referenceMs.toFixed(0)}ms ·
                classifier {result.inferenceMs.toFixed(1)}ms ·{" "}
                {result.references} templates. Crop/confirmation time excluded;
                no end-to-end phone claim.
              </p>
            </div>
          )}
        </>
      )}
      <label className={s.privacyChoice}>
        <input
          type="checkbox"
          checked={retain}
          onChange={(e) => setRetain(e.target.checked)}
        />
        <span>
          Keep confirmed 96px portrait crops locally as labelled examples. Full
          screenshots are never saved; may still contain overlays. Off by
          default.
        </span>
      </label>
      {retain && (
        <details className={s.details}>
          <summary>Dataset labels for future evaluation</summary>
          <label className={s.field}>
            Evidence kind
            <select
              value={evidenceKind}
              onChange={(e) =>
                setEvidenceKind(e.target.value as typeof evidenceKind)
              }
            >
              <option value="screenshot">
                Real game screenshot (your assertion)
              </option>
              <option value="reference-test">Reference / synthetic test</option>
            </select>
          </label>
          <label className={s.field}>
            Match group (same value for screenshots of one match)
            <input
              value={matchGroup}
              onChange={(e) => setMatchGroup(e.target.value)}
              maxLength={100}
              placeholder="Optional; defaults to source-file hash"
            />
          </label>
          <label className={s.field}>
            Device label
            <input
              value={deviceLabel}
              onChange={(e) => setDeviceLabel(e.target.value)}
              maxLength={100}
              placeholder="Optional model / resolution, no serial numbers"
            />
          </label>
          <p className={s.muted}>
            A source-file hash groups crops without retaining the screenshot.
            Use the same match group across images to avoid train/evaluation
            leakage.
          </p>
        </details>
      )}
      <div className={s.actions}>
        <button
          onClick={() => {
            try {
              const records = readCorrections();
              exportJSON(
                { algorithm: VISION_VERSION, records },
                "rift-labelled-crops",
              );
              setMessage(`Exported ${records.length} labelled crops.`);
            } catch {
              setMessage("Labelled examples could not be read.");
            }
          }}
        >
          Export labelled crops
        </button>
        <button
          onClick={() => {
            try {
              const records = readCorrections();
              const evaluation = evaluateCorrections(records);
              exportJSON(evaluation, "rift-correction-diagnostics");
              setMessage(
                evaluation.realCrops
                  ? `Diagnostic exported for ${evaluation.realCrops} user-labelled real crops. This is a selected correction set, not held-out accuracy.`
                  : "No labelled real screenshots yet. Accuracy is unmeasured; exported diagnostic has null rates.",
              );
            } catch {
              setMessage("Labelled examples could not be evaluated.");
            }
          }}
        >
          Export correction diagnostics
        </button>
        <button
          onClick={() => {
            try {
              deleteCorrections();
              setMessage("Labelled crops deleted from this browser.");
            } catch {
              setMessage("Browser blocked crop deletion.");
            }
          }}
        >
          Delete labelled crops
        </button>
      </div>
      {message && (
        <p role="status" className={s.notice}>
          {message}
        </p>
      )}
    </section>
  );
}

export default function VisionInput(
  props: Parameters<typeof ManualCropInput>[0],
) {
  return (
    <>
      <ScreenshotInput />
      <details className={s.details}>
        <summary>Manual portrait crop & labelled dataset tools</summary>
        <ManualCropInput {...props} />
      </details>
    </>
  );
}
