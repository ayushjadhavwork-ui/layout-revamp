// ===========================================================
// The Layout — product catalogue + backend config
// Update GAS_URL after deploying Code.gs as a Web App.
// ===========================================================

import { SITE } from "./site-content";
// ALL PRICES LIVE IN prices.ts — edit that file, not this one.
import { PRICES, priceOf } from "./prices";

export const CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/AKfycbwoqxri-OOv5wTYTw3iLPJC1ZJ7nru5b2SFQ8E080e6L_OY1LJAK_BR__VTdTh3gFQq2g/exec",
  UPI_ID: "sphati666-1@okhdfcbank",
  PAYEE: "The Layout Magazines",
  CURRENCY: "₹",
};

export type Category =
  | "sizes"
  | "templates"
  | "addons"
  | "combos"
  | "polaroids"
  | "strips"
  | "delivery"
  | "newspaper"
  | "promotions";


// A magazine trim format. Only "sizes" entries carry this field.
export type SizeFormat = "standard" | "mini";

export type Product = {
  id: string;
  name: string;
  price: number;
  desc: string;
  templateLimit?: number;
  format?: SizeFormat;
};

// Page count → how many templates that package includes. Shared by both
// formats (Mini gets the same template allowance as Standard).
const SIZE_ROWS: { pages: number; templateLimit: number }[] = [
  { pages: 4,  templateLimit: 1 },
  { pages: 6,  templateLimit: 3 },
  { pages: 8,  templateLimit: 5 },
  { pages: 12, templateLimit: 9 },
  { pages: 14, templateLimit: 11 },
  { pages: 16, templateLimit: 13 },
  { pages: 18, templateLimit: 15 },
  { pages: 20, templateLimit: 17 },
];

export const CATALOG: Record<Exclude<Category, "templates">, Product[]> & {
  templates: Product[];
} = {
  sizes: [
    // Standard (A4)
    ...SIZE_ROWS.map(({ pages, templateLimit }) => ({
      id: `sz-${pages}`,
      name: `${pages} Pages`,
      price: priceOf("sizes", `sz-${pages}`),
      templateLimit,
      format: "standard" as SizeFormat,
      desc: `${pages} pages + front & back cover. ${templateLimit} template${templateLimit === 1 ? "" : "s"}. Standard A4 size.`,
    })),
    // Mini (A5)
    ...SIZE_ROWS.map(({ pages, templateLimit }) => ({
      id: `sz-${pages}-mini`,
      name: `${pages} Pages`,
      price: priceOf("sizesMini", `sz-${pages}-mini`),
      templateLimit,
      format: "mini" as SizeFormat,
      desc: `${pages} pages + front & back cover. ${templateLimit} template${templateLimit === 1 ? "" : "s"}. Mini A5 size.`,
    })),
  ],

  // Count lives in site-content.ts (SITE.templateCount) — bump it there.

  templates: Array.from({ length: SITE.templateCount }, (_, i) => ({
    id: `tpl-${i + 1}`,
    name: `Template ${i + 1}`,
    price: 0,
    desc: "Curated aesthetic layout — included with your chosen package.",
  })),
  addons: [
    { id: "add-wrap",   name: "Gift Wrap",           price: priceOf("addons", "add-wrap"),   desc: "Pastel gift wrap with ribbon." },
    { id: "add-letter", name: "Handwritten Letter",  price: priceOf("addons", "add-letter"), desc: "A personal letter, penned by us." },
    { id: "add-combo",  name: "Combo (Wrap + Letter)", price: priceOf("addons", "add-combo"), desc: "Both — because why not?" },
  ],
  combos: [
    {
      id: "combo-main",
      name: "Main Character Pack",
      price: priceOf("combos", "combo-main"),
      desc: "8-Page Custom Magazine + Gift Wrap + Personalized Letter. Everything you need to feel like the main character. You save ₹50.",
    },
    {
      id: "combo-core",
      name: "Core Memory Pack",
      price: priceOf("combos", "combo-core"),
      desc: "12-Page Custom Magazine + Classic Polaroid Pack (18 Photos) + 1 Polaroid Strip. A whole core memory in a box. You save ₹51.",
    },
    {
      id: "combo-soft",
      name: "Soft Launch Bundle",
      price: priceOf("combos", "combo-soft"),
      desc: "16-Page Custom Magazine + Memory Polaroid Pack (27 Photos) + Gift Wrap + Personalized Letter. The full soft launch treatment. You save ₹130.",
    },
  ],

  polaroids: [
    { id: "pol-mini",    name: "Mini Pack",    price: priceOf("polaroids", "pol-mini"),    desc: "9 mini polaroids — matte finish, keepsake-ready." },
    { id: "pol-classic", name: "Classic Pack", price: priceOf("polaroids", "pol-classic"), desc: "18 classic polaroids — the everyday memory stack." },
    { id: "pol-memory",  name: "Memory Pack",  price: priceOf("polaroids", "pol-memory"),  desc: "27 polaroids to tell the whole story." },
    { id: "pol-premium", name: "Premium Pack", price: priceOf("polaroids", "pol-premium"), desc: "36 premium polaroids — the full collection." },
  ],
  strips: [
    { id: "strip-1", name: "Strip 1", price: 0, desc: "Editorial polaroid strip — design 1." },
    { id: "strip-2", name: "Strip 2", price: 0, desc: "Editorial polaroid strip — design 2." },
    { id: "strip-3", name: "Strip 3", price: 0, desc: "Editorial polaroid strip — design 3." },
    { id: "strip-4", name: "Strip 4", price: 0, desc: "Editorial polaroid strip — design 4." },
    { id: "strip-5", name: "Strip 5", price: 0, desc: "Editorial polaroid strip — design 5." },
  ],
  delivery: [
    { id: "del-std", name: "Standard Delivery", price: priceOf("delivery", "del-std"), desc: "Free — arrives in 7-8 days." },
    { id: "del-exp", name: "Express Shipping",  price: priceOf("delivery", "del-exp"), desc: "Priority — arrives in 3-4 days." },
  ],

  // A small, standalone product — not part of the magazine builder or any
  // combo. Two landscape spreads, flat price.
  newspaper: [
    {
      id: "news-mag",
      name: "Newspaper Magazine",
      price: priceOf("newspaper", "news-mag"),
      desc: "A special broadsheet-style keepsake with space for two landscape spreads.",
    },
  ],


  // Free items granted by redeeming a Spin-the-Wheel coupon code — never sold
  // directly, only ever added by applyCouponFreebie() in store.ts.
  promotions: [
    { id: "promo-strip",   name: "Free Polaroid Strip",       price: 0, desc: "Redeemed via spin-the-wheel coupon." },
    { id: "promo-letter",  name: "Free Personalized Letter",  price: 0, desc: "Redeemed via spin-the-wheel coupon." },
    { id: "promo-sticker", name: "Free Sticker Pack",         price: 0, desc: "Redeemed via spin-the-wheel coupon." },
  ],
};

