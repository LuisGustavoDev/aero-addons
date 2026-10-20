import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/modrinth";

export const metadata: Metadata = {
  title: "Review queue — AeroAddons",
  robots: { index: false },
};

const compact = new Intl.NumberFormat("en", { notation: "compact" });

// Local-only tool: lists projects that mention Aeronautics/Sable without
// requiring it, so a person decides whether they belong in the directory.
export default async function ReviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { pending } = await getCatalog();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Review queue</h1>
        <p className="text-subtle">
          These projects mention Create Aeronautics or Sable but don&apos;t
          require them, so they stay hidden until reviewed. Add the slug to{" "}
          <code>src/data/approved-mentions.json</code> if it&apos;s a real
          addon, or to <code>src/data/excluded.json</code> if it&apos;s a
          standalone mod.
        </p>
      </header>

      {pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-subtle">
          Nothing to review.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a
                  href={a.modrinthUrl ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold hover:text-brass"
                >
                  {a.title}
                </a>
                <span className="text-sm text-subtle">
                  by {a.author} · {compact.format(a.downloads)} downloads
                </span>
              </div>
              <p className="text-sm text-subtle">{a.description}</p>
              <code className="self-start rounded bg-muted px-2 py-0.5 text-xs">{a.slug}</code>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
