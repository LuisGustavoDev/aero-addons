// Prints the deployment URL from the saved stdout of `vercel deploy`.
// The CLI prints JSON when it detects an agent and a bare URL in CI, so both
// forms are accepted. Exits 1 when no URL can be found.
import { readFileSync } from "node:fs";

const raw = readFileSync(process.argv[2] ?? "deploy.json", "utf8").trim();

let url;
try {
  const data = JSON.parse(raw);
  url = data.deployment?.url ?? data.url;
} catch {
  url = raw.split(/\s+/).findLast((part) => /^https:\/\/\S+$/.test(part));
}

if (!url) {
  console.error(`No deployment URL in vercel output:\n${raw}`);
  process.exit(1);
}
console.log(url);
