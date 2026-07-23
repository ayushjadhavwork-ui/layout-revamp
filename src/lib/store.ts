import { create } from "zustand";
import { CATALOG, STRIP_TIERS, STRIP_MAX, COMBO_RECIPES, type Product, type Category } from "./catalog";


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
  randomizeTemplates: () => number; // returns count picked
  toggleStrip: (id: string) => boolean; // returns success; false if cap reached
  setCoupon: (c: State["coupon"]) => void;
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
    const singleChoice: Category[] = ["addons", "polaroids", "strips", "delivery", "sizes", "combos"];
    set((s) => {
      let cart = category === "combos" ? s.cart : dropCombo(s.cart);
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
    if (item?.category === "strips") {
      patch.stripSelections = [];
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
        ...dropCombo(s.cart).filter((c) => c.category !== "sizes" && c.category !== "templates"),
        { key: key("sizes", size.id), category: "sizes", id: size.id, name: size.name, price: size.price },
      ],
    }));
  },

  toggleTemplate: (id) => {
    const s = get();
    if (!s.selectedSizeId) return false;
    // A manual template change breaks an active combo cleanly rather than
    // leaving its auto-picked size/templates half-detached from the cart.
    const hadCombo = s.cart.some((c) => c.category === "combos");
    if (hadCombo) {
      set({ selectedSizeId: null, selectedTemplateIds: [], cart: dropCombo(s.cart).filter((c) => c.category !== "sizes" && c.category !== "templates") });
      return false;
    }
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
    // Preserve combo linkage so re-rolling a combo's templates doesn't
    // orphan them from the combo they belong to.
    const comboId = s.cart.find((c) => c.category === "templates")?.comboId;
    set({
      selectedTemplateIds: pickedIds,
      cart: [
        ...s.cart.filter((c) => c.category !== "templates"),
        ...picked.map((tpl) => ({
          key: key("templates", tpl.id),
          category: "templates" as Category,
          id: tpl.id,
          name: tpl.name,
          comboId,
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
  setCustomer: (customer) => set({ customer }),
  setCartId: (cartId) => set({ cartId }),

  // Combos are a one-click bundle: picking one auto-selects its included
  // size/templates/add-ons/polaroids/strips (random where there's a choice)
  // and adds them to the cart at price 0 — the combo's own line carries the
  // real charge, so the total is the combo price, not size+addons+combo.
  selectCombo: (combo) => {
    const recipe = COMBO_RECIPES[combo.id];
    set((s) => {
      // Only one combo (and its linked items) can be active at a time.
      const cart = s.cart.filter((c) => c.category !== "combos" && !c.comboId);
      const linked: CartItem[] = [];
      let selectedSizeId = s.selectedSizeId;
      let selectedTemplateIds = s.selectedTemplateIds;
      let stripSelections = s.stripSelections;

      if (recipe?.sizeId) {
        const size = CATALOG.sizes.find((sz) => sz.id === recipe.sizeId);
        if (size) {
          selectedSizeId = size.id;
          linked.push({ key: `combo:${combo.id}:size`, category: "sizes", id: size.id, name: size.name, price: 0, comboId: combo.id });

          const limit = size.templateLimit ?? 0;
          const pool = [...CATALOG.templates];
          for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
          }
          const picked = pool.slice(0, limit);
          selectedTemplateIds = picked.map((t) => t.id);
          picked.forEach((t) =>
            linked.push({ key: `combo:${combo.id}:tpl:${t.id}`, category: "templates", id: t.id, name: t.name, price: 0, comboId: combo.id })
          );
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
    cart: s.cart.filter((c) => !(c.category === "combos" && c.id === comboId) && c.comboId !== comboId),
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
}));
