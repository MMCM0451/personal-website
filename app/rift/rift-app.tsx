"use client";
/* eslint-disable @next/next/no-img-element -- Immutable local portraits are resized during acquisition. */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  champions,
  championById,
  DATA_VERSION,
  items,
  PATCH,
  runes,
} from "@/lib/rift/catalog";
import { itemEligibility, recommend } from "@/lib/rift/engine";
import {
  clearData,
  editHistory,
  exportJSON,
  saveAdvice,
  updateState,
  useRift,
} from "@/lib/rift/storage";
import { defaultProfile, emptyDraft, parseState } from "@/lib/rift/state";
import {
  MODES,
  OBJECTIVES,
  ROLES,
  STAGES,
  type BuildCandidate,
  type Draft,
  type Profile,
  type Recommendation,
  type Reason,
} from "@/lib/rift/types";
import s from "./rift.module.css";
import VisionInput from "./vision-input";
import { deleteCorrections } from "@/lib/rift/vision-browser";

type View = "dashboard" | "draft" | "build" | "history" | "settings";
type Target =
  | { kind: "allies" | "enemies"; index: number }
  | { kind: "selected" }
  | { kind: "ban" }
  | { kind: "pool" };
const labels: Record<string, string> = {
  top: "Top / Baron",
  jungle: "Jungle",
  mid: "Mid",
  adc: "ADC / Dragon",
  support: "Support",
  win: "Win the game",
  kills: "Find kills",
  carry: "Personal carry",
  mvp: "MVP-oriented",
  practice: "Practise a champion",
  ranked: "Ranked",
  pvp: "PvP",
  aram: "ARAM",
  "aaa-aram": "AAA ARAM",
  "pre-lock": "Pre-lock-in",
  loading: "Loading / locked",
  "in-game": "In-game",
  postgame: "Postgame",
};
const title = (id: string) => labels[id] ?? id;
const name = (id: string) =>
  items[id]?.name.replace(/&#x27;|&#039;/g, "'") ??
  championById[id]?.name ??
  id;
function Portrait({ id, small = false }: { id: string; small?: boolean }) {
  // Local immutable assets, already resized at acquisition; no remote request or image service.
  return (
    <img
      className={small ? s.smallPortrait : s.portrait}
      src={championById[id].portrait}
      width={112}
      height={128}
      alt=""
      loading="lazy"
    />
  );
}
function Reasons({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className={s.reasons}>
      {reasons.map((r, i) => (
        <li key={r.code + i}>
          <span>
            <b>{r.code.replaceAll("_", " ")}</b>
            {r.text}
          </span>
          <strong>
            {r.value > 0 ? "+" : ""}
            {r.value}
          </strong>
        </li>
      ))}
    </ul>
  );
}
function Select({
  label,
  value,
  values,
  onChange,
  display,
}: {
  label: string;
  value: string;
  values: readonly string[];
  onChange: (v: string) => void;
  display?: Record<string, string>;
}) {
  return (
    <label className={s.field}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {values.map((v) => (
          <option key={v} value={v}>
            {display?.[v] ?? title(v)}
          </option>
        ))}
      </select>
    </label>
  );
}
function Picker({
  target,
  close,
  choose,
  pool,
}: {
  target: Target;
  close: () => void;
  choose: (id: string) => void;
  pool: string[];
}) {
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  const filtered = champions
    .filter((c) =>
      [c.name, c.id, ...c.aliases].some((v) =>
        v.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    )
    .sort(
      (a, b) =>
        Number(pool.includes(b.id)) - Number(pool.includes(a.id)) ||
        a.name.localeCompare(b.name),
    );
  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-label="Champion selector"
    >
      <div className={s.dialogHead}>
        <div>
          <p className={s.eyebrow}>
            {target.kind === "pool" ? "EDIT YOUR POOL" : "MANUAL SELECTION"}
          </p>
          <h2>Choose a champion</h2>
        </div>
        <button
          className={s.iconButton}
          onClick={close}
          aria-label="Close champion selector"
        >
          ×
        </button>
      </div>
      <input
        className={s.search}
        aria-label="Search champions"
        placeholder="Search name or alias…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      <p className={s.muted}>
        {filtered.length} champions · pool first · roster-only kits are marked
      </p>
      <div className={s.pickerGrid}>
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => choose(c.id)}
            className={s.championTile}
          >
            <Portrait id={c.id} />
            <span>{c.name}</span>
            <small>
              {pool.includes(c.id)
                ? "Your pool"
                : c.coverage === "roster-only"
                  ? "Roster only"
                  : "Kit covered"}
            </small>
          </button>
        ))}
      </div>
      {!filtered.length && <p>No matches. Try another name.</p>}
    </dialog>
  );
}
function BuildPanel({
  recommendation,
  profile,
  draft,
}: {
  recommendation: Recommendation;
  profile: Profile;
  draft: Draft;
}) {
  const [tab, setTab] = useState("");
  const [message, setMessage] = useState("");
  const build =
    recommendation.builds.find((b) => b.id === tab) ?? recommendation.builds[0];
  if (!build)
    return (
      <section className={s.card}>
        <p className={s.eyebrow}>BUILD COVERAGE</p>
        <h2>No covered build yet</h2>
        <p>
          Select a covered pool champion or check the patch warning. Unsupported
          mechanics are left explicit.
        </p>
      </section>
    );
  const selected = recommendation.selected!;
  return (
    <section className={s.card} aria-label="Build recommendation">
      <div className={s.sectionHead}>
        <div className={s.inline}>
          <Portrait id={selected} small />
          <div>
            <p className={s.eyebrow}>
              A PLAN FOR {championById[selected].name.toUpperCase()}
            </p>
            <h2>Build with a reason.</h2>
          </div>
        </div>
        <span className={s.badge}>5 items + boots</span>
      </div>
      <div className={s.buildTabs} role="group" aria-label="Candidate builds">
        {recommendation.builds.map((b) => (
          <button
            key={b.id}
            className={b.id === build.id ? s.activeTab : ""}
            onClick={() => setTab(b.id)}
            aria-pressed={b.id === build.id}
          >
            {b.name}
            <span>Utility {b.score}</span>
          </button>
        ))}
      </div>
      <p className={s.lead}>{build.strategy}</p>
      <p className={s.tradeoff}>
        <b>Trade-off.</b> {build.tradeoff}
      </p>
      <ol className={s.itemGrid}>
        {build.items.map((id, i) => (
          <li key={id}>
            <span className={s.itemNumber}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <strong>{name(id)}</strong>
            <span>{items[id].price.toLocaleString()}g</span>
            <small>{build.itemReasons[id]}</small>
            <a href={items[id].source} target="_blank" rel="noreferrer">
              Source ·{" "}
              {items[id].status === "community"
                ? "provisional"
                : "cross-checked"}{" "}
              ↗
            </a>
          </li>
        ))}
        <li className={s.bootSlot}>
          <span className={s.itemNumber}>↗</span>
          <strong>{name(build.boots)}</strong>
          <span>{items[build.boots].price.toLocaleString()}g total</span>
          <small>
            {items[build.boots].minMinute
              ? "Tier 2 first → Tier 3 after 10:00"
              : "Tier 2 · mode upgrade timing unverified"}
          </small>
        </li>
      </ol>
      {build.supportInventory.length > 0 && (
        <div className={s.notice}>
          <b>Keep the support quest slot.</b>
          <p>
            Before any optional late sale:{" "}
            {build.supportInventory.map(name).join(" · ")}. The quest item
            occupies one of the five major slots; its evolution is earned in
            play. The final fifth major above assumes you choose to give up the
            evolved quest item’s utility.
          </p>
        </div>
      )}
      <div className={s.runeBox}>
        <div>
          <p className={s.eyebrow}>FIVE LEGAL RUNES</p>
          <h3>{runes[build.runes.keystone].name}</h3>
          <p>
            Keystone + 3 {runes[build.runes.primary[0]].tree} rows + 1{" "}
            {runes[build.runes.secondary].tree}
          </p>
        </div>
        <ol>
          {[
            build.runes.keystone,
            ...build.runes.primary,
            build.runes.secondary,
          ].map((id, i) => (
            <li key={id}>
              <span>{i === 0 ? "✦" : i}</span>
              <div>
                {runes[id].name}
                <small>{build.runeReasons[id]}</small>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className={s.spells}>
        <b>Summoner spells</b> {build.spells.join(" + ")}{" "}
        <small>· Review spell trade-offs before lock-in.</small>
      </p>
      <details className={s.details} open={draft.stage === "loading"}>
        <summary>
          Purchase and recall plan{" "}
          <span>{build.totalGold.toLocaleString()}g gross</span>
        </summary>
        <p className={s.muted}>
          Illustrative purchases from an empty inventory; no income or exact
          recall minute is assumed. Components are credited when combined. Later
          purchases can move ahead of a time-gated boot upgrade.
        </p>
        <ol className={s.timeline}>
          {build.purchase.map((step, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              <div>
                <strong>
                  {step.action === "release"
                    ? "Release quest slot"
                    : name(step.item)}
                </strong>
                <p>{step.note}</p>
                <small>
                  {step.action === "release"
                    ? "No sale credit"
                    : `${step.action === "combine" ? "Remaining combine / missing components" : "Buy"} ${step.cost.toLocaleString()}g · spent ${step.total.toLocaleString()}g`}
                  {step.minMinute > 0 && ` · gate ${step.minMinute}:00`}
                </small>
              </div>
            </li>
          ))}
        </ol>
      </details>
      <details className={s.details}>
        <summary>Conditional swaps and alternatives</summary>
        {build.alternatives.map((a) => (
          <p key={a.item}>
            <b>{name(a.item)}</b> in place of {name(a.replaces)}. {a.condition}
          </p>
        ))}
        <p className={s.muted}>
          These are single-slot alternatives, not instructions to add a seventh
          item. Reassess triggers and passive conflicts after changes.
        </p>
      </details>
      <details className={s.details}>
        <summary>Why this candidate?</summary>
        <Reasons reasons={build.reasons} />
        {Object.entries(build.spellReasons).map(([id, reason]) => (
          <p key={id}>
            <b>{id}.</b> {reason}
          </p>
        ))}
        <p className={s.muted}>
          Rune baseline follows a reviewed Wild Rift example; changing archetype
          can change the independent keystone. Rune choices remain hypotheses,
          not measured effect estimates.
        </p>
      </details>
      {draft.stage === "in-game" && (
        <InGame
          build={build}
          draft={draft}
          profile={profile}
          selected={selected}
        />
      )}
      <div className={s.actions}>
        <button
          className={s.primary}
          onClick={() =>
            setMessage(
              saveAdvice({ ...recommendation, presentedBuild: build.id })
                ? "Saved the exact input and all candidate plans. Open History to review."
                : "Save failed — see storage notice.",
            )
          }
        >
          Save advice before match
        </button>
        <button
          onClick={() =>
            exportJSON(
              { ...recommendation, presentedBuild: build.id },
              "rift-advice",
            )
          }
        >
          Export this advice
        </button>
      </div>
      {message && (
        <p role="status" className={s.muted}>
          {message}
        </p>
      )}
    </section>
  );
}
function InGame({
  build,
  draft,
  profile,
  selected,
}: {
  build: BuildCandidate;
  draft: Draft;
  profile: Profile;
  selected: string;
}) {
  const targets = [...build.items, build.boots];
  // A held upgrade also satisfies its lower-tier components. Credit only held recipe descendants.
  const contains = (parent: string, child: string): boolean =>
    parent === child || items[parent].recipe.some((id) => contains(id, child));
  const next = targets.find(
    (id) => !draft.owned.some((held) => contains(held, id)),
  );
  let suggestion = "All planned final slots are already owned.";
  if (next) {
    const remaining = [...draft.owned];
    const credit = (id: string): number => {
      const at = remaining.indexOf(id);
      if (at >= 0) {
        remaining.splice(at, 1);
        return items[id].price;
      }
      return items[id].recipe.reduce((sum, c) => sum + credit(c), 0);
    };
    const cost =
      items[next].price -
      items[next].recipe.reduce((sum, c) => sum + credit(c), 0);
    const blocked = itemEligibility(
      items[next],
      championById[selected],
      profile.mode,
      draft.patch,
      draft.gameMinutes,
    );
    suggestion = blocked.length
      ? `${name(next)}: ${blocked.join(", ")}.`
      : remaining.length >= 6
        ? "Inventory is full. Review components and replacements before buying."
        : `${name(next)}: ${cost.toLocaleString()}g remaining after matching held components. ${draft.gold >= cost ? "Affordable with entered gold." : `${(cost - draft.gold).toLocaleString()}g more needed.`}`;
  }
  return (
    <div className={s.notice}>
      <h3>Next major target</h3>
      <p>{suggestion}</p>
      <p className={s.muted}>
        Uses entered inventory and gold. This is not live game telemetry;
        unrelated or evolved quest items need manual review.
      </p>
    </div>
  );
}

export default function RiftApp({ view }: { view: View }) {
  const { state, history, status } = useRift();
  const profile = state.profiles.find((p) => p.id === state.activeProfile)!;
  const recommendation = useMemo(
    () => recommend(profile, state.draft),
    [profile, state.draft],
  );
  const [picker, setPicker] = useState<Target | null>(null);
  const [notice, setNotice] = useState("");
  const draft = state.draft;
  const changeProfile = (patch: Partial<Profile>) =>
    updateState((st) => ({
      ...st,
      profiles: st.profiles.map((p) =>
        p.id === st.activeProfile ? { ...p, ...patch } : p,
      ),
    }));
  const changeDraft = (patch: Partial<Draft>) =>
    updateState((st) => ({ ...st, draft: { ...st.draft, ...patch } }));
  function choose(id: string) {
    if (!picker) return;
    if (picker.kind === "pool") {
      if (!profile.pool.some((p) => p.champion === id))
        changeProfile({
          pool: [
            ...profile.pool,
            { champion: id, proficiency: 2, preference: 3 },
          ],
        });
    } else if (picker.kind === "selected") changeDraft({ selected: id });
    else if (picker.kind === "ban") {
      if (!draft.bans.includes(id)) changeDraft({ bans: [...draft.bans, id] });
    } else {
      const side = [...draft[picker.kind]];
      if (side.some((v, i) => v === id && i !== picker.index)) {
        setNotice("That champion is already in this team.");
        return;
      }
      side[picker.index] = id;
      changeDraft({ [picker.kind]: side });
    }
    setPicker(null);
    setNotice("");
  }
  function loadExample() {
    changeDraft({
      ...emptyDraft(),
      allies: ["jinx", null, null, null, null],
      enemies: ["miss-fortune", "veigar", "nunu-and-willump", "varus", "zyra"],
    });
    setNotice("Example draft loaded. Replace any pick with your actual game.");
  }
  const partner = state.profiles.find((p) => p.id === profile.duoPartner);
  return (
    <div className={s.app}>
      <header
        className={`${s.hero} ${view !== "dashboard" ? s.compactHero : ""}`}
      >
        <div>
          <p className={s.eyebrow}>RIFT LAB / WILD RIFT</p>
          <h1>
            A clearer next move<span>.</span>
          </h1>
          <p>Know the draft. Choose your edge. Take a plan into the Rift.</p>
        </div>
        <div className={s.version}>
          <span className={s.dot} /> Local strategy engine <b>Patch {PATCH}</b>
          <small>Partial mechanics verification · no LLM calls</small>
        </div>
      </header>
      <nav className={s.nav} aria-label="Rift Lab navigation">
        {(["dashboard", "draft", "build", "history", "settings"] as const).map(
          (v) => (
            <Link
              href={v === "dashboard" ? "/rift" : `/rift/${v}`}
              key={v}
              aria-current={view === v ? "page" : undefined}
            >
              <span>
                {
                  {
                    dashboard: "⌂",
                    draft: "◈",
                    build: "↗",
                    history: "◷",
                    settings: "☷",
                  }[v]
                }
              </span>
              {v === "dashboard"
                ? "Overview"
                : title(v).replace(/^./, (c) => c.toUpperCase())}
            </Link>
          ),
        )}
      </nav>
      {status && (
        <div className={s.notice} role="status">
          {status}
        </div>
      )}
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {view !== "history" && (
        <section className={s.context} aria-label="Player and game settings">
          <Select
            label="Player"
            value={state.activeProfile}
            values={state.profiles.map((p) => p.id)}
            display={Object.fromEntries(
              state.profiles.map((p) => [p.id, p.name]),
            )}
            onChange={(v) =>
              updateState((st) => ({
                ...st,
                activeProfile: v,
                draft: { ...st.draft, selected: null, owned: [] },
              }))
            }
          />
          <Select
            label="Assigned role"
            value={profile.role}
            values={ROLES}
            onChange={(v) => changeProfile({ role: v as Profile["role"] })}
          />
          <Select
            label="Your objective"
            value={profile.objective}
            values={OBJECTIVES}
            onChange={(v) =>
              changeProfile({ objective: v as Profile["objective"] })
            }
          />
          <Select
            label="Game mode"
            value={profile.mode}
            values={MODES}
            onChange={(v) => changeProfile({ mode: v as Profile["mode"] })}
          />
          <Select
            label="Game stage"
            value={draft.stage}
            values={STAGES}
            onChange={(v) => changeDraft({ stage: v as Draft["stage"] })}
          />
        </section>
      )}
      {(view === "dashboard" || view === "draft") && (
        <>
          {view === "dashboard" && (
            <div className={s.introGrid}>
              <div className={s.introCard}>
                <p className={s.eyebrow}>01 / SET THE SCENE</p>
                <h2>Start with what you know.</h2>
                <p>
                  Choose your role and objective above. Tap visible picks below;
                  leave hidden champions unknown.
                </p>
                <div className={s.actions}>
                  <Link className={s.primary} href="/rift/draft">
                    Open draft desk ↗
                  </Link>
                  <button onClick={loadExample}>
                    Try Swain + Jinx example
                  </button>
                </div>
              </div>
              <div className={s.introCard}>
                <p className={s.eyebrow}>02 / KEEP YOUR EDGE</p>
                <h2>Your pool. Your playstyle.</h2>
                <div className={s.poolPreview}>
                  {profile.pool.slice(0, 6).map((p) => (
                    <button
                      key={p.champion}
                      onClick={() => changeDraft({ selected: p.champion })}
                      aria-label={`Plan with ${name(p.champion)}`}
                    >
                      <Portrait id={p.champion} small />
                      <span>{name(p.champion)}</span>
                    </button>
                  ))}
                </div>
                <Link className={s.textLink} href="/rift/settings">
                  Edit proficiency and preferences ↗
                </Link>
              </div>
            </div>
          )}
          <div className={s.workspace}>
            <section className={s.card}>
              <div className={s.sectionHead}>
                <div>
                  <p className={s.eyebrow}>THE DRAFT DESK</p>
                  <h2>Read the room.</h2>
                </div>
                <button onClick={() => changeDraft(emptyDraft())}>
                  Reset draft
                </button>
              </div>
              <p className={s.muted}>
                Visible picks only. Enter allies and enemies before choosing
                your own champion.
              </p>
              {(["allies", "enemies"] as const).map((side) => (
                <div className={s.team} key={side}>
                  <div className={s.teamLabel}>
                    <h3>{side === "allies" ? "Your team" : "Opposing team"}</h3>
                    <span>{draft[side].filter(Boolean).length} / 5 known</span>
                  </div>
                  <div className={s.slots}>
                    {draft[side].map((id, i) => (
                      <div key={i} className={s.slot}>
                        <button
                          className={s.slotPick}
                          onClick={() => setPicker({ kind: side, index: i })}
                          aria-label={`${side === "allies" ? "Ally" : "Enemy"} slot ${i + 1}: ${id ? name(id) : "unknown"}`}
                        >
                          {id ? (
                            <Portrait id={id} />
                          ) : (
                            <span className={s.unknown}>+</span>
                          )}
                          <span>{id ? name(id) : "Unknown"}</span>
                        </button>
                        {id && (
                          <button
                            className={s.clearSlot}
                            onClick={() => {
                              const slots = [...draft[side]];
                              slots[i] = null;
                              changeDraft({ [side]: slots });
                            }}
                            aria-label={`Clear ${side} slot ${i + 1}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className={s.lockRow}>
                <div>
                  <p className={s.eyebrow}>YOUR CHAMPION</p>
                  <p>
                    {draft.selected
                      ? name(draft.selected)
                      : "Not selected — all visible picks still count"}
                  </p>
                </div>
                <button onClick={() => setPicker({ kind: "selected" })}>
                  {draft.selected ? "Change champion" : "Choose champion"}
                </button>
                {draft.selected && (
                  <button onClick={() => changeDraft({ selected: null })}>
                    Clear
                  </button>
                )}
              </div>
              <div className={s.bans}>
                <span>Bans</span>
                {draft.bans.map((id) => (
                  <button
                    key={id}
                    onClick={() =>
                      changeDraft({ bans: draft.bans.filter((c) => c !== id) })
                    }
                  >
                    {name(id)} ×
                  </button>
                ))}
                <button onClick={() => setPicker({ kind: "ban" })}>
                  + Ban
                </button>
              </div>
              <div className={s.coverage}>
                <b>
                  {recommendation.coverage.reviewedEnemies}/
                  {recommendation.coverage.knownEnemies} visible enemy kits
                  covered
                </b>
                <p>
                  142 portrait selections · 27 qualitative kits · 8 champions
                  with build templates
                </p>
              </div>
              <VisionInput
                retain={state.retainCrops}
                setRetain={(retainCrops) =>
                  updateState((st) => ({ ...st, retainCrops }))
                }
                confirm={(team, slot, id) => {
                  if (draft[team].some((c, i) => c === id && i !== slot))
                    return false;
                  const slots = [...draft[team]];
                  slots[slot] = id;
                  changeDraft({ [team]: slots });
                  return true;
                }}
              />
            </section>
            <section className={s.card} aria-label="Champion recommendations">
              <p className={s.eyebrow}>YOUR TOP PICKS</p>
              <h2>Play to your strengths.</h2>
              <p className={s.muted}>
                Pool + role + visible composition. Utility points are not a win
                rate.
              </p>
              <div className={s.candidates}>
                {recommendation.champions.map((c, i) => (
                  <article key={c.champion}>
                    <div className={s.candidateTitle}>
                      <span className={s.rank}>0{i + 1}</span>
                      <Portrait id={c.champion} small />
                      <div>
                        <h3>{name(c.champion)}</h3>
                        <span className={s.muted}>{title(profile.role)}</span>
                      </div>
                      <strong>
                        {c.score}
                        <small>utility</small>
                      </strong>
                    </div>
                    {c.warnings.map((w) => (
                      <p key={w} className={s.muted}>
                        {w}
                      </p>
                    ))}
                    <details>
                      <summary>Score breakdown & trade-offs</summary>
                      <Reasons reasons={c.reasons} />
                    </details>
                    <button
                      className={
                        draft.selected === c.champion ? s.activeButton : ""
                      }
                      onClick={() => changeDraft({ selected: c.champion })}
                    >
                      {draft.selected === c.champion
                        ? "Selected"
                        : "Plan with " + name(c.champion)}
                    </button>
                  </article>
                ))}
              </div>
              {!recommendation.champions.length && (
                <p>
                  No covered pool champion fits this role. Add a suitable
                  champion in Settings.
                </p>
              )}
              <Link className={s.textLink} href="/rift/build">
                Open complete build plan ↗
              </Link>
            </section>
          </div>
          {view === "draft" && (
            <BuildPanel
              recommendation={recommendation}
              profile={profile}
              draft={draft}
            />
          )}
        </>
      )}
      {view === "build" && (
        <>
          <div className={s.buildHero}>
            <div>
              <p className={s.eyebrow}>{title(draft.stage).toUpperCase()}</p>
              <h2>
                {recommendation.selected
                  ? `A plan for ${name(recommendation.selected)}.`
                  : "Choose your champion."}
              </h2>
              <p className={s.muted}>
                Updates immediately when picks, objective or role change.
              </p>
            </div>
            <button onClick={() => setPicker({ kind: "selected" })}>
              Change champion
            </button>
            <Link className={s.textLink} href="/rift/draft">
              Edit draft ↗
            </Link>
          </div>
          {draft.stage === "in-game" && (
            <section className={s.context}>
              <label className={s.field}>
                Game minute
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={draft.gameMinutes}
                  onChange={(e) =>
                    changeDraft({
                      gameMinutes: Math.min(
                        180,
                        Math.max(0, Number(e.target.value)),
                      ),
                    })
                  }
                />
              </label>
              <label className={s.field}>
                Gold available
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={draft.gold}
                  onChange={(e) =>
                    changeDraft({
                      gold: Math.min(
                        100000,
                        Math.max(0, Number(e.target.value)),
                      ),
                    })
                  }
                />
              </label>
              <label className={s.field}>
                Add known item
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && draft.owned.length < 6)
                      changeDraft({ owned: [...draft.owned, e.target.value] });
                  }}
                >
                  <option value="">Choose owned item…</option>
                  {Object.values(items).map((i) => (
                    <option key={i.id} value={i.id}>
                      {name(i.id)}
                    </option>
                  ))}
                </select>
              </label>
              <div className={s.bans}>
                {draft.owned.map((id, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      changeDraft({
                        owned: draft.owned.filter((_, j) => i !== j),
                      })
                    }
                  >
                    {name(id)} ×
                  </button>
                ))}
              </div>
            </section>
          )}
          <BuildPanel
            recommendation={recommendation}
            profile={profile}
            draft={draft}
          />
        </>
      )}
      {view === "settings" && (
        <div className={s.workspace}>
          <section className={s.card}>
            <p className={s.eyebrow}>PLAYER SETTINGS</p>
            <h2>Make the model yours.</h2>
            <label className={s.field}>
              Profile name
              <input
                value={profile.name}
                maxLength={60}
                onChange={(e) => {
                  if (e.target.value.trim())
                    changeProfile({ name: e.target.value });
                }}
              />
            </label>
            <label className={s.field}>
              Aggression / risk: {profile.risk}%
              <input
                type="range"
                min={0}
                max={100}
                value={profile.risk}
                onChange={(e) =>
                  changeProfile({ risk: Number(e.target.value) })
                }
              />
              <span className={s.muted}>Cautious ← → Aggressive</span>
            </label>
            <Select
              label="Queue"
              value={profile.queue}
              values={["solo", "duo", "team"]}
              onChange={(v) => changeProfile({ queue: v as Profile["queue"] })}
            />
            {profile.queue !== "solo" && (
              <label className={s.field}>
                Duo partner
                <select
                  value={profile.duoPartner ?? ""}
                  onChange={(e) =>
                    changeProfile({ duoPartner: e.target.value || null })
                  }
                >
                  <option value="">No partner set</option>
                  {state.profiles
                    .filter((p) => p.id !== profile.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {partner && (
              <p className={s.muted}>
                {partner.name} prefers{" "}
                {partner.pool.map((p) => name(p.champion)).join(", ")}. Enter
                their actual pick as an ally; no champion is assumed.
              </p>
            )}
            <div className={s.actions}>
              <button
                onClick={() => {
                  const p = defaultProfile(
                    "player-" + crypto.randomUUID().slice(0, 8),
                    "New player",
                  );
                  updateState((st) => ({
                    ...st,
                    profiles: [...st.profiles, p],
                    activeProfile: p.id,
                  }));
                }}
              >
                Add profile
              </button>
              {state.profiles.length > 1 && (
                <button
                  onClick={() =>
                    updateState((st) => ({
                      ...st,
                      profiles: st.profiles
                        .filter((p) => p.id !== profile.id)
                        .map((p) => ({
                          ...p,
                          duoPartner:
                            p.duoPartner === profile.id ? null : p.duoPartner,
                        })),
                      activeProfile: st.profiles.find(
                        (p) => p.id !== profile.id,
                      )!.id,
                    }))
                  }
                >
                  Delete this profile
                </button>
              )}
            </div>
            <hr />
            <h3>Local data & privacy</h3>
            <p className={s.muted}>
              Profiles, draft and saved advice stay in this browser. No account,
              cloud sync or match-history API is connected.
            </p>
            <div className={s.actions}>
              <button
                onClick={() =>
                  exportJSON({ state, history, dataVersion: DATA_VERSION })
                }
              >
                Export local data
              </button>
              <label className={s.fileButton}>
                Import profiles & draft
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 2_000_000) throw Error();
                      const data = JSON.parse(await file.text());
                      const imported = parseState(data.state ?? data);
                      updateState(() => imported);
                      setNotice(
                        "Profiles and draft imported. Advice history remains unchanged.",
                      );
                    } catch {
                      setNotice(
                        "Import rejected: invalid or oversized profile/draft file.",
                      );
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                onClick={() => {
                  clearData();
                  try {
                    deleteCorrections();
                  } catch {}
                  setNotice("Local profiles, draft and advice history reset.");
                }}
              >
                Delete local data
              </button>
            </div>
          </section>
          <section className={s.card}>
            <div className={s.sectionHead}>
              <div>
                <p className={s.eyebrow}>CHAMPION POOL</p>
                <h2>Experience matters.</h2>
              </div>
              <button onClick={() => setPicker({ kind: "pool" })}>
                + Champion
              </button>
            </div>
            <p className={s.muted}>
              Proficiency is your estimate (1–5). Preference sets what you
              enjoy/practise. Both are editable and contribute to scoring.
            </p>
            {profile.pool.map((p, i) => (
              <div className={s.poolEntry} key={p.champion}>
                <div className={s.inline}>
                  <span className={s.rank}>{i + 1}</span>
                  <Portrait id={p.champion} small />
                  <div>
                    <strong>{name(p.champion)}</strong>
                    <p className={s.muted}>
                      {championById[p.champion].coverage === "roster-only"
                        ? "Roster only — not scored yet"
                        : "Qualitative kit covered"}
                    </p>
                  </div>
                  <button
                    className={s.iconButton}
                    aria-label={`Remove ${name(p.champion)} from pool`}
                    onClick={() =>
                      changeProfile({
                        pool: profile.pool.filter(
                          (q) => q.champion !== p.champion,
                        ),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
                <div className={s.twoFields}>
                  {(["proficiency", "preference"] as const).map((key) => (
                    <label className={s.field} key={key}>
                      {key === "proficiency" ? "Proficiency" : "Preference"}
                      <select
                        value={p[key]}
                        onChange={(e) =>
                          changeProfile({
                            pool: profile.pool.map((q) =>
                              q.champion === p.champion
                                ? { ...q, [key]: Number(e.target.value) }
                                : q,
                            ),
                          })
                        }
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
      {view === "history" && (
        <section className={s.card}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.eyebrow}>
                ADVICE HISTORY / {history.length} SAVED
              </p>
              <h2>Keep the actual advice.</h2>
            </div>
            <button onClick={() => exportJSON({ state, history })}>
              Export history
            </button>
          </div>
          <p className={s.muted}>
            Frozen recommendations and notes, stored locally. Postgame
            screenshot extraction and performance statistics are not implemented
            yet. Do not infer purchase order from a final build.
          </p>
          {history.length === 0 && (
            <div className={s.empty}>
              <span>◷</span>
              <h3>Your first game starts here.</h3>
              <p>
                Save a recommendation before the match to compare it with what
                happened.
              </p>
              <Link className={s.primary} href="/rift/build">
                Open your plan ↗
              </Link>
            </div>
          )}
          {history.map((record) => (
            <article className={s.historyEntry} key={record.id}>
              <div className={s.sectionHead}>
                <h3>
                  {record.recommendation.selected
                    ? name(record.recommendation.selected)
                    : "Draft"}{" "}
                  · {record.recommendation.input.profile.name}
                </h3>
                <button onClick={() => editHistory(record.id, null)}>
                  Delete record
                </button>
              </div>
              <p className={s.muted}>
                {new Date(record.savedAt).toLocaleString()} ·{" "}
                {title(record.recommendation.input.profile.mode)} ·{" "}
                {title(record.recommendation.input.profile.role)} · Patch{" "}
                {record.recommendation.patch}
              </p>
              <p>
                {
                  (
                    record.recommendation.builds.find(
                      (b) => b.id === record.recommendation.presentedBuild,
                    ) ?? record.recommendation.builds[0]
                  )?.name
                }{" "}
                ·{" "}
                {(
                  record.recommendation.builds.find(
                    (b) => b.id === record.recommendation.presentedBuild,
                  ) ?? record.recommendation.builds[0]
                )?.items
                  .map(name)
                  .join(" → ")}
              </p>
              <details>
                <summary>Frozen inputs and all candidates</summary>
                <pre className={s.json}>
                  {JSON.stringify(record.recommendation, null, 2)}
                </pre>
              </details>
              <label className={s.field}>
                Your observations (annotations, not extracted facts)
                <textarea
                  value={record.note}
                  maxLength={4000}
                  onChange={(e) => editHistory(record.id, e.target.value)}
                  placeholder="Why did you swap an item? How did the engagement go? Was the death productive?"
                />
              </label>
            </article>
          ))}
        </section>
      )}
      {view !== "settings" && view !== "history" && (
        <section className={s.brief}>
          <div>
            <p className={s.eyebrow}>MATCHUP BRIEF</p>
            <h2>Know what changes the fight.</h2>
            {recommendation.tactics.length ? (
              <ul>
                {recommendation.tactics.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <p>
                Enter visible enemies to surface threat-specific tactics.
                Preserve an exit and play around allied follow-up.
              </p>
            )}
          </div>
          <div>
            <p className={s.eyebrow}>COVERAGE & ASSUMPTIONS</p>
            {recommendation.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        </section>
      )}
      <footer className={s.footer}>
        <p>
          Snapshot {DATA_VERSION} · rules {recommendation.ruleVersion}. Scores
          are hypotheses; test them against your games.
        </p>
        <p>
          Rift Lab isn’t endorsed by Riot Games and doesn’t reflect the views or
          opinions of Riot Games or anyone officially involved in producing or
          managing Riot Games properties. Riot Games, and all associated
          properties are trademarks or registered trademarks of Riot Games, Inc.
        </p>
        <p>
          <a
            href="https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3b/"
            target="_blank"
            rel="noreferrer"
          >
            Official patch notes ↗
          </a>{" "}
          · Personal beta · experimental screenshot recognition
        </p>
      </footer>
      {picker && (
        <Picker
          target={picker}
          close={() => setPicker(null)}
          choose={choose}
          pool={profile.pool.map((p) => p.champion)}
        />
      )}
    </div>
  );
}
