import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATALOG, STRIP_TIERS, STRIP_MAX, COMBO_RECIPES, COUPON_FREEBIES, type Product, type Category, type SizeFormat } from "./catalog";


export type CartItem = {
  key: string;
  category: Category;
  id: string;
  name: string;
  price: number;
  note?: string;
  // Set when this line was auto-added by a combo pack — it's priced at 0
  // (the combo's own line carries the real charge) and can only be
  // removed by deselecting the combo itself.
  comboId?: string;
  // Set when this line is a free item granted by a redeemed coupon code
  // (see applyCouponFreebie) — tracks which code granted it so a new coupon
  // can cleanly swap it out.
  promoCode?: string;
};

type State = {
  cart: CartItem[];
  // Magazine trim format the customer is shopping in — picked before a size.
  format: SizeFormat;
  selectedSizeId: string | null;
  selectedTemplateIds: string[];
  stripSelections: string[];
  coupon: { code: string; percent: number } | null;
  cartId: string | null;
  customer: null | { name: string; phone: string; email: string; address: string };

  addItem: (category: Category, product: Product, note?: string) => void;
  removeItem: (key: string) => void;
  setFormat: (format: SizeFormat) => void;
  setSize: (sizeId: string) => void;
  toggleTemplate: (id: string) => boolean; // returns success
  randomizeTemplates: () => number; // returns count picked
  toggleStrip: (id: string) => boolean; // returns success; false if cap reached
  setCoupon: (c: State["coupon"]) => void;
  applyCouponFreebie: (code: string) => void;
  setCustomer: (c: State["customer"]) => void;
  setCartId: (id: string | null) => void;
  selectCombo: (combo: Product) => void;
  deselectCombo: (comboId: string) => void;
  clear: () => void;

  subtotal: () => number;
  discount: () => number;
  total: () => number;
  templateLimit: () => number;
};



const key = (cat: Category, id: string) => `${cat}:${id}`;

// Manually picking a size/template/addon/strip overrides whatever a combo
// auto-selected — drop the combo (and its linked lines) so we never end up
// charging the combo price alongside a separately-priced duplicate item.
const dropCombo = (cart: CartItem[]) => cart.filter((c) => c.category !== "combos" && !c.comboId);

// Categories no combo recipe ever touches — picking these alongside an active
// combo (delivery, the unrelated Newspaper Magazine product, or a coupon
// freebie) must not blow away the combo.
const COMBO_INDEPENDENT: Category[] = ["delivery", "newspaper", "promotions"];

