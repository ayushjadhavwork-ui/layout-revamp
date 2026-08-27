import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATALOG, STRIP_TIERS, STRIP_MAX, POCKET_TEMPLATE_LIMIT, COMBO_RECIPES, COUPON_FREEBIES, type Product, type Category, type SizeFormat } from "./catalog";


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
  // Set on "pocket" and "pocket-templates" lines only — ties a Pocket
  // Magazine cart line to its own template picks so multiple Pocket
  // Magazines can be bought in one order, each with an independent
  // template selection (see pocketUnits below).
  unit?: string;
};

export type PocketUnit = { uid: string; templateIds: string[] };

type State = {
  cart: CartItem[];
  // Magazine trim format the customer is shopping in — picked before a size.
  format: SizeFormat;
  selectedSizeId: string | null;
  selectedTemplateIds: string[];
  // One entry per Pocket Magazine the customer has added — each carries its
  // own independent template picks, so buying 2-3 Pocket Magazines together
  // means picking templates for each individually.
  pocketUnits: PocketUnit[];
  // Friendship Card quantity tier (Single/Duo) and its design picks — same
  // "parent selection drives a sub-selection limit" shape as
  // selectedSizeId/selectedTemplateIds above, but flat (only ever one
  // Friendship Card line at a time) rather than multi-unit like Pocket.
  selectedFriendshipId: string | null;
  selectedFriendshipDesignIds: string[];
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
  addPocketUnit: () => void;
  removePocketUnit: (uid: string) => void;
  togglePocketTemplate: (uid: string, id: string) => boolean; // returns success
  randomizePocketTemplates: (uid: string) => number; // returns count picked
  // Selects/switches the Friendship Card quantity tier. If the previously
  // selected tier had more design picks than the new tier allows, keeps
  // only the first-picked design(s) and drops the rest (truncate, not a
  // full reset) — see catalog.ts's designLimit field.
  setFriendship: (friendId: string) => void;
  toggleFriendshipDesign: (id: string) => boolean; // returns success
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
  pocketTemplateLimit: () => number;
  friendshipDesignLimit: () => number;
};



const key = (cat: Category, id: string) => `${cat}:${id}`;

// Identifies one Pocket Magazine among several in the same cart — never
// persisted/parsed as meaningful data, just needs to be unique per unit.
const genUid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// Manually picking a size/template/addon/strip overrides whatever a combo
// auto-selected — drop the combo (and its linked lines) so we never end up
// charging the combo price alongside a separately-priced duplicate item.
const dropCombo = (cart: CartItem[]) => cart.filter((c) => c.category !== "combos" && !c.comboId);

