## Goal

Split **Polaroid Strips** and **Polaroid Packs** off from the generic `ProductGrid` and give each its own custom, dedicated layout — strips must render as **tall, full-scale vertical strips** (like the catalogue screenshot), and packs must look like **real stacked polaroids**. Both sections keep the "click to add / View More for details" pattern, but View More opens a modal that preserves the correct aspect: strips stay tall, packs stay square.

The rest of the shop (sizes, templates, add-ons, delivery) keeps using the existing `ProductGrid` / `ProductModal` — untouched.

---

## What each section will look like

### Polaroid Strips (Step 5)

Replaces the current 2-3-col grid with a **horizontal rail of 5 tall strips** — one per SKU, matching the catalogue exactly:

```text
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│        │ │        │ │        │ │        │ │        │
│Strip 1 │ │Strip 2 │ │Strip 3 │ │Strip 4 │ │Strip 5 │
│ (tall) │ │ (tall) │ │ (tall) │ │ (tall) │ │ (tall) │
│        │ │        │ │        │ │        │ │        │
│        │ │        │ │        │ │        │ │        │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
  ₹100      ₹125      ₹175      ₹220      ₹275
[Select]   [Select]  [Select]  [Select]  [Select]
[View →]   [View →]  [View →]  [View →]  [View →]
```

- Each card = a vertical rectangle at roughly **3:8** aspect ratio (matches a real photo strip).
- Placeholder tile: layered pastel bands + "Strip N" label + tiny caption, styled to *feel* like a photo strip so the layout reads correctly before real images land.
- When you drop 5 real strip images into `public/media/strips/strip-1.jpg` … `strip-5.jpg` (already wired via `SITE.productImages` keys `str-1`..`str-5`), the placeholders swap out automatically — the shape stays identical.
- Selected state: `ring-2 ring-rose-wine` + a small ✓ badge in the top-right corner.
- Horizontal scroll on mobile (`overflow-x-auto snap-x`), 5-across on desktop.

**View More modal (StripModal):**
- Left = the **full-length strip at real scale** (same 3:8 tall image, up to ~560px tall on desktop, no cropping).
- Right = title, ₹price, long description, "Add to Cart" pill, review section (reuses same review UI as ProductModal).
- Same modal shell, just a two-column layout that respects the strip's tall aspect instead of forcing 16:10.

### Polaroid Packs (Step 4)

Replaces the current card grid with 4 **real-polaroid-looking tiles**, matching the catalogue mockup:

```text
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ MINI PACK │   │CLASSIC    │   │ MEMORY    │   │ PREMIUM   │
│           │   │  PACK     │   │   PACK    │   │   PACK    │
│  ┌─────┐  │   │  ┌─────┐  │   │  ┌─────┐  │   │  ┌─────┐  │
│  │ 📷  │  │   │  │ 📷  │  │   │  │ 📷  │  │   │  │ 📷  │  │
│  │photo│  │   │  │photo│  │   │  │photo│  │   │  │photo│  │
│  └─────┘  │   │  └─────┘  │   │  └─────┘  │   │  └─────┘  │
│           │   │           │   │           │   │           │
│9 POLAROIDS│   │18POLAROIDS│   │27POLAROIDS│   │36POLAROIDS│
│  ₹80      │   │  ₹150     │   │  ₹220     │   │  ₹280     │
│ [Select]  │   │ [Select]  │   │ [Select]  │   │ [Select]  │
│[View More]│   │[View More]│   │[View More]│   │[View More]│
└───────────┘   └───────────┘   └───────────┘   └───────────┘
```

