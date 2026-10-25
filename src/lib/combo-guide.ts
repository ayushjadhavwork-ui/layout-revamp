import { CATALOG, COMBO_RECIPES, POCKET_TEMPLATE_LIMIT, type Category } from "./catalog";
import type { ComboCartEntry, ComboIssue, ComboSection } from "./combo-validation";

// Guided Combo Mode: while a combo is active, the page shows only the
// sections that combo needs, and a progress bar walks the customer through
// the choices it leaves to them. Both are derived from comboCheckoutIssues,
// so "complete" here always agrees with the checkout gate.

export type ComboStep = { section: ComboSection; label: string; done: boolean };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// The choices a combo leaves to the customer, in page order. A step is done
// once checkout has nothing left to say about its section.
export function comboSteps(comboId: string, issues: ComboIssue[]): ComboStep[] {
  const recipe = COMBO_RECIPES[comboId];
  if (!recipe) return [];
  const pending = new Set(issues.map((issue) => issue.section));
  const steps: ComboStep[] = [];
  const add = (section: ComboSection, label: string) => steps.push({ section, label, done: !pending.has(section) });

  if (recipe.sizeId) {
    const limit = CATALOG.sizes.find((size) => size.id === recipe.sizeId)?.templateLimit ?? 0;
    add("templates", `Pick ${plural(limit, "magazine template")}`);
  }
  if (recipe.pocketCount) add("pocket", `Pick ${plural(POCKET_TEMPLATE_LIMIT, "Pocket Magazine template")}`);
  if (recipe.memoryCardCount) add("memory-card", `Pick ${plural(recipe.memoryCardCount, "Photo Card design")}`);
  if (recipe.friendshipCount) {
    add("friendship-card", recipe.friendshipCount === 2 ? "Pick Duo Card + 2 designs" : "Pick Single Card + design");
  }
  if (recipe.stripCount) add("strips", `Pick ${plural(recipe.stripCount, "Polaroid Strip")}`);
  return steps;
}

// What the customer should do next: the first unfinished step, or failing
// that the first remaining checkout issue (e.g. an included item to restore).
export function nextComboAction(steps: ComboStep[], issues: ComboIssue[]): { section: ComboSection; label: string } | null {
  const step = steps.find((s) => !s.done);
  if (step) return step;
  const issue = issues[0];
  return issue ? { section: issue.section, label: issue.message } : null;
}

// Sections Guided Combo Mode can hide. "combos", "extras" (it holds
// Delivery) and checkout are always shown.
export type GuidedSection = "build" | "templates" | "pocket" | "newspaper" | "memory-card" | "friendship-card" | "sticker-book" | "it-polaroids" | "addons" | "packs" | "strips";

const SECTION_CATEGORIES: Record<GuidedSection, Category[]> = {
  build: [],
  templates: ["templates"],
  pocket: ["pocket", "pocket-templates"],
  newspaper: ["newspaper"],
  "memory-card": ["memory-card", "memory-card-designs"],
  "friendship-card": ["friendship", "friendship-designs"],
  "sticker-book": ["sticker-book"],
  "it-polaroids": ["it-polaroids"],
  addons: ["addons"],
  packs: ["polaroids"],
  strips: ["strips"],
};

// A section stays visible when the combo includes it, when a checkout issue
// points at it (so "Complete my order" can always scroll there), or when the
// cart already holds something from it (a paid extra picked while showing
// all products). THE IT POLAROIDS is always shown: it's the top-up for
// photos a combo can't hold, which the Keepsake Matchmaker points customers
// to right after it loads a combo.
export function guidedVisibleSections(comboId: string, issues: ComboIssue[], cart: ComboCartEntry[]): Set<GuidedSection> {
  const recipe = COMBO_RECIPES[comboId] ?? {};
  const visible = new Set<GuidedSection>(["it-polaroids"]);
  if (recipe.sizeId) visible.add("templates");
  if (recipe.pocketCount) visible.add("pocket");
  if (recipe.newspaper) visible.add("newspaper");
  if (recipe.memoryCardCount) visible.add("memory-card");
  if (recipe.friendshipCount) visible.add("friendship-card");
  if (recipe.addonIds?.length) visible.add("addons");
  if (recipe.polaroidId) visible.add("packs");
  if (recipe.stripCount) visible.add("strips");

  for (const issue of issues) {
    if (issue.section === "extras") {
      visible.add("addons");
      visible.add("packs");
    } else if (issue.section !== "combos") {
      visible.add(issue.section);
    }
  }
  for (const [section, categories] of Object.entries(SECTION_CATEGORIES) as [GuidedSection, Category[]][]) {
    if (cart.some((item) => categories.includes(item.category))) visible.add(section);
  }
  return visible;
}
