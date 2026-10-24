import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { CATALOG } from "./catalog";
import { productCouponCheck, useStore } from "./store";

const store = () => useStore.getState();
const book = CATALOG["sticker-book"][0];
const magazine = CATALOG.sizes.find((s) => s.id === "sz-4")!;

// What PromoCodeBox does with a product coupon.
const apply = (code: string) => {
  const check = productCouponCheck(code, store().cart);
  if (check?.valid) store().setCoupon({ code: code.toUpperCase(), percent: 0, amount: check.amount });
  return check;
};

beforeEach(() => store().clear());

describe("THE LOVE STICKER BOOK", () => {
  it("adds one ₹1,199 line", () => {
    store().addItem("sticker-book", book);
    store().addItem("sticker-book", book);
    const lines = store().cart.filter((c) => c.category === "sticker-book");
    assert.equal(lines.length, 1);
    assert.equal(lines[0].price, 1199);
  });

  it("rejects PATAKA200 without the sticker book", () => {
    store().setSize(magazine.id);
    assert.deepEqual(apply("PATAKA200"), { valid: false, message: "Code PATAKA200 is only valid on The Love Sticker Book." });
    assert.equal(store().coupon, null);
  });

  it("takes ₹200 off with the sticker book", () => {
    store().addItem("sticker-book", book);
    assert.equal(apply("pataka200")?.valid, true);
    assert.equal(store().discount(), 200);
    assert.equal(store().total(), 999);
  });

  it("drops PATAKA200 when the sticker book leaves the cart", () => {
    store().addItem("sticker-book", book);
    store().setSize(magazine.id);
    apply("PATAKA200");
    store().removeItem(store().cart.find((c) => c.category === "sticker-book")!.key);
    assert.equal(store().coupon, null);
    assert.equal(store().discount(), 0);
  });

  it("ignores codes that aren't product coupons", () => {
    assert.equal(productCouponCheck("LAYOUT10", []), null);
  });

  it("ships free", () => {
    store().addItem("sticker-book", book);
    store().addItem("delivery", CATALOG.delivery.find((d) => d.id === "del-std")!);
    assert.equal(store().cart.find((c) => c.category === "delivery")?.price, 0);
  });
});
