import type { Metadata } from "next";
import { SubmitForm } from "@/components/submit-form";
import { getAddons } from "@/lib/modrinth";

export const metadata: Metadata = {
  title: "Submit an addon — AeroAddons",
};

export default async function SubmitPage() {
  const addons = (await getAddons())
    .map((a) => ({ slug: a.slug, title: a.title }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Submit an addon</h1>
        <p className="text-subtle">
          Addons published on Modrinth are found automatically within an hour.
          Use this form for CurseForge-only addons, missing CurseForge links or
          anything that looks wrong. Every submission is reviewed before it
          goes live.
        </p>
      </header>
      <SubmitForm
        addons={addons}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
      />
    </main>
  );
}
