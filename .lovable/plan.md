## Goal

Make every piece of media, copy stat, and external link on the site editable from **one single file** — no component hunting, no CSS. Then add a **tiled background system** so you can drop in 1920×1080 art tiles (head / repeating middle / tail) per section.

---

## Part 1 — One config file to rule them all

Create `src/lib/site-content.ts`. This becomes the ONLY file a non-coder edits. Every component reads from it.

```ts
// src/lib/site-content.ts
export const SITE = {
  // ---- Global background (page-wide) ----
  pageBackground: "/media/bg/page.jpg",  // or leave "" to use the CSS default

  // ---- Hero video / reel ----
  heroVideo: "/media/hero.mp4",
  heroPoster: "/media/hero-poster.jpg",

  // ---- Reels / Instagram / social embeds ----
  reels: [
    { id: "r1", thumbnail: "/media/reels/reel-1.jpg", href: "https://instagram.com/reel/XXXX" },
    { id: "r2", thumbnail: "/media/reels/reel-2.jpg", href: "https://instagram.com/reel/YYYY" },
    { id: "r3", thumbnail: "/media/reels/reel-3.jpg", href: "https://instagram.com/reel/ZZZZ" },
  ],

  // ---- External links (LinkedIn, Behind The Layout, etc.) ----
  links: {
    behindTheLayout: "https://drive.google.com/…",
    linkedin: "https://linkedin.com/company/the-layout",
    instagram: "https://instagram.com/thelayout",
  },

  // ---- Journey / Stats section (Step 1 block) ----
  stats: {
    title: "Our Journey in Numbers",
    subtitle: "Trusted by shoppers across India",
    blocks: [
      { big: "70,000+", small: "Orders Delivered" },
      { big: "45,000+", small: "Customer Reviews" },
      { big: "4.5 / 5.0", small: "Total Review Rating", progress: 90 }, // % filled
    ],
  },

  // ---- Product images (for the e-commerce modal) ----
  // Keyed by product id from catalog.ts
  productImages: {
    "str-1":     ["/media/products/strip-1-a.jpg", "/media/products/strip-1-b.jpg"],
    "pol-mini":  ["/media/products/pol-mini-a.jpg", "/media/products/pol-mini-b.jpg"],
    "add-wrap":  ["/media/products/wrap-a.jpg", "/media/products/wrap-b.jpg"],
    // …one entry per product
  },

  // ---- Founders ----
  founders: [
    { name: "Founder A", role: "Creative Director", photo: "/media/founders/a.jpg", bio: "…" },
    { name: "Founder B", role: "Operations",        photo: "/media/founders/b.jpg", bio: "…" },
  ],
};
```

### Where the media lives

- Put all media in `public/media/…` (folders: `hero/`, `reels/`, `products/`, `founders/`, `bg/`).
- Anything in `public/` is served at the same path — `public/media/hero.mp4` → `/media/hero.mp4`.
- **To update:** the client just replaces a file in the right folder OR edits a string in `site-content.ts`. No build knowledge needed.

### Rewire existing components

- `src/routes/index.tsx` (hero, reels, founders, journey, Behind-The-Layout link) → read from `SITE.*`.
- `src/components/site/shop.tsx` `ProductModal` → read images from `SITE.productImages[product.id]` (fallback to a placeholder).
- Remove hardcoded stat numbers / URLs / image paths from JSX.

### A tiny `MEDIA.md` cheat-sheet at project root

Plain-English 20-line guide: "To change hero video, drop a new file at `public/media/hero.mp4`. To change a stat, open `src/lib/site-content.ts` and edit the number in quotes." That's it.

---

## Part 2 — Tiled background system (head / repeat / tail)

**Short answer: yes, this works perfectly.** It's just three stacked `background-image` layers on a section. No JS.

### How it works

A section becomes a vertical strip. You provide up to three 1920×1080 (or any) PNG/JPG/WebP tiles:

```text
┌──────────────┐  head.jpg   (drawn once, top)
├──────────────┤
│              │
│  repeat.jpg  │ (tiled vertically as many times as needed to fill middle)
│              │
├──────────────┤
│  tail.jpg    │ (drawn once, bottom)
└──────────────┘
```

