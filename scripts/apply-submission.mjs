// Applies an approved submission issue to the data files.
// Reads the issue body from ISSUE_BODY. Exit codes: 0 applied, 2 needs manual handling, 1 invalid.
import { readFileSync, writeFileSync } from "node:fs";

const MANUAL = "src/data/manual-addons.json";
const LINKS = "src/data/curseforge-links.json";
const CURSEFORGE_URL =
  /^https:\/\/www\.curseforge\.com\/minecraft\/(mc-mods|data-packs|texture-packs)\/([a-z0-9-]+)$/;

function fail(message, code = 1) {
  console.log(message);
  process.exit(code);
}

const body = process.env.ISSUE_BODY ?? "";
const block = body.match(/```json\n([\s\S]*?)\n```/);
if (!block) fail("No JSON block found in the issue.");

let s;
try {
  s = JSON.parse(block[1]);
} catch {
  fail("The JSON block is not valid JSON.");
}

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const write = (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + "\n");

if (s.kind === "new") {
  const match = String(s.curseforgeUrl).match(CURSEFORGE_URL);
  if (!match) fail("Invalid CurseForge URL.");
  const manual = read(MANUAL);
  const links = read(LINKS);
  if (manual.some((a) => a.curseforgeUrl === s.curseforgeUrl) || Object.values(links).includes(s.curseforgeUrl)) {
    fail("This CurseForge project is already listed.");
  }
  manual.push({
    slug: `cf-${match[2]}`,
    title: String(s.title).slice(0, 80),
    description: String(s.description).slice(0, 200),
    author: String(s.author).slice(0, 60),
    curseforgeUrl: s.curseforgeUrl,
    iconUrl: s.iconUrl ?? null,
    loaders: s.loaders,
    gameVersions: s.gameVersions,
    category: s.category,
    addedAt: new Date().toISOString(),
  });
  write(MANUAL, manual);
  console.log(`Added ${s.title} to the directory.`);
} else if (s.kind === "link") {
  if (!CURSEFORGE_URL.test(s.curseforgeUrl)) fail("Invalid CurseForge URL.");
  const links = read(LINKS);
  if (links[s.slug]) fail(`${s.slug} already has a CurseForge link.`);
  links[s.slug] = s.curseforgeUrl;
  write(LINKS, Object.fromEntries(Object.entries(links).sort(([a], [b]) => a.localeCompare(b))));
  console.log(`Linked ${s.slug} to ${s.curseforgeUrl}.`);
} else if (s.kind === "report") {
  fail("Reports need a manual fix (category rules in src/lib/categorize.ts or src/data/excluded.json).", 2);
} else {
  fail(`Unknown submission kind: ${s.kind}`);
}
