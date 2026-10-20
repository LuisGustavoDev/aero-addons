// Prints the project's "Protection Bypass for Automation" secret, generating one
// if the project has none, so CI can smoke-test protected deployments.
// Needs VERCEL_TOKEN, VERCEL_ORG_ID and VERCEL_PROJECT_ID.

const { VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID } = process.env;
if (!VERCEL_TOKEN || !VERCEL_ORG_ID || !VERCEL_PROJECT_ID) {
  console.error("VERCEL_TOKEN, VERCEL_ORG_ID and VERCEL_PROJECT_ID are required.");
  process.exit(1);
}

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.vercel.com${path}?teamId=${VERCEL_ORG_ID}`, {
    ...init,
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${body.error?.message ?? res.status}`);
  return body;
};

const automationSecret = (bypass = {}) =>
  Object.entries(bypass).find(([, value]) => value.scope === "automation-bypass")?.[0];

try {
  let secret = automationSecret((await api(`/v9/projects/${VERCEL_PROJECT_ID}`)).protectionBypass);
  if (!secret) {
    const created = await api(`/v1/projects/${VERCEL_PROJECT_ID}/protection-bypass`, {
      method: "PATCH",
      body: JSON.stringify({ generate: { note: "GitHub Actions smoke tests" } }),
    });
    secret = automationSecret(created.protectionBypass);
  }
  if (!secret) throw new Error("Vercel returned no automation bypass secret.");
  console.log(secret);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
