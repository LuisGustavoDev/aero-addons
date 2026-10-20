import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — AeroAddons",
};

export default function About() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight">About AeroAddons</h1>

      <p>
        Addons for Create Aeronautics are scattered across showcase threads that
        close after a day. AeroAddons keeps them all in one searchable list.
      </p>

      <h2 className="text-xl font-semibold">How addons are found</h2>
      <p>
        Every hour the site searches Modrinth and keeps each project whose
        latest version requires <strong>Create Aeronautics</strong> or{" "}
        <strong>Sable</strong>. Projects that only mention them (plenty of
        addons never declare their dependencies, but so do standalone mods with
        a bit of compatibility) are reviewed by hand before they appear.
        Categories are assigned automatically from the title and description,
        so a few may be off.
      </p>

      <h2 className="text-xl font-semibold">CurseForge</h2>
      <p>
        CurseForge&apos;s API terms don&apos;t allow caching its data, so the
        site doesn&apos;t read from it. When an addon is also published on
        CurseForge, its card links straight to that page instead. Addons that
        only exist on CurseForge can be added through the{" "}
        <Link href="/submit" className="underline hover:text-brass">
          submission form
        </Link>
        .
      </p>

      <h2 className="text-xl font-semibold">Disclaimer</h2>
      <p className="text-subtle">
        This is an unofficial fan project. It isn&apos;t affiliated with the
        Create team, the Simulated team, Modrinth or CurseForge. All addons
        belong to their authors.
      </p>
    </main>
  );
}
