# Image size guide

Send this to the client so every asset they hand over drops in at the right
size the first time. "Recommended px" is the size to ask for — the site will
scale it down gracefully, but never ask for smaller than this or it'll look
soft on retina screens. Where a ratio is listed, cropping to that ratio
matters more than the exact pixel count.

All images should be `.jpg` (photos) or `.png` (anything needing
transparency, like the logo). Keep individual files under ~500KB where
possible — the whole site currently loads a lot of full-bleed art.

---

## 1. Brand

| Asset | Recommended px | Ratio | Notes |
|---|---|---|---|
| Logo (`logo.png`) | 512×512 | 1:1 | Transparent background PNG. Used from 32px (nav) up to 224px (hero) and as the favicon, so it must read clearly small. |

---

## 2. Full-width banners (top of page)

These stretch edge-to-edge behind text, so anything important (faces, text)
should sit centered — the sides can get cropped on very wide or very narrow
screens.

| Asset | Recommended px | Ratio | Where |
|---|---|---|---|
| Hero background tile (`backgrounds.hero.repeat`) | 1920×1080+ | seamless, tiles vertically if page is tall | Behind the very first "Welcome to The Layout" panel |
| Showreel video | 1920×1080 | 16:9 | Autoplay video right after the top marquee |
| Banner — "2.svg" slot (`CustomImageSection`) | 1920×1080 | 16:9 (crops to 4:3 on phones) | Right after the showreel |
| Banner — "3.svg" slot (`CreateMagazineSection`) | 1920×1080 | 16:9, full height always shown (never cropped) | Right before "Choose your package" |
| How-to-order background tile (`backgrounds.howToOrder.repeat`) | 1920×1080+ | seamless, tiles vertically | Behind the "How to order" 5-step section |
| Founders background tail (`backgrounds.founders.tail`) | 1920×~600–1000 | seamless top edge, no-repeat | Bottom strip behind "Meet the founders" |

**Seamless tiles** (marked "tiles vertically" above): the very top row of
pixels and the very bottom row of pixels must match, since the image
repeats downward to fill whatever space is left — a visible seam will
show at each repeat if they don't.

---

## 3. Mandatory pages (Front Cover / First Page / Last Page / Back Cover)

| Context | Recommended px | Ratio |
|---|---|---|
| Grid thumbnail | 700×1000 | 7:10 (portrait, magazine-page shaped) |
| Modal / detail view | same image, 700×1000 | 7:10 |

One image per page reused in both places — no need for two separate crops.

---

## 4. Package sizes (4/6/8/…/20 pages)

| Context | Recommended px | Ratio |
|---|---|---|
| Grid card | 640×800 | 4:5 (portrait) |
| Modal / detail view | same image, 640×800 | 4:5 |

Optional — falls back to a text placeholder if not provided.

---

## 5. Templates (Template 01–24)

| Context | Recommended px | Ratio |
|---|---|---|
| Grid card | 800×600 | 4:3 (landscape spread) |
| Modal / detail view | 1600×1200 (higher-res version of the same spread) | 4:3, shown at natural size — no forced crop |

These represent a two-page magazine spread, so landscape, not portrait.

---

## 6. Combos (Main Character / Core Memory / Soft Launch)

| Context | Recommended px | Ratio |
|---|---|---|
| Grid card | 800×600 | 4:3 |
| Modal / detail view | 800×800 | 1:1 (square, different crop than the card) |

Optional — falls back to an emoji/icon tile if not provided.

---

## 7. Add-ons (Gift Wrap / Letter / Combo)

| Context | Recommended px | Ratio |
|---|---|---|
| Grid card | 800×800 | 1:1 |
| Modal / detail view | same image, 800×800 | 1:1 |

Optional — falls back to an icon tile if not provided.

---

## 8. Polaroid packs (Mini / Classic / Memory / Premium)

| Context | Recommended px | Ratio |
|---|---|---|
| Grid + modal (inside the polaroid frame) | 800×800 | 1:1 (square photo, frame is added by the site) |

Currently sourced from bundled placeholder photos — override per pack via
`SITE.productImages` if the client provides real shots.

---

## 9. Polaroid strips (Strip 1–5)

| Context | Recommended px | Ratio |
|---|---|---|
| Grid card | 480×1280 | 3:8 (tall strip — 4 photo cells stacked) |
| Modal / detail view | same image, 480×1280 | 3:8 |

---

## 10. Founders

| Asset | Recommended px | Ratio |
|---|---|---|
| Founder photo | 480×480 | 1:1 |

Optional — falls back to an initial-letter avatar if left blank.

---

## 11. Reels / social embeds

No image upload needed — these pull live from Instagram via the reel URL
pasted into `SITE.reels` / `SITE.milestoneReel.url`. Just make sure the
Instagram post itself has a good cover frame.

---

## Quick reference — by shape

- **Square (1:1)**: logo, founders, add-ons, polaroid packs, combo modal
- **Portrait 4:5**: package size cards
- **Portrait 7:10**: mandatory pages
- **Portrait 3:8 (tall)**: polaroid strips
- **Landscape 4:3**: templates, combo cards
- **Landscape 16:9**: banners, showreel video
- **Seamless tiling**: hero / how-to-order / founders backgrounds
