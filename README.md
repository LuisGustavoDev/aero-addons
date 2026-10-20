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
