import { describe, expect, it } from "vitest";
import { normalizeCurseforgeUrl, normalizeTitle, parseSubmission } from "./submission";

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

const validNew = {
  kind: "new",
  title: "Sky Hooks",
  curseforgeUrl: "https://www.curseforge.com/minecraft/mc-mods/sky-hooks",
  description: "Hooks that hold airships in place.",
  author: "someone",
  loaders: ["neoforge"],
  gameVersions: "1.21.1",
  category: "Vehicles & Parts",
};

describe("normalizeCurseforgeUrl", () => {
  it("normalizes host, case and trailing slash", () => {
    expect(normalizeCurseforgeUrl("https://curseforge.com/minecraft/MC-MODS/Sky-Hooks/")).toBe(
      "https://www.curseforge.com/minecraft/mc-mods/sky-hooks",
    );
  });

  it("rejects other sites and non-project pages", () => {
    expect(normalizeCurseforgeUrl("https://example.com/minecraft/mc-mods/x")).toBeNull();
    expect(normalizeCurseforgeUrl("https://www.curseforge.com/minecraft/mc-mods/x/files")).toBeNull();
    expect(normalizeCurseforgeUrl("http://www.curseforge.com/minecraft/mc-mods/x")).toBeNull();
  });
});

describe("normalizeTitle", () => {
  it("ignores case and punctuation", () => {
    expect(normalizeTitle("Create: Tracks+")).toBe(normalizeTitle("create tracks"));
  });
});

describe("parseSubmission", () => {
  it("accepts a valid new addon", () => {
    const result = parseSubmission(form(validNew));
    expect(result.ok).toBe(true);
    if (result.ok && result.submission.kind === "new") {
      expect(result.submission.gameVersions).toEqual(["1.21.1"]);
      expect(result.submission.iconUrl).toBeNull();
    }
  });

  it("reports every invalid field", () => {
    const result = parseSubmission(form({ kind: "new", title: "x", gameVersions: "latest" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        ["author", "category", "curseforgeUrl", "description", "gameVersions", "loaders", "title"].sort(),
      );
    }
  });

  it("only accepts icons from Modrinth or CurseForge", () => {
    const bad = parseSubmission(form({ ...validNew, iconUrl: "https://evil.example/icon.png" }));
    expect(bad.ok).toBe(false);
    const good = parseSubmission(form({ ...validNew, iconUrl: "https://media.forgecdn.net/avatars/1/2/icon.png" }));
    expect(good.ok).toBe(true);
  });

  it("drops unknown loaders", () => {
    const result = parseSubmission(form({ ...validNew, loaders: ["neoforge", "bukkit"] }));
    expect(result.ok && result.submission.kind === "new" && result.submission.loaders).toEqual(["neoforge"]);
  });

  it("strips control characters and caps lengths", () => {
    const result = parseSubmission(form({ ...validNew, title: "Sky\u0000 Hooks" + "x".repeat(200) }));
    expect(result.ok).toBe(true);
    if (result.ok && result.submission.kind === "new") {
      expect(result.submission.title).not.toContain("\u0000");
      expect(result.submission.title.length).toBeLessThanOrEqual(80);
    }
  });

  it("requires an addon and a valid link for link submissions", () => {
    expect(parseSubmission(form({ kind: "link", curseforgeUrl: "nope" })).ok).toBe(false);
    expect(
      parseSubmission(
        form({ kind: "link", slug: "create-tracks", curseforgeUrl: "https://www.curseforge.com/minecraft/mc-mods/create-tracks" }),
      ).ok,
    ).toBe(true);
  });

  it("requires a target category for wrong-category reports", () => {
    expect(parseSubmission(form({ kind: "report", slug: "x", reason: "Wrong category" })).ok).toBe(false);
    expect(
      parseSubmission(form({ kind: "report", slug: "x", reason: "Wrong category", suggestedCategory: "Combat" })).ok,
    ).toBe(true);
  });

  it("requires details for other reports", () => {
    expect(parseSubmission(form({ kind: "report", slug: "x", reason: "Other", details: "short" })).ok).toBe(false);
  });

  it("rejects unknown kinds", () => {
    expect(parseSubmission(form({ kind: "delete" })).ok).toBe(false);
  });
});
