# Observatory deployment contract

The private Observatory uses dynamic Next.js pages and a same-origin server proxy. Public website builds contain interface code only. Research, snapshots, migration checkpoints, owner identity configuration and secrets belong outside this public repository.

## Server environment

- `NEXTAUTH_URL`: exact HTTPS deployment origin. Use the canonical `https://www.maxma.me` in production.
- `NEXTAUTH_SECRET`: independent session encryption secret, generated and bound by the owner.
- `OBSERVATORY_GITHUB_CLIENT_ID`, `OBSERVATORY_GITHUB_CLIENT_SECRET`: GitHub OAuth application credentials. Allow only exact controlled callback URLs, without wildcard matching.
- `OBSERVATORY_OWNER_GITHUB_ID`: immutable numeric GitHub account ID. A matching display name or username is insufficient.
- `OBSERVATORY_SITE_ORIGIN`: exact origin allowed to submit browser mutations.
- `OBSERVATORY_API_URL`, `OBSERVATORY_SERVICE_SECRET`: HTTPS backend origin and server-only signing secret. Never use a `NEXT_PUBLIC_` prefix.

Use separate backend databases, object buckets and service/session secrets for staging and production. Branch-scoped preview variables must reference staging. Preserve Vercel preview authentication; research additionally requires the owner session. Do not run migrations from a Vercel build.

GitHub sign-in requests profile/email only. The server checks the provider's immutable account ID. Sessions use secure, host-only, HttpOnly, SameSite=Lax cookies; browser mutations require the exact origin. The proxy forwards no browser credentials or caller-supplied Sites identity headers. Backend credentials expire after two minutes and have a fixed audience.

## Validation

Run `npm run typecheck`, `npm run build`, `npm run test:rift` and `npm run verify:rift-data`. With the production server running, run `node scripts/verify-observatory-privacy.mjs`; set `OBSERVATORY_TEST_URL` for a deployed host. This verifies anonymous access and forged identities. Actual GitHub owner sign-in, logout, cross-account denial and authenticated mutations require separate live verification.

The backend repository owns complete migration, reconciliation, encrypted backup and restoration tooling. Native rows, original IDs/hashes, immutable snapshots, reviews, source policies/cursors, briefs and every raw object must reconcile. Active lease credentials are reset, rather than copied. A static SQLite analysis download is insufficient.

## Release gates

1. Inspect the protected preview and verify owner access with isolated staging data.
2. Complete full source export/import reconciliation and restore the independent encrypted backup into fresh storage.
3. Verify the local model worker against independently reviewed groups. Model proposals remain unaccepted until reviewed; record any missing benchmark evidence.
4. Freeze the old writer, reconcile the final delta, then transfer the single 08:00 UTC responsibility. Keep the source private and readable for rollback.
5. Publish the verified branch and check the canonical site, including existing public and Rift routes. Record deployment, migration and model-validation results separately.

A production UI deployment does not itself establish that migration or scheduler cutover is complete. Pending model batches and failed collection must remain visible. Personal fit stays unassessed when profile evidence is incomplete.
