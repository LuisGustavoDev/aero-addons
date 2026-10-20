import { describe, expect, it } from "vitest";
import { classify, type Dependencies } from "./classify";

const AERONAUTICS = "oWaK0Q19";
const SABLE = "T9PomCSv";

const lists = (approved: string[] = [], excluded: string[] = []) => ({
  approved: new Set(approved),
  excluded: new Set(excluded),
});

const deps = (required: string[] = [], optional: string[] = []): Dependencies => ({
  required: new Set(required),
  optional: new Set(optional),
});

const project = (overrides: Partial<Parameters<typeof classify>[0]> = {}) => ({
  id: "abc123",
  slug: "some-addon",
  title: "Some Addon",
  description: "Adds a thing.",
  ...overrides,
});

describe("classify", () => {
  it("lists projects that require Create Aeronautics", () => {
    expect(classify(project(), deps([AERONAUTICS]), lists())).toEqual({
      status: "listed",
      requires: ["Create Aeronautics"],
    });
  });

  it("lists projects that require Sable", () => {
    expect(classify(project(), deps([SABLE]), lists())).toEqual({
      status: "listed",
      requires: ["Sable"],
    });
  });

  it("keeps mention-only projects pending until reviewed", () => {
    const p = project({ description: "Works with Sable sub-levels." });
    expect(classify(p, deps(), lists())).toEqual({
      status: "pending",
      requires: ["Sable"],
    });
  });

  it("keeps optional-dependency projects pending until reviewed", () => {
    expect(classify(project(), deps([], [AERONAUTICS]), lists()).status).toBe("pending");
  });

  it("lists mention-only projects once approved", () => {
    const p = project({ title: "Aeronautics Thing" });
    expect(classify(p, deps(), lists(["some-addon"])).status).toBe("listed");
  });

  it("skips excluded projects even when they require a parent", () => {
    expect(classify(project(), deps([AERONAUTICS]), lists([], ["some-addon"]))).toEqual({
      status: "skipped",
    });
  });

  it("skips the parent mods themselves", () => {
    expect(classify(project({ id: AERONAUTICS }), deps(), lists()).status).toBe("skipped");
  });

  it("skips unrelated projects", () => {
    expect(classify(project(), deps(), lists()).status).toBe("skipped");
  });

  it("does not treat 'sable' inside other words as a mention", () => {
    const p = project({ description: "A disposable tool." });
    expect(classify(p, deps(), lists()).status).toBe("skipped");
  });
});
