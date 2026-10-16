import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CATALOG, COMBO_RECIPES, MEMORY_CARD_MAX, MEMORY_CARD_TIERS, STRIP_TIERS } from "./catalog";
import { migrateSavedCart, useStore } from "./store";

const store = () => useStore.getState();
const combo = (id: string) => CATALOG.combos.find((c) => c.id === id)!;
const line = (category: string) => store().cart.find((c) => c.category === category);
const memoryDesign = CATALOG["memory-card-designs"][0].id;
const strip = CATALOG.strips[0].id;
const single = CATALOG.friendship.find((f) => f.id === "friend-single")!;

beforeEach(() => store().clear());

describe("extras beside a combo that doesn't include them", () => {
  it("charges Photo Cards at the normal price, up to the normal max", () => {
    assert.equal(COMBO_RECIPES["combo-01"].memoryCardCount, undefined);
    store().selectCombo(combo("combo-01"));
    assert.equal(store().memoryCardLimit(), MEMORY_CARD_MAX);
    assert.equal(store().addMemoryCardDesign(memoryDesign), true);
    assert.equal(line("memory-card")?.price, MEMORY_CARD_TIERS[1]);
    assert.equal(line("memory-card")?.comboId, undefined);
    assert.equal(line("memory-card-designs")?.comboId, undefined);
  });

  it("charges Single & Duo Cards at the normal price", () => {
    assert.equal(COMBO_RECIPES["combo-01"].friendshipCount, undefined);
    store().selectCombo(combo("combo-01"));
    store().setFriendship(single.id);
    assert.equal(line("friendship")?.price, single.price);
    assert.equal(line("friendship")?.comboId, undefined);
  });

  it("charges Polaroid Strips at the normal price", () => {
    assert.equal(COMBO_RECIPES["combo-03"].stripCount, undefined);
    store().selectCombo(combo("combo-03"));
    assert.equal(store().toggleStrip(strip), true);
    assert.equal(line("strips")?.price, STRIP_TIERS[1]);
    assert.equal(line("strips")?.comboId, undefined);
  });

  it("keeps paid extras and their picks when the combo is removed", () => {
    store().selectCombo(combo("combo-01"));
    store().addMemoryCardDesign(memoryDesign);
    store().deselectCombo("combo-01");
    assert.equal(line("memory-card")?.price, MEMORY_CARD_TIERS[1]);
    assert.deepEqual(store().selectedMemoryCardDesignIds, [memoryDesign]);
  });
});

describe("products a combo includes", () => {
  it("are still free and linked to the combo", () => {
    store().selectCombo(combo("combo-02"));
    assert.equal(store().memoryCardLimit(), 1);
    store().addMemoryCardDesign(memoryDesign);
    assert.equal(store().addMemoryCardDesign(memoryDesign), false);
    assert.deepEqual([line("memory-card")?.price, line("memory-card")?.comboId], [0, "combo-02"]);
    store().toggleStrip(strip);
    assert.deepEqual([line("strips")?.price, line("strips")?.comboId], [0, "combo-02"]);
  });

  it("replace paid picks of that product when the combo is selected", () => {
    store().addMemoryCardDesign(memoryDesign);
    store().selectCombo(combo("combo-02"));
    assert.equal(line("memory-card"), undefined);
    assert.deepEqual(store().selectedMemoryCardDesignIds, []);
  });
});

describe("carts saved before the fix", () => {
  const migrate = (state: Record<string, unknown>) =>
    migrateSavedCart(state, 5) as Record<string, unknown>;
  const savedCart = (comboId: string) => ({
    cart: [
      { key: `combos:${comboId}`, category: "combos", id: comboId, name: "Combo", price: 999 },
      { key: "memory-card:bundle", category: "memory-card", id: "bundle", name: "The Memory Card × 1", price: 0, comboId },
      { key: `memory-card-designs:${memoryDesign}`, category: "memory-card-designs", id: memoryDesign, name: "Card", price: 0, comboId },
      { key: "strips:bundle", category: "strips", id: "bundle", name: "Polaroid Strips × 1", price: 0, comboId },
    ],
    selectedMemoryCardDesignIds: [memoryDesign],
    stripSelections: [strip],
  });

  it("drops strips/cards made free by a combo that doesn't include them", () => {
    const state = migrate(savedCart("combo-03"));
    assert.deepEqual((state.cart as { category: string }[]).map((c) => c.category), ["combos"]);
    assert.deepEqual(state.selectedMemoryCardDesignIds, []);
    assert.deepEqual(state.stripSelections, []);
  });

  it("keeps lines the combo really includes", () => {
    const state = migrate(savedCart("combo-02"));
    assert.equal((state.cart as unknown[]).length, 4);
    assert.equal((state.cart as { category: string; name: string }[]).find((c) => c.category === "memory-card")?.name, "The Photo Card × 1");
    assert.deepEqual(state.selectedMemoryCardDesignIds, [memoryDesign]);
    assert.deepEqual(state.stripSelections, [strip]);
  });
});
