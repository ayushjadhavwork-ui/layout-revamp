// ===========================================================
// PRICES — THE ONLY FILE YOU NEED TO EDIT TO CHANGE PRICING
// ===========================================================
//
// HOW TO EDIT (no coding knowledge needed):
//   1. Find the line for the item you want to change.
//   2. Change ONLY the number after the colon (":").
//   3. Keep the comma at the end of the line.
//   4. Save. The whole site (cards, modals, cart, totals) updates.
//
// RULES:
//   - Numbers only. No "₹", no commas inside the number, no quotes.
//     GOOD:  699        BAD:  ₹699   "699"   1,200
//   - 0 means "free" / "included".
//   - Do NOT delete or rename lines. Do NOT rename the keys on the left.
//     If a line goes missing you'll see a warning in the browser console
//     and prices may show as blank.
// ===========================================================

export const PRICES = {
  // -------------------------------------------------------
  // MAGAZINE PACKAGES — STANDARD (A4) format
  // Key = page count.
  // -------------------------------------------------------
  sizes: {
    "sz-4": 699, // 4 Pages
    "sz-6": 799, // 6 Pages
    "sz-8": 999, // 8 Pages
    "sz-12": 1200, // 12 Pages
    "sz-14": 1325, // 14 Pages
    "sz-16": 1449, // 16 Pages
    "sz-18": 1650, // 18 Pages
    "sz-20": 1850, // 20 Pages
  },

  // -------------------------------------------------------
  // MAGAZINE PACKAGES — MINI (A5) format
  // Same page counts, smaller trim size, its own prices.
  // -------------------------------------------------------
  sizesMini: {
    "sz-4-mini": 549, // 4 Pages (Mini)
    "sz-6-mini": 649, // 6 Pages (Mini)
    "sz-8-mini": 799, // 8 Pages (Mini)
    "sz-12-mini": 999, // 12 Pages (Mini)
    "sz-14-mini": 1099, // 14 Pages (Mini)
    "sz-16-mini": 1199, // 16 Pages (Mini)
    "sz-18-mini": 1349, // 18 Pages (Mini)
    "sz-20-mini": 1499, // 20 Pages (Mini)
  },


  // -------------------------------------------------------
  // ADD-ONS
  // -------------------------------------------------------
  addons: {
    "add-wrap": 99, // Gift Wrap
    "add-letter": 149, // Handwritten Letter
    "add-combo": 219, // Combo (Wrap + Letter)
  },

  // -------------------------------------------------------
  // CURATED COMBOS (flat bundle price shown to the customer)
  // NOTE: the "You save ₹__" text lives in catalog.ts descriptions —
  // update that wording there if you change these numbers.
  // -------------------------------------------------------
  combos: {
    "combo-main": 1049, // Main Character Pack
    "combo-core": 1379, // Core Memory Pack
    "combo-soft": 1699, // Soft Launch Bundle
  },

  // -------------------------------------------------------
  // POLAROID PACKS
  // -------------------------------------------------------
  polaroids: {
    "pol-mini": 80, // Mini Pack (9 photos)
    "pol-classic": 150, // Classic Pack (18 photos)
    "pol-memory": 220, // Memory Pack (27 photos)
    "pol-premium": 280, // Premium Pack (36 photos)
  },

  // -------------------------------------------------------
  // POLAROID STRIPS — bundle pricing by HOW MANY strips picked.
  // Individual strips have no price of their own; the total below
  // is charged for that many strips together.
  // -------------------------------------------------------
  stripTiers: {
    1: 100, // any 1 strip
    2: 125, // any 2 strips
    3: 175, // any 3 strips
    4: 220, // any 4 strips
    5: 275, // any 5 strips
  },

  // -------------------------------------------------------
  // DELIVERY
  // -------------------------------------------------------
  delivery: {
    "del-std": 0, // Standard Delivery (free)
    "del-exp": 149, // Express Shipping
  },

  // -------------------------------------------------------
  // NEWSPAPER MAGAZINE (standalone keepsake)
  // -------------------------------------------------------
  newspaper: {
    "news-mag": 250,
  },
} as const;

// ===========================================================
// Internal helper — do not edit below this line.
// ===========================================================
type PriceGroup = keyof typeof PRICES;

export function priceOf(group: PriceGroup, id: string | number): number {
  const value = (PRICES[group] as Record<string | number, number | undefined>)[id];
  if (typeof value !== "number") {
    if (import.meta.env.DEV) {
      console.warn(
        `[prices.ts] Missing price for "${id}" in PRICES.${group}. ` +
          `Check src/lib/prices.ts — a line may have been deleted or renamed.`,
      );
    }
    return 0;
  }
  return value;
}
