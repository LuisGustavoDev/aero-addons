import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = join(__dirname, "apply-submission.mjs");

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "aeroaddons-"));
  mkdirSync(join(dir, "src/data"), { recursive: true });
  writeFileSync(join(dir, "src/data/manual-addons.json"), "[]\n");
  writeFileSync(
    join(dir, "src/data/curseforge-links.json"),
    JSON.stringify({ "create-tracks": "https://www.curseforge.com/minecraft/mc-mods/create-tracks" }),
  );
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

function run(submission: unknown) {
  const body = `Submitted through the AeroAddons form.\n\n\`\`\`json\n${JSON.stringify(submission, null, 2)}\n\`\`\``;
  return spawnSync("node", [SCRIPT], { cwd: dir, env: { ...process.env, ISSUE_BODY: body }, encoding: "utf8" });
}

const read = (file: string) => JSON.parse(readFileSync(join(dir, "src/data", file), "utf8"));

const newAddon = {
  kind: "new",
  title: "Sky Hooks",
  curseforgeUrl: "https://www.curseforge.com/minecraft/mc-mods/sky-hooks",
  description: "Hooks that hold airships in place.",
  author: "someone",
  loaders: ["neoforge"],
  gameVersions: ["1.21.1"],
  category: "Vehicles & Parts",
  iconUrl: null,
};

describe("apply-submission script", () => {
  it("adds an approved CurseForge-only addon", () => {
    const result = run(newAddon);
    expect(result.status).toBe(0);
    expect(read("manual-addons.json")).toMatchObject([{ slug: "cf-sky-hooks", title: "Sky Hooks" }]);
  });

  it("refuses a CurseForge project that is already listed", () => {
    const result = run({ ...newAddon, curseforgeUrl: "https://www.curseforge.com/minecraft/mc-mods/create-tracks" });
    expect(result.status).toBe(1);
    expect(read("manual-addons.json")).toEqual([]);
  });

  it("adds a CurseForge link to a listed addon", () => {
    const url = "https://www.curseforge.com/minecraft/mc-mods/sky-hooks";
    expect(run({ kind: "link", slug: "sky-hooks", curseforgeUrl: url }).status).toBe(0);
    expect(read("curseforge-links.json")["sky-hooks"]).toBe(url);
  });

  it("does not overwrite an existing link", () => {
    const result = run({ kind: "link", slug: "create-tracks", curseforgeUrl: "https://www.curseforge.com/minecraft/mc-mods/other" });
    expect(result.status).toBe(1);
  });

  it("leaves reports for a person to handle", () => {
    expect(run({ kind: "report", slug: "x", reason: "Other" }).status).toBe(2);
  });

  it("rejects issues without a JSON block", () => {
    const result = spawnSync("node", [SCRIPT], { cwd: dir, env: { ...process.env, ISSUE_BODY: "hello" }, encoding: "utf8" });
    expect(result.status).toBe(1);
  });
});
