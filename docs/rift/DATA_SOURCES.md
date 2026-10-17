# Data sources and release controls

Investigated 2026-10-17. Current Riot patch: **7.3b**, published October 14, effective update October 15. A patch label is not proof every mechanic was verified.

| Source | Intended use | Confidence / limits |
| --- | --- | --- |
| [Official roster](https://wildrift.leagueoflegends.com/en-us/champions/) | Names, WR membership, portraits, ability descriptions | Official, retrieved page has 142 cards; website may lag game. No PC Data Dragon mechanics. |
| [iArmanKarimi/wildrift-champions-api](https://github.com/iArmanKarimi/wildrift-champions-api) | Investigated extraction approach for Riot `__NEXT_DATA__` | MIT wrapper, unstable page paths; not a patch-versioned item/rune source. Pin fetched data locally, no runtime dependency. |
| [Riot 7.2](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-2/) | New item recipes, boots and 10:00 tier-3 gate | Official changed mechanics; does not constitute a whole shop snapshot. |
| [Riot 7.3](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3/) | Item overhaul and jungle changes | Official; review alongside 7.3a/b. |
| [Riot 7.3b](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3b/) | Latest overrides (including Yun Tal 3000) | Official. Preserve prior snapshots; no automatic unreviewed promotion. |
| [WildRiftFire](https://www.wildriftfire.com/guide/swain), [runes](https://www.wildriftfire.com/rune-list), [items](https://www.wildriftfire.com/item-list) | Cross-check WR-specific availability and legal pages | Community-authored guides, not empirical win probabilities. Some prose is stale (e.g. Swain level 6 reference); do not ingest guide advice as fact. |
| [WildRiftMeta item database](https://www.wildriftmeta.com/items/) | Inspect recipes, prices and effects | Community dataset; mark provisional unless official changed values cross-checked. |
| [Wild Rift Gold Efficiency](https://github.com/changchiyou/wildrift-gold-efficiency) | Investigated versioned item dataset | Manually maintained, MIT code; inspect source freshness and game-IP rights separately. |
| [ry2x merged data](https://github.com/ry2x/WildRift-Merged-Champion-Data) | Evaluated only | Merges PC Data Dragon and WR data: rejected as a mechanics source without field-level verification. |

Combat property scores are authored qualitative heuristics, not measured statistics. Sources do not establish exhaustive matchup counters, global WR match history access, per-player analytics or Riot MVP coefficients.

## Update procedure

Use acquisition tooling to create a **new snapshot directory**, retaining raw roster/ability payloads, retrieval UTC, URL and SHA-256. Review official patch changes and community discrepancies. Edit a new mechanics snapshot or explicit manual override, recording rationale/source/status; never rewrite old snapshots or saved recommendations. Validate schemas, recipes, removed items, unique groups, rune rows, champion/mode restrictions and regression scenarios. Change the active snapshot only after checks and local review. Historical records pin exact data/rule versions and full outputs.

Command: `node scripts/acquire-rift.mjs <new-snapshot-id> <patch>` (defaults to 7.3b). It refuses an existing snapshot directory. It captures the currently served pages; passing an older patch number does **not** retrieve an original historical vintage. New acquisition never automatically promotes a snapshot. Update imports/PATCH/DATA_VERSION in `lib/rift/catalog.ts` explicitly after review, add versioned overrides, bump rule version if behavior changes, and preserve all prior files. Re-run tests/typecheck/build and record a new integrity manifest. `npm run verify:rift-data` verifies the pinned current snapshot's 77 original item pages plus 148 normalised/review/portrait artifacts. The verifier is deliberately pinned and must be updated when promoting a new snapshot.

Active snapshot `.3` repairs `.2`'s empty-stat extraction; it retains item HTML with real HTTP hashes/retrieval clocks, and inherits roster/kits/runes from `.2` without inventing a new retrieval time. `7.3b-official-review-1.json` records official price overrides for Yun Tal/Thornmail and Warmog's threshold. The UI's cross-check label concerns the verified changed price/rule; inherited recipes remain community evidence. Earlier failed partial acquisitions remain available and are not used at runtime. See PROJECT_STATE for the failure log and limits.

## Riot and privacy

Release packaging keeps raw acquisition `sources/` folders local and excludes them from Git/Vercel uploads. Normalized game facts, curated strategy data, source URLs/receipts/manifests and reference portraits are versioned for the app. No screenshot dataset is shipped. On a checkout with the local source archive, `npm run verify:rift-data` verifies it as well; on a fresh clone, use `npm run verify:rift-data -- --normalized-only` to check the 148 shipped artifacts while explicitly reporting that raw source pages were not checked. The ignored local archive is not cloud backup.

[General policies](https://developer.riotgames.com/policies/general) require registration/audit, a visible non-endorsement notice and game integrity. [Legal Jibber Jabber](https://www.riotgames.com/en/legal) and asset permissions must be reviewed for public release; wrapper software licenses do not license Riot art. Local cached portraits retain original URLs/hashes and are Riot property. Registration/approval has not happened. No overlay, client control, memory access, hidden information collection, de-anonymisation or API key is used. Screenshots stay on device; no upload by default. Private browser data is not durable cloud backup.
