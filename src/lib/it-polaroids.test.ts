import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CATALOG, IT_POLAROID_PRICE, IT_POLAROIDS_MAX, IT_POLAROIDS_MIN } from "./catalog";
import { PRICES } from "./prices";
import { clampItPolaroidsQty, standardDeliveryPrice, useStore } from "./store";

const store = () => useStore.getState();
const line = (category: string) => store().cart.find((c) => c.category === category);
const standard = CATALOG.delivery.find((d) => d.id === "del-std")!;
const miniMagazine = CATALOG.sizes.find((s) => s.id === "sz-4-mini")!;
const pack = CATALOG.polaroids[0];

beforeEach(() => store().clear());

describe("THE IT POLAROIDS quantity", () => {
  it("clamps to 1..100", () => {
    assert.equal(clampItPolaroidsQty(0), IT_POLAROIDS_MIN);
    assert.equal(clampItPolaroidsQty(-5), IT_POLAROIDS_MIN);
    assert.equal(clampItPolaroidsQty(101), IT_POLAROIDS_MAX);
    assert.equal(clampItPolaroidsQty(Number.NaN), IT_POLAROIDS_MIN);
    assert.equal(clampItPolaroidsQty(50), 50);
  });

  it("never lets the cart hold fewer than 1 or more than 100", () => {
    store().addItPolaroids(0);
    assert.equal(store().itPolaroidsQty(), 1);
    store().setItPolaroidsQty(101);
    assert.equal(store().itPolaroidsQty(), 100);
    store().setItPolaroidsQty(0);
    assert.equal(store().itPolaroidsQty(), 1);
  });

  it("only changes quantity for a line already in the cart", () => {
    store().setItPolaroidsQty(5);
    assert.equal(line("it-polaroids"), undefined);
  });

  it("removes the line", () => {
    store().addItPolaroids(3);
    store().removeItPolaroids();
    assert.equal(store().itPolaroidsQty(), 0);
    assert.equal(line("it-polaroids"), undefined);
  });
});

describe("THE IT POLAROIDS pricing", () => {
  it("charges ₹120 per polaroid", () => {
    assert.equal(IT_POLAROID_PRICE, 120);
    store().addItPolaroids(5);
    assert.equal(line("it-polaroids")?.price, 600);
    assert.equal(line("it-polaroids")?.name, "THE IT POLAROIDS × 5");
    store().setItPolaroidsQty(7);
    assert.equal(line("it-polaroids")?.price, 840);
  });
});

describe("Standard Delivery price", () => {
  it("is ₹80 for a polaroids-only cart and free once a magazine is added", () => {
    store().addItPolaroids(5);
    store().addItem("delivery", standard);
    assert.equal(line("delivery")?.price, PRICES.deliveryPolaroidsOnly["del-std"]);
    assert.equal(store().total(), 600 + 80);

    store().setSize(miniMagazine.id);
    assert.equal(line("delivery")?.price, 0);

    store().removeItem(line("sizes")!.key);
    assert.equal(line("delivery")?.price, 80);
  });

  it("counts Polaroid Packs as polaroids", () => {
    store().addItem("polaroids", pack);
    assert.equal(standardDeliveryPrice(store().cart), 80);
    store().addItPolaroids(2);
    assert.equal(standardDeliveryPrice(store().cart), 80);
  });

  it("stays free for carts with neither polaroids nor a magazine", () => {
    store().addMemoryCardDesign(CATALOG["memory-card-designs"][0].id);
    assert.equal(standardDeliveryPrice(store().cart), 0);
  });

  it("stays free beside a combo", () => {
    store().selectCombo(CATALOG.combos.find((c) => c.id === "combo-05")!);
    store().addItPolaroids(3);
    assert.equal(standardDeliveryPrice(store().cart), 0);
  });

  it("leaves Express Shipping at its own price", () => {
    store().addItPolaroids(1);
    store().addItem("delivery", CATALOG.delivery.find((d) => d.id === "del-exp")!);
    assert.equal(line("delivery")?.price, PRICES.delivery["del-exp"]);
  });
});
