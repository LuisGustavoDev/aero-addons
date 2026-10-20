// Decides whether a Modrinth project belongs in the directory.
// Kept free of network and Next.js imports so the rules can be unit tested.

// A project whose latest version *requires* one of these is listed automatically.
export const PARENT_PROJECTS: Record<string, string> = {
  oWaK0Q19: "Create Aeronautics",
  T9PomCSv: "Sable",
};

// Projects that only mention a parent, or depend on it optionally, may just be
// standalone mods with some compatibility. They wait in the review queue
// (/review in development) until their slug goes into approved-mentions.json
// or excluded.json.
const PARENT_MENTIONS: [RegExp, string][] = [
  [/aeronautics|create[: ]+simulated|simulated[- ]project/i, "Create Aeronautics"],
  [/\bsable\b/i, "Sable"],
];

export type Dependencies = { required: Set<string>; optional: Set<string> };

export type Classification =
  | { status: "listed" | "pending"; requires: string[] }
  | { status: "skipped" };

const parentNames = (ids: Set<string>) =>
  Object.entries(PARENT_PROJECTS)
    .filter(([id]) => ids.has(id))
    .map(([, name]) => name);

export function classify(
  project: { id: string; slug: string; title: string; description: string },
  deps: Dependencies | undefined,
  lists: { excluded: Set<string>; approved: Set<string> },
): Classification {
  if (project.id in PARENT_PROJECTS || lists.excluded.has(project.slug)) {
    return { status: "skipped" };
  }

  const required = parentNames(deps?.required ?? new Set());
  if (required.length > 0) return { status: "listed", requires: required };

  const text = `${project.title} ${project.description}`;
  const loose = new Set([
    ...parentNames(deps?.optional ?? new Set()),
    ...PARENT_MENTIONS.filter(([re]) => re.test(text)).map(([, name]) => name),
  ]);
  if (loose.size === 0) return { status: "skipped" };

  return {
    status: lists.approved.has(project.slug) ? "listed" : "pending",
    requires: [...loose],
  };
}