// Categories a combo recipe can auto-populate — selecting a combo must clear
// any of these picked manually beforehand, or their real price would sit in
// the cart alongside the combo's flat price (double-charging the customer
// for e.g. the page size their combo already includes).
const COMBO_MANAGED: Category[] = ["sizes", "templates", "addons", "polaroids", "strips"];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
  cart: [],
  format: "standard",
  selectedSizeId: null,
  selectedTemplateIds: [],
  stripSelections: [],
  coupon: null,
  cartId: null,
  customer: null,

  // Switching format invalidates any size/template pick (IDs are
  // format-specific) and any active combo (combo recipes are Standard-only,
  // so a Mini switch would leave the cart misrepresenting the order).
  setFormat: (format) => set((s) => {
    if (s.format === format) return s;
    return {
      format,
      selectedSizeId: null,
      selectedTemplateIds: [],
      cart: dropCombo(s.cart).filter((c) => c.category !== "sizes" && c.category !== "templates"),
    };
  }),




  addItem: (category, product, note) => {
    // Single-choice categories (only one active at a time)
    const singleChoice: Category[] = ["addons", "polaroids", "strips", "delivery", "sizes", "combos", "newspaper"];
    set((s) => {
      let cart = (category === "combos" || COMBO_INDEPENDENT.includes(category)) ? s.cart : dropCombo(s.cart);
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


  removeItem: (k) => {
    const item = get().cart.find((c) => c.key === k);
    // A combo-linked line (comboId set) can't be removed on its own without
    // leaving the combo half-detached from the cart — removing any of its
    // pieces removes the whole combo cleanly instead.
    if (item?.comboId) {
      get().deselectCombo(item.comboId);
      return;
    }
    set((s) => {
      const patch: Partial<State> = { cart: s.cart.filter((c) => c.key !== k) };
      if (item?.category === "sizes") {
        patch.selectedSizeId = null;
        patch.selectedTemplateIds = [];
      }
      if (item?.category === "templates") {
        patch.selectedTemplateIds = s.selectedTemplateIds.filter((id) => id !== item.id);
      }
      if (item?.category === "strips") {
        patch.stripSelections = [];
      }
      return patch as State;
    });
  },


  setSize: (sizeId) => {
    const size = CATALOG.sizes.find((s) => s.id === sizeId);
    if (!size) return;
    set((s) => ({
      selectedSizeId: sizeId,
      selectedTemplateIds: [],
      cart: [
        ...dropCombo(s.cart).filter((c) => c.category !== "sizes" && c.category !== "templates"),
        { key: key("sizes", size.id), category: "sizes", id: size.id, name: size.name, price: size.price },
      ],
    }));
  },

  toggleTemplate: (id) => {
    const s = get();
    if (!s.selectedSizeId) return false;
    // Templates stay user-pickable even with a combo active — the combo
    // only fixes the page size (and thus the template limit); which specific
    // right/left spreads fill those slots is always the customer's choice.
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

  randomizeTemplates: () => {
    const s = get();
    if (!s.selectedSizeId) return 0;
    const limit = get().templateLimit();
    if (limit <= 0) return 0;
    // Fisher–Yates shuffle
    const pool = [...CATALOG.templates];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, limit);
    const pickedIds = picked.map((t) => t.id);
    set({
      selectedTemplateIds: pickedIds,
      cart: [
        ...s.cart.filter((c) => c.category !== "templates"),
        ...picked.map((tpl) => ({
          key: key("templates", tpl.id),
          category: "templates" as Category,
          id: tpl.id,
          name: tpl.name,
          price: 0,
        })),
      ],
    });
    return picked.length;
  },


  toggleStrip: (id) => {
    const s = get();
    // A manual strip change breaks an active combo cleanly rather than
    // leaving its auto-picked strip bundle half-detached from the cart.
    const hadCombo = s.cart.some((c) => c.category === "combos");
    if (hadCombo) {
      set({ selectedSizeId: null, selectedTemplateIds: [], stripSelections: [], cart: dropCombo(s.cart) });
      return false;
    }
    const already = s.stripSelections.includes(id);
    if (!already && s.stripSelections.length >= STRIP_MAX) return false;
    const next = already
      ? s.stripSelections.filter((x) => x !== id)
      : [...s.stripSelections, id];
    // Rebuild the single strips cart line
    const otherCart = s.cart.filter((c) => c.category !== "strips");
    let cart = otherCart;
    if (next.length > 0) {
      const price = STRIP_TIERS[next.length] ?? 0;
      const names = next
        .map((sid) => CATALOG.strips.find((st) => st.id === sid)?.name ?? sid)
        .join(", ");
      cart = [
        ...otherCart,
        {
          key: key("strips", "bundle"),
          category: "strips",
          id: "bundle",
          name: `Polaroid Strips × ${next.length}`,
          price,
          note: names,
        },
      ];
    }
    set({ stripSelections: next, cart });
    return true;
  },

  setCoupon: (coupon) => set({ coupon }),

  // Some Spin-the-Wheel codes (SPINPOLA/SPINLETTER/SPINSTICK) grant a free
  // item rather than a % discount. Only one redeemed coupon is active at a
  // time, so swap out any previously-granted freebie for the new one.
  applyCouponFreebie: (code) => set((s) => {
    const cart = s.cart.filter((c) => !c.promoCode);
    const productId = COUPON_FREEBIES[code.trim().toUpperCase()];
    if (!productId) return { cart };
    const product = CATALOG.promotions.find((p) => p.id === productId);
    if (!product) return { cart };
    return {
      cart: [
        ...cart,
        { key: `promo:${productId}`, category: "promotions", id: product.id, name: product.name, price: 0, promoCode: code },
      ],
    };
  }),

  setCustomer: (customer) => set({ customer }),
  setCartId: (cartId) => set({ cartId }),

  // Combos are a one-click bundle: picking one auto-selects its included
  // size/add-ons/polaroids/strips (random where there's a choice) and adds
  // them to the cart at price 0 — the combo's own line carries the real
  // charge, so the total is the combo price, not size+addons+combo. Templates
  // are the one exception: the combo only fixes how many the customer gets
  // (via the size's templateLimit) — which ones is always their own pick,
  // made afterwards in the Templates section same as a non-combo order.
  selectCombo: (combo) => {
    const recipe = COMBO_RECIPES[combo.id];
    set((s) => {
      // Only one combo (and its linked items) can be active at a time, and
      // any manually-picked size/template/addon/polaroid/strip must go too —
      // otherwise its real price sits in the cart on top of the combo price.
      const cart = s.cart.filter((c) => c.category !== "combos" && !c.comboId && !COMBO_MANAGED.includes(c.category));
      const linked: CartItem[] = [];
      let selectedSizeId = s.selectedSizeId;
      let selectedTemplateIds: string[] = [];
      let stripSelections = s.stripSelections;

      if (recipe?.sizeId) {
        const size = CATALOG.sizes.find((sz) => sz.id === recipe.sizeId);
        if (size) {
          selectedSizeId = size.id;
          linked.push({ key: `combo:${combo.id}:size`, category: "sizes", id: size.id, name: size.name, price: 0, comboId: combo.id });
        }
      }

      for (const aid of recipe?.addonIds ?? []) {
        const addon = CATALOG.addons.find((a) => a.id === aid);
        if (addon) linked.push({ key: `combo:${combo.id}:addon:${addon.id}`, category: "addons", id: addon.id, name: addon.name, price: 0, comboId: combo.id });
      }

      if (recipe?.polaroidId) {
        const pol = CATALOG.polaroids.find((p) => p.id === recipe.polaroidId);
        if (pol) linked.push({ key: `combo:${combo.id}:pol:${pol.id}`, category: "polaroids", id: pol.id, name: pol.name, price: 0, comboId: combo.id });
      }

      if (recipe?.stripCount) {
        const pool = [...CATALOG.strips];
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const picked = pool.slice(0, recipe.stripCount);
        stripSelections = picked.map((st) => st.id);
        linked.push({
          key: `combo:${combo.id}:strips`,
          category: "strips",
          id: "bundle",
          name: `Polaroid Strips × ${picked.length}`,
          price: 0,
          note: picked.map((st) => st.name).join(", "),
          comboId: combo.id,
        });
      }

      const comboLine: CartItem = { key: key("combos", combo.id), category: "combos", id: combo.id, name: combo.name, price: combo.price };

      return { cart: [...cart, comboLine, ...linked], selectedSizeId, selectedTemplateIds, stripSelections };
    });
  },

  deselectCombo: (comboId) => set((s) => ({
    // Templates the customer picked while the combo was active never carry
    // comboId (they're freely chosen, not auto-linked) — but they're
    // meaningless without the size context the combo provided, so clear
    // them too rather than leaving orphaned template lines in the cart.
    cart: s.cart.filter((c) => !(c.category === "combos" && c.id === comboId) && c.comboId !== comboId && c.category !== "templates"),
    selectedSizeId: null,
    selectedTemplateIds: [],
    stripSelections: [],
  })),

  clear: () => set({ cart: [], selectedSizeId: null, selectedTemplateIds: [], stripSelections: [], coupon: null, cartId: null }),


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
    }),
    {
      name: "the-layout-cart",
      version: 1,
      // Hydration is triggered manually (see __root.tsx) after mount, not
      // automatically at store-creation time — the store module re-evaluates
      // fresh on the client, so an automatic hydrate would apply localStorage
      // state before React's first client render, mismatching the
      // server-rendered (always-empty) HTML and tripping hydration errors.
      skipHydration: true,
      // customer is deliberately excluded — re-collecting shipping/contact
      // details after a refresh is a small ask next to losing the whole cart,
      // and it avoids quietly resurrecting stale PII from localStorage.
      partialize: (s) => ({
        cart: s.cart,
        format: s.format,
        selectedSizeId: s.selectedSizeId,
        selectedTemplateIds: s.selectedTemplateIds,
        stripSelections: s.stripSelections,
        coupon: s.coupon,
        cartId: s.cartId,
      }),
    },
  ),
);
