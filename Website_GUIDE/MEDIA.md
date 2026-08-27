# Editing The Layout — Client Guide

Everything a non-coder needs to update the site lives in **two places**:

1. `src/lib/site-content.ts` — the text, links, stats, and image *paths*.
2. `public/media/…` — the actual image / video files.

You do **not** need to touch any component file.

---

## 1. Quick edits (text, links, stats)

Open `src/lib/site-content.ts` and edit anything between quotes.

| I want to change…              | Edit this key in `site-content.ts`                                     |
| ------------------------------ | ---------------------------------------------------------------------- |
| The stats numbers (70k+ etc.)  | `stats.blocks`                                                         |
| "Behind The Layout" link       | `links.behindTheLayout`                                                |
| LinkedIn / Instagram / X links | `links.linkedin`, `links.instagram`, `links.twitter`                   |
| Instagram reels shown          | `reels` — paste/replace reel URLs                                      |
| Photo gallery ("Wall of memories") | `photoGallery` — see § 2b                                          |
| The scrolling top banner       | `marquee`                                                              |
| Founder names / bios           | `founders`                                                             |
| Milestone reel copy            | `milestoneReel`                                                        |
| How many templates exist       | `templateCount` — see § 2c                                             |

Save the file → the site updates automatically.

---

## 2. Swapping media (photos, videos)

Media files live in `public/media/`. The site references them by URL path
that matches the folder structure — `public/media/hero.jpg` becomes `/media/hero.jpg`.

**Recommended folders:**

```
public/media/
├── hero/           ← hero images / video posters
├── founders/       ← founder headshots
├── products/       ← product photos (used in the shop modal)
├── reels/          ← reel thumbnails if needed
├── photo gallery/  ← "Wall of memories" grid (see § 2b)
├── templates/      ← magazine template spreads (see § 2c)
├── combos/         ← combo bundle cover shots (see § 2d)
├── delivery/       ← delivery-option cover shots (see § 2d)
├── newspaper/      ← newspaper spread previews (see § 2d)
├── pocket/         ← Pocket Magazine card thumbnail (see § 2d)
├── friendship/     ← Friendship Card 3D model (§ 2e) + design images (§ 2f)
└── bg/             ← background tiles (see § 3)
```

**Two ways to swap a media file:**

- **Same filename** → drop the new file with the exact same name and location.
  No code edit needed.
- **New filename** → drop the new file, then update the matching path in
  `site-content.ts`.

**Product images** live under `productImages` in `site-content.ts`,
keyed by the product id (`strip-1`, `pol-mini`, `add-wrap`, …). Example:

```ts
"strip-1": ["/media/strips/1-a.jpg", "/media/strips/1-b.jpg"],
```

Leave the array `[]` (or leave the line commented out) and the modal falls
back to an auto-generated gradient tile.

**Filename case matters.** The live site is hosted on a case-sensitive
server — `Photo.JPG` and `photo.jpg` are different files there even though
Windows/Mac treat them as the same. Whatever case the file has in
`public/media/…`, copy that exact case into the path in `site-content.ts`.

### 2b. The "Wall of memories" photo gallery

This is the self-refreshing 3×3 grid below the Reels section. It's driven
entirely by the `photoGallery` array in `site-content.ts`:

```ts
photoGallery: [
  "/media/photo%20gallery/1.JPG",
  "/media/photo%20gallery/2.JPG",
  // ...
],
```

- **The first entry in the list always sits in the center tile** and never
  changes. The other 8 tiles keep cycling through the rest of the list.
- **To add a photo:** drop the file into `public/media/photo gallery/` and
  add its path as a new line (all 38 currently in that folder are already
  listed — just append `39.jpg`, etc. as you add more).
- **To remove a photo:** delete or comment out its line.
- The folder name has a space in it, so the URL uses `%20` in place of the
  space — keep that when adding new lines.

### 2c. Adding more templates

The Templates section is generated from a single number:

```ts
templateCount: 24,
```

To add template #25: bump this to `25`, drop the new spread image at
`public/media/templates/25.jpg`, and add a line for it under
`productImages` in the same file:

```ts
"tpl-25": ["/media/templates/25.jpg"],
```

Until you add that image line, the new template card just shows the
built-in placeholder — it won't break anything to bump the count first and
add art later.

