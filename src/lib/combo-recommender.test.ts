import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG } from "./catalog";
import { OCCASIONS, RECIPIENTS, comboPhotoCapacity, photoCountIn, recommendCombo } from "./combo-recommender";

describe("Keepsake Matchmaker", () => {
  it("adds up photo counts from the note", () => {
    assert.equal(photoCountIn("We have 15 travel photos and 5 cute selfies"), 20);
    assert.equal(photoCountIn("a 12 pages magazine for ₹999"), 0);
    assert.equal(photoCountIn("no numbers here"), 0);
  });

  it("always recommends a real combo for every occasion and recipient", () => {
    const ids = new Set(CATALOG.combos.map((c) => c.id));
    for (const occasion of OCCASIONS) {
      for (const recipient of RECIPIENTS) {
        const rec = recommendCombo(occasion, recipient, "");
        assert.ok(ids.has(rec.comboId), `${occasion}/${recipient} → ${rec.comboId}`);
        assert.ok(rec.headline.length > 0);
        assert.ok(rec.reasons.length >= 2);
      }
    }
  });

  it("follows strong hints in the note", () => {
    assert.equal(recommendCombo("Just Because", "Self", "I'd love a newspaper").comboId, "combo-03");
    assert.equal(recommendCombo("Anniversary", "Partner", "something small in a pocket size with a letter").comboId, "combo-04");
  });

  it("suggests IT Polaroids when the note has more photos than the combo holds", () => {
    const rec = recommendCombo("Birthday", "Best Friend", "we have 200 photos");
    assert.ok(comboPhotoCapacity(rec.comboId) < 200);
    assert.match(rec.polaroidTip ?? "", /THE IT POLAROIDS/);
    assert.equal(recommendCombo("Birthday", "Best Friend", "").polaroidTip, undefined);
  });
});
