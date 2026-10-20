import { describe, expect, it } from "vitest";
import { categorize } from "./categorize";

const project = (title: string, description = "", categories: string[] = [], project_type = "mod") => ({
  title,
  description,
  categories,
  project_type,
});

describe("categorize", () => {
  it("detects compatibility patches", () => {
    expect(categorize(project("Jade Sable Compat"))).toContain("Compatibility");
  });

  it("detects vehicle parts", () => {
    expect(categorize(project("Better Propellers", "New propeller types"))).toContain("Vehicles & Parts");
  });

  it("detects combat addons", () => {
    expect(categorize(project("Sky Turrets", "Mount a cannon on your airship"))).toContain("Combat");
  });

  it("puts language packs only in Translations", () => {
    expect(categorize(project("Create Aeronautics RU", "Russian translation", [], "resourcepack"))).toEqual([
      "Translations",
    ]);
  });

  it("treats resource packs as visuals", () => {
    expect(categorize(project("Shiny Pack", "", [], "resourcepack"))).toContain("Visuals & Sound");
  });

  it("falls back to Modrinth tags when the text has no keywords", () => {
    expect(categorize(project("Thing", "Does stuff", ["worldgen"]))).toEqual(["World & Adventure"]);
  });

  it("uses Other when nothing matches", () => {
    expect(categorize(project("Thing", "Does stuff"))).toEqual(["Other"]);
  });
});
