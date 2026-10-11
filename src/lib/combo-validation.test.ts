import { describe, expect, test } from "bun:test";
import { comboSelectionIssues, type ComboSelection } from "./combo-validation";

const completeComboFive: ComboSelection = {
  cart: [
    { category: "combos", id: "combo-05", name: "The Double Trouble" },
    { category: "friendship", id: "friend-duo", name: "Duo Card", comboId: "combo-05" },
    { category: "friendship-designs", id: "card-01", name: "Card 01 ×2", comboId: "combo-05" },
    { category: "memory-card", id: "bundle", name: "The Memory Card × 2", comboId: "combo-05" },
    { category: "memory-card-designs", id: "memory-01", name: "Birthday ×2", comboId: "combo-05" },
    { category: "strips", id: "bundle", name: "Polaroid Strips × 2", comboId: "combo-05" },
    { category: "promotions", id: "promo-postcard", name: "Free Postcard", comboId: "combo-05" },
  ],
  stripSelections: ["strip-1", "strip-2"],
  selectedFriendshipId: "friend-duo",
  selectedFriendshipDesignIds: ["card-1", "card-1"],
  selectedMemoryCardDesignIds: ["memory-1", "memory-1"],
};

describe("combo selection validation", () => {
  test("allows combo 05 only when both strip and card quantities are present", () => {
    expect(comboSelectionIssues("combo-05", completeComboFive)).toEqual([]);
  });

  test("blocks checkout if an included Memory Card design is removed", () => {
    const selection = {
      ...completeComboFive,
      cart: completeComboFive.cart.filter((item) => item.category !== "memory-card-designs"),
      selectedMemoryCardDesignIds: [],
    };
    expect(comboSelectionIssues("combo-05", selection)).toContain("Choose 2 Memory Card designs included in your combo.");
  });

  test("blocks checkout until the exact included strip quantity is selected", () => {
    expect(comboSelectionIssues("combo-05", { ...completeComboFive, stripSelections: ["strip-1"] })).toContain(
      "Choose 2 Polaroid Strips for your combo.",
    );
  });
});