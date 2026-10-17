import { champions, items, runePages } from "../lib/rift/catalog";
import {
  recommend,
  validateCatalog,
  validateRunePage,
} from "../lib/rift/engine";
import { defaultState } from "../lib/rift/state";
console.log({
  champions: champions.length,
  items: Object.keys(items).length,
  catalogErrors: validateCatalog(),
  runeErrors: Object.entries(runePages).map(([id, page]) => [
    id,
    validateRunePage(page),
  ]),
});
const state = defaultState();
const r = recommend(state.profiles[0], state.draft);
console.log({
  candidates: r.champions.map((c) => [c.champion, c.score]),
  builds: r.builds.map((b) => [b.id, b.items, b.totalGold]),
});
