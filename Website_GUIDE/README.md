# The Layout — website

Custom magazines, polaroid strips, polaroid packs and keepsakes. React 19 +
TanStack Start + Tailwind v4, with a Google Sheet + Apps Script backend.

## Docs map

| File | What's in it |
| ---- | ------------ |
| `MEDIA.md` | Non-coder guide: text, links, stats, media swaps, tiled backgrounds, package/strip/pack images, prices, spin-wheel |
| `size.md` | Exact pixel sizes / aspect ratios to request from the client for every image slot |
| `BACKEND_SETUP.md` | Google Sheet tabs, Apps Script deployment, API contract, spin-wheel lead capture, troubleshooting |
| `code.gs` | The Apps Script source that gets pasted into the sheet's script editor |

## Where things live

```
src/lib/site-content.ts   all copy, links, stats, media paths      ← edit this
src/lib/prices.ts         every price in one commented file        ← edit this
src/lib/catalog.ts        product ids/structure + GAS_URL
src/lib/store.ts          cart, format toggle, strip selection
src/lib/gas.ts            backend bridge (coupons, orders, reviews, spin)
src/routes/index.tsx      the one-page site
src/routes/happy-customers.tsx
src/components/site/      one file per section
public/media/             all images/video
```

## Sections on the homepage

Hero → marquee → showreel → banners → how to order → **The Team** → Journey /
stats → magazine packages (A4 / A5 Mini toggle) → mandatory pages → templates
(with "randomise for me") → newspaper templates → combos → add-ons → polaroid
strips (bundle pricing) → polaroid packs → reels → FAQ → cart drawer +
payment/success modals → spin-the-wheel popup → WhatsApp button.

## Run locally

```bash
bun install
bun run dev
```

## Notes

- Orders are recorded in the backend sheet with a payment screenshot; there is
  no invoice PDF or payment gateway (see `BACKEND_SETUP.md` § 8).
- Editing `src/routeTree.gen.ts` is not allowed — it's generated.
