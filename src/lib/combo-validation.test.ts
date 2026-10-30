import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { comboCheckoutIssues, comboSelectionIssues, type ComboSelection } from "./combo-validation";

const completeComboFive: ComboSelection = {
  cart: [
    { category: "combos", id: "combo-05", name: "The Double Trouble" },
    { category: "friendship", id: "friend-duo", name: "Duo License Card", comboId: "combo-05" },
    { category: "friendship-designs", id: "card-01", name: "Card 01 ×2", comboId: "combo-05" },
    { category: "memory-card", id: "bundle", name: "The Memory Card × 2", comboId: "combo-05" },
    { category: "memory-card-designs", id: "memory-01", name: "Birthday ×2", comboId: "combo-05" },
    { category: "strips", id: "bundle", name: "Polaroid Strips × 2", comboId: "combo-05" },
  ],
  stripSelections: ["strip-1", "strip-2"],
  selectedFriendshipId: "friend-duo",
  selectedFriendshipDesignIds: ["card-1", "card-1"],
  selectedMemoryCardDesignIds: ["memory-1", "memory-1"],
};

describe("combo selection validation", () => {
  it("allows combo 05 only when both strip and card quantities are present", () => {
    assert.deepEqual(comboSelectionIssues("combo-05", completeComboFive), []);
  });

  it("blocks checkout if an included Memory Card design is removed", () => {
    const selection = {
      ...completeComboFive,
      cart: completeComboFive.cart.filter((item) => item.category !== "memory-card-designs"),
      selectedMemoryCardDesignIds: [],
    };
    assert.ok(comboSelectionIssues("combo-05", selection).includes("Choose 2 Memory Card designs included in your combo."));
  });

  it("blocks checkout until the exact included strip quantity is selected", () => {
    assert.ok(comboSelectionIssues("combo-05", { ...completeComboFive, stripSelections: ["strip-1"] }).includes(
      "Choose 2 Polaroid Strips for your combo.",
    ));
  });

  it("blocks checkout until every combo magazine template is picked", () => {
    const comboSeven: ComboSelection = {
      cart: [
        { category: "combos", id: "combo-07", name: "The Keepsake Edit" },
        { category: "sizes", id: "sz-14", name: "14 Pages", comboId: "combo-07" },
        { category: "addons", id: "add-combo", name: "Combo (Wrap + Letter)", comboId: "combo-07" },
        { category: "strips", id: "bundle", name: "Polaroid Strips × 1", comboId: "combo-07" },
      ],
      stripSelections: ["strip-1"],
      selectedFriendshipId: null,
      selectedFriendshipDesignIds: [],
      selectedMemoryCardDesignIds: [],
      selectedTemplateIds: ["tpl-1"],
    };
    const issues = comboCheckoutIssues("combo-07", comboSeven);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].section, "templates");
    assert.match(issues[0].message, /^Please pick all \d+ magazine templates \(1\/\d+ selected\)\.$/);
  });

  it("points a missing strip at the strips section", () => {
    const issues = comboCheckoutIssues("combo-05", { ...completeComboFive, stripSelections: [] });
    assert.deepEqual(issues.map((issue) => issue.section), ["strips"]);
  });
});
