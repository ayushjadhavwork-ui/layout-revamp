import { CATALOG, COMBO_RECIPES, POCKET_TEMPLATE_LIMIT, type Category } from "./catalog";

export type ComboCartEntry = {
  category: Category;
  id: string;
  name: string;
  comboId?: string;
  unit?: string;
};

export type ComboSelection = {
  cart: ComboCartEntry[];
  stripSelections: string[];
  selectedFriendshipId: string | null;
  selectedFriendshipDesignIds: string[];
  selectedMemoryCardDesignIds: string[];
  // Template picks are optional so callers that only care about the
  // product/design side of a combo can leave them out.
  selectedTemplateIds?: string[];
  pocketUnits?: { uid: string; templateIds: string[] }[];
};

// Page anchor (see routes/index.tsx) where the customer fixes an issue, so
// checkout can scroll straight to it.
export type ComboSection = "combos" | "build" | "templates" | "pocket" | "newspaper" | "memory-card" | "friendship-card" | "extras" | "strips";

export type ComboIssue = { message: string; section: ComboSection };

function quantityInName(name: string): number {
  const match = name.match(/×\s*(\d+)/);
  return match ? Number(match[1]) : 1;
}

function linkedCount(cart: ComboCartEntry[], comboId: string, category: Category): number {
  return cart
    .filter((item) => item.comboId === comboId && item.category === category)
    .reduce((sum, item) => sum + quantityInName(item.name), 0);
}

// Everything a combo includes that is still missing, in page order, each with
// the section the customer has to visit. Checkout is blocked while any remain.
export function comboCheckoutIssues(comboId: string, selection: ComboSelection): ComboIssue[] {
  const recipe = COMBO_RECIPES[comboId];
  if (!recipe) return [{ message: "This combo has no recipe configured. Please choose a different combo.", section: "combos" }];

  const linked = selection.cart.filter((item) => item.comboId === comboId);
  const issues: ComboIssue[] = [];
  const push = (section: ComboSection, message: string) => issues.push({ message, section });
  const hasLinked = (category: Category, id: string) => linked.some((item) => item.category === category && item.id === id);

  if (recipe.sizeId && !hasLinked("sizes", recipe.sizeId)) push("build", "Choose the magazine included in your combo.");
  if (recipe.newspaper && !linked.some((item) => item.category === "newspaper")) push("newspaper", "Choose the Newspaper Magazine included in your combo.");
  if ((recipe.pocketCount ?? 0) > linked.filter((item) => item.category === "pocket").length) push("pocket", "Restore every Pocket Magazine included in your combo.");

  if (recipe.sizeId && selection.selectedTemplateIds) {
    const limit = CATALOG.sizes.find((size) => size.id === recipe.sizeId)?.templateLimit ?? 0;
    const picked = selection.selectedTemplateIds.length;
    if (picked < limit) push("templates", `Please pick all ${limit} magazine templates (${picked}/${limit} selected).`);
  }
  if (selection.pocketUnits) {
    const comboUnits = new Set(linked.filter((item) => item.category === "pocket").map((item) => item.unit));
    selection.pocketUnits
      .filter((unit) => comboUnits.has(unit.uid) && unit.templateIds.length < POCKET_TEMPLATE_LIMIT)
      .forEach((unit) => push("pocket", `Please pick all ${POCKET_TEMPLATE_LIMIT} Pocket Magazine templates (${unit.templateIds.length}/${POCKET_TEMPLATE_LIMIT} selected).`));
  }

  for (const addonId of recipe.addonIds ?? []) {
    if (!hasLinked("addons", addonId)) {
      const addon = CATALOG.addons.find((item) => item.id === addonId);
      push("extras", `Restore ${addon?.name ?? "an add-on"}, included in your combo.`);
    }
  }
  if (recipe.polaroidId && !hasLinked("polaroids", recipe.polaroidId)) {
    const pack = CATALOG.polaroids.find((item) => item.id === recipe.polaroidId);
    push("extras", `Restore ${pack?.name ?? "the Polaroid pack"}, included in your combo.`);
  }
  if (recipe.freePostcard && !linked.some((item) => item.category === "promotions" && item.id === "promo-postcard")) {
    push("combos", "Restore the free Postcard included in your combo.");
  }

  const expectedStrips = recipe.stripCount ?? 0;
  if (selection.stripSelections.length !== expectedStrips || linkedCount(selection.cart, comboId, "strips") !== expectedStrips) {
    if (expectedStrips > 0) push("strips", `Choose ${expectedStrips} Polaroid Strip${expectedStrips === 1 ? "" : "s"} for your combo.`);
  }

  const expectedFriendship = recipe.friendshipCount ?? 0;
  if (expectedFriendship > 0) {
    const requiredTier = expectedFriendship === 1 ? "friend-single" : "friend-duo";
    const tierPresent = selection.selectedFriendshipId === requiredTier && hasLinked("friendship", requiredTier);
    const selectedDesigns = selection.selectedFriendshipDesignIds.length;
    const cartDesigns = linkedCount(selection.cart, comboId, "friendship-designs");
    if (!tierPresent || selectedDesigns !== expectedFriendship || cartDesigns !== expectedFriendship) {
      push("friendship-card", `Choose the ${expectedFriendship === 1 ? "Single Card" : "Duo Card"} and ${expectedFriendship} design${expectedFriendship === 1 ? "" : "s"} included in your combo.`);
    }
  }

  const expectedMemoryCards = recipe.memoryCardCount ?? 0;
  if (expectedMemoryCards > 0) {
    const selectedDesigns = selection.selectedMemoryCardDesignIds.length;
    const cartDesigns = linkedCount(selection.cart, comboId, "memory-card-designs");
    const parentPresent = linked.some((item) => item.category === "memory-card");
    if (!parentPresent || selectedDesigns !== expectedMemoryCards || cartDesigns !== expectedMemoryCards) {
      push("memory-card", `Choose ${expectedMemoryCards} Photo Card design${expectedMemoryCards === 1 ? "" : "s"} included in your combo.`);
    }
  }

  return issues;
}

export function comboSelectionIssues(comboId: string, selection: ComboSelection): string[] {
  return comboCheckoutIssues(comboId, selection).map((issue) => issue.message);
}
