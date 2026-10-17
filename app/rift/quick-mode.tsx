"use client";
/* eslint-disable @next/next/no-img-element -- Patch-tagged local imagery. */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  champions,
  championById,
  items,
  runes,
  PATCH,
} from "@/lib/rift/catalog";
import visuals from "@/lib/rift/data/visual-assets.json";
import { recommend } from "@/lib/rift/engine";
import {
  adviceDiff,
  nextPurchase,
  quickThreats,
} from "@/lib/rift/quick-advice";
import { setManualSlot } from "@/lib/rift/scan-state";
import { emptyDraft } from "@/lib/rift/state";
import { updateState, useRift } from "@/lib/rift/storage";
import {
  MODES,
  OBJECTIVES,
  ROLES,
  STAGES,
  type AppState,
  type Profile,
} from "@/lib/rift/types";
import ScreenshotInput from "./screenshot-input";
import q from "./quick.module.css";
const assetRows = visuals.records as Record<string, { path: string }>;
const itemName = (id: string) =>
  items[id]?.name.replace(/&#x27;|&#039;/g, "'") ?? id;
const shortNames: Record<string, string> = {
  "rylais-crystal-scepter": "Rylai's",
  "rabadons-deathcap": "Deathcap",
  "zhonyas-hourglass": "Hourglass",
  "chainlaced-crushers": "Crushers",
  "spellslingers-shoes": "Spellslinger",
  "amaranths-twinguard": "Twinguard",
  "bloodletters-curse": "Bloodletter",
  "yun-tal-wildarrows": "Yun Tal",
  "runaans-hurricane": "Runaan's",
  "infinity-edge": "Infinity Edge",
  "mercurys-treads": "Mercury",
  "armored-advance": "Armored",
  "crimson-lucidity": "Lucidity",
  "gunmetal-greaves": "Gunmetal",
};
const shortItem = (id: string) => shortNames[id] ?? itemName(id);
const shortRune: Record<string, string> = {
  "axiom-arcanist": "Axiom",
  transcendence: "Transcend.",
  "nimbus-cloak": "Nimbus",
  "legend-haste": "Haste",
  "grasp-of-the-undying": "Grasp",
  "legend-bloodline": "Bloodline",
  "eyeball-collector": "Eyeball",
  "empowered-attack": "Empowered",
  "sudden-impact": "Impact",
  "chain-assault": "Chain",
  "lethal-tempo": "Lethal Tempo",
};
const labels: Record<string, string> = {
  win: "Win",
  kills: "Kills",
  carry: "Carry",
  mvp: "MVP proxy",
  support: "Support",
  practice: "Practise",
  "pre-lock": "Draft",
  loading: "Locked",
  "in-game": "In game",
  postgame: "Postgame",
  adc: "ADC",
  "aaa-aram": "AAA ARAM",
  pvp: "PvP",
};
const label = (v: string) => labels[v] ?? v[0].toUpperCase() + v.slice(1);
function Sheet({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      className={q.sheet}
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button aria-label="Close sheet" onClick={close}>
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
function Icon({ id, kind }: { id: string; kind: "item" | "rune" }) {
  const src = assetRows[`${kind}:${id}`]?.path;
  return src ? (
    <img src={src} width={36} height={36} alt="" />
  ) : (
    <span className={q.fallbackIcon} aria-hidden="true">
      {kind === "item" && items[id]?.kind === "boots" ? "III" : "◇"}
    </span>
  );
}
export default function QuickMode() {
  const { state, status } = useRift();
  const draft = state.draft,
    profile = state.profiles.find((p) => p.id === state.activeProfile)!;
  const recommendation = useMemo(
    () => recommend(profile, draft),
    [profile, draft],
  );
  const threats = useMemo(() => quickThreats(draft), [draft]);
  const [sheet, setSheet] = useState<string | null>(null),
    [target, setTarget] = useState<{
      side: "allies" | "enemies";
      index: number;
    } | null>(null),
    [query, setQuery] = useState(""),
    [notice, setNotice] = useState("");
  const build =
    recommendation.builds.find((b) => b.id === draft.buildChoice) ??
    recommendation.builds[0];
  const runeIds = build
    ? [build.runes.keystone, ...build.runes.primary, build.runes.secondary]
    : [];
  const purchase = build ? nextPurchase(build, draft) : null;
  function change(transform: (st: AppState) => AppState) {
    try {
      updateState((st) => {
        const before = recommend(
          st.profiles.find((p) => p.id === st.activeProfile)!,
          st.draft,
        );
        const next = transform(st);
        const after = recommend(
          next.profiles.find((p) => p.id === next.activeProfile)!,
          next.draft,
        );
        const diff = adviceDiff(before, after);
        setNotice(
          [
            ...diff.removedThreats.map(
              (id) =>
                `${championById[id].name} removed: its specific warning is gone.`,
            ),
            ...diff.addedThreats.map(
              (id) => `${championById[id].name}: threat reviewed.`,
            ),
            ...(diff.objectiveChanged ? ["Objective re-evaluated."] : []),
            ...(diff.buildsChanged
              ? ["Build or purchase priorities changed."]
              : []),
          ].join(" "),
        );
        return next;
      });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Update failed");
    }
  }
  function pref(patch: Partial<Profile>) {
    change((st) => ({
      ...st,
      profiles: st.profiles.map((p) =>
        p.id === st.activeProfile ? { ...p, ...patch } : p,
      ),
    }));
  }
  function pick(id: string | null) {
    if (!target) return;
    change((st) => ({
      ...st,
      draft: setManualSlot(st.draft, target.side, target.index, id),
    }));
    setTarget(null);
    setQuery("");
  }
  const selected = recommendation.selected;
  const primaryReason = threats[0]
    ? `${championById[threats[0].championId].name}: ${threats[0].action}`
    : "Enter visible opponents to surface matchup-specific advice.";
  return (
    <div className={q.quick}>
      <header className={q.header}>
        <Link href="/rift">
          <b>✦ Rift Lab</b>
          <span>/ QUICK</span>
        </Link>
        <div>
          <span className={q.patch}>WR {PATCH}</span>
          <button
            aria-label="Quick settings"
            onClick={() => setSheet("settings")}
          >
            ⚙
          </button>
        </div>
      </header>
      <div className={q.chips}>
        <button onClick={() => setSheet("settings")}>
          {draft.selected
            ? championById[draft.selected].name
            : "Choose champion"}{" "}
          · {label(draft.stage)}
        </button>
        <button onClick={() => setSheet("settings")}>
          {label(profile.role)} · {label(profile.objective)}
        </button>
        <button onClick={() => setSheet("settings")}>
          {label(profile.mode)} ·{" "}
          {profile.queue === "solo"
            ? "Solo"
            : profile.duoPartner
              ? state.profiles.find((p) => p.id === profile.duoPartner)?.name
              : label(profile.queue)}
        </button>
      </div>
      <ScreenshotInput compact />
      <section className={q.card} aria-label="Editable team composition">
        {(["allies", "enemies"] as const).map((side) => (
          <div key={side} className={q.teamRow}>
            <strong>{side === "allies" ? "YOUR" : "ENEMY"}</strong>
            {draft[side].map((id, index) => (
              <button
                key={index}
                className={q.champion}
                onClick={() => {
                  setTarget({ side, index });
                  setQuery("");
                }}
                aria-label={`${side === "allies" ? "Ally" : "Enemy"} ${index + 1}: ${id ? championById[id].name : "unknown"}`}
              >
                {id ? (
                  <img
                    src={
                      assetRows[`wr:${id}`]?.path ?? championById[id].portrait
                    }
                    width={30}
                    height={30}
                    alt=""
                  />
                ) : (
                  <span className={q.unknown}>?</span>
                )}
                <span>{id ? championById[id].name : "Unknown"}</span>
                {id && (
                  <i
                    aria-label={
                      draft.slotEvidence?.[side]?.[index]?.source ===
                      "screenshot"
                        ? draft.slotEvidence?.[side]?.[index]?.corrected
                          ? "Screenshot, user-corrected"
                          : "Screenshot, reviewed"
                        : "Manual"
                    }
                  >
                    {draft.slotEvidence?.[side]?.[index]?.source ===
                    "screenshot"
                      ? draft.slotEvidence?.[side]?.[index]?.corrected
                        ? "C"
                        : "S"
                      : "M"}
                  </i>
                )}
              </button>
            ))}
          </div>
        ))}
        <div className={q.sectionTitle}>
          <p className={q.meta}>
            {recommendation.coverage.knownEnemies}/5 enemies ·{" "}
            {recommendation.coverage.reviewedEnemies} kits · S scan / C edit / M
            manual
          </p>
          <button
            className={q.textButton}
            onClick={() => {
              change((st) => ({ ...st, draft: emptyDraft() }));
              setNotice("Draft reset. Saved profile preferences kept.");
            }}
          >
            Reset
          </button>
        </div>
      </section>
      <section
        className={`${q.card} ${q.decision}`}
        aria-label="Quick recommendation"
      >
        <div className={q.sectionTitle}>
          <div>
            <span className={q.kicker}>
              {draft.stage === "postgame"
                ? "RETROSPECTIVE"
                : draft.buildChoice &&
                    recommendation.builds.some(
                      (b) => b.id === draft.buildChoice,
                    )
                  ? "YOUR CHOICE"
                  : "RECOMMENDED"}{" "}
              · {selected ? championById[selected].name : "No covered champion"}
            </span>
            <h1>{build?.name ?? "Choose a covered champion"}</h1>
          </div>
          <button className={q.textButton} onClick={() => setSheet("compare")}>
            Compare ↗
          </button>
        </div>
        <p className={q.twoLines}>{primaryReason}</p>
        {draft.stage === "postgame" && (
          <button
            className={q.textButton}
            onClick={() =>
              change((st) => ({
                ...st,
                draft: {
                  ...st.draft,
                  stage: "pre-lock",
                  owned: [],
                  gold: 0,
                  gameMinutes: 0,
                },
              }))
            }
          >
            Plan next game with these picks ↗
          </button>
        )}
      </section>
      {build && (
        <section className={q.card} aria-label="Quick loadout">
          <div className={q.sectionTitle}>
            <b>
              Build <span>· 5 items + boots</span>
            </b>
            <button className={q.textButton} onClick={() => setSheet("build")}>
              Why these? ↗
            </button>
          </div>
          <div className={q.items}>
            {[...build.items, build.boots].map((id, i) => (
              <button
                key={id}
                onClick={() => setSheet(`item:${id}`)}
                aria-label={`${i === 5 ? "Boots" : `Item ${i + 1}`}: ${itemName(id)}`}
              >
                <Icon id={id} kind="item" />
                <span>{shortItem(id)}</span>
              </button>
            ))}
          </div>
          <div className={q.sectionTitle}>
            <b>
              Runes{" "}
              <span>
                ·{" "}
                {draft.stage === "pre-lock"
                  ? "choose before lock"
                  : "informational; already locked"}
              </span>
            </b>
            <button className={q.textButton} onClick={() => setSheet("runes")}>
              Details ↗
            </button>
          </div>
          <div className={q.runes}>
            {runeIds.map((id) => (
              <button
                key={id}
                onClick={() => setSheet(`rune:${id}`)}
                aria-label={`Rune: ${runes[id].name}`}
              >
                <Icon id={id} kind="rune" />
                <span>{shortRune[id] ?? runes[id].name}</span>
              </button>
            ))}
          </div>
          {!!build.supportInventory.length && (
            <p className={q.meta}>
              Quest uses a slot; 5th major needs optional late sale.
            </p>
          )}
        </section>
      )}
      <section className={q.card}>
        <div className={q.sectionTitle}>
          <b>Biggest threats</b>
          <button className={q.textButton} onClick={() => setSheet("threats")}>
            All threats ↗
          </button>
        </div>
        <div className={q.threats}>
          {threats.slice(0, 2).map((t) => (
            <div key={t.code}>
              <strong>{t.title}</strong>
              <p className={q.twoLines}>{t.action}</p>
            </div>
          ))}
          {!threats.length && (
            <p>Unknown picks have no champion-specific warnings.</p>
          )}
        </div>
      </section>
      {build && (
        <section className={q.card}>
          <div className={q.sectionTitle}>
            <b>Purchase path</b>
            <button
              className={q.textButton}
              onClick={() => setSheet("purchases")}
            >
              All steps ↗
            </button>
          </div>
          <div className={q.purchases}>
            <div>
              <small>EARLY</small>
              <b>400g boots</b>
              <span>First / second recall</span>
            </div>
            <div>
              <small>
                {draft.stage === "in-game" ? "BUY NEXT" : "NEXT MAJOR"}
              </small>
              <b>
                {draft.stage === "in-game" && purchase
                  ? shortItem(purchase.item)
                  : shortItem(build.items[0])}
              </b>
              <span>
                {draft.stage === "in-game" && purchase
                  ? `${purchase.cost}g · ${purchase.affordable ? "affordable" : "save gold"}`
                  : "First core spike"}
              </span>
            </div>
            <div>
              <small>THEN</small>
              <b>
                {shortItem(
                  build.purchase.find(
                    (p) =>
                      p.action !== "release" &&
                      items[p.item].kind === "major" &&
                      p.item !== build.items[0],
                  )?.item ?? build.items[1],
                )}
              </b>
              <span>T3 ≥10m, after core</span>
            </div>
          </div>
          {build.purchase.some((p) => p.note.startsWith("Accelerated")) && (
            <p className={q.alert}>
              Burst → earlier Hourglass; component ≠ Stasis.
            </p>
          )}
        </section>
      )}
      <p className={q.quality}>
        Partial mechanics verification · confidence uncalibrated · no LLM calls.{" "}
        <Link href="/rift/settings">Profiles & privacy ↗</Link>
      </p>
      <details className={q.debug}>
        <summary>Rule trace & coverage</summary>
        <p>
          Deterministic engine. Timing measurements are available in scan
          evidence. {recommendation.ruleVersion} · {recommendation.dataVersion}.
          No render/phone performance claim.
        </p>
        <output data-testid="quick-advice" hidden>
          {JSON.stringify(recommendation)}
        </output>
        {recommendation.warnings.map((w) => (
          <p key={w}>{w}</p>
        ))}
      </details>
      {(notice || status) && (
        <p className={q.notice} role="status">
          {notice || status}
        </p>
      )}
      <footer className={q.bottom}>
        <button
          className={q.primary}
          disabled={!build}
          onClick={async () => {
            if (!build) return;
            const text = `Rift Lab WR ${PATCH} (${recommendation.ruleVersion}) — ${build.name}\n${draft.stage === "pre-lock" ? "Before lock" : "Informational / retrospective runes"}: ${runeIds.map((id) => runes[id].name).join(" · ")}\nItems: ${build.items.map(itemName).join(" → ")} + ${itemName(build.boots)}\n${threats
              .slice(0, 2)
              .map((t) => t.action)
              .join(
                "\n",
              )}\nEarly Boots of Speed 400g; Tier 3 ≥10:00 after core. Partial mechanics verification.`;
            try {
              await navigator.clipboard.writeText(text);
              setNotice("Copied the actual engine plan.");
            } catch {
              setSheet("copy");
            }
          }}
        >
          ▣ Copy plan
        </button>
        <Link href="/rift/build">Full analysis ↗</Link>
      </footer>
      {target && (
        <Sheet
          title={`Edit ${target.side === "allies" ? "ally" : "enemy"} ${target.index + 1}`}
          close={() => setTarget(null)}
        >
          <input
            autoFocus
            placeholder="Search champions…"
            aria-label="Search champions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => pick(null)}>Keep unknown / clear pick</button>
          <div className={q.picker}>
            {champions
              .filter((c) =>
                [c.name, c.id, ...c.aliases].some((v) =>
                  v.toLowerCase().includes(query.toLowerCase()),
                ),
              )
              .map((c) => (
                <button key={c.id} onClick={() => pick(c.id)}>
                  <img
                    src={assetRows[`wr:${c.id}`]?.path ?? c.portrait}
                    width={44}
                    height={44}
                    alt=""
                  />
                  {c.name}
                </button>
              ))}
          </div>
        </Sheet>
      )}
      {sheet && (
        <Sheet
          title={
            sheet === "settings"
              ? "Quick settings"
              : sheet === "compare"
                ? "Compare candidates"
                : sheet.startsWith("item:")
                  ? itemName(sheet.slice(5))
                  : sheet.startsWith("rune:")
                    ? runes[sheet.slice(5)].name
                    : label(sheet)
          }
          close={() => setSheet(null)}
        >
          {sheet === "settings" && (
            <div className={q.settings}>
              <label>
                Player
                <select
                  value={state.activeProfile}
                  onChange={(e) =>
                    change((st) => ({
                      ...st,
                      activeProfile: e.target.value,
                      draft: { ...st.draft, selected: null, owned: [] },
                    }))
                  }
                >
                  {state.profiles.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                My champion
                <select
                  value={draft.selected ?? ""}
                  onChange={(e) =>
                    change((st) => ({
                      ...st,
                      draft: { ...st.draft, selected: e.target.value || null },
                    }))
                  }
                >
                  <option value="">Not chosen</option>
                  {champions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {(
                [
                  [
                    "Role",
                    ROLES,
                    profile.role,
                    (v: string) => pref({ role: v as Profile["role"] }),
                  ],
                  [
                    "Objective",
                    OBJECTIVES,
                    profile.objective,
                    (v: string) =>
                      pref({ objective: v as Profile["objective"] }),
                  ],
                  [
                    "Mode",
                    MODES,
                    profile.mode,
                    (v: string) => pref({ mode: v as Profile["mode"] }),
                  ],
                  [
                    "Stage",
                    STAGES,
                    draft.stage,
                    (v: string) =>
                      change((st) => ({
                        ...st,
                        draft: { ...st.draft, stage: v as typeof draft.stage },
                      })),
                  ],
                ] as const
              ).map(([text, values, value, fn]) => (
                <label key={text}>
                  {text}
                  <select value={value} onChange={(e) => fn(e.target.value)}>
                    {values.map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label>
                Party
                <select
                  value={profile.queue}
                  onChange={(e) =>
                    pref({ queue: e.target.value as Profile["queue"] })
                  }
                >
                  {["solo", "duo", "team"].map((v) => (
                    <option key={v} value={v}>
                      {label(v)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Duo partner
                <select
                  value={profile.duoPartner ?? ""}
                  onChange={(e) => pref({ duoPartner: e.target.value || null })}
                >
                  <option value="">Not set</option>
                  {state.profiles
                    .filter((p) => p.id !== profile.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Risk tolerance {profile.risk}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={profile.risk}
                  onChange={(e) => pref({ risk: Number(e.target.value) })}
                />
              </label>
              <label>
                Boot priorities
                <select
                  value={profile.bootTiming ?? "core-first"}
                  onChange={(e) =>
                    pref({
                      bootTiming: e.target.value as Profile["bootTiming"],
                    })
                  }
                >
                  <option value="core-first">
                    400g early; core before Tier 3
                  </option>
                  <option value="earlier-tier2">
                    Earlier Tier 2; delays first major
                  </option>
                </select>
              </label>
              <Link href="/rift/settings">
                Edit proficiency, pool and local data ↗
              </Link>
            </div>
          )}
          {sheet === "compare" && (
            <>
              <h3>Champion choices before lock</h3>
              {recommendation.champions.map((c) => (
                <button
                  className={q.compare}
                  key={c.champion}
                  onClick={() =>
                    change((st) => ({
                      ...st,
                      draft: { ...st.draft, selected: c.champion },
                    }))
                  }
                  disabled={draft.stage !== "pre-lock"}
                >
                  {championById[c.champion].name} · utility {c.score}
                </button>
              ))}
              <h3>Build candidates</h3>
              <button
                className={q.compare}
                onClick={() => {
                  change((st) => ({
                    ...st,
                    draft: { ...st.draft, buildChoice: null },
                  }));
                  setSheet(null);
                }}
              >
                Use engine recommendation
              </button>
              {recommendation.builds.map((b) => (
                <button
                  className={q.compare}
                  key={b.id}
                  onClick={() => {
                    change((st) => ({
                      ...st,
                      draft: { ...st.draft, buildChoice: b.id },
                    }));
                    setSheet(null);
                  }}
                >
                  <b>
                    {b.name} · utility {b.score}
                  </b>
                  <p>{b.tradeoff}</p>
                </button>
              ))}
              <p>
                Utility points are authored heuristics, not win probabilities.
              </p>
            </>
          )}
          {sheet === "threats" && (
            <>
              {threats.map((t) => (
                <article key={t.code}>
                  <h3>{t.title}</h3>
                  <p>{t.action}</p>
                  <a href={t.source} target="_blank" rel="noreferrer">
                    Wild Rift kit source ↗
                  </a>
                </article>
              ))}
              <p>
                {recommendation.coverage.reviewedEnemies}/
                {recommendation.coverage.knownEnemies} visible enemy kits
                reviewed. Missing kits remain a coverage gap.
              </p>
            </>
          )}
          {build && sheet === "build" && (
            <>
              <p>{build.strategy}</p>
              <p>{build.tradeoff}</p>
              {build.reasons.map((r, i) => (
                <p key={i}>
                  <b>
                    {r.code} ({r.value})
                  </b>{" "}
                  {r.text}
                </p>
              ))}
              {build.alternatives.map((a) => (
                <p key={a.item}>
                  <b>{itemName(a.item)}</b> for {itemName(a.replaces)}:{" "}
                  {a.condition}
                </p>
              ))}
              <Link href="/rift/build">Full score provenance ↗</Link>
            </>
          )}
          {build && sheet === "runes" && (
            <>
              {draft.stage !== "pre-lock" && (
                <p className={q.warning}>
                  These runes are informational. They cannot be changed in the
                  played/locked game.
                </p>
              )}
              {runeIds.map((id) => (
                <p key={id}>
                  <b>{runes[id].name}</b> · {runes[id].tree}, row{" "}
                  {runes[id].row}. {build.runeReasons[id]}
                </p>
              ))}
              <p>
                Five legal slots in this snapshot. Patch mechanics are partially
                verified.
              </p>
            </>
          )}
          {build && sheet === "purchases" && (
            <>
              <p>
                Costs are the pinned community snapshot, with matching owned
                components credited. No exact recall time or income is assumed.
                Tier 3 may be delayed further.
              </p>
              <label>
                Game minutes
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={draft.gameMinutes}
                  onChange={(e) =>
                    change((st) => ({
                      ...st,
                      draft: {
                        ...st.draft,
                        gameMinutes: Number(e.target.value),
                      },
                    }))
                  }
                />
              </label>
              <label>
                Available gold
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={draft.gold}
                  onChange={(e) =>
                    change((st) => ({
                      ...st,
                      draft: { ...st.draft, gold: Number(e.target.value) },
                    }))
                  }
                />
              </label>
              <Link href="/rift/build">
                Enter held components in full analysis ↗
              </Link>
              <ol>
                {build.purchase.map((p, i) => (
                  <li key={i}>
                    <b>
                      {p.action === "release"
                        ? "Optional quest-item sale"
                        : itemName(p.item)}{" "}
                      · {p.cost}g
                    </b>
                    <p>
                      {p.note}{" "}
                      {p.minMinute > 0 ? `Earliest ${p.minMinute}:00.` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </>
          )}
          {build &&
            sheet.startsWith("item:") &&
            (() => {
              const id = sheet.slice(5),
                item = items[id];
              return (
                <>
                  <p>{item.stats}</p>
                  <p>
                    {build.itemReasons[id] ??
                      "Matchup boot choice; review opportunity cost against core items."}
                  </p>
                  <p>
                    {item.price}g total ·{" "}
                    {item.recipe.length
                      ? `Recipe: ${item.recipe.map(itemName).join(" + ")}`
                      : "Direct purchase"}
                    .{" "}
                    {item.minMinute
                      ? `Available ≥${item.minMinute}:00 in ranked/PvP.`
                      : ""}
                  </p>
                  <p>
                    {item.status === "community"
                      ? "Community mechanics: provisional"
                      : "Official cross-check exists; see detailed provenance"}
                    .{" "}
                    {assetRows[`item:${id}`]
                      ? ""
                      : "Icon unavailable; the III symbol is an original fallback marker."}
                  </p>
                  <a href={item.source} target="_blank" rel="noreferrer">
                    Source ↗
                  </a>
                </>
              );
            })()}
          {build && sheet.startsWith("rune:") && (
            <>
              <p>{build.runeReasons[sheet.slice(5)]}</p>
              <p>
                {runes[sheet.slice(5)].tree} · row {runes[sheet.slice(5)].row} ·
                snapshot {recommendation.dataVersion}. Provisional effects.
              </p>
              {draft.stage !== "pre-lock" && (
                <p>Informational only after lock.</p>
              )}
            </>
          )}
          {sheet === "copy" && (
            <textarea
              readOnly
              aria-label="Plan to copy"
              value={JSON.stringify(
                {
                  patch: PATCH,
                  stage: draft.stage,
                  champion: selected,
                  build,
                  runeIds,
                  threats,
                },
                null,
                2,
              )}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}
