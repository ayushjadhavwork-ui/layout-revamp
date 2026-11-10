import { describe, expect, test } from "bun:test";
import { CATALOG } from "./catalog";
const find = (id: string) => CATALOG.sizes.find((s) => s.id === id)!;
describe("new magazine sizes", () => {
  test("A4 and A5 each offer 18 page counts (4–38)", () => {
    expect(CATALOG.sizes.filter((s) => s.format === "standard").length).toBe(18);
    expect(CATALOG.sizes.filter((s) => s.format === "mini").length).toBe(18);
  });
  test("A4 38 pages costs ₹4100 with 35 templates", () => {
    expect(find("sz-38").price).toBe(4100);
    expect(find("sz-38").templateLimit).toBe(35);
  });
  test("A4 10 pages costs ₹1100", () => expect(find("sz-10").price).toBe(1100));
  test("A5 12 pages now costs ₹750", () => expect(find("sz-12-mini").price).toBe(750));
  test("A5 38 pages costs ₹2050", () => expect(find("sz-38-mini").price).toBe(2050));
});
