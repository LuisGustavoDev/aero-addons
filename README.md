# AeroAddons

Unofficial directory of every addon for [Create Aeronautics](https://modrinth.com/mod/create-aeronautics) and Sable.

## How it works

- `src/lib/modrinth.ts` searches the Modrinth API (`aeronautics`, `sable`, `simulated`, `create aero`).
  - Projects whose latest version **requires** Create Aeronautics or Sable are listed automatically.
  - Projects that only **mention** them, or depend on them optionally, stay hidden in a review queue. Run `npm run dev` and open `/review` (development only) to see them.
- Results are cached with `"use cache"` + `cacheLife("hours")`, so Modrinth is hit at most once an hour.
- `src/lib/categorize.ts` assigns categories from keywords in the title/description.
- Search, filters and sorting run on the client (`src/components/addon-browser.tsx`).

## Manual data

- `src/data/curseforge-links.json` — `{ "modrinth-slug": "curseforge-url" }`. CurseForge's API terms forbid caching its data, so CurseForge pages are linked, not fetched.
- `src/data/approved-mentions.json` — reviewed mention-only projects that are real addons.
- `src/data/excluded.json` — reviewed projects that aren't addons (standalone mods, keyword stuffing).

## Development

```bash
npm install
npm run dev -- -p 3101
```

## Tests

```bash
npm run check   # lint + type-check + unit tests
npm run build && npx next start -p 3000 & node scripts/smoke-test.mjs http://localhost:3000
```

- Unit tests (Vitest) cover the inclusion rules, categories, form validation, the hand-edited data files and the approval script.
- `scripts/smoke-test.mjs` checks a running site: the home page must list at least 100 addons, `/about` and `/submit` must load and `/review` must be a 404.

## Deploys

`main` is production. Vercel's own Git deployments are turned off (`vercel.json`), so the only way to production is `.github/workflows/deploy.yml`:

1. Lint, type-check, unit tests, production build and smoke test.
2. Deploy to Vercel without taking traffic and smoke-test that deployment.
3. Promote it, smoke-test the live site and roll back to the previous deployment if it fails.

Pull requests and pushes to `develop`, `feature/*`, `release/*` and `hotfix/*` run step 1 (`ci.yml`). Approved submissions start the deploy themselves.

Required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Optional repository variable: `PRODUCTION_URL` (enables the live smoke test and rollback).
