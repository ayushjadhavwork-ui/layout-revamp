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
  polaroids: [
    { id: "pol-mini",    name: "Mini Pack (9)",     price: 199, desc: "9 mini polaroids." },
    { id: "pol-classic", name: "Classic Pack (18)", price: 349, desc: "18 classic polaroids." },
    { id: "pol-premium", name: "Premium Pack (36)", price: 599, desc: "36 premium polaroids." },
  ],
  strips: [
    { id: "str-1", name: "1 Strip",  price: 100, desc: "A single polaroid strip." },
    { id: "str-2", name: "2 Strips", price: 125, desc: "Two polaroid strips." },
    { id: "str-3", name: "3 Strips", price: 175, desc: "Three polaroid strips." },
    { id: "str-4", name: "4 Strips", price: 220, desc: "Four polaroid strips." },
    { id: "str-5", name: "5 Strips", price: 275, desc: "Five polaroid strips." },
  ],
  delivery: [
    { id: "del-std", name: "Standard Delivery", price: 0,   desc: "Free — arrives in 7-8 days." },
    { id: "del-exp", name: "Express Shipping",  price: 149, desc: "Priority — arrives in 3-4 days." },
  ],
};

export const fmt = (n: number) =>
  `${CONFIG.CURRENCY}${n.toLocaleString("en-IN")}`;
