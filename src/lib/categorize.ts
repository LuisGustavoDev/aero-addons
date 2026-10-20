export const CATEGORIES = [
  "Compatibility",
  "Vehicles & Parts",
  "Combat",
  "Quality of Life",
  "Visuals & Sound",
  "World & Adventure",
  "Translations",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

type Rule = { category: Category; pattern: RegExp; modrinth?: string[] };

const TRANSLATION =
  /translat|language pack|locali[sz]ation|русиф|перевод|日本語|türkçe|en français/i;

// Checked against title + description; Modrinth's own tags back the keywords up.
const RULES: Rule[] = [
  {
    category: "Compatibility",
    pattern: /\b(compat\w*|patch|fix(es)?|integration|bridge|support for)\b/i,
  },
  {
    category: "Combat",
    pattern: /\b(cannon|weapon|gun|missile|bomb|armou?r|warfare|tacz|turret|torpedo|radar)\b/i,
  },
  {
    category: "Vehicles & Parts",
    pattern:
      /\b(propeller|wheel|engine|thruster|track|bearing|rotor|jet|wing|flap|gyro\w*|steering|throttle|joystick|ballast|transmission|suspension|submarine|boat|plane|car|vehicle)s?\b/i,
    modrinth: ["transportation", "technology"],
  },
  {
    category: "Visuals & Sound",
    pattern: /\b(sound|audio|render\w*|shader|blur|light\w*|camera|texture|pbr|particle|visual)s?\b/i,
  },
  {
    category: "World & Adventure",
    pattern: /\b(worldgen|structure|dimension|space|planet|biome|hangar|quest|ambush)s?\b/i,
    modrinth: ["worldgen", "adventure"],
  },
  {
    category: "Quality of Life",
    pattern: /\b(quality[- ]of[- ]life|qol|tweak|utility|tool|hud|tooltip|config\w*)s?\b/i,
    modrinth: ["utility", "management"],
  },
];

export function categorize(project: {
  title: string;
  description: string;
  categories: string[];
  project_type: string;
}): Category[] {
  const text = `${project.title} ${project.description}`;
  const found = new Set<Category>();

  // Language packs would otherwise land in "Visuals & Sound" as resource packs.
  if (TRANSLATION.test(text) || project.categories.includes("locale")) {
    return ["Translations"];
  }
  if (project.project_type === "resourcepack") found.add("Visuals & Sound");

  for (const rule of RULES) {
    if (rule.pattern.test(text)) found.add(rule.category);
  }
  // Fall back to Modrinth tags only when the text gave us nothing.
  if (found.size === 0) {
    for (const rule of RULES) {
      if (rule.modrinth?.some((tag) => project.categories.includes(tag))) {
        found.add(rule.category);
      }
    }
  }
  if (found.size === 0) found.add("Other");

  return CATEGORIES.filter((c) => found.has(c));
}
