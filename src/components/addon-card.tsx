import Image from "next/image";
import type { Addon } from "@/lib/modrinth";

const compact = new Intl.NumberFormat("en", { notation: "compact" });
const date = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const primary =
  "rounded-md bg-brass px-3 py-1.5 font-medium text-brass-ink hover:opacity-90";
const secondary = "rounded-md border border-line px-3 py-1.5 hover:border-brass";

export function AddonCard({ addon }: { addon: Addon }) {
  const versions = addon.gameVersions.slice(-3).join(", ");
  const href = addon.modrinthUrl ?? addon.curseforgeUrl ?? undefined;

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-brass/60">
      <div className="flex items-start gap-3">
        {addon.iconUrl ? (
          <Image
            src={addon.iconUrl}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-lg bg-muted object-cover"
          />
        ) : (
          <div className="size-14 shrink-0 rounded-lg bg-muted" aria-hidden />
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-tight">
            <a href={href} target="_blank" rel="noreferrer" className="hover:text-brass">
              {addon.title}
            </a>
          </h3>
          <p className="text-sm text-subtle">by {addon.author}</p>
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-subtle">{addon.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {addon.categories.map((c) => (
          <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {c}
          </span>
        ))}
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-subtle">
        <div>
          <dt className="sr-only">Downloads</dt>
          <dd>
            {addon.modrinthUrl
              ? `⬇ ${compact.format(addon.downloads)} downloads`
              : "CurseForge only"}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Updated</dt>
          <dd>
            {addon.modrinthUrl ? "Updated" : "Added"}{" "}
            {date.format(new Date(addon.updatedAt))}
          </dd>
        </div>
        <div className="col-span-2 truncate">
          <dt className="sr-only">Versions and loaders</dt>
          <dd>
            {versions || "—"}
            {addon.loaders.length > 0 && ` · ${addon.loaders.join(", ")}`}
          </dd>
        </div>
      </dl>

      <div className="flex gap-2 text-sm">
        {addon.modrinthUrl && (
          <a href={addon.modrinthUrl} target="_blank" rel="noreferrer" className={primary}>
            Modrinth
          </a>
        )}
        {addon.curseforgeUrl && (
          <a
            href={addon.curseforgeUrl}
            target="_blank"
            rel="noreferrer"
            className={addon.modrinthUrl ? secondary : primary}
          >
            CurseForge
          </a>
        )}
      </div>
    </article>
  );
}
