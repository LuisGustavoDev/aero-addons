import { CATEGORIES, type Category } from "./categorize";

export const SUBMISSION_KINDS = ["new", "link", "report"] as const;
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

export const REPORT_REASONS = [
  "Wrong category",
  "Not an Aeronautics/Sable addon",
  "Broken or outdated info",
  "Other",
] as const;

export const SUBMIT_LOADERS = ["neoforge", "forge", "fabric", "datapack"] as const;

export type NewAddonSubmission = {
  kind: "new";
  title: string;
  curseforgeUrl: string;
  description: string;
  author: string;
  loaders: string[];
  gameVersions: string[];
  category: Category;
  iconUrl: string | null;
  discord: string | null;
};

export type LinkSubmission = {
  kind: "link";
  slug: string;
  curseforgeUrl: string;
  discord: string | null;
};

export type ReportSubmission = {
  kind: "report";
  slug: string;
  reason: (typeof REPORT_REASONS)[number];
  suggestedCategory: Category | null;
  details: string;
  discord: string | null;
};

export type Submission = NewAddonSubmission | LinkSubmission | ReportSubmission;

export type FieldErrors = Partial<Record<string, string>>;

const CURSEFORGE_URL =
  /^https:\/\/(?:www\.)?curseforge\.com\/minecraft\/(mc-mods|data-packs|texture-packs)\/([a-z0-9-]+)\/?$/i;
const ICON_HOSTS = new Set(["cdn.modrinth.com", "media.forgecdn.net"]);
const GAME_VERSION = /^\d+\.\d+(\.\d+)?$/;

export function normalizeCurseforgeUrl(raw: string): string | null {
  const match = raw.trim().match(CURSEFORGE_URL);
  if (!match) return null;
  return `https://www.curseforge.com/minecraft/${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
}

export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Strips control characters and caps length so nothing odd ends up in the review issue.
function text(form: FormData, name: string, max: number): string {
  const value = form.get(name);
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function parseSubmission(
  form: FormData,
): { ok: true; submission: Submission } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const kind = text(form, "kind", 10) as SubmissionKind;
  const discord = text(form, "discord", 40) || null;

  if (!SUBMISSION_KINDS.includes(kind)) {
    return { ok: false, errors: { kind: "Choose what you want to do." } };
  }

  if (kind === "new") {
    const title = text(form, "title", 80);
    const curseforgeUrl = normalizeCurseforgeUrl(text(form, "curseforgeUrl", 200));
    const description = text(form, "description", 200);
    const author = text(form, "author", 60);
    const loaders = form
      .getAll("loaders")
      .filter((l): l is string => typeof l === "string")
      .filter((l) => (SUBMIT_LOADERS as readonly string[]).includes(l));
    const gameVersions = text(form, "gameVersions", 100)
      .split(/[\s,]+/)
      .filter(Boolean);
    const category = text(form, "category", 40) as Category;
    const iconRaw = text(form, "iconUrl", 300);

    if (title.length < 3) errors.title = "Enter the addon's name.";
    if (!curseforgeUrl)
      errors.curseforgeUrl =
        "Use the project page link, like https://www.curseforge.com/minecraft/mc-mods/your-addon";
    if (description.length < 10) errors.description = "Write at least a short sentence.";
    if (author.length < 2) errors.author = "Enter the author's name.";
    if (loaders.length === 0) errors.loaders = "Pick at least one loader.";
    if (gameVersions.length === 0 || !gameVersions.every((v) => GAME_VERSION.test(v)))
      errors.gameVersions = "List versions like 1.21.1, separated by commas.";
    if (!CATEGORIES.includes(category)) errors.category = "Pick a category.";

    let iconUrl: string | null = null;
    if (iconRaw) {
      try {
        const url = new URL(iconRaw);
        if (url.protocol !== "https:" || !ICON_HOSTS.has(url.hostname)) throw new Error();
        iconUrl = url.toString();
      } catch {
        errors.iconUrl = "Icons must be hosted on media.forgecdn.net or cdn.modrinth.com.";
      }
    }

    if (Object.keys(errors).length > 0) return { ok: false, errors };
    return {
      ok: true,
      submission: {
        kind,
        title,
        curseforgeUrl: curseforgeUrl!,
        description,
        author,
        loaders,
        gameVersions,
        category,
        iconUrl,
        discord,
      },
    };
  }

  const slug = text(form, "slug", 100);
  if (!slug) errors.slug = "Pick an addon from the list.";

  if (kind === "link") {
    const curseforgeUrl = normalizeCurseforgeUrl(text(form, "curseforgeUrl", 200));
    if (!curseforgeUrl)
      errors.curseforgeUrl =
        "Use the project page link, like https://www.curseforge.com/minecraft/mc-mods/your-addon";
    if (Object.keys(errors).length > 0) return { ok: false, errors };
    return { ok: true, submission: { kind, slug, curseforgeUrl: curseforgeUrl!, discord } };
  }

  const reason = text(form, "reason", 60) as ReportSubmission["reason"];
  const suggested = text(form, "suggestedCategory", 40);
  const details = text(form, "details", 500);
  if (!REPORT_REASONS.includes(reason)) errors.reason = "Pick a reason.";
  if (reason === "Wrong category" && !CATEGORIES.includes(suggested as Category))
    errors.suggestedCategory = "Pick the category it should be in.";
  if (reason !== "Wrong category" && details.length < 10)
    errors.details = "Tell us a bit more.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    submission: {
      kind,
      slug,
      reason,
      suggestedCategory: CATEGORIES.includes(suggested as Category)
        ? (suggested as Category)
        : null,
      details,
      discord,
    },
  };
}
