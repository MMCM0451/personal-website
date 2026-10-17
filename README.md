This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Rift Lab

Repair branch adds `/rift/quick`: real local scoreboard recognition with explicit review, compact builds/runes/threats/purchases, and shared state with full analysis. Draft/loading recognition remains unsupported. Actual fixtures, confidence policy and measured timing: [RECOGNITION_STATUS.md](docs/rift/RECOGNITION_STATUS.md). Supply private fixtures using `RIFT_FIXTURE_DIR`; they are never public assets. No production deployment of this repair is authorised.

Local Wild Rift companion at `/rift` (draft/build/history/settings). Start with `npm run dev`; run `npm run test:rift`, `npm run typecheck`, and `npm run build` before release. `npm run benchmark:rift` records engine-only PC timing. Architecture, data provenance, rules, vision limits and handover are in [docs/rift/PROJECT_STATE.md](docs/rift/PROJECT_STATE.md).

Rift screenshots are processed locally; labelled crop retention is opt-in. Current manual/build coverage and experimental recogniser limits are visible in the app. The existing GitHub/Vercel integration deploys `main` to production. Max authorised the initial Rift release on 2026-10-17; later production changes still require applicable approval. See the project state for verified deployment evidence.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