### 2d. Combos, Delivery, and Newspaper images

These sections work exactly like any other product — add an entry under
`productImages` keyed by the product id and it'll show up automatically.
The ids are already listed as commented-out examples in `site-content.ts`;
just uncomment and point them at your files:

| Section    | Product ids                              |
| ---------- | ----------------------------------------- |
| Combos     | `combo-main`, `combo-core`, `combo-soft`  |
| Delivery   | `del-std`, `del-exp`                      |
| Newspaper  | `news-tpl-1`, `news-tpl-2` (the two fixed spread previews — the newspaper product itself has no separate cover slot) |
| Pocket Magazine | `pocket-mag` (first entry = card thumbnail; its Step 2 template picks reuse the same `tpl-<n>` art as the normal magazine) |
| Friendship Card designs | `card-1`..`card-4` — each takes a front/back pair, see § 2f |

### 2e. Friendship Card — 3D model

Unlike every other product, the Friendship Card section shows an interactive,
auto-rotating 3D model instead of a photo. To swap it:

1. Export your model as a **.glb** file (glTF binary — the standard format
   for web 3D; Blender, Sketchfab, and most 3D tools can export it directly).
2. Drop it at `public/media/friendship/friendship-card-placeholder.glb`,
   keeping the exact filename — or give it a new name and update
   `friendshipCardModel` near the top of `site-content.ts`.
3. Keep the file reasonably small (a few MB at most) — it downloads fully
   before the model appears. Compress textures / reduce polygon count in
   your 3D tool if it's large.

The current file is a plain placeholder card shape (no real artwork) —
replace it with a real scan or model whenever one's ready. No other code
changes needed; the viewer (drag to rotate, pinch/scroll to zoom, slow
auto-rotate) works with any valid .glb dropped in that same spot.

### 2f. Friendship Card — design template images

Below the 3D model, the customer picks 1 or 2 of **4 fixed designs**
(Card 01–Card 04), each a "Friendship Licence" card. Each design needs
**two images** — a front and a back (the customer swipes between them in
the pop-up detail view) — live in `public/media/friendship/` as:

```
CARD_01_FRONT.webp   CARD_01_BACK.webp
CARD_02_FRONT.webp   CARD_02_BACK.webp
CARD_03_FRONT.webp   CARD_03_BACK.webp
CARD_04_FRONT.webp   CARD_04_BACK.webp
```

