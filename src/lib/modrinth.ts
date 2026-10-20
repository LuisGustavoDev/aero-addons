import { cacheLife } from "next/cache";
import { categorize, type Category } from "./categorize";
import { classify, type Dependencies } from "./classify";
import curseforgeLinks from "@/data/curseforge-links.json";
import approvedMentions from "@/data/approved-mentions.json";
import excluded from "@/data/excluded.json";
import manualAddons from "@/data/manual-addons.json";

const API = "https://api.modrinth.com/v2";

// Modrinth asks every client to send an identifying User-Agent.
const USER_AGENT =
  "LuisGustavoDev/aero-addons/0.1.1 (github.com/LuisGustavoDev)";

const SEARCH_QUERIES = ["aeronautics", "sable", "simulated", "create aero"];
const PAGE_SIZE = 100;
const MAX_RESULTS_PER_QUERY = 500;

type SearchHit = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  categories: string[];
  display_categories: string[];
  versions: string[];
  downloads: number;
  follows: number;
  icon_url: string | null;
  date_created: string;
  date_modified: string;
  latest_version: string | null;
  project_type: string;
};

type Version = {
  project_id: string;
  dependencies: { project_id: string | null; dependency_type: string }[];
};

export type Addon = {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  iconUrl: string | null;
  downloads: number;
  follows: number;
  createdAt: string;
  updatedAt: string;
  projectType: string;
  loaders: string[];
  gameVersions: string[];
  categories: Category[];
  requires: string[];
  modrinthUrl: string | null;
  curseforgeUrl: string | null;
};

// CurseForge-only addons approved through the submission form.
type ManualAddon = {
  slug: string;
  title: string;
  description: string;
  author: string;
  curseforgeUrl: string;
  iconUrl: string | null;
  loaders: string[];
  gameVersions: string[];
  category: Category;
  addedAt: string;
};

function fromManual(m: ManualAddon): Addon {
  return {
    id: `manual:${m.slug}`,
    slug: m.slug,
    title: m.title,
    description: m.description,
    author: m.author,
    iconUrl: m.iconUrl,
    downloads: 0,
    follows: 0,
    createdAt: m.addedAt,
    updatedAt: m.addedAt,
    projectType: m.loaders.includes("datapack") ? "datapack" : "mod",
    loaders: m.loaders,
    gameVersions: m.gameVersions,
    categories: [m.category],
    requires: ["Create Aeronautics"],
    modrinthUrl: null,
    curseforgeUrl: m.curseforgeUrl,
  };
}

const LOADERS = new Set(["neoforge", "forge", "fabric", "quilt", "datapack"]);

async function modrinth<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Modrinth ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function searchCandidates(): Promise<Map<string, SearchHit>> {
  const facets = encodeURIComponent(
    JSON.stringify([
      ["project_type:mod", "project_type:datapack", "project_type:resourcepack"],
    ]),
  );
  const hits = new Map<string, SearchHit>();

  for (const query of SEARCH_QUERIES) {
    for (let offset = 0; offset < MAX_RESULTS_PER_QUERY; offset += PAGE_SIZE) {
      const page = await modrinth<{ hits: SearchHit[]; total_hits: number }>(
        `/search?query=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}&facets=${facets}`,
      );
      for (const hit of page.hits) hits.set(hit.project_id, hit);
      if (offset + PAGE_SIZE >= page.total_hits) break;
    }
  }
  return hits;
}

async function dependenciesByProject(
  versionIds: string[],
): Promise<Map<string, Dependencies>> {
  const deps = new Map<string, Dependencies>();
  for (let i = 0; i < versionIds.length; i += PAGE_SIZE) {
    const ids = encodeURIComponent(
      JSON.stringify(versionIds.slice(i, i + PAGE_SIZE)),
    );
    const versions = await modrinth<Version[]>(`/versions?ids=${ids}`);
    for (const v of versions) {
      const entry: Dependencies = { required: new Set(), optional: new Set() };
      for (const d of v.dependencies) {
        if (!d.project_id) continue;
        if (d.dependency_type === "required" || d.dependency_type === "embedded") {
          entry.required.add(d.project_id);
        } else if (d.dependency_type === "optional") {
          entry.optional.add(d.project_id);
        }
      }
      deps.set(v.project_id, entry);
    }
  }
  return deps;
}

function toAddon(hit: SearchHit, requires: string[]): Addon {
  const links = curseforgeLinks as Record<string, string>;
  return {
    id: hit.project_id,
    slug: hit.slug,
    title: hit.title,
    description: hit.description,
    author: hit.author,
    iconUrl: hit.icon_url || null,
    downloads: hit.downloads,
    follows: hit.follows,
    createdAt: hit.date_created,
    updatedAt: hit.date_modified,
    projectType: hit.categories.includes("datapack")
      ? "datapack"
      : hit.project_type,
    loaders: hit.categories.filter((c) => LOADERS.has(c)),
    gameVersions: hit.versions,
    categories: categorize(hit),
    requires,
    modrinthUrl: `https://modrinth.com/${hit.project_type}/${hit.slug}`,
    curseforgeUrl: links[hit.slug] ?? null,
  };
}

export type Catalog = {
  addons: Addon[];
  // Mention-only or optional-dependency projects nobody has reviewed yet.
  pending: Addon[];
};

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("hours");

  const candidates = await searchCandidates();
  const versionIds = [...candidates.values()]
    .map((h) => h.latest_version)
    .filter((id): id is string => Boolean(id));
  const deps = await dependenciesByProject(versionIds);

  const lists = {
    excluded: new Set<string>(excluded),
    approved: new Set<string>(approvedMentions),
  };
  const addons: Addon[] = [];
  const pending: Addon[] = [];

  for (const hit of candidates.values()) {
    const result = classify(
      { id: hit.project_id, slug: hit.slug, title: hit.title, description: hit.description },
      deps.get(hit.project_id),
      lists,
    );
    if (result.status === "skipped") continue;
    (result.status === "listed" ? addons : pending).push(toAddon(hit, result.requires));
  }
  addons.push(...(manualAddons as ManualAddon[]).map(fromManual));

  const byDownloads = (a: Addon, b: Addon) => b.downloads - a.downloads;
  return { addons: addons.sort(byDownloads), pending: pending.sort(byDownloads) };
}

export async function getAddons(): Promise<Addon[]> {
  return (await getCatalog()).addons;
}
