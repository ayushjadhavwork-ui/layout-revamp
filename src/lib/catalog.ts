// ===========================================================
// The Layout — product catalogue + backend config
// Update GAS_URL after deploying Code.gs as a Web App.
// ===========================================================

export const CONFIG = {
  GAS_URL: "REPLACE_WITH_YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL",
  UPI_ID: "yourupi@bank",
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
  | "delivery";


export type Product = {
  id: string;
  name: string;
  price: number;
  desc: string;
  templateLimit?: number;
};

export const CATALOG: Record<Exclude<Category, "templates">, Product[]> & {
  templates: Product[];
} = {
  sizes: [
    { id: "sz-4",  name: "4 Pages",  price: 699,  templateLimit: 1,  desc: "4 pages + front & back cover. 1 template." },
    { id: "sz-6",  name: "6 Pages",  price: 799,  templateLimit: 3,  desc: "6 pages + front & back cover. 3 templates." },
    { id: "sz-8",  name: "8 Pages",  price: 999,  templateLimit: 5,  desc: "8 pages + front & back cover. 5 templates." },
    { id: "sz-12", name: "12 Pages", price: 1200, templateLimit: 9,  desc: "12 pages + front & back cover. 9 templates." },
    { id: "sz-14", name: "14 Pages", price: 1325, templateLimit: 11, desc: "14 pages + front & back cover. 11 templates." },
    { id: "sz-16", name: "16 Pages", price: 1449, templateLimit: 13, desc: "16 pages + front & back cover. 13 templates." },
    { id: "sz-18", name: "18 Pages", price: 1650, templateLimit: 15, desc: "18 pages + front & back cover. 15 templates." },
    { id: "sz-20", name: "20 Pages", price: 1850, templateLimit: 17, desc: "20 pages + front & back cover. 17 templates." },
  ],
  templates: Array.from({ length: 24 }, (_, i) => ({
    id: `tpl-${i + 1}`,
    name: `Template ${i + 1}`,
    price: 0,
    desc: "Curated aesthetic layout — included with your chosen package.",
  })),
  addons: [
    { id: "add-wrap",   name: "Gift Wrap",           price: 99,  desc: "Pastel gift wrap with ribbon." },
    { id: "add-letter", name: "Handwritten Letter",  price: 149, desc: "A personal letter, penned by us." },
    { id: "add-combo",  name: "Combo (Wrap + Letter)", price: 219, desc: "Both — because why not?" },
  ],
  combos: [
    {
      id: "combo-main",
      name: "Main Character Pack",
      price: 1049,
      desc: "8-Page Custom Magazine + Gift Wrap + Personalized Letter. Everything you need to feel like the main character. You save ₹50.",
    },
    {
      id: "combo-core",
      name: "Core Memory Pack",
      price: 1379,
      desc: "12-Page Custom Magazine + Classic Polaroid Pack (18 Photos) + 1 Polaroid Strip. A whole core memory in a box. You save ₹71.",
    },
    {
      id: "combo-soft",
      name: "Soft Launch Bundle",
      price: 1699,
      desc: "16-Page Custom Magazine + Memory Polaroid Pack (27 Photos) + Gift Wrap + Personalized Letter. The full soft launch treatment. You save ₹70.",
    },
  ],

  polaroids: [
    { id: "pol-mini",    name: "Mini Pack",    price: 80,  desc: "9 mini polaroids — matte finish, keepsake-ready." },
    { id: "pol-classic", name: "Classic Pack", price: 150, desc: "18 classic polaroids — the everyday memory stack." },
    { id: "pol-memory",  name: "Memory Pack",  price: 220, desc: "27 polaroids to tell the whole story." },
    { id: "pol-premium", name: "Premium Pack", price: 280, desc: "36 premium polaroids — the full collection." },
  ],
  strips: [
    { id: "strip-1", name: "Strip 1", price: 0, desc: "Editorial polaroid strip — design 1." },
    { id: "strip-2", name: "Strip 2", price: 0, desc: "Editorial polaroid strip — design 2." },
    { id: "strip-3", name: "Strip 3", price: 0, desc: "Editorial polaroid strip — design 3." },
    { id: "strip-4", name: "Strip 4", price: 0, desc: "Editorial polaroid strip — design 4." },
    { id: "strip-5", name: "Strip 5", price: 0, desc: "Editorial polaroid strip — design 5." },
  ],
  delivery: [
    { id: "del-std", name: "Standard Delivery", price: 0,   desc: "Free — arrives in 7-8 days." },
    { id: "del-exp", name: "Express Shipping",  price: 149, desc: "Priority — arrives in 3-4 days." },
  ],
};

// Tier pricing for polaroid strips, indexed by number of strips selected (1..5).
export const STRIP_TIERS: Record<number, number> = {
  1: 100,
  2: 125,
  3: 175,
  4: 220,
  5: 275,
};
export const STRIP_MAX = 5;


export const fmt = (n: number) =>
  `${CONFIG.CURRENCY}${n.toLocaleString("en-IN")}`;
