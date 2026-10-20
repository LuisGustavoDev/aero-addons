// Checks that a running copy of the site renders real data.
// Usage: node scripts/smoke-test.mjs <base-url>
// For deployments behind Vercel's deployment protection, set
// VERCEL_AUTOMATION_BYPASS_SECRET (see scripts/vercel-bypass.mjs).
// Exits 1 on any failure.

const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/smoke-test.mjs <base-url>");
  process.exit(1);
}

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
// Only the bypass header: asking Vercel to also set the bypass cookie makes it
// answer with a redirect, which is meant for browsers.
const headers = bypass ? { "x-vercel-protection-bypass": bypass } : {};

// A broken Modrinth fetch would still render the page, just nearly empty.
const MIN_ADDONS = 100;

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
    // Redirects are not followed: a protected deployment answers with a
    // redirect to Vercel's login page, which must count as a failure.
    const res = await fetch(`${base}${check.path}`, { headers, redirect: "manual" });
    const html = await res.text();
    const problem =
      res.status !== check.status
        ? `status ${res.status}, expected ${check.status}`
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
