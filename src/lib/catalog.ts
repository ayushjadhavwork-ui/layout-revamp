// ===========================================================
// The Layout — product catalogue + backend config
// Update GAS_URL after deploying Code.gs as a Web App.
// ===========================================================

import { SITE } from "./site-content";
// ALL PRICES LIVE IN prices.ts — edit that file, not this one.
import { PRICES, priceOf, mrpOf } from "./prices";

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
  | "pocket"
  | "pocket-templates"
  | "friendship"
  | "friendship-designs"
  | "memory-card"
  | "memory-card-designs"
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
  // Struck-through "was" price — only Friendship Card entries carry this.
  mrp?: number;
  // How many Friendship Card designs this quantity tier allows (1 for
  // Single, 2 for Duo) — only "friendship" entries carry this. Mirrors
  // how a "sizes" entry's templateLimit drives that product's own
  // sub-selection cap (see friendshipDesignLimit() in store.ts).
  designLimit?: number;
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

// The pocket magazine is a strictly 6-page, single-SKU product — fixed page
// count, fixed template allowance, no size variants like the standard/mini
// packages above.
export const POCKET_TEMPLATE_LIMIT = 3;

// Reused by both the normal magazine's "templates" category and the pocket
// magazine's "pocket-templates" category — same 24 designs, same artwork.
// The category on the cart line (not the product id) is what distinguishes
// which magazine a picked template belongs to.
const TEMPLATES: Product[] = Array.from({ length: SITE.templateCount }, (_, i) => ({
  id: `tpl-${i + 1}`,
  name: `Template ${i + 1}`,
  price: 0,
  desc: "Curated aesthetic layout — included with your chosen package.",
}));

// The 4 Friendship Card design templates — front image is the thumbnail,
// back image is shown when the customer swipes past it in the detail modal
// (see FRIENDSHIP_DESIGN_IMAGE_COUNT convention in site-content.ts's
// productImages: ["<front>", "<back>"]). A customer picks 1 (Single) or up
// to 2 (Duo) of these, tracked separately from the quantity tier itself —
// see selectedFriendshipDesignIds / addFriendshipDesign in store.ts.
const FRIENDSHIP_DESIGNS: Product[] = Array.from({ length: 4 }, (_, i) => ({
  id: `card-${i + 1}`,
  name: `Card ${String(i + 1).padStart(2, "0")}`,
  price: 0,
  desc: "A curated Friendship Card design — front & back preview available.",
}));

const MEMORY_CARD_DESIGNS: Product[] = [
  { id: "memory-birthday", name: "The Birthday Card", price: 0, desc: SITE.memoryCardInfo["memory-birthday"].description },
  { id: "memory-friendship", name: "The Friendship Club Card", price: 0, desc: SITE.memoryCardInfo["memory-friendship"].description },
  { id: "memory-lover", name: "The Lover Era Card", price: 0, desc: SITE.memoryCardInfo["memory-lover"].description },
];

