import { AddonBrowser } from "@/components/addon-browser";
import { getAddons } from "@/lib/modrinth";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

export default async function Home() {
  const addons = await getAddons();
  const totalDownloads = addons.reduce((sum, a) => sum + a.downloads, 0);
  const authors = new Set(addons.map((a) => a.author)).size;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-medium uppercase tracking-widest text-brass">
          Community directory
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Every addon for Create Aeronautics, in one place.
        </h1>
        <p className="max-w-2xl text-lg text-subtle">
          Airships, planes, cars, submarines, compatibility patches and more.
          Found automatically from Modrinth and refreshed every hour.
        </p>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-2">
          <Stat label="addons" value={addons.length.toString()} />
          <Stat label="total downloads" value={compact.format(totalDownloads)} />
          <Stat label="authors" value={authors.toString()} />
        </dl>
      </header>

      <AddonBrowser addons={addons} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dd className="text-2xl font-semibold">{value}</dd>
      <dt className="text-subtle">{label}</dt>
    </div>
  );
}