CSS multi-background handles all three in one element. Middle repeats automatically based on section height — so a short section might show the repeat once, a long section shows it 8 times, no code change. Note: good but the tiles can also be svgs. let me know which one works best png, jpeg or svg.

### The reusable component

`src/components/site/TiledSection.tsx`:

```tsx
type Tiles = { head?: string; repeat?: string; tail?: string; tileHeight?: number };

export function TiledSection({ tiles, children, className = "" }: {
  tiles: Tiles; children: React.ReactNode; className?: string;
}) {
  const h = tiles.tileHeight ?? 1080;
  const layers: string[] = [];
  const positions: string[] = [];
  const repeats: string[] = [];
  const sizes: string[] = [];

  if (tiles.head)   { layers.push(`url(${tiles.head})`);   positions.push("top center");    repeats.push("no-repeat"); sizes.push("100% auto"); }
  if (tiles.tail)   { layers.push(`url(${tiles.tail})`);   positions.push("bottom center"); repeats.push("no-repeat"); sizes.push("100% auto"); }
  if (tiles.repeat) { layers.push(`url(${tiles.repeat})`); positions.push("center");        repeats.push("repeat-y");  sizes.push("100% auto"); }

  return (
    <section
      className={`relative ${className}`}
      style={{
        backgroundImage: layers.join(", "),
        backgroundPosition: positions.join(", "),
        backgroundRepeat: repeats.join(", "),
        backgroundSize: sizes.join(", "),
        paddingTop: tiles.head ? h * 0.4 : undefined,   // reserve space for head art
        paddingBottom: tiles.tail ? h * 0.4 : undefined,
      }}
    >
      {children}
    </section>
  );
}
```

Order matters in CSS: the **first** listed layer paints on top. Head + tail are listed before repeat so they cover the repeating tile where they overlap.

### Register tile sets in `site-content.ts`

```ts
backgrounds: {
  hero:      { head: "/media/bg/hero-single.jpg" }, // single tile — done
  customize: {
    head:   "/media/bg/customize-head.jpg",
    repeat: "/media/bg/customize-mid.jpg",
    tail:   "/media/bg/customize-tail.jpg",
  },
  journey:   { head: "/media/bg/journey.jpg" },
},
```

### Usage in a route

```tsx
<TiledSection tiles={SITE.backgrounds.customize}>
  {/* … existing customization UI unchanged … */}
</TiledSection>
```

### Rules for the client when creating tiles

- **Width:** design at 1920 px wide; the CSS scales to 100% container width, so on mobile it still looks right (bleeds off correctly).
- **Middle tile:** the **top and bottom edges must match** (seamless), otherwise you'll see a hard line where it repeats. Easiest: keep the middle a solid texture/pattern, no strong horizontal elements at the edges.
- **Head/tail:** can have unique art (curves, decorations); their inner edge should visually blend into the middle tile.
- **Format:** JPG for photos (~200-400 KB each), WebP if you can, PNG only when you need transparency.
- **Section height** = however tall the content is; the middle just repeats to fill. Nothing to configure.

### What if the client wants no tiles?

Pass `{}` or omit — the section renders with the normal page background. Zero risk.

---

## Files to add / change

- **New:** `src/lib/site-content.ts` (config)
- **New:** `src/components/site/TiledSection.tsx`
- **New:** `MEDIA.md` (client cheat-sheet)
- **New folders:** `public/media/{hero,reels,products,founders,bg}/` with placeholder files so paths resolve
- **Edit:** `src/routes/index.tsx` — read stats, hero, reels, founders, Behind-The-Layout link from `SITE`; wrap sections in `<TiledSection>` where desired
- **Edit:** `src/components/site/shop.tsx` — `ProductModal` reads images from `SITE.productImages[id]`

Won't touch: `catalog.ts` pricing, routing, existing utility classes, cart logic.

---

## After you approve

I'll implement all of the above in one pass, wire the existing sections to the config, and drop in placeholder tiles so you can see the head/repeat/tail behavior live. Then you swap the placeholder files with your real art whenever ready.

also write a detailed description of how the tiles should be made for each section so the client is able to understand how we are gonna make it, also please make sure the tiles that is the background is very easy to update on the go.