import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CATALOG } from "./catalog";
import { comboSteps, guidedVisibleSections, nextComboAction } from "./combo-guide";
import { comboCheckoutIssues } from "./combo-validation";
import { useStore } from "./store";

const store = () => useStore.getState();
const issuesFor = (comboId: string) => comboCheckoutIssues(comboId, store());

beforeEach(() => store().clear());

describe("guided combo mode", () => {
  it("keeps every section a checkout issue points to visible, for every combo", () => {
    for (const combo of CATALOG.combos) {
      store().clear();
      store().selectCombo(combo);
      const issues = issuesFor(combo.id);
      const visible = guidedVisibleSections(combo.id, issues, store().cart);
      for (const issue of issues) {
        if (issue.section === "combos" || issue.section === "extras") continue;
        assert.ok(visible.has(issue.section), `${combo.id}: "${issue.message}" points at hidden #${issue.section}`);
      }
    }
  });

  it("hides sections a combo doesn't use", () => {
    store().selectCombo(CATALOG.combos.find((c) => c.id === "combo-01")!);
    const visible = guidedVisibleSections("combo-01", issuesFor("combo-01"), store().cart);
    for (const hidden of ["build", "memory-card", "friendship-card", "pocket", "newspaper"] as const) {
      assert.equal(visible.has(hidden), false, hidden);
    }
    assert.ok(visible.has("templates") && visible.has("strips"));
  });

  it("starts at zero and finishes exactly when checkout has nothing left to say", () => {
    const combo = CATALOG.combos.find((c) => c.id === "combo-05")!;
    store().selectCombo(combo);
    let steps = comboSteps("combo-05", issuesFor("combo-05"));
    assert.deepEqual(steps.map((s) => s.section), ["memory-card", "friendship-card", "strips"]);
    assert.equal(steps.filter((s) => s.done).length, 0);

    const memory = CATALOG["memory-card-designs"][0].id;
    store().addMemoryCardDesign(memory);
    store().addMemoryCardDesign(memory);
    steps = comboSteps("combo-05", issuesFor("combo-05"));
    assert.deepEqual(steps.map((s) => s.done), [true, false, false]);
    assert.equal(nextComboAction(steps, issuesFor("combo-05"))?.section, "friendship-card");

    store().setFriendship("friend-duo");
    const design = CATALOG["friendship-designs"][0].id;
    store().addFriendshipDesign(design);
    store().addFriendshipDesign(design);
    store().toggleStrip(CATALOG.strips[0].id);
    store().toggleStrip(CATALOG.strips[1].id);
    assert.deepEqual(issuesFor("combo-05"), []);
    steps = comboSteps("combo-05", []);
    assert.ok(steps.every((s) => s.done));
    assert.equal(nextComboAction(steps, []), null);
  });
});

describe("THE IT POLAROIDS in guided combo mode", () => {
  it("stays visible for every combo, so the Matchmaker's polaroid tip has somewhere to go", () => {
    for (const combo of CATALOG.combos) {
      store().clear();
      store().selectCombo(combo);
      assert.ok(guidedVisibleSections(combo.id, issuesFor(combo.id), store().cart).has("it-polaroids"), combo.id);
    }
  });
});
