"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, type Category } from "@/lib/categorize";
import type { Addon } from "@/lib/modrinth";
import { AddonCard } from "./addon-card";

type Sort = "downloads" | "updated" | "newest" | "follows";

const SORTS: { value: Sort; label: string }[] = [
  { value: "downloads", label: "Most downloaded" },
  { value: "updated", label: "Recently updated" },
  { value: "newest", label: "Newest" },
  { value: "follows", label: "Most followed" },
];

const LOADER_LABELS: Record<string, string> = {
  neoforge: "NeoForge",
  forge: "Forge",
  fabric: "Fabric",
  quilt: "Quilt",
  datapack: "Datapack",
};

const PAGE = 48;

export function AddonBrowser({ addons }: { addons: Addon[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [loader, setLoader] = useState("");
  const [version, setVersion] = useState("");
  const [sort, setSort] = useState<Sort>("downloads");
  const [limit, setLimit] = useState(PAGE);

  const loaders = useMemo(
    () => [...new Set(addons.flatMap((a) => a.loaders))].sort(),
    [addons],
  );
  const versions = useMemo(
    () =>
      [...new Set(addons.flatMap((a) => a.gameVersions))].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true }),
      ),
    [addons],
  );
  const counts = useMemo(() => {
    const map = new Map<Category, number>();
    for (const a of addons)
      for (const c of a.categories) map.set(c, (map.get(c) ?? 0) + 1);
    return map;
  }, [addons]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = addons.filter(
      (a) =>
        (!q ||
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q)) &&
        (!category || a.categories.includes(category)) &&
        (!loader || a.loaders.includes(loader)) &&
        (!version || a.gameVersions.includes(version)),
    );
    const by: Record<Sort, (a: Addon, b: Addon) => number> = {
      downloads: (a, b) => b.downloads - a.downloads,
      follows: (a, b) => b.follows - a.follows,
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    };
    return filtered.sort(by[sort]);
  }, [addons, query, category, loader, version, sort]);

  const resetLimit = () => setLimit(PAGE);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            resetLimit();
          }}
          placeholder="Search addons, features or authors…"
          aria-label="Search addons"
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 outline-none focus:border-brass"
        />
        <div className="grid grid-cols-2 gap-2 md:flex">
          <select
            value={loader}
            onChange={(e) => {
              setLoader(e.target.value);
              resetLimit();
            }}
            aria-label="Loader"
            className="rounded-lg border border-line bg-surface px-3 py-2.5"
          >
            <option value="">Any loader</option>
            {loaders.map((l) => (
              <option key={l} value={l}>
                {LOADER_LABELS[l] ?? l}
              </option>
            ))}
          </select>
          <select
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              resetLimit();
            }}
            aria-label="Minecraft version"
            className="rounded-lg border border-line bg-surface px-3 py-2.5"
          >
            <option value="">Any version</option>
            {versions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort by"
            className="col-span-2 rounded-lg border border-line bg-surface px-3 py-2.5"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
        <CategoryChip
          active={category === null}
          onClick={() => {
            setCategory(null);
            resetLimit();
          }}
        >
          All <span className="text-subtle">{addons.length}</span>
        </CategoryChip>
        {CATEGORIES.filter((c) => counts.has(c)).map((c) => (
          <CategoryChip
            key={c}
            active={category === c}
            onClick={() => {
              setCategory(category === c ? null : c);
              resetLimit();
            }}
          >
            {c} <span className="text-subtle">{counts.get(c)}</span>
          </CategoryChip>
        ))}
      </div>

      <p className="text-sm text-subtle" aria-live="polite">
        {results.length} addon{results.length === 1 ? "" : "s"}
      </p>

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-subtle">
          No addons match these filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.slice(0, limit).map((a) => (
            <AddonCard key={a.id} addon={a} />
          ))}
        </div>
      )}

      {results.length > limit && (
        <button
          type="button"
          onClick={() => setLimit(limit + PAGE)}
          className="mx-auto rounded-lg border border-line px-5 py-2 hover:border-brass"
        >
          Show more ({results.length - limit} left)
        </button>
      )}
    </section>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-brass bg-brass/15 text-fg"
          : "border-line hover:border-brass/60"
      }`}
    >
      {children}
    </button>
  );
}
