# Rift Lab architecture

Current repair addition (2026-10-17): `/rift/quick` is another client view over `useRift` and the same `recommend(Profile, Draft)`. `screenshot.ts` is pure pixel/layout/template math; `screenshot-browser.ts` owns bounded decoding and same-origin reference preparation; `scan-state.ts` owns reviewed merging/provenance/protection. `screenshot-input.tsx` is shared by Quick and full draft, with the old precise-crop tool retained separately. `quick-advice.ts` only adapts existing engine outputs and kit tactics for display; it is not a second strategy model. See RECOGNITION_STATUS for actual supported layouts and QUICK_MODE_DESIGN for controls.

This repair uses a local branch/checkout inside the writable task workspace. The original canonical checkout and production remain unchanged. Current Next version is 16.4.2; the audit below describes the original starting point. Next dev now generates a local AGENTS.md directing agents to bundled version-specific docs; it was read before implementation.

Audit date: 2026-10-17. Local implementation; production publication requires Max's approval.

## Repository audit

The task's OneDrive MAXMA.ME directory has no application files. Canonical checkout: `C:\Users\maxmi\Documents\personal-website`, GitHub `MMCM0451/personal-website`. Clean working tree at audit. Next.js 16.1.6 App Router, React 19.2.3, TypeScript strict, Tailwind 4 plus handwritten CSS. Existing routes: home, about, projects, blog, photos. Shared header/footer, serif headings, paper background and green accent. README is the Next starter; no architecture/deployment file, application AGENTS.md, test runner, authentication or persistent backend was present. Scripts: dev/build/start/lint. Existing workflow identifies Vercel and main-to-production deployment; the live Vercel Git integration was not rechecked in this audit, so no push was attempted.

MMCM checkout and its AGENTS.md, README, PROJECT_STATE, PORTAL_OPERATIONS and Infrastructure Guide were inspected read-only. It uses Next/Vercel, Google identity, an API Gateway JWT authorizer, Lambda and private versioned S3 in eu-north-1; DynamoDB/Step Functions serve its independent research engine. Reusable patterns: immutable manifests, explicit versions, separate public assets/private evidence, minimal scopes and isolated resources. Rift will not import its code, identities, buckets, data or credentials. Local infrastructure definitions/docs are accessible. A read-only STS check using mmcm-capital in eu-north-1 returned an expired session; live cloud access is not currently verified and authentication was not refreshed. No cloud resources are needed for this slice.

## Boundaries

- `app/rift`: client application inside existing site shell, scoped CSS; dashboard, draft, build, history, settings routes. No changes to existing page content.
- `lib/rift`: pure synchronous TypeScript strategy functions; inputs and outputs contain patch, snapshot and rule version. No network/LLM calls on the recommendation path.
- `lib/rift/data`: pinned Wild Rift roster and mechanics, source receipts, explicit heuristic combat tags and data-driven build templates. Unsupported champions remain selectable with conservative warnings; no fabricated kit properties.
- Browser persistence: versioned profile/draft/recommendation history, validation at load, export/delete. Images local, opt-in correction evidence; storage errors visible. No authentication claim or cross-device sync.
- Vision separate from strategy: local image decode, user-adjustable crops, reference matching, ranked candidates and explicit confirmation. Unknown slots remain null. No silent automatic layout/identity guesses. Real screenshot evaluation precedes any production accuracy claim.

## Contracts

One keystone + three minor runes from different rows of one primary tree + one minor from a different tree. Final inventory is five major items plus one boot slot. Support quest item occupies a major slot until explicitly sold late; expose both inventories. Components consume/upgrade into parent items with incremental costs. Tier 3 boots require 10:00 on the Rift; uncertain mode mechanics disable upgrade advice. No PC-only enchant assumptions. Build legality is distinct from a strategy's uncalibrated utility score (never a win probability).

Hidden picks, unknown roles, unverified effects and missing observations are explicit. MVP objective uses transparent participation/survival/damage proxies; Riot's private scoring is unknown. No inferred purchase order from final inventories.

## Future

IndexedDB for larger opt-in labelled crops/multiple postgame screenshots, reviewed OCR observations and calculated metrics with provenance. No CNN until held-out real screenshots justify it. PWA/share-target needs scoped service-worker testing before release. Multiuser cloud: separate Rift resource names, private encrypted storage, identity-scoped access, deletion and cost review; never reuse financial system permissions. Public release requires Riot registration/policy and asset-rights review.

Release maintenance: the 2026-10-17 deployment request authorised publication through the existing Vercel integration. The framework and matching lint configuration were updated to Next 16.4.2 for security fixes; the initial audit versions above describe the pre-change checkout. See PROJECT_STATE for validation and remaining experimental limits.

## Implemented vertical slice

Optional catch-all App Router page statically generates only the five known Rift paths. `rift-app.tsx` composes profile/draft/build/history views; `vision-input.tsx` owns temporary image/crop state. `storage.ts` uses a versioned external store with runtime validation and visible failures. `engine.ts` is synchronous and imports data/templates/explanations only. `vision.ts` is numerical and separately tested; `vision-browser.ts` handles decode/canvas/reference caching and opt-in labels. There are no Rift API routes or server secrets. Immutable locally resized portraits total about 491 KiB. All original site content is retained; Projects gains an application link.
