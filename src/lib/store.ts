import { create } from "zustand";
import { CATALOG, STRIP_TIERS, STRIP_MAX, type Product, type Category } from "./catalog";


export type CartItem = {
  key: string;
  category: Category;
  id: string;
  name: string;
  price: number;
  note?: string;
};

type State = {
  cart: CartItem[];
  selectedSizeId: string | null;
  selectedTemplateIds: string[];
  stripSelections: string[];
  coupon: { code: string; percent: number } | null;
  cartId: string | null;
  customer: null | { name: string; phone: string; email: string; address: string };

  addItem: (category: Category, product: Product, note?: string) => void;
  removeItem: (key: string) => void;
  setSize: (sizeId: string) => void;
  toggleTemplate: (id: string) => boolean; // returns success
  toggleStrip: (id: string) => boolean; // returns success; false if cap reached
  setCoupon: (c: State["coupon"]) => void;
  setCustomer: (c: State["customer"]) => void;
  setCartId: (id: string | null) => void;
  clear: () => void;

  subtotal: () => number;
  discount: () => number;
  total: () => number;
  templateLimit: () => number;
};


const key = (cat: Category, id: string) => `${cat}:${id}`;

export const useStore = create<State>((set, get) => ({
  cart: [],
  selectedSizeId: null,
  selectedTemplateIds: [],
  stripSelections: [],
  coupon: null,
  cartId: null,
  customer: null,


  addItem: (category, product, note) => {
    // Single-choice categories (only one active at a time)
    const singleChoice: Category[] = ["addons", "polaroids", "strips", "delivery", "sizes"];
    set((s) => {
      let cart = s.cart;
      if (singleChoice.includes(category)) {
        cart = cart.filter((c) => c.category !== category);
      }
      const k = key(category, product.id);
      if (!singleChoice.includes(category) && cart.some((c) => c.key === k)) return s;
      return {
        cart: [...cart, { key: k, category, id: product.id, name: product.name, price: product.price, note }],
      };
    });
  },

  removeItem: (k) => set((s) => {
    const item = s.cart.find((c) => c.key === k);
    const patch: Partial<State> = { cart: s.cart.filter((c) => c.key !== k) };
    if (item?.category === "sizes") {
      patch.selectedSizeId = null;
      patch.selectedTemplateIds = [];
    }
    if (item?.category === "templates") {
      patch.selectedTemplateIds = s.selectedTemplateIds.filter((id) => id !== item.id);
    }
    return patch as State;
  }),

  setSize: (sizeId) => {
    const size = CATALOG.sizes.find((s) => s.id === sizeId);
    if (!size) return;
    set((s) => ({
      selectedSizeId: sizeId,
      selectedTemplateIds: [],
      cart: [
        ...s.cart.filter((c) => c.category !== "sizes" && c.category !== "templates"),
        { key: key("sizes", size.id), category: "sizes", id: size.id, name: size.name, price: size.price },
      ],
    }));
  },

  toggleTemplate: (id) => {
    const s = get();
    if (!s.selectedSizeId) return false;
    const limit = get().templateLimit();
    const already = s.selectedTemplateIds.includes(id);
    if (!already && s.selectedTemplateIds.length >= limit) return false;
    const nextIds = already
      ? s.selectedTemplateIds.filter((t) => t !== id)
      : [...s.selectedTemplateIds, id];
    const tpl = CATALOG.templates.find((t) => t.id === id)!;
    set({
      selectedTemplateIds: nextIds,
      cart: already
        ? s.cart.filter((c) => c.key !== key("templates", id))
        : [...s.cart, { key: key("templates", id), category: "templates", id, name: tpl.name, price: 0 }],
    });
    return true;
  },

  setCoupon: (coupon) => set({ coupon }),
  setCustomer: (customer) => set({ customer }),
  setCartId: (cartId) => set({ cartId }),
  clear: () => set({ cart: [], selectedSizeId: null, selectedTemplateIds: [], coupon: null, cartId: null }),

  subtotal: () => get().cart.reduce((s, c) => s + c.price, 0),
  discount: () => {
    const sub = get().subtotal();
    const c = get().coupon;
    if (!c) return 0;
    return Math.round((sub * c.percent) / 100);
  },
  total: () => Math.max(0, get().subtotal() - get().discount()),
  templateLimit: () => {
    const s = get();
    if (!s.selectedSizeId) return 0;
    return CATALOG.sizes.find((sz) => sz.id === s.selectedSizeId)?.templateLimit ?? 0;
  },
}));
