"use client";
import { useSyncExternalStore } from "react";
import {
  defaultState,
  parseState,
  validateDraft,
  validateProfile,
} from "./state";
import type { AppState, Recommendation, SavedAdvice } from "./types";

const STATE_KEY = "rift-lab.state.v1";
const HISTORY_KEY = "rift-lab.advice.v1";
interface Snapshot {
  state: AppState;
  history: SavedAdvice[];
  status: string;
}
const server: Snapshot = { state: defaultState(), history: [], status: "" };
let cached: Snapshot | undefined;
const listeners = new Set<() => void>();
function get(): Snapshot {
  if (cached) return cached;
  cached = { ...server };
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) cached.state = parseState(JSON.parse(raw));
    const records: unknown = JSON.parse(
      localStorage.getItem(HISTORY_KEY) ?? "[]",
    );
    if (!Array.isArray(records) || records.length > 50)
      throw Error("Invalid history");
    cached.history = records.filter((r): r is SavedAdvice => {
      try {
        if (
          typeof r.id !== "string" ||
          typeof r.savedAt !== "string" ||
          !Number.isFinite(Date.parse(r.savedAt)) ||
          typeof r.note !== "string"
        )
          return false;
        validateProfile(r.recommendation.input.profile);
        validateDraft(r.recommendation.input.draft);
        return (
          typeof r.recommendation.ruleVersion === "string" &&
          typeof r.recommendation.dataVersion === "string" &&
          Array.isArray(r.recommendation.builds) &&
          r.recommendation.builds.every((b: unknown) => {
            if (!b || typeof b !== "object") return false;
            const build = b as Record<string, unknown>;
            return (
              typeof build.id === "string" &&
              typeof build.name === "string" &&
              typeof build.boots === "string" &&
              Array.isArray(build.items) &&
              build.items.every((id) => typeof id === "string")
            );
          })
        );
      } catch {
        return false;
      }
    });
    if (cached.history.length !== records.length)
      cached.status =
        "Some invalid history entries were ignored. Export the stored data before resetting if recovery is needed.";
  } catch {
    cached.status =
      "Stored data could not be read or validated. Working in memory; original stored data has not been replaced.";
  }
  return cached;
}
function emit() {
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const refresh = () => {
    cached = undefined;
    emit();
  };
  window.addEventListener("storage", refresh);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", refresh);
  };
}
export function useRift() {
  return useSyncExternalStore(subscribe, get, () => server);
}
export function updateState(transform: (state: AppState) => AppState) {
  const current = get();
  const state = parseState(transform(structuredClone(current.state)));
  let status = "";
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    status =
      "Changes work in this tab but could not be saved. Export before closing.";
  }
  cached = { ...current, state, status };
  emit();
}
export function saveAdvice(recommendation: Recommendation): boolean {
  const current = get();
  const record = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    recommendation: structuredClone(recommendation),
    note: "",
  };
  if (current.history.length >= 50) {
    cached = {
      ...current,
      status:
        "History is full (50 records). Export and delete records before saving another; no earlier advice was discarded.",
    };
    emit();
    return false;
  }
  const history = [record, ...current.history];
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    cached = { ...current, history, status: "" };
    emit();
    return true;
  } catch {
    cached = {
      ...current,
      status:
        "Advice was not saved: browser storage is unavailable or full. Export the current recommendation.",
    };
    emit();
    return false;
  }
}
export function editHistory(id: string, note: string | null) {
  const current = get();
  const history =
    note === null
      ? current.history.filter((r) => r.id !== id)
      : current.history.map((r) =>
          r.id === id ? { ...r, note: note.slice(0, 4000) } : r,
        );
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    cached = { ...current, history, status: "" };
  } catch {
    cached = { ...current, status: "History change could not be saved." };
  }
  emit();
}
export function exportJSON(data: unknown, name = "rift-lab-export") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function clearData() {
  try {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    cached = {
      state: defaultState(),
      history: [],
      status: "Profiles, draft and advice history deleted from this browser.",
    };
  } catch {
    cached = {
      ...get(),
      status:
        "Browser blocked deletion. Clear site data in your browser settings.",
    };
  }
  emit();
}