export const CATALOG: Record<Exclude<Category, "templates" | "pocket-templates">, Product[]> & {
  templates: Product[];
  "pocket-templates": Product[];
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

  templates: TEMPLATES,
  "pocket-templates": TEMPLATES,
  addons: [
    { id: "add-wrap",   name: "Gift Wrap",           price: priceOf("addons", "add-wrap"),   desc: "Pastel gift wrap with ribbon." },
    { id: "add-letter", name: "Handwritten Letter",  price: priceOf("addons", "add-letter"), desc: "A personal letter, penned by us." },
    { id: "add-combo",  name: "Combo (Wrap + Letter)", price: priceOf("addons", "add-combo"), desc: "Both — because why not?" },
  ],
  combos: [
    ...Array.from({ length: 9 }, (_, index) => {
      const id = `combo-${String(index + 1).padStart(2, "0")}`;
      const info = SITE.comboInfo[id];
      return { id, name: info.name, price: priceOf("combos", id), desc: info.description };
    }),
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

  // A standalone product within Step 1 — strictly 6 pages, pocket-sized, and
  // shoppable alongside (not instead of) a Standard/Mini magazine above.
  // Its own template picks happen in Step 2, tracked separately under the
  // "pocket-templates" category so they never collide with the main
  // magazine's template selection.
  pocket: [
    {
      id: "pocket-mag",
      name: "Pocket Magazine",
      price: priceOf("pocket", "pocket-mag"),
      templateLimit: POCKET_TEMPLATE_LIMIT,
      desc: "6 pages + front & back cover. 3 templates. Tiny in size, but made to hold the biggest memories — a pocket-sized magazine crafted with your photos and personality, stylish, personal, and easy to carry wherever you go.",
    },
  ],

  // A standalone product, same spirit as the Newspaper/Pocket Magazine —
  // not part of the magazine builder. Fully custom-printed friendship card,
  // sold as a quantity tier (Single/Duo) — picking one unlocks a design
  // pick step below (see "friendship-designs"), same two-step shape as
  // sizes → templates. The 3D viewer and customisation copy live in
  // friendship-section.tsx.
  friendship: [
    {
      id: "friend-single",
      name: "Single Card",
      price: priceOf("friendship", "friend-single"),
      mrp: mrpOf("friendshipMrp", "friend-single"),
      designLimit: 1,
      desc: "One fully personalised friendship card — names, photo, a shared date and place, inside jokes, and your own special rights, printed on premium cardstock. Pick 1 design.",
    },
    {
      id: "friend-duo",
      name: "Duo Card — BESTIE SET",
      price: priceOf("friendship", "friend-duo"),
      mrp: mrpOf("friendshipMrp", "friend-duo"),
      designLimit: 2,
      desc: "A matching pair of friendship cards for you and your bestie — same customisation as the Single Card, designed as a set. Pick up to 2 designs.",
    },
  ],

  // Design picks for the Friendship Card — a flat "which of the 4 designs"
  // selection, limited by the chosen quantity tier's designLimit (see
  // friendshipDesignLimit() in store.ts). Same relationship to "friendship"
  // as "templates" has to "sizes".
  "friendship-designs": FRIENDSHIP_DESIGNS,

  // One dynamic bundle line is rebuilt by the store as customers select
  // 1–3 designs. Its price comes from PRICES.memoryCardTiers.
  "memory-card": [],
  "memory-card-designs": MEMORY_CARD_DESIGNS,

  // Free items granted by redeeming a Spin-the-Wheel coupon code — never sold
  // directly, only ever added by applyCouponFreebie() in store.ts.
  promotions: [
    { id: "promo-strip",   name: "Free Polaroid Strip",       price: 0, desc: "Redeemed via spin-the-wheel coupon." },
    { id: "promo-letter",  name: "Free Personalized Letter",  price: 0, desc: "Redeemed via spin-the-wheel coupon." },
    { id: "promo-sticker", name: "Free Sticker Pack",         price: 0, desc: "Redeemed via spin-the-wheel coupon." },
    { id: "promo-postcard", name: "Free Postcard", price: 0, desc: "Included with a curated combo." },
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

export const MEMORY_CARD_TIERS: Record<number, number> = { ...PRICES.memoryCardTiers };
export const MEMORY_CARD_MAX = Object.keys(PRICES.memoryCardTiers).length;


// ===========================================================
// COMBO RECIPES — what a combo auto-selects when chosen.
// Templates are picked at random (up to the size's limit) since a combo
// is meant to be a one-click "just build it for me" bundle.
// ===========================================================
export type ComboRecipe = {
  sizeId?: string;
  newspaper?: boolean;
  pocketCount?: number;
  addonIds?: string[];
  polaroidId?: string;
  stripCount?: number;
  friendshipCount?: number;
  memoryCardCount?: number;
  freePostcard?: boolean;
};

export const COMBO_RECIPES: Record<string, ComboRecipe> = {
  "combo-01": { sizeId: "sz-6-mini", stripCount: 1, polaroidId: "pol-mini", addonIds: ["add-combo"], freePostcard: true },
  "combo-02": { sizeId: "sz-12-mini", memoryCardCount: 1, stripCount: 1, freePostcard: true },
  "combo-03": { newspaper: true, friendshipCount: 1, polaroidId: "pol-mini", freePostcard: true },
  "combo-04": { pocketCount: 1, memoryCardCount: 1, addonIds: ["add-letter"], polaroidId: "pol-classic", freePostcard: true },
  "combo-05": { friendshipCount: 2, memoryCardCount: 2, stripCount: 2, freePostcard: true },
  "combo-06": { sizeId: "sz-12", memoryCardCount: 1, friendshipCount: 1, freePostcard: true },
  "combo-07": { sizeId: "sz-14", stripCount: 1, addonIds: ["add-combo"], freePostcard: true },
  "combo-08": { sizeId: "sz-20-mini", friendshipCount: 1, memoryCardCount: 1, stripCount: 2, polaroidId: "pol-classic", freePostcard: true },
  "combo-09": { sizeId: "sz-18", polaroidId: "pol-mini", stripCount: 1, addonIds: ["add-combo"], friendshipCount: 1, memoryCardCount: 1, freePostcard: true },
};

// Real sum of what a combo's included items would cost bought separately —
// the "slashed" total shown next to the combo's flat price.
export function comboRealTotal(comboId: string): number {
  const recipe = COMBO_RECIPES[comboId];
  if (!recipe) return 0;
  let total = 0;
  if (recipe.sizeId) total += CATALOG.sizes.find((s) => s.id === recipe.sizeId)?.price ?? 0;
  if (recipe.newspaper) total += CATALOG.newspaper[0]?.price ?? 0;
  if (recipe.pocketCount) total += (CATALOG.pocket[0]?.price ?? 0) * recipe.pocketCount;
  for (const id of recipe.addonIds ?? []) {
    total += CATALOG.addons.find((a) => a.id === id)?.price ?? 0;
  }
  if (recipe.polaroidId) total += CATALOG.polaroids.find((p) => p.id === recipe.polaroidId)?.price ?? 0;
  if (recipe.stripCount) total += STRIP_TIERS[recipe.stripCount] ?? 0;
  if (recipe.friendshipCount) {
    const tier = recipe.friendshipCount > 1 ? "friend-duo" : "friend-single";
    total += CATALOG.friendship.find((item) => item.id === tier)?.price ?? 0;
  }
  if (recipe.memoryCardCount) total += MEMORY_CARD_TIERS[recipe.memoryCardCount] ?? 0;
  return total;
}


export const fmt = (n: number) =>
  `${CONFIG.CURRENCY}${n.toLocaleString("en-IN")}`;
