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
| The scrolling top banner       | `marquee`                                                              |
| Founder names / bios           | `founders`                                                             |
| Milestone reel copy            | `milestoneReel`                                                        |

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
└── bg/             ← background tiles (see § 3)
```

**Two ways to swap a media file:**

- **Same filename** → drop the new file with the exact same name and location.
  No code edit needed.
- **New filename** → drop the new file, then update the matching path in
  `site-content.ts`.

**Product images** live under `productImages` in `site-content.ts`,
keyed by the product id (`str-1`, `pol-mini`, `add-wrap`, …). Example:

```ts
"str-1": ["/media/products/strip-1-a.jpg", "/media/products/strip-1-b.jpg"],
```

Leave the array `[]` and the modal falls back to an auto-generated gradient tile.

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
