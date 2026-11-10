import assert from "node:assert/strict";
import { describe, it as test } from "node:test";
import { CATALOG } from "./catalog";
const find = (id: string) => CATALOG.sizes.find((s) => s.id === id)!;
describe("new magazine sizes", () => {
  test("A4 and A5 each offer 18 page counts (4–38)", () => {
    expect(CATALOG.sizes.filter((s) => s.format === "standard").length).toBe(18);
    expect(CATALOG.sizes.filter((s) => s.format === "mini").length).toBe(18);
  });
  test("A4 38 pages costs ₹4100 with 35 templates", () => {
    assert.equal(find("sz-38").price, 4100);
    assert.equal(find("sz-38").templateLimit, 35);
  });
  test("A4 10 pages costs ₹1100", () => assert.equal(find("sz-10").price, 1100));
  test("A5 12 pages now costs ₹750", () => assert.equal(find("sz-12-mini").price, 750));
  test("A5 38 pages costs ₹2050", () => assert.equal(find("sz-38-mini").price, 2050));
});
