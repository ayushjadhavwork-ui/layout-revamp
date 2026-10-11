import { CATALOG, COMBO_RECIPES, type Category } from "./catalog";

export type ComboCartEntry = {
  category: Category;
  id: string;
  name: string;
  comboId?: string;
};

export type ComboSelection = {
  cart: ComboCartEntry[];
  stripSelections: string[];
  selectedFriendshipId: string | null;
  selectedFriendshipDesignIds: string[];
  selectedMemoryCardDesignIds: string[];
};

function quantityInName(name: string): number {
  const match = name.match(/×\s*(\d+)/);
  return match ? Number(match[1]) : 1;
}

function linkedCount(cart: ComboCartEntry[], comboId: string, category: Category): number {
  return cart
    .filter((item) => item.comboId === comboId && item.category === category)
    .reduce((sum, item) => sum + quantityInName(item.name), 0);
}

export function comboSelectionIssues(comboId: string, selection: ComboSelection): string[] {
  const recipe = COMBO_RECIPES[comboId];
  if (!recipe) return ["This combo has no recipe configured. Please choose a different combo."];

  const linked = selection.cart.filter((item) => item.comboId === comboId);
  const issues: string[] = [];
  const hasLinked = (category: Category, id: string) => linked.some((item) => item.category === category && item.id === id);

  if (recipe.sizeId && !hasLinked("sizes", recipe.sizeId)) issues.push("Choose the magazine included in your combo.");
  if (recipe.newspaper && !linked.some((item) => item.category === "newspaper")) issues.push("Choose the Newspaper Magazine included in your combo.");
  if ((recipe.pocketCount ?? 0) > linked.filter((item) => item.category === "pocket").length) issues.push("Restore every Pocket Magazine included in your combo.");
  for (const addonId of recipe.addonIds ?? []) {
    if (!hasLinked("addons", addonId)) {
      const addon = CATALOG.addons.find((item) => item.id === addonId);
      issues.push(`Restore ${addon?.name ?? "an add-on"}, included in your combo.`);
    }
  }
  if (recipe.polaroidId && !hasLinked("polaroids", recipe.polaroidId)) {
    const pack = CATALOG.polaroids.find((item) => item.id === recipe.polaroidId);
    issues.push(`Restore ${pack?.name ?? "the Polaroid pack"}, included in your combo.`);
  }
  if (recipe.freePostcard && !linked.some((item) => item.category === "promotions" && item.id === "promo-postcard")) {
    issues.push("Restore the free Postcard included in your combo.");
  }

  const expectedStrips = recipe.stripCount ?? 0;
  if (selection.stripSelections.length !== expectedStrips || linkedCount(selection.cart, comboId, "strips") !== expectedStrips) {
    if (expectedStrips > 0) issues.push(`Choose ${expectedStrips} Polaroid Strip${expectedStrips === 1 ? "" : "s"} for your combo.`);
  }

  const expectedFriendship = recipe.friendshipCount ?? 0;
  if (expectedFriendship > 0) {
    const requiredTier = expectedFriendship === 1 ? "friend-single" : "friend-duo";
    const tierPresent = selection.selectedFriendshipId === requiredTier && hasLinked("friendship", requiredTier);
    const selectedDesigns = selection.selectedFriendshipDesignIds.length;
    const cartDesigns = linkedCount(selection.cart, comboId, "friendship-designs");
    if (!tierPresent || selectedDesigns !== expectedFriendship || cartDesigns !== expectedFriendship) {
      issues.push(`Choose the ${expectedFriendship === 1 ? "Single Card" : "Duo Card"} and ${expectedFriendship} design${expectedFriendship === 1 ? "" : "s"} included in your combo.`);
    }
  }

  const expectedMemoryCards = recipe.memoryCardCount ?? 0;
  if (expectedMemoryCards > 0) {
    const selectedDesigns = selection.selectedMemoryCardDesignIds.length;
    const cartDesigns = linkedCount(selection.cart, comboId, "memory-card-designs");
    const parentPresent = linked.some((item) => item.category === "memory-card");
    if (!parentPresent || selectedDesigns !== expectedMemoryCards || cartDesigns !== expectedMemoryCards) {
      issues.push(`Choose ${expectedMemoryCards} Memory Card design${expectedMemoryCards === 1 ? "" : "s"} included in your combo.`);
    }
  }

  return issues;
}