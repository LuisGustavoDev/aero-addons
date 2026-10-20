"use server";

import { appendFile } from "node:fs/promises";
import { headers } from "next/headers";
import { getAddons } from "@/lib/modrinth";
import {
  normalizeTitle,
  parseSubmission,
  type FieldErrors,
  type Submission,
} from "@/lib/submission";

export type SubmitState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: FieldErrors }
  | { status: "success"; message: string };

const MIN_FILL_MS = 3_000;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 3;

// Per-instance only: good enough to slow down a script, not a distributed limit.
const recent = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    recent.set(ip, hits);
    return true;
  }
  recent.set(ip, [...hits, now]);
  return false;
}

async function passesTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    },
  );
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

async function findDuplicate(s: Submission): Promise<string | null> {
  const addons = await getAddons();

  if (s.kind === "new") {
    if (addons.some((a) => a.curseforgeUrl === s.curseforgeUrl))
      return "That CurseForge project is already listed.";
    const exact = s.title.toLowerCase();
    const title = normalizeTitle(s.title);
    const match =
      addons.find((a) => a.title.toLowerCase() === exact) ??
      addons.find((a) => normalizeTitle(a.title) === title);
    if (match)
      return `"${match.title}" is already listed. If it's the same addon, use "Add a CurseForge link" instead.`;
    return null;
  }

  const addon = addons.find((a) => a.slug === s.slug);
  if (!addon) return "Pick an addon from the list.";
  if (s.kind === "link") {
    if (addon.curseforgeUrl) return `"${addon.title}" already has a CurseForge link.`;
    if (addons.some((a) => a.curseforgeUrl === s.curseforgeUrl))
      return "That CurseForge link already belongs to another addon.";
  }
  return null;
}

function issueTitle(s: Submission): string {
  if (s.kind === "new") return `[New addon] ${s.title}`;
  if (s.kind === "link") return `[CurseForge link] ${s.slug}`;
  return `[Report] ${s.slug}: ${s.reason}`;
}

// Everything the user typed stays inside the JSON block, so nothing renders as
// markdown or pings anyone. The approve-submission workflow reads this block.
function issueBody(s: Submission): string {
  const json = JSON.stringify(s, null, 2).replaceAll("```", "'''");
  return [
    "Submitted through the AeroAddons form.",
    "",
    "Add the `approved` label to apply it, or close the issue to reject it.",
    "",
    "```json",
    json,
    "```",
  ].join("\n");
}

async function deliver(s: Submission): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (token && repo) {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: issueTitle(s),
        body: issueBody(s),
        labels: ["submission", s.kind],
      }),
    });
    if (!res.ok) {
      console.error("GitHub issue creation failed", res.status, await res.text());
    }
    return res.ok;
  }

  // Without GitHub configured, local development writes to a file you can inspect.
  if (process.env.NODE_ENV !== "production") {
    await appendFile(
      ".submissions.local.jsonl",
      JSON.stringify({ at: new Date().toISOString(), ...s }) + "\n",
    );
    return true;
  }
  return false;
}

export async function submitAddon(
  _prev: SubmitState,
  form: FormData,
): Promise<SubmitState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Honeypot: hidden from people, filled in by most bots.
  if (form.get("website")) {
    return { status: "success", message: "Thanks! Your submission is in the review queue." };
  }

  const startedAt = Number(form.get("startedAt"));
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "error", message: "That was quick. Please review the form and send it again." };
  }

  if (rateLimited(ip)) {
    return { status: "error", message: "Too many submissions. Please try again in a few minutes." };
  }

  const turnstileToken = String(form.get("cf-turnstile-response") ?? "");
  if (!(await passesTurnstile(turnstileToken, ip))) {
    return { status: "error", message: "The anti-spam check failed. Please try again." };
  }

  const parsed = parseSubmission(form);
  if (!parsed.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: parsed.errors };
  }

  const duplicate = await findDuplicate(parsed.submission);
  if (duplicate) return { status: "error", message: duplicate };

  if (!(await deliver(parsed.submission))) {
    return { status: "error", message: "Submissions are unavailable right now. Please try again later." };
  }

  return {
    status: "success",
    message: "Thanks! Your submission is in the review queue and will show up once it's approved.",
  };
}