(Uppercase — the live site is on a case-sensitive host, so `Card_01_front`
or `card_01_front` would **not** match. Match the case above exactly if
you're replacing a file.)

The front image is what shows as the thumbnail in the picker grid; the back
is only seen in the pop-up. These paths are wired up in `productImages` in
`site-content.ts` — to swap the art, drop a replacement file in at the same
name (no code edit needed). If a file is ever missing (or fails to load),
that design shows a small placeholder card icon instead of a broken image.

**Any image size/shape works — nothing gets cropped or stretched.** Both
the thumbnail grid and the pop-up size the frame to match your image's own
proportions, so the whole design is always fully visible. You don't need to
pre-crop your artwork to a specific ratio before dropping it in.

If you ever need a different file extension than `.webp` (e.g. `.jpg`),
update the matching path under `productImages["card-1"]` (etc.) in
`site-content.ts` to match.

---

## 3. Custom tiled backgrounds

Each section can carry its own background art built from up to **three tiles**:

```
┌─────────────┐   HEAD   (drawn once at the top of the section)
├─────────────┤
│             │
│  REPEAT     │   (tiled vertically — grows with content)
│             │
├─────────────┤
│  TAIL       │   (drawn once at the bottom)
└─────────────┘
```

You only need to design as many tiles as the section needs:

- **Short section (Hero, Journey)** — one `head` tile is enough.
- **Long section (Customize, Extras)** — use `head + repeat + tail`.
- **Any section** — set to `{}` to keep the default page background.

### Tile design rules

| Rule                       | Why                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Width 1920 px**          | Scales to any screen. Design at 1920, export at 1920.                                                |
| **Repeat tile is seamless** | The top edge and bottom edge of the repeat tile MUST match pixel-for-pixel, or you'll see a seam.  |
| **Head/tail transitions**  | The inner edge of head and tail should visually blend into the repeat tile.                          |
| **File format**            | JPG for photos (200–400 KB). PNG only when you need transparency. WebP if you can export it.         |
| **SVG?**                   | SVG works for flat / geometric patterns and stays crisp at any size. Avoid SVG for photographic art. |
| **Height**                 | Anything up to 1080 px is fine. Repeat tiles look best around 400–1080 px tall.                      |

### Wiring a tile set

Once tiles are in `public/media/bg/`, register them in `site-content.ts` → `backgrounds`:

```ts
backgrounds: {
  hero: { head: "/media/bg/hero.jpg" },

  customize: {
    head:   "/media/bg/customize-head.jpg",
    repeat: "/media/bg/customize-mid.jpg",  // seamless top/bottom
    tail:   "/media/bg/customize-tail.jpg",
  },
},
```

The section component reads the entry by name — no other edit needed.

---

## 4. Which format is best?

| Content type                              | Best format |
| ----------------------------------------- | ----------- |
| Photos, product shots, founder headshots  | **JPG**     |
| Icons, logos with transparent background  | **PNG**     |
| Flat patterns, geometric background tiles | **SVG**     |
| Video reels / showreel                    | **MP4**     |

JPG usually wins for backgrounds because file size stays small.
Use SVG only for crisp geometric/flat art (no photo content).

---

## 5. Preview locally

After editing, save the file. The site reloads automatically. If something
doesn't appear, double-check the file path in `site-content.ts` starts with
`/media/…` and the file actually exists in `public/media/…`.

---

## 6. Packages (A4 Standard vs A5 Mini)

The "Choose your package" section has a **format toggle**. Each format reads
its own folder, so the two can look completely different:

| Format             | Thumbnail file                                     | Size-guide file (opens on click)              |
| ------------------ | -------------------------------------------------- | --------------------------------------------- |
| Standard (A4)      | `public/media/sizes/<N>_pages_magazine.jpg`        | `public/media/sizes/<N>_pages_sizeGuide.jpg`  |
| Mini (A5)          | `public/media/sizes-mini/<N>_pages_mini_magazine.jpg` | `public/media/sizes-mini/<N>_mini_sizeGuide.jpg` |

`<N>` is the page count: 4, 6, 8, 12, 14, 16, 18, 20.
To override any of them by hand, add an entry under `productImages` in
`site-content.ts` keyed `"sz-8"` (Standard) or `"sz-8-mini"` (Mini) — the
first path in the list is the thumbnail, the rest are gallery images.
Combos are Standard-only by design.

---

## 7. Polaroid strips & polaroid packs

| Section          | Folder                  | Notes                                                        |
| ---------------- | ----------------------- | ------------------------------------------------------------ |
| Polaroid strips  | `public/media/strips/`  | Tall 3:8 images, one per design (Strip 1–5).                  |
| Polaroid packs   | `public/media/polaroids/` | Square 1:1 photos — the polaroid frame is drawn by the site. |

Strips are priced as a **bundle** — the individual strips carry no price; the
total is decided by how many are selected (1→₹100, 2→₹125, 3→₹175, 4→₹220,
5→₹275). Selecting a 6th strip is blocked. Those numbers live in
`src/lib/prices.ts` (see § 8), not in the strips component.

---

## 8. Changing prices

**All prices live in one file: `src/lib/prices.ts`.** Every number is
commented with what it belongs to. Change the number, save, done — the cart,
the product cards, and the modals all read from it.

Things intentionally priced at 0: magazine templates, individual strips, and
promo/spin-wheel items (they either come with a package or are bundle-priced).

If you add a brand-new product id in `catalog.ts` without a price entry, the
site logs a loud dev-time warning telling you exactly which id is missing.

---

## 9. Spin-the-Wheel prizes

The wheel is **not** edited in code. Its prizes, odds, colours, and on/off
state all come from the `Spin Config` tab of the backend Google Sheet — see
`BACKEND_SETUP.md` § 7. Emptying/deactivating that tab hides the wheel
entirely.

---

## 10. Happy customers page

`/happy-customers` is driven by `photoGallery`-style entries under
`happyCustomers` in `site-content.ts`, with screenshots in
`public/media/happy_customers/`. The public reviews link used across the site
is `links.customerReviews`.