Each tile is styled as a **stacked polaroid**:
- Outer card: cream (`#f8ecd8` / catalogue brown accent), rounded, thin border.
- Inner: a square photo with white "polaroid frame" padding, subtle drop shadow, and a second/third card slightly rotated behind it (`rotate-[-3deg]`, `translate-x-1`) to sell the "stack of photos" effect.
- Camera icon top-center, pack name in uppercase serif, count below the photo, price in a pill at the bottom.
- Placeholder photos: I'll AI-generate 4 tasteful stock-style images (dried flowers / daisies / sunset sky / bedroom — matching the catalogue) at ~1024×1024 and drop them into `src/assets/polaroids/`, then wire via `SITE.productImages` (`pol-mini`, `pol-classic`, `pol-memory`, `pol-premium`).

**View More modal (PackModal):**
- Same modal shell.
- Left = the polaroid photo in a **large white polaroid frame** (square-ish), preserving the "instant photo" look.
- Right = title, count ("9 Polaroids"), price, description, Add to Cart, reviews.

---

## Catalogue changes

`src/lib/catalog.ts` — replace the 3 pack entries with the 4 catalogue prices:

```ts
polaroids: [
  { id: "pol-mini",    name: "Mini Pack",    price: 80,  desc: "9 mini polaroids, matte-finish." },
  { id: "pol-classic", name: "Classic Pack", price: 150, desc: "18 classic polaroids." },
  { id: "pol-memory",  name: "Memory Pack",  price: 220, desc: "27 polaroids for the full story." },
  { id: "pol-premium", name: "Premium Pack", price: 280, desc: "36 premium polaroids, keepsake box." },
],
```

Strips catalogue already matches (₹100/125/175/220/275) — no changes.

---

## Files touched

**New**
- `src/components/site/strips-section.tsx` — `<StripsSection />` (custom grid) + `<StripModal />`
- `src/components/site/packs-section.tsx` — `<PacksSection />` (polaroid-styled grid) + `<PackModal />`
- `src/assets/polaroids/{mini,classic,memory,premium}.jpg` — AI-generated placeholder photos (4 files, one per pack)

**Edited**
- `src/lib/catalog.ts` — 4 packs at ₹80/150/220/280 (adds `pol-memory`, updates prices)
- `src/lib/site-content.ts` — swap `pol-premium` for the new keys; add polaroid image paths; add `str-1..5` placeholder pattern comments
- `src/routes/index.tsx` — swap the two `<ProductGrid category="strips" …>` and `<ProductGrid category="polaroids" …>` calls for `<StripsSection />` and `<PacksSection />`; wire their own modal state (independent from generic `ProductModal`)

**Untouched**
- `ProductGrid` / `ProductModal` in `src/components/site/shop.tsx` (still used for sizes, templates, add-ons, delivery)
- Cart, delivery ETA, store, backgrounds, routing, hero, journey, founders

---

## Technical notes

- **Zustand `useStore` reuse.** Both new sections use existing `addItem`/`removeItem` — no store changes; cart, single-choice logic for `polaroids` and `strips` (already enforced), and delivery ETA all keep working.
- **Aspect containers.** Strips use `aspect-[3/8]` on tiles and `max-h-[560px]` in the modal; packs use `aspect-square` for the inner photo. Both sit inside the existing pink/cream page background and respect the `TiledSection` wrap already registered under `SITE.backgrounds`.
- **Media swap-in.** Client drops files into `public/media/strips/*.jpg` (strips) and `public/media/products/pol-*.jpg` (packs); paths already reserved in `site-content.ts`. Removing my placeholder polaroid image imports later takes one line — the fallback stays.
- **View More parity.** New modals reuse the review form + toast pattern from `ProductModal` so behavior stays consistent (existing reviews shown, form to post one, "Add to cart" closes modal).

---

## Confirmed from your answers

1. **Strip images:** waiting on your 5 uploads → placeholder strip tiles now, swap-ready when you drop files.
2. **Pack pricing:** 4 packs — Mini ₹80, Classic ₹150, Memory ₹220, Premium ₹280.
3. **Pack photos:** I'll AI-generate 4 stylized polaroid-style placeholder photos to sell the look now.

Say the word and I'll build.