// Categories no combo recipe ever touches — picking these alongside an active
// combo (delivery, the unrelated Newspaper/Pocket Magazine products, or a
// coupon freebie) must not blow away the combo.
const COMBO_INDEPENDENT: Category[] = ["delivery", "newspaper", "pocket", "pocket-templates", "friendship", "friendship-designs", "promotions"];

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
  pocketUnits: [],
  selectedFriendshipId: null,
  selectedFriendshipDesignIds: [],
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
    // Single-choice categories (only one active at a time). Pocket Magazines
    // are deliberately excluded — they're multi-unit and go through
    // addPocketUnit/removePocketUnit, never through addItem.
    const singleChoice: Category[] = ["addons", "polaroids", "strips", "delivery", "sizes", "combos", "newspaper", "friendship"];
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
      let cart = s.cart.filter((c) => c.key !== k);
      const patch: Partial<State> = { cart };
      if (item?.category === "sizes") {
        patch.selectedSizeId = null;
        patch.selectedTemplateIds = [];
      }
      if (item?.category === "templates") {
        patch.selectedTemplateIds = s.selectedTemplateIds.filter((id) => id !== item.id);
      }
      // Removing a Pocket Magazine unit (e.g. via the cart drawer's trash
      // icon) must also drop the templates picked for that specific unit —
      // they're meaningless without it — but leave any other Pocket
      // Magazine units in the cart untouched.
      if (item?.category === "pocket") {
        const uid = item.unit;
        cart = cart.filter((c) => !(c.category === "pocket-templates" && c.unit === uid));
        patch.cart = cart;
        patch.pocketUnits = s.pocketUnits.filter((u) => u.uid !== uid);
      }
      if (item?.category === "pocket-templates") {
        const uid = item.unit;
        patch.pocketUnits = s.pocketUnits.map((u) =>
          u.uid === uid ? { ...u, templateIds: u.templateIds.filter((id) => id !== item.id) } : u,
        );
      }
      if (item?.category === "friendship") {
        cart = cart.filter((c) => c.category !== "friendship-designs");
        patch.cart = cart;
        patch.selectedFriendshipId = null;
        patch.selectedFriendshipDesignIds = [];
      }
      if (item?.category === "friendship-designs") {
        patch.selectedFriendshipDesignIds = s.selectedFriendshipDesignIds.filter((id) => id !== item.id);
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

  // Adds one more Pocket Magazine to the cart, independent of any other
  // Pocket Magazine already there — each gets its own uid and empty
  // template selection, so buying several means picking templates for each
  // one separately.
  addPocketUnit: () => {
    const product = CATALOG.pocket[0];
    const uid = genUid();
    set((s) => ({
      cart: [
        ...s.cart,
        {
          key: key("pocket", `${product.id}#${uid}`),
          category: "pocket",
          id: product.id,
          name: product.name,
          price: product.price,
          unit: uid,
        },
      ],
      pocketUnits: [...s.pocketUnits, { uid, templateIds: [] }],
    }));
  },

  removePocketUnit: (uid) => set((s) => ({
    cart: s.cart.filter((c) => !((c.category === "pocket" || c.category === "pocket-templates") && c.unit === uid)),
    pocketUnits: s.pocketUnits.filter((u) => u.uid !== uid),
  })),

  togglePocketTemplate: (uid, id) => {
    const s = get();
    const unit = s.pocketUnits.find((u) => u.uid === uid);
    if (!unit) return false;
    const limit = POCKET_TEMPLATE_LIMIT;
    const already = unit.templateIds.includes(id);
    if (!already && unit.templateIds.length >= limit) return false;
    const nextIds = already
      ? unit.templateIds.filter((t) => t !== id)
      : [...unit.templateIds, id];
    const tpl = CATALOG.templates.find((t) => t.id === id)!;
    const lineKey = `pocket-templates:${id}#${uid}`;
    set({
      pocketUnits: s.pocketUnits.map((u) => (u.uid === uid ? { ...u, templateIds: nextIds } : u)),
      cart: already
        ? s.cart.filter((c) => c.key !== lineKey)
        : [...s.cart, { key: lineKey, category: "pocket-templates", id, name: tpl.name, price: 0, unit: uid }],
    });
    return true;
  },

  randomizePocketTemplates: (uid) => {
    const s = get();
    const unit = s.pocketUnits.find((u) => u.uid === uid);
    if (!unit) return 0;
    const limit = POCKET_TEMPLATE_LIMIT;
    // Fisher–Yates shuffle
    const pool = [...CATALOG.templates];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, limit);
    const pickedIds = picked.map((t) => t.id);
    set({
      pocketUnits: s.pocketUnits.map((u) => (u.uid === uid ? { ...u, templateIds: pickedIds } : u)),
      cart: [
        ...s.cart.filter((c) => !(c.category === "pocket-templates" && c.unit === uid)),
        ...picked.map((tpl) => ({
          key: `pocket-templates:${tpl.id}#${uid}`,
          category: "pocket-templates" as Category,
          id: tpl.id,
          name: tpl.name,
          price: 0,
          unit: uid,
        })),
      ],
    });
    return picked.length;
  },


  // Selects a Friendship Card quantity tier for the first time, or switches
  // between Single/Duo. Unlike setSize (which fully resets templates),
  // switching tiers TRUNCATES the design picks to the new limit — keeping
  // the first-picked design(s) — rather than clearing them, per the
  // Friendship Card's own "downgrade keeps what still fits" spec.
  setFriendship: (friendId) => {
    const product = CATALOG.friendship.find((f) => f.id === friendId);
    if (!product) return;
    set((s) => {
      const newLimit = product.designLimit ?? 1;
      const keptIds = s.selectedFriendshipDesignIds.slice(0, newLimit);
      const droppedIds = s.selectedFriendshipDesignIds.slice(newLimit);
      const cart = [
        ...s.cart.filter(
          (c) => c.category !== "friendship" && !(c.category === "friendship-designs" && droppedIds.includes(c.id)),
        ),
        {
          key: key("friendship", product.id),
          category: "friendship" as Category,
          id: product.id,
          name: product.name,
          price: product.price,
        },
      ];
      return { selectedFriendshipId: friendId, selectedFriendshipDesignIds: keptIds, cart };
    });
  },

  toggleFriendshipDesign: (id) => {
    const s = get();
    if (!s.selectedFriendshipId) return false;
    const limit = get().friendshipDesignLimit();
    const already = s.selectedFriendshipDesignIds.includes(id);
    if (!already && s.selectedFriendshipDesignIds.length >= limit) return false;
    const nextIds = already
      ? s.selectedFriendshipDesignIds.filter((t) => t !== id)
      : [...s.selectedFriendshipDesignIds, id];
    const design = CATALOG["friendship-designs"].find((d) => d.id === id)!;
    set({
      selectedFriendshipDesignIds: nextIds,
      cart: already
        ? s.cart.filter((c) => c.key !== key("friendship-designs", id))
        : [...s.cart, { key: key("friendship-designs", id), category: "friendship-designs", id, name: design.name, price: 0 }],
    });
    return true;
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

  clear: () => set({
    cart: [],
    selectedSizeId: null,
    selectedTemplateIds: [],
    pocketUnits: [],
    selectedFriendshipId: null,
    selectedFriendshipDesignIds: [],
    stripSelections: [],
    coupon: null,
    cartId: null,
  }),


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
  pocketTemplateLimit: () => POCKET_TEMPLATE_LIMIT,
  friendshipDesignLimit: () => {
    const s = get();
    if (!s.selectedFriendshipId) return 0;
    return CATALOG.friendship.find((f) => f.id === s.selectedFriendshipId)?.designLimit ?? 0;
  },
    }),
    {
      name: "the-layout-cart",
      // v2: selectedPocketTemplateIds (one flat array, one Pocket Magazine)
      // replaced by pocketUnits (one entry per Pocket Magazine, each with
      // its own template picks — see the CartItem.unit comment above). A
      // plain merge would keep an old blob's "pocket" cart line(s) while
      // pocketUnits silently started empty — the picker would never render
      // for that line and the checkout gate (which walks pocketUnits)
      // wouldn't catch it, letting an incomplete order through. migrate()
      // strips any pre-v2 pocket/pocket-templates lines instead so old carts
      // just lose that one item rather than shipping incomplete.
      //
      // v3: the Friendship Card became a two-step quantity→design picker
      // (selectedFriendshipId/selectedFriendshipDesignIds, new
      // "friendship-designs" category) instead of a single addItem'd SKU
      // line. Same risk as v2: an old blob's "friendship" cart line has no
      // matching selectedFriendshipId, so the new design-limit gate would
      // treat it as already-complete (limit 0) and let it through checkout
      // with zero designs picked. migrate() strips any pre-v3
      // friendship/friendship-designs lines for the same reason v2 strips
      // pre-v2 pocket lines.
      version: 3,
      migrate: (persisted, version) => {
        const s = persisted as Record<string, unknown>;
        if (!s || typeof s !== "object" || version >= 3) return s;
        let cart = Array.isArray(s.cart) ? (s.cart as CartItem[]) : [];
        const patch: Record<string, unknown> = { ...s };
        if (version < 2) {
          cart = cart.filter((c) => c.category !== "pocket" && c.category !== "pocket-templates");
          patch.pocketUnits = [];
        }
        cart = cart.filter((c) => c.category !== "friendship" && c.category !== "friendship-designs");
        patch.selectedFriendshipId = null;
        patch.selectedFriendshipDesignIds = [];
        patch.cart = cart;
        return patch;
      },
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
        pocketUnits: s.pocketUnits,
        selectedFriendshipId: s.selectedFriendshipId,
        selectedFriendshipDesignIds: s.selectedFriendshipDesignIds,
        stripSelections: s.stripSelections,
        coupon: s.coupon,
        cartId: s.cartId,
      }),
    },
  ),
);
