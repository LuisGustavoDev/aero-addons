import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = join(__dirname, "deployment-url.mjs");
const URL = "https://aero-addons-abc123-team.vercel.app";

let dir: string | undefined;
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

function run(output: string) {
  dir = mkdtempSync(join(tmpdir(), "deploy-url-"));
  const file = join(dir, "deploy.out");
  writeFileSync(file, output);
  return spawnSync("node", [SCRIPT, file], { encoding: "utf8" });
}

describe("deployment-url script", () => {
  it("reads the bare URL printed in CI", () => {
    const result = run(`${URL}\n`);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(URL);
  });

  it("reads the JSON printed in agent mode", () => {
    const result = run(JSON.stringify({ status: "ok", deployment: { url: URL } }));
    expect(result.stdout.trim()).toBe(URL);
  });

  it("fails when there is no URL", () => {
    expect(run("Error: something went wrong").status).toBe(1);
    expect(run("{}").status).toBe(1);
  });
});
