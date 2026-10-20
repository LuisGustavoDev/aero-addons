// Guards the hand-edited data files: a typo here would break the build or the site.
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/categorize";
import { SUBMIT_LOADERS, normalizeCurseforgeUrl } from "@/lib/submission";
import approved from "./approved-mentions.json";
import curseforgeLinks from "./curseforge-links.json";
import excluded from "./excluded.json";
import manualAddons from "./manual-addons.json";

const SLUG = /^[a-z0-9][a-z0-9_.-]*$/;

describe("curseforge-links.json", () => {
  it("maps Modrinth slugs to normalized CurseForge project URLs", () => {
    for (const [slug, url] of Object.entries(curseforgeLinks as Record<string, string>)) {
      expect(slug).toMatch(SLUG);
      expect(normalizeCurseforgeUrl(url), slug).toBe(url);
    }
  });

  it("never links two addons to the same project", () => {
    const urls = Object.values(curseforgeLinks as Record<string, string>);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("review lists", () => {
  it("contain unique, valid slugs", () => {
    for (const list of [approved, excluded] as string[][]) {
      expect(new Set(list).size).toBe(list.length);
      for (const slug of list) expect(slug).toMatch(SLUG);
    }
  });

  it("never approve and exclude the same project", () => {
    const both = (approved as string[]).filter((s) => (excluded as string[]).includes(s));
    expect(both).toEqual([]);
  });
});

describe("manual-addons.json", () => {
  type Manual = {
    slug: string;
    title: string;
    curseforgeUrl: string;
    loaders: string[];
    gameVersions: string[];
    category: string;
    addedAt: string;
  };

  it("only holds valid CurseForge-only addons", () => {
    for (const a of manualAddons as Manual[]) {
      expect(a.slug).toMatch(/^cf-[a-z0-9-]+$/);
      expect(a.title.length).toBeGreaterThan(0);
      expect(normalizeCurseforgeUrl(a.curseforgeUrl)).toBe(a.curseforgeUrl);
      expect(CATEGORIES).toContain(a.category);
      for (const l of a.loaders) expect(SUBMIT_LOADERS).toContain(l);
      for (const v of a.gameVersions) expect(v).toMatch(/^\d+\.\d+(\.\d+)?$/);
      expect(Number.isNaN(Date.parse(a.addedAt))).toBe(false);
    }
  });
});
