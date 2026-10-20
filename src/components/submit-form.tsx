"use client";

import Script from "next/script";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}
import { submitAddon, type SubmitState } from "@/app/submit/actions";
import { CATEGORIES } from "@/lib/categorize";
import {
  REPORT_REASONS,
  SUBMIT_LOADERS,
  type SubmissionKind,
} from "@/lib/submission";

type Option = { slug: string; title: string };

const KINDS: { value: SubmissionKind; label: string; hint: string }[] = [
  {
    value: "new",
    label: "Add a CurseForge-only addon",
    hint: "Addons on Modrinth show up automatically. Use this for addons published only on CurseForge.",
  },
  {
    value: "link",
    label: "Add a CurseForge link",
    hint: "The addon is already listed but its card has no CurseForge button.",
  },
  {
    value: "report",
    label: "Report a problem",
    hint: "Wrong category, not really an addon, or outdated info.",
  },
];

const LOADER_LABELS: Record<string, string> = {
  neoforge: "NeoForge",
  forge: "Forge",
  fabric: "Fabric",
  datapack: "Datapack",
};

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-brass aria-[invalid=true]:border-red-500";

const initial: SubmitState = { status: "idle" };

export function SubmitForm({
  addons,
  turnstileSiteKey,
}: {
  addons: Option[];
  turnstileSiteKey: string | null;
}) {
  const [attempt, setAttempt] = useState(0);
  return (
    <FormBody
      key={attempt}
      addons={addons}
      turnstileSiteKey={turnstileSiteKey}
      onReset={() => setAttempt(attempt + 1)}
    />
  );
}

function FormBody({
  addons,
  turnstileSiteKey,
  onReset,
}: {
  addons: Option[];
  turnstileSiteKey: string | null;
  onReset: () => void;
}) {
  const [state, action, pending] = useActionState(submitAddon, initial);
  const [kind, setKind] = useState<SubmissionKind>("new");
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const startedAt = useRef(0);

  // Stamped on the client after mount; the page itself is prerendered.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Turnstile tokens are single-use, so a rejected attempt needs a fresh one.
  useEffect(() => {
    if (state.status === "error") window.turnstile?.reset();
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-brass/60 bg-surface p-6">
        <p role="status">{state.message}</p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-line px-4 py-2 hover:border-brass"
        >
          Send another
        </button>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const err = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="text-sm text-red-500">
        {errors[name]}
      </p>
    ) : null;
  const invalid = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form
      // Dispatching manually skips React's automatic form reset, so a failed
      // validation keeps what the person typed.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        data.set("startedAt", String(startedAt.current));
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-6"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">What do you want to do?</legend>
        {KINDS.map((k) => (
          <label
            key={k.value}
            className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 has-[:checked]:border-brass"
          >
            <input
              type="radio"
              name="kind"
              value={k.value}
              checked={kind === k.value}
              onChange={() => setKind(k.value)}
              className="mt-1 accent-[var(--brass)]"
            />
            <span>
              <span className="font-medium">{k.label}</span>
              <span className="block text-sm text-subtle">{k.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {kind === "new" && (
        <>
          <Field label="Addon name" name="title" error={err("title")}>
            <input id="title" name="title" maxLength={80} required className={input} {...invalid("title")} />
          </Field>
          <Field label="CurseForge page" name="curseforgeUrl" error={err("curseforgeUrl")}>
            <input
              id="curseforgeUrl"
              name="curseforgeUrl"
              type="url"
              required
              placeholder="https://www.curseforge.com/minecraft/mc-mods/your-addon"
              className={input}
              {...invalid("curseforgeUrl")}
            />
          </Field>
          <Field label="Short description" name="description" error={err("description")}>
            <textarea
              id="description"
              name="description"
              maxLength={200}
              rows={3}
              required
              className={input}
              {...invalid("description")}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Author" name="author" error={err("author")}>
              <input id="author" name="author" maxLength={60} required className={input} {...invalid("author")} />
            </Field>
            <Field label="Category" name="category" error={err("category")}>
              <select id="category" name="category" required className={input} {...invalid("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <fieldset className="flex flex-col gap-2" {...invalid("loaders")}>
            <legend className="mb-1 font-medium">Loaders</legend>
            <div className="flex flex-wrap gap-4">
              {SUBMIT_LOADERS.map((l) => (
                <label key={l} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="loaders"
                    value={l}
                    defaultChecked={l === "neoforge"}
                    className="accent-[var(--brass)]"
                  />
                  {LOADER_LABELS[l]}
                </label>
              ))}
            </div>
            {err("loaders")}
          </fieldset>
          <Field
            label="Minecraft versions"
            name="gameVersions"
            hint="Separate with commas."
            error={err("gameVersions")}
          >
            <input
              id="gameVersions"
              name="gameVersions"
              defaultValue="1.21.1"
              required
              className={input}
              {...invalid("gameVersions")}
            />
          </Field>
          <Field
            label="Icon URL (optional)"
            name="iconUrl"
            hint="Right-click the icon on CurseForge and copy the image address."
            error={err("iconUrl")}
          >
            <input
              id="iconUrl"
              name="iconUrl"
              type="url"
              placeholder="https://media.forgecdn.net/avatars/…"
              className={input}
              {...invalid("iconUrl")}
            />
          </Field>
        </>
      )}

      {(kind === "link" || kind === "report") && (
        <Field label="Addon" name="slug" error={err("slug")}>
          <select id="slug" name="slug" required defaultValue="" className={input} {...invalid("slug")}>
            <option value="" disabled>
              Choose an addon…
            </option>
            {addons.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      {kind === "link" && (
        <Field label="CurseForge page" name="curseforgeUrl" error={err("curseforgeUrl")}>
          <input
            id="curseforgeUrl"
            name="curseforgeUrl"
            type="url"
            required
            placeholder="https://www.curseforge.com/minecraft/mc-mods/your-addon"
            className={input}
            {...invalid("curseforgeUrl")}
          />
        </Field>
      )}

      {kind === "report" && (
        <>
          <Field label="What's wrong?" name="reason" error={err("reason")}>
            <select
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={input}
              {...invalid("reason")}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          {reason === "Wrong category" && (
            <Field label="It should be in" name="suggestedCategory" error={err("suggestedCategory")}>
              <select id="suggestedCategory" name="suggestedCategory" className={input} {...invalid("suggestedCategory")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          )}
          <Field
            label={reason === "Wrong category" ? "Details (optional)" : "Details"}
            name="details"
            error={err("details")}
          >
            <textarea id="details" name="details" maxLength={500} rows={4} className={input} {...invalid("details")} />
          </Field>
        </>
      )}

      <Field
        label="Discord username (optional)"
        name="discord"
        hint="Only if we may need to ask you something. It appears in the public review queue."
      >
        <input id="discord" name="discord" maxLength={40} className={input} />
      </Field>

      {/* Honeypot: invisible to people, bots tend to fill it in. */}
      <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
        </>
      )}

      {state.status === "error" && (
        <p role="alert" className="rounded-lg border border-red-500/60 p-3 text-sm">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-brass px-5 py-2.5 font-medium text-brass-ink hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send for review"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-medium">
        {label}
      </label>
      {hint && <p className="text-sm text-subtle">{hint}</p>}
      {children}
      {error}
    </div>
  );
}
