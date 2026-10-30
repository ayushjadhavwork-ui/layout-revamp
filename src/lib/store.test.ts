import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CATALOG, COMBO_RECIPES, MEMORY_CARD_MAX, MEMORY_CARD_TIERS, STRIP_MAX, STRIP_TIERS } from "./catalog";
import { PRICES } from "./prices";
import { migrateSavedCart, useStore } from "./store";

const store = () => useStore.getState();
const combo = (id: string) => CATALOG.combos.find((c) => c.id === id)!;
const line = (category: string) => store().cart.find((c) => c.category === category);
const memoryDesign = CATALOG["memory-card-designs"][0].id;
const strip = CATALOG.strips[0].id;
const single = CATALOG.friendship.find((f) => f.id === "friend-single")!;

beforeEach(() => store().clear());

describe("extras beside a combo that doesn't include them", () => {
  it("charges Memory Cards at the normal price, up to the normal max", () => {
    assert.equal(COMBO_RECIPES["combo-01"].memoryCardCount, undefined);
    store().selectCombo(combo("combo-01"));
    assert.equal(store().memoryCardLimit(), MEMORY_CARD_MAX);
    assert.equal(store().addMemoryCardDesign(memoryDesign), true);
    assert.equal(line("memory-card")?.price, MEMORY_CARD_TIERS[1]);
    assert.equal(line("memory-card")?.comboId, undefined);
    assert.equal(line("memory-card-designs")?.comboId, undefined);
  });

  it("charges License Cards at the normal price", () => {
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
    assert.equal((state.cart as { category: string; name: string }[]).find((c) => c.category === "memory-card")?.name, "The Memory Card × 1");
    assert.deepEqual(state.selectedMemoryCardDesignIds, [memoryDesign]);
    assert.deepEqual(state.stripSelections, [strip]);
  });
});

describe("Polaroid Strips bundle pricing", () => {
  const expected: Record<number, number> = { 1: 100, 2: 125, 3: 175, 4: 220, 5: 275, 6: 330, 8: 420, 10: 500, 12: 600 };

  it("offers all 12 strips", () => {
    assert.equal(CATALOG.strips.length, 12);
    assert.equal(STRIP_MAX, 12);
  });

  for (const [n, price] of Object.entries(expected)) {
    it(`charges ₹${price} for ${n} strip${n === "1" ? "" : "s"}`, () => {
      CATALOG.strips.slice(0, Number(n)).forEach((s) => assert.equal(store().toggleStrip(s.id), true));
      assert.equal(line("strips")?.price, price);
    });
  }

  it("has a price for every count up to the strip limit", () => {
    for (let n = 1; n <= STRIP_MAX; n++) assert.ok(STRIP_TIERS[n] > 0, `no price for ${n} strips`);
  });

  it("keeps combo strips free and swaps the oldest pick once the allowance is full", () => {
    store().selectCombo(combo("combo-05")); // includes 2 strips
    const [a, b, c] = CATALOG.strips;
    store().toggleStrip(a.id);
    store().toggleStrip(b.id);
    assert.equal(store().toggleStrip(c.id), true);
    assert.deepEqual(store().stripSelections, [b.id, c.id]);
    assert.deepEqual([line("strips")?.price, line("strips")?.comboId], [0, "combo-05"]);
  });
});

describe("renamed cards", () => {
  it("call the bundle line The Memory Card and the tiers License Card / Duo License Card", () => {
    store().addMemoryCardDesign(memoryDesign);
    assert.equal(line("memory-card")?.name, "The Memory Card × 1");
    assert.deepEqual(CATALOG.friendship.map((f) => f.name), ["License Card", "Duo License Card"]);
  });

  it("rename lines in carts saved under the old names", () => {
    const state = migrateSavedCart({
      cart: [
        { key: "memory-card:bundle", category: "memory-card", id: "bundle", name: "The Photo Card × 2", price: 220 },
        { key: "friendship:friend-duo", category: "friendship", id: "friend-duo", name: "Duo Card — BESTIE SET", price: 499 },
      ],
      selectedMemoryCardDesignIds: [memoryDesign, memoryDesign],
    }, 7) as { cart: { name: string }[] };
    assert.deepEqual(state.cart.map((c) => c.name), ["The Memory Card × 2", "Duo License Card"]);
  });
});

describe("no free postcard", () => {
  it("is never added to a cart or a combo", () => {
    store().addItem("sizes", CATALOG.sizes[0]);
    store().selectCombo(combo("combo-01"));
    assert.equal(store().cart.some((c) => c.id === "promo-postcard"), false);
  });

  it("is dropped from carts saved before it was discontinued", () => {
    const state = migrateSavedCart({
      cart: [
        { key: "sizes:sz-4", category: "sizes", id: "sz-4", name: "4 Pages", price: 699 },
        { key: "promotions:promo-postcard", category: "promotions", id: "promo-postcard", name: "Free Postcard", price: 0 },
      ],
    }, 7) as { cart: { id: string }[] };
    assert.deepEqual(state.cart.map((c) => c.id), ["sz-4"]);
  });
});

describe("auto Standard Delivery at checkout", () => {
  const delivery = () => store().cart.filter((c) => c.category === "delivery");
  const express = CATALOG.delivery.find((d) => d.id === "del-exp")!;

  it("adds Standard Delivery when no delivery is picked", () => {
    store().addItem("sizes", CATALOG.sizes[0]);
    assert.equal(store().ensureStandardDelivery(), true);
    assert.deepEqual(delivery().map((c) => c.id), ["del-std"]);
    assert.equal(store().ensureStandardDelivery(), false);
    assert.equal(delivery().length, 1);
  });

  it("leaves an Express Shipping choice alone", () => {
    store().addItem("sizes", CATALOG.sizes[0]);
    store().addItem("delivery", express);
    assert.equal(store().ensureStandardDelivery(), false);
    assert.deepEqual(delivery().map((c) => c.id), ["del-exp"]);
  });

  it("prices it for polaroid-only carts", () => {
    store().addItPolaroids(2);
    store().ensureStandardDelivery();
    assert.equal(delivery()[0].price, PRICES.deliveryPolaroidsOnly["del-std"]);
  });
});