// The Newspaper Magazine's two landscape spreads — fixed, not user-pickable.
// Both come together as one whole ₹250 product; these exist purely to show
// a preview of each spread. Override previews via SITE.productImages["news-tpl-1"/"news-tpl-2"].
export const NEWSPAPER_TEMPLATES: Product[] = [
  { id: "news-tpl-1", name: "Layout 1", price: 0, desc: "Landscape broadsheet spread." },
  { id: "news-tpl-2", name: "Layout 2", price: 0, desc: "Landscape broadsheet spread." },
];

// Maps a Spin-the-Wheel coupon code to the free product it grants when
// applied in the cart — see applyCouponFreebie() in store.ts.
export const COUPON_FREEBIES: Record<string, string> = {
  SPINPOLA: "promo-strip",
  SPINLETTER: "promo-letter",
  SPINSTICK: "promo-sticker",
};

// Tier pricing for polaroid strips, indexed by number of strips selected (1..5).
// Numbers live in prices.ts → PRICES.stripTiers.
export const STRIP_TIERS: Record<number, number> = { ...PRICES.stripTiers };
export const STRIP_MAX = Object.keys(PRICES.stripTiers).length;


// ===========================================================
// COMBO RECIPES — what a combo auto-selects when chosen.
// Templates are picked at random (up to the size's limit) since a combo
// is meant to be a one-click "just build it for me" bundle.
// ===========================================================
export type ComboRecipe = {
  sizeId?: string;
  addonIds?: string[];
  polaroidId?: string;
  stripCount?: number;
};

export const COMBO_RECIPES: Record<string, ComboRecipe> = {
  "combo-main": { sizeId: "sz-8", addonIds: ["add-wrap", "add-letter"] },
  "combo-core": { sizeId: "sz-12", polaroidId: "pol-classic", stripCount: 1 },
  "combo-soft": { sizeId: "sz-16", polaroidId: "pol-memory", addonIds: ["add-wrap", "add-letter"] },
};

// Real sum of what a combo's included items would cost bought separately —
// the "slashed" total shown next to the combo's flat price.
export function comboRealTotal(comboId: string): number {
  const recipe = COMBO_RECIPES[comboId];
  if (!recipe) return 0;
  let total = 0;
  if (recipe.sizeId) total += CATALOG.sizes.find((s) => s.id === recipe.sizeId)?.price ?? 0;
  for (const id of recipe.addonIds ?? []) {
    total += CATALOG.addons.find((a) => a.id === id)?.price ?? 0;
  }
  if (recipe.polaroidId) total += CATALOG.polaroids.find((p) => p.id === recipe.polaroidId)?.price ?? 0;
  if (recipe.stripCount) total += STRIP_TIERS[recipe.stripCount] ?? 0;
  return total;
}


export const fmt = (n: number) =>
  `${CONFIG.CURRENCY}${n.toLocaleString("en-IN")}`;
