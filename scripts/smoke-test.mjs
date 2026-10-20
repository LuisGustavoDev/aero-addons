// Checks that a running copy of the site renders real data.
// Usage:
//   node scripts/smoke-test.mjs <base-url>
//   node scripts/smoke-test.mjs --vercel <deployment-url>
// The --vercel form goes through `vercel curl`, which gets past Vercel's
// deployment protection (needs VERCEL_TOKEN). Exits 1 on any failure.
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const viaVercel = args[0] === "--vercel";
const base = (viaVercel ? args[1] : args[0] ?? "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke-test.mjs [--vercel] <url>");
  process.exit(1);
}

// A broken Modrinth fetch would still render the page, just nearly empty.
const MIN_ADDONS = 100;
const STATUS_MARKER = "\n__SMOKE_STATUS__";

async function get(path) {
  if (!viaVercel) {
    const res = await fetch(`${base}${path}`, { redirect: "follow" });
    return { status: res.status, html: await res.text() };
  }
  const token = process.env.VERCEL_TOKEN ? ["--token", process.env.VERCEL_TOKEN] : [];
  const result = spawnSync(
    "npx",
    ["--yes", "vercel@64", "curl", path, "--deployment", base, "--yes", ...token, "--", "-sL", "-w", `${STATUS_MARKER}%{http_code}`],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
  );
  const out = result.stdout ?? "";
  const at = out.lastIndexOf(STATUS_MARKER);
  if (at === -1) throw new Error(`vercel curl failed: ${result.stderr?.trim().split("\n").pop()}`);
  return { status: Number(out.slice(at + STATUS_MARKER.length)), html: out.slice(0, at) };
}

const checks = [
  {
    path: "/",
    status: 200,
    test: (html) => {
      const match = html.match(/>(\d+)<\/dd><dt[^>]*>addons</);
      const count = match ? Number(match[1]) : 0;
      return count >= MIN_ADDONS || `expected at least ${MIN_ADDONS} addons, found ${count}`;
    },
  },
  { path: "/about", status: 200, test: (html) => html.includes("About AeroAddons") || "missing heading" },
  { path: "/submit", status: 200, test: (html) => html.includes("Submit an addon") || "missing heading" },
  { path: "/review", status: 404 },
];

let failed = false;
for (const check of checks) {
  try {
    const { status, html } = await get(check.path);
    const problem =
      status !== check.status
        ? `status ${status}, expected ${check.status}`
        : check.test
          ? check.test(html)
          : true;
    if (problem === true) {
      console.log(`ok   ${check.path}`);
    } else {
      failed = true;
      console.log(`FAIL ${check.path}: ${problem}`);
    }
  } catch (error) {
    failed = true;
    console.log(`FAIL ${check.path}: ${error.message}`);
  }
}

process.exit(failed ? 1 : 0);
