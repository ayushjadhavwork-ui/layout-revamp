import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG } from "./catalog";
import { magazineProgress, magazineTracks } from "./magazine-progress";

const standard = CATALOG.sizes.find((s) => s.format === "standard" && (s.templateLimit ?? 0) > 1)!;
const mini = CATALOG.sizes.find((s) => s.format === "mini" && (s.templateLimit ?? 0) > 0)!;
const limit = standard.templateLimit!;
const none = { sizeId: null, templateCount: 0, pocketUnits: [], pocketLimit: 6 };

describe("magazine template progress", () => {
  it("has nothing to track without a magazine", () => {
    assert.deepEqual(magazineTracks(none), []);
    assert.equal(magazineProgress([]).next, null);
  });

  it("tracks a custom magazine by its format and template limit", () => {
    const half = Math.floor(limit / 2);
    const [track] = magazineTracks({ ...none, sizeId: standard.id, templateCount: half });
    assert.equal(track.label, `Custom Standard A4 Magazine · ${standard.name}`);
    assert.equal(track.required, limit);
    assert.equal(track.anchor, "templates");
    const progress = magazineProgress([track]);
    assert.equal(progress.percent, Math.round((half / limit) * 100));
    assert.equal(progress.next, track);

    const [miniTrack] = magazineTracks({ ...none, sizeId: mini.id });
    assert.match(miniTrack.label, /^Custom Mini A5 Magazine/);
  });

  it("points at the custom magazine first, then each unfinished pocket unit", () => {
    const tracks = magazineTracks({
      sizeId: standard.id,
      templateCount: limit,
      pocketUnits: [
        { uid: "a", templateIds: ["1", "2", "3", "4", "5", "6"] },
        { uid: "b", templateIds: ["1", "2"] },
      ],
      pocketLimit: 6,
    });
    assert.deepEqual(tracks.map((t) => t.label).slice(1), ["Pocket Magazine #1", "Pocket Magazine #2"]);
    const progress = magazineProgress(tracks);
    assert.equal(progress.next?.anchor, "pocket-unit-b");
    assert.equal(progress.chosen, limit + 8);
    assert.equal(progress.required, limit + 12);
  });

  it("is complete at 100% once every magazine has its templates", () => {
    const tracks = magazineTracks({ ...none, sizeId: standard.id, templateCount: limit });
    const progress = magazineProgress(tracks);
    assert.equal(progress.percent, 100);
    assert.equal(progress.next, null);
  });
});
