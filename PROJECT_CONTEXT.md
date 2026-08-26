# The Layout — Project Context

**Purpose of this file:** a complete technical + product handoff for whoever
(human or AI) works on this codebase next. It documents what exists, why it's
built the way it is, what's fragile, and what's still open — as of `main`
after commit `3a8e2bb` plus one further uncommitted session (see §11a) that
made Pocket Magazine multi-unit, reordered it below Templates, gave the
Friendship Card a Z-axis spin + better lighting, added scroll nudges, and
added a shipping-label PDF alongside the invoice. Update this file when you
make a structural change; it will go stale otherwise, same as any doc.

For **editing content/prices/media without touching code**, see
`Website_GUIDE/` instead — that's the non-coder-facing guide. This file is
the engineering map.

---

## 1. What this project is

**The Layout** is a single-page e-commerce site selling custom-printed
keepsakes: magazines (Standard A4 / Mini A5, page-count tiers), a Pocket
Magazine, a Newspaper Magazine, a Friendship Card, polaroid packs, polaroid
strips, and add-ons (gift wrap, handwritten letter), plus curated
bundle "combos." Checkout collects customer details and a manually-uploaded
UPI payment screenshot — there is **no payment gateway** and **no login/auth
system**. Orders + reviews + coupons + a lead-capture spin wheel are all
backed by a single Google Sheet driven by a Google Apps Script Web App (see
§6).

The whole customer-facing site is **one route** (`/`, `src/routes/index.tsx`)
— a long scrolling page with anchor-linked sections — plus a second static
page (`/happy-customers`) for a testimonials wall.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **TanStack Start** (`@tanstack/react-start`) + **TanStack Router** | File-based routing under `src/routes/`; `src/routeTree.gen.ts` is **generated — never hand-edit it**. |
| UI | **React 19** | Uses React 19's native custom-elements support (see §9.4, the 3D viewer). |
| Bundler/dev server | **Vite 8** | Config at `vite.config.ts`, itself a thin wrapper over `@lovable.dev/vite-tanstack-config` (see §2.1). |
| Server runtime target | **Nitro** (`nitro` devDependency, v3 beta) → **Cloudflare Workers** via the `cloudflare-module` preset (default) | See §10 for the full deployment story. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite` plugin, CSS-first config in `src/styles.css` — no `tailwind.config.js`) | Custom design tokens (`--color-rose-wine` etc.) — see §8. |
| Component primitives | **shadcn/ui** ("new-york" style, see `components.json`) built on **Radix UI** | Lives in `src/components/ui/` — mostly unused scaffolding; the actual site UI is hand-built in `src/components/site/`. |
| State | **Zustand** (`src/lib/store.ts`), persisted to `localStorage` | See §5. |
| Backend | **Google Apps Script + Google Sheets** (`code.gs`, pasted into the Sheet's script editor) | See §6. No Node/Cloudflare-side backend — the Worker only does SSR. |
| Icons | **lucide-react** | |
| Toasts | **sonner** | |
| 3D | **`@google/model-viewer`**, vendored as a static asset, *not* imported as a JS module (see §9.4) | |
| Package manager | Both **npm** (`package-lock.json`) and **bun** (`bun.lock`, `bunfig.toml`) are tracked in the repo | See §9.1 — pick one and keep the other in sync, or expect drift. |

### 2.1 The `@lovable.dev/vite-tanstack-config` wrapper

`vite.config.ts` is intentionally thin — almost all Vite/TanStack
Start/Nitro/React-plugin wiring lives inside the `@lovable.dev/vite-tanstack-config`
package (a Lovable.dev starter-kit dependency). This project was originally
scaffolded via Lovable. The wrapper's own comment block warns: **do not
manually add the TanStack Start / React / Tailwind / Nitro plugins** — they're
already included, and duplicating them breaks the build. Only pass additional
config via `defineConfig({ vite: {...}, nitro: {...}, ... })`.

Notably: **the type surface for `nitro` overrides is narrow on purpose**
(`preset`, `output`, `cloudflare: { nodeCompat, deployConfig }` only — see
`node_modules/@lovable.dev/vite-tanstack-config/dist/index.d.ts`). You cannot
pass arbitrary Nitro/Rollup options (e.g. `rollupConfig.external`) through
this wrapper. If you ever need to, you'd have to either fork the wrapper's
config or drop down to a raw Nitro config file — this was tried once (§9.4)
and abandoned in favor of a different fix.

The wrapper also includes an **HMR-gate plugin** and **sandbox
port/host detection**, both meant for the Lovable cloud sandbox — they're
inert outside that environment.

---

## 3. Repository layout

```
code.gs                       Google Apps Script backend source (paste into the Sheet's editor)
vite.config.ts                Thin wrapper, see §2.1
components.json                shadcn/ui config
eslint.config.js               Flat ESLint config — only lints **/*.{ts,tsx}; public/vendor is ignored
.prettierignore                Prettier ignore list — public/vendor is excluded (see §9.4)
.gitattributes                 Marks public/vendor/*.js as binary (no CRLF normalization)
public/_headers                Cloudflare/static-host cache-control rules (long-cache immutable for media/vendor)
public/media/                  All product imagery, videos, backgrounds, GLB models — see §7
public/vendor/                 Vendored third-party build(s) not meant to go through the JS bundler — see §9.4
scripts/optimize-media.mjs     One-off/manual media-optimization pass (webp conversion) — not part of the build
src/
  routeTree.gen.ts              GENERATED — do not edit
  router.tsx                    createRouter() — React Query client + TanStack Router wiring
  server.ts                     Cloudflare Worker fetch handler — wraps TanStack Start's server entry with error recovery
  start.ts                      TanStack Start client/server shared entry (framework boilerplate)
  styles.css                    Tailwind v4 CSS-first config + design tokens + global styles
  routes/
    __root.tsx                   Root layout: <html>, <head>, QueryClientProvider, telemetry install, store hydration
    index.tsx                    THE homepage — ~950 lines, every section composed here
    happy-customers.tsx          Testimonials wall page
    README.md                    File-based routing conventions cheat sheet (route→URL mapping, splat/dynamic segment syntax)
  lib/
    catalog.ts                    Product catalog (all category data), Category type, CONFIG (GAS_URL etc.)
    prices.ts                     ALL prices in one file — the only pricing source of truth
    store.ts                      Zustand cart/selection store — see §5
    site-content.ts               ALL copy, links, stats, media paths — the non-coder-facing content file
    gas.ts                        Fetch wrapper around the Apps Script backend (timeouts, retries, mock mode)
    use-product-reviews.ts        Shared hook: load/submit/delete reviews for one productId
    telemetry.ts                  Client error reporting → Apps Script "Errors" sheet (fire-and-forget)
    error-capture.ts              Captures uncaught errors server-side so server.ts can render a real error page
    error-page.ts                 Static HTML fallback error page renderer
    utils.ts                      cn() — clsx + tailwind-merge, shadcn convention
  components/
    site/                         One file per homepage section (hand-built, not shadcn) — see §4
    ui/                           shadcn/ui primitives — largely unused by the actual site
  hooks/
    use-mobile.tsx
  assets/                        Bundled (not public/) assets — logo, polaroid category photos
  types/
    model-viewer.d.ts             Ambient JSX typing for the <model-viewer> custom element — see §9.4
Website_GUIDE/                  Non-coder editing guides — see README.md's docs map inside that folder
```

---

## 4. Component architecture (the "section" pattern)

Every homepage feature (Sizes, Templates, Pocket Magazine, Newspaper
Magazine, Friendship Card, Combos, Add-ons, Polaroid Packs, Polaroid Strips,
Delivery) is either:

**(a) A bespoke section component** — most of them. Pattern:
- Exported `XSection()` component rendering a grid of cards inside a
  `bg-rose-wine rounded-3xl` panel, each card: thumbnail/visual, name,
  price, a "Select"/"Selected" pill button, and a "View"/eye icon that opens
  a modal.
- A co-located `XModal()` — full detail view, larger visual, description,
  bullet list of what's included, an "Add"/"Select" button, and (except
  Delivery) a `<ReviewsPanel>` fed by `useProductReviews(productId)`.
- State comes from `useStore()` (Zustand) and `CATALOG.<category>` (static
  product data).

**(b) The generic `ProductGrid` + `ProductModal`** (`shop.tsx`) — used only
for categories that don't need bespoke visuals/behavior: currently just
`delivery` (rendered directly in `index.tsx`) and as a fallback pattern.
Sizes and Templates *used to* be closer to this generic pattern but have
been fully replaced by bespoke components (`sizes-section.tsx`,
`templates-section.tsx`) because of format-toggle / dual-magazine
complexity — don't be surprised the generic components look
underused relative to their apparent generality.

| File | Category | Notable behavior |
|---|---|---|
| `sizes-section.tsx` | `sizes` | Standard(A4)/Mini(A5) format toggle; picking a size clears any active combo and resets template selection. |
| `templates-section.tsx` | `templates` | Renders the normal magazine's template grid only — see §5.3. Has a "Randomise for me" shuffle button. Shares its grid/detail-modal UI with `pocket-section.tsx` via `template-picker.tsx`. |
| `pocket-section.tsx` | `pocket`, `pocket-templates` | Standalone, **multi-unit** product (see §5.3) — a customer can add several Pocket Magazines; each renders its own template grid + "Remove" control directly below the product card, keyed by a `unit` uid. Positioned in `index.tsx` *after* the normal Templates section (§11a) so selecting one immediately reveals its own picker instead of sending the customer to a shared grid elsewhere. |
| `template-picker.tsx` | — | Shared, store-agnostic `TemplateGrid` + `TemplateDetailModal` — the caller (normal-magazine `templates-section.tsx`, or once per Pocket Magazine unit in `pocket-section.tsx`) passes in selection/limit/toggle callbacks. Not a "section" itself. |
| `scroll-hint.tsx` | — | `<ScrollHint text targetId>` — a small bouncing-chevron pill shown after picking a size or a Pocket Magazine, prompting a scroll down to that product's template picker. Not category-specific. |
| `newspaper-section.tsx` | `newspaper` | Standalone product; two **fixed, non-pickable** preview spreads (`NEWSPAPER_TEMPLATES` in `catalog.ts`) — not user-selectable templates. |
| `friendship-section.tsx` | `friendship` | Standalone product with an **interactive 3D model viewer** instead of a photo — see §9.4. Two SKUs (Single / Duo), single-choice. |
| `combos-section.tsx` | `combos` | One-click bundles; auto-populates size/add-ons/polaroids/strips per `COMBO_RECIPES` in `catalog.ts`. Shows "original total" (computed live via `comboRealTotal()`, never hand-typed) struck through. |
| `addons-section.tsx` | `addons` | Gift Wrap / Handwritten Letter / Combo(both) — generic single-choice with a note field in the modal. |
| `strips-section.tsx` | `strips` | Multi-select up to 5, **bundle-priced by count** (`STRIP_TIERS`), not per-item. |
| `packs-section.tsx` | `polaroids` | 4 fixed packs (9/18/27/36 photos), imported via `src/assets/polaroids/*.webp` (bundled, not `public/`). |
| `spin-wheel.tsx` | — | Lead-capture popup; prize config fetched live from the backend (`getSpinConfig`), see §6.7. |
| `reviews-panel.tsx` | — | `<ReviewStars>` + `<ReviewsPanel>` — shared UI, not category-specific. |
| `shop.tsx` | — | The catch-all: `ProductGrid`, `ProductModal`, `CartDrawer`, `CustomerInfoModal`, `PaymentModal`, `SuccessModal`, `ModalShell`, `StepIndicator`, `CartButton`, `PromoCodeBox`, `CartSummaryPanel`, `DeliveryEta`. This is the biggest file (~1090 lines) and the one most other files import `ModalShell` from. |

**Every section follows the same interaction contract**, which matters if
you add a new one: click card → toggle selection (toast feedback); click
"View"/eye → open modal with fuller detail + reviews; the *same* toggle
action is reachable from both places. Categories that allow only one active
item at a time are listed in `singleChoice` inside `store.ts`'s `addItem`.

---

## 5. State: `src/lib/store.ts` (Zustand + persist)

### 5.1 Shape

```ts
cart: CartItem[]                        // the actual order — see below
format: "standard" | "mini"             // magazine trim size toggle
selectedSizeId: string | null           // e.g. "sz-8" or "sz-8-mini"
selectedTemplateIds: string[]           // for the NORMAL magazine (tied to selectedSizeId)
selectedPocketTemplateIds: string[]     // for the Pocket Magazine — independent of the above
stripSelections: string[]               // which of strip-1..strip-5 are picked
coupon: { code, percent } | null
cartId: string | null                   // set once CustomerInfoModal submits (logCart)
customer: {...} | null                  // deliberately NOT persisted (see partialize below)
```

`CartItem`:
```ts
{ key, category, id, name, price, note?, comboId?, promoCode? }
```
`key` is always `${category}:${id}` (with one exception: strips collapse to
a single `strips:bundle` line — see §5.2). `comboId` marks a line as
auto-added by a combo (price 0, real charge is on the combo's own line;
can only be removed by removing the whole combo). `promoCode` marks a free
item granted by a redeemed spin-wheel coupon.

### 5.2 Category behavior rules (read before adding a category)

Three category lists in `store.ts` govern cross-category interactions —
**get a new category into the right ones or it will misbehave with combos**:

- `singleChoice` (inside `addItem`): only one item of this category can be in
  the cart at once — selecting a new one silently replaces the old one.
- `COMBO_INDEPENDENT`: categories a combo never touches. Adding/removing
  these must **not** drop an active combo. (`delivery`, `newspaper`,
  `pocket`, `pocket-templates`, `friendship`, `promotions`.)
- `COMBO_MANAGED`: categories a combo recipe *can* auto-populate. Selecting a
  combo wipes anything manually picked in these first, so the real price
  never sits in the cart alongside the combo's flat price. (`sizes`,
  `templates`, `addons`, `polaroids`, `strips`.)

If a category belongs to neither list, `addItem`'s default (`dropCombo`
whenever that category is touched) applies — i.e. it silently kills any
active combo. That's correct for `COMBO_MANAGED` categories going through
dedicated actions (`setSize`, `toggleTemplate`, `toggleStrip` all call
`dropCombo` explicitly too) but would be **wrong** for a new standalone
product — remember to add it to `COMBO_INDEPENDENT`.

### 5.3 Two parallel "magazine + templates" systems (Pocket is now multi-unit)

This is the single most important structural fact for future work: **there
are two independent magazine *systems* that can be in the cart
simultaneously**, each with its own template selection — and the Pocket
Magazine one supports **any number of units**, each with its own picks
(added in §11a; a customer can buy 2-3 Pocket Magazines in one order):

| | Normal magazine (Standard/Mini) | Pocket Magazine (per unit) |
|---|---|---|
| Selected via | `selectedSizeId` (+ a `sizes` cart line) | one `pocket` cart line per unit, each tagged `unit: <uid>` |
| How many at once | Exactly 0 or 1 | 0 or more — `pocketUnits: { uid, templateIds }[]` in `store.ts`, one entry per Pocket Magazine |
| Template category | `templates` | `pocket-templates` — each line also carries the same `unit` uid as its parent `pocket` line |
| Template state | `selectedTemplateIds` (flat array) | `pocketUnits[i].templateIds` (one array per unit) |
| Template limit | `templateLimit()` — derived from the chosen size's `templateLimit` field (1–17, scales with page count) | `pocketTemplateLimit()` — constant `POCKET_TEMPLATE_LIMIT = 3`, applies per unit |
| Add/select action | `setSize(id)` | `addPocketUnit()` — appends a new unit + cart line, never goes through `addItem` (removed from `singleChoice` in §11a) |
| Remove action | `removeItem(key)` (cart-line generic) | `removePocketUnit(uid)`, or `removeItem(key)` on the pocket line (handles unit cleanup too) |
| Toggle template action | `toggleTemplate(id)` | `togglePocketTemplate(uid, id)` |
| Randomize action | `randomizeTemplates()` | `randomizePocketTemplates(uid)` |

**Both share the same 24 (currently) template *designs*** — `CATALOG.templates`
and `CATALOG["pocket-templates"]` point at the literal same array
(`TEMPLATES` in `catalog.ts`). The **cart line's `category`** field (plus,
for Pocket, its `unit` field) is what ties a template pick to the right
product. `templates-section.tsx` renders the normal magazine's grid only;
`pocket-section.tsx` renders one grid **per pocket unit**, each in its own
bordered block with a `#pocket-unit-<uid>` anchor (used by both the
checkout-gate scroll and each unit's own `<ScrollHint>`). Both reuse the
same store-agnostic `<TemplateGrid>`/`<TemplateDetailModal>` from
`template-picker.tsx` rather than duplicating the grid/modal UI.

**Every checkout gate that checks "are templates complete" checks both
independently** — this was a real bug class introduced when Pocket Magazine
was added, and multi-unit Pocket makes it worse if you're not careful: a
gate now has to loop `pocketUnits` and fail if **any** unit is short, not
just check one flat array. If you add a third such product, grep for
`selectedTemplateIds`/`templateLimit`/`pocketUnits` across `shop.tsx`,
`index.tsx`, `pocket-section.tsx`, `templates-section.tsx`, and `code.gs`
and mirror every hit for the new product, or a customer can check out with
an incomplete order.

**Persisted-store migration:** `pocketUnits` replaced the old flat
`selectedPocketTemplateIds` array, which is a shape change to a persisted
key (see §5.4's "Adding new persisted keys is safe... Removing or renaming
... would need a real migration"). `store.ts` bumps `version: 2` and its
`migrate()` strips any pre-v2 `pocket`/`pocket-templates` cart lines rather
than leaving a `pocket` line in an old visitor's `localStorage` cart with no
matching unit to render a picker for (which would have let that one item
through checkout incomplete).

### 5.4 Persistence

`zustand/middleware persist`, key `the-layout-cart`, `localStorage`.
**`skipHydration: true`** — the store does *not* auto-hydrate on creation;
`__root.tsx`'s `RootComponent` calls `useStore.persist.rehydrate()` manually
inside a `useEffect` after mount. This is deliberate: the store module
re-evaluates fresh per request under SSR, so auto-hydrating at creation time
would apply `localStorage` state before React's first client render and
mismatch the (always-empty) server-rendered HTML, causing a hydration error.
**If you ever see a hydration mismatch involving cart state, check this
first.**

`customer` is deliberately excluded from `partialize` (not persisted) —
re-asking for shipping/contact info after a refresh is an acceptable cost
next to silently resurrecting stale PII from `localStorage` indefinitely.

`version: 1` — no migration function exists. **Adding new persisted keys is
safe without a version bump** (Zustand's default merge keeps the new key's
initial value for old `localStorage` blobs that don't have it) — this is
how `selectedPocketTemplateIds` was added without a migration. Removing or
renaming a persisted key, or changing its shape, would need a real
migration or accept that returning customers' local carts silently reset.

---

## 6. Backend: Google Apps Script + Google Sheets (`code.gs`)

Full setup instructions live in `Website_GUIDE/BACKEND_SETUP.md` — **read
§6.5 below first, because that guide is stale on one major point (invoice
generation).**

### 6.1 Architecture

`code.gs` is pasted directly into the Apps Script editor bound to a Google
Sheet ("Extensions → Apps Script" from inside the Sheet — **not** a
standalone script.google.com project, or `SpreadsheetApp.getActiveSpreadsheet()`
returns null). It's deployed as a Web App (`Deploy → New deployment → Web
app`, execute as "Me", access "Anyone"). The frontend's only handle to it is
one URL: `CONFIG.GAS_URL` in `src/lib/catalog.ts`, currently a live
`/exec` URL (not the `REPLACE...` placeholder, i.e. **the site is not in mock
mode**).

`src/lib/gas.ts` is the only file that talks to it. It POSTs
`Content-Type: text/plain;charset=utf-8` deliberately (not
`application/json`) to avoid a CORS preflight — **do not "fix" this to
`application/json`**, it will break cross-origin calls. Every call has a
hard timeout (`AbortController`, 15s default / 60s for the order+screenshot
upload), retries transport failures only (never a definitive HTTP error
response), and reports failures to `telemetry.ts`.

### 6.2 Sheet tabs (headers must match `BACKEND_SETUP.md` §1 exactly)

| Tab | Auto-created headers? | Written by |
|---|---|---|
| `Coupons` | No — create manually | Read-only from the app; you manage rows by hand |
| `Cart Logs` | Yes, on first write | `logCart` (fires when `CustomerInfoModal` submits, before payment) |
| `Completed Orders` | Yes, on first write | `completeOrder` (fires after payment screenshot upload) |
| `Reviews` | **No — must be added manually before first use** | `submitReview`/`deleteReview`/`getReviews` |
| `Errors` | Yes, on first write (tab itself must exist or writes just no-op) | `logError` (from `telemetry.ts`) |
| `Spin Config` | N/A — optional, falls back to a hardcoded default list if absent | Read-only; you manage rows by hand |
| `Spin Leads` | Yes, on first write | `handleSpinLead` |

Every write handler except `logError` runs inside a script-wide
`LockService` lock (30s wait, then a "server is busy" response) so
concurrent requests can't interleave mid-write (e.g. two orders racing on
`ensureHeaders`). `logError` is deliberately left unlocked — best-effort
telemetry isn't worth lock-contending with a real order write.

### 6.3 `completeOrder` — what actually happens on checkout

1. Payment screenshot (a data URL) is decoded and saved to a Drive folder
   **"The Layout — Payment Screenshots"**, shared "anyone with the link."
2. **A PDF invoice is generated** (`generateInvoicePdf_`) — HTML built
   in-memory (`buildInvoiceHtml_`) and converted to PDF via Apps Script's
   blob conversion (no Docs/Slides template involved — the design is 100%
   in that function's inline CSS). Saved to a Drive folder **"The Layout —
   Invoices,"** shared "anyone with the link." **Not auto-emailed** — the
   commented-out `sendInvoiceEmail_` call is right there if you want to turn
   that on.
3. A row is appended to `Completed Orders`: `orderId, cartId, name, phone,
   email, address, cart (JSON), total, coupon, screenshotUrl, timestamp,
   invoiceUrl, paymentVerified` (last column defaults to `"Pending..."` —
   there's no UI to change it; whoever manages the sheet edits it by hand
   after verifying payment).

Both the screenshot save and invoice generation are wrapped so a Drive
failure never blocks the order row itself from being written — you'll see
`"ERROR: <message>"` in the `screenshotUrl`/`invoiceUrl` column instead of a
failed request. **Check that column first** when something's wrong with
screenshots or invoices — the actual failure reason is right there.

### 6.4 Invoice line-item formatting (`buildInvoiceHtml_`)

Template categories (`templates`, `pocket-templates`) are **zero-cost cart
lines** that would otherwise pad the invoice with a run of ₹0.00 rows — the
code filters them out of the itemized list and instead folds them into a
single note line under their magazine's row, e.g.
`Templates:- 3, 7, 12`. Category-specific label logic:

| Category | Invoice label | Template note |
|---|---|---|
| `sizes` | `Custom Magazine (8 Pages, Normal Magazine, A4)` — spells out Mini vs Standard since both share the same `item.name` ("8 Pages") and only the id suffix (`-mini`) distinguishes them | `Templates:- <normal template numbers>` |
| `pocket` | `Pocket Magazine (6 Pages, Pocket Size)` | `Templates:- <pocket template numbers>` |
| `friendship` | `Friendship Card (Single Card)` / `Friendship Card (Duo Card — BESTIE SET)` — **parenthesized, not dash-prefixed**, because the Duo product's own name already contains an em-dash (`Duo Card — BESTIE SET`); a second leading dash there reads as a typo | — (no templates; customization is via `item.note`, which prints generically for every category) |
| anything else | `item.name` as-is | — |

If you add another product category with its own "sub-selection" concept
(like templates), **mirror this exact pattern**: a dedicated cart category
for the sub-items, filtered out of `invoiceCart`, folded into a note under
the parent row. Don't let a new zero-price category leak through as bare
₹0.00 invoice rows.

With Pocket Magazine now multi-unit (§5.3), each `pocket` cart line and its
matching `pocket-templates` lines share a `unit` uid — `buildInvoiceHtml_`
groups `pocketTemplateItems` into `pocketTemplateLabelsByUnit` keyed by
`t.unit || ""` and looks each `pocket` row up by its own `item.unit || ""`,
so a 3-Pocket-Magazine order's invoice shows each row's own templates, not
every unit's templates on every row. Cart lines from before this fix (no
`unit` field at all) all fall into the `""` bucket together, which
reproduces the old flat-list behavior for anything logged pre-migration —
deliberate, not an oversight. Verified with a standalone `.mjs` against
synthetic single-unit, multi-unit, and unit-less carts before being pasted
into `code.gs`, same verification method as `shippingItemSummaryHtml_`
below.

### 6.3a Shipping labels

`completeOrder` also generates a **PDF shipping label** alongside the
invoice — `generateShippingLabelPdf_(order)` / `buildShippingLabelHtml_`,
saved to its own Drive folder ("The Layout — Shipping Labels", "anyone with
the link"), same wrapped-in-try/catch-so-a-Drive-failure-never-blocks-the-
order pattern as the invoice and screenshot save. Its Drive link (or an
`ERROR: <message>` string on failure) is written to a new `shippingLabel`
column, added immediately after `paymentVerified` in `Completed Orders` —
`ensureHeaders` appends it automatically to existing sheets since it's the
last item in the passed header array, no manual sheet edit needed.

Design intentionally diverges from the invoice: it's a compact
courier-label layout (black banner with "NORMAL SHIPPING"/"EXPRESS
SHIPPING" — read from the `delivery` cart line's id — plus the logo; a
two-column body; order number + thank-you footer), sized via `@page { size:
6in 4in; }` rather than a full invoice page. The **ITEM** cell deliberately
uses coarser, category-level labels than the invoice (`shippingItemLabel_`
— e.g. "A4 Magazine", "Pocket Magazine", never page counts or notes) and
collapses repeats to a count (`shippingItemSummaryHtml_` — "Pocket Magazine
× 3", not three lines) so a packer sees what to grab, not the customer's
exact spec. `templates`/`pocket-templates`/`delivery` categories and
combo-linked (`comboId` set) lines are excluded from that cell the same way
the invoice excludes templates from its rows.

### 6.5 ⚠️ `Website_GUIDE/BACKEND_SETUP.md` is stale

That guide's §8 states **"no automatic invoice or PDF generation, and no
online payment gateway."** The "no payment gateway" half is still true. The
**"no invoice"** half is **false as of the current `code.gs`** — invoice PDF
generation (§6.3 above) has been added since that guide was last updated.
Don't trust that section; trust `code.gs` itself. (This file you're reading
now supersedes it — update `BACKEND_SETUP.md` §8 if you touch this area
again, or just point future readers here.)

### 6.6 Redeploy discipline

**Every edit to `code.gs` requires a new Apps Script deployment *version*
to go live** — editing the script source alone does nothing to the running
Web App. `Deploy → Manage deployments → pencil icon → Version: New version
→ Deploy`. The URL stays the same, so no frontend change is needed. As of
this file's writing, **two code.gs changes are sitting undeployed**:
- The Pocket Magazine invoice row + template note (§6.4).
- The Friendship Card invoice row + note.

- The new `shippingLabel` column + `generateShippingLabelPdf_` (§6.3a,
  §11a) — also undeployed as of this writing.

All are inert on the live site until one redeploy happens. No manual Google
Sheet column changes are needed for any of them — carts are logged as an
opaque JSON blob, and `ensureHeaders` handles new sheet columns (including
`shippingLabel`) automatically.

### 6.7 Spin-the-wheel

Entirely sheet-driven (`Spin Config` tab) — no code change needed to
add/remove/reorder/reweight/pause a prize; the frontend fetches live config
via `getSpinConfig`. Odds are enforced **server-side** (`handleSpinLead`
re-reads the same tab and does the weighted pick itself — the client-shown
wheel and the actual odds can never drift apart, and the client can't cheat
the odds). Emptying/deactivating every row in `Spin Config` is a deliberate
kill-switch — both endpoints then return `{ success: false }` and the
frontend hides the spin trigger entirely.

---

## 7. Media & asset conventions

**Full non-coder guide:** `Website_GUIDE/MEDIA.md`. Key structural facts for
engineering work:

- `public/media/<category>/` — one folder per product category. Referenced
  from `SITE.productImages[productId]` in `site-content.ts` (first array
  entry = card thumbnail, rest = gallery/lightbox images). Missing entry →
  automatic gradient-placeholder fallback (every card component has one) —
  **a missing image is never a hard error**, just a visibly worse card.
- Filenames are **case-sensitive in production** (the host, unlike
  Windows/Mac dev machines) — copy exact case from disk into
  `site-content.ts`.
- `SITE.templateCount` (currently **34**, bumped from 24 by a teammate mid-way
  through this session) drives how many `Template NN` cards render — see
  `catalog.ts`'s `TEMPLATES` array, generated via `Array.from({ length:
  SITE.templateCount }, ...)`. Bump the number first, art can follow later
  (missing `tpl-<n>` images just show a placeholder).
- `public/_headers` sets `Cache-Control: public, max-age=31536000, immutable`
  for `/media/*`, `*.webp`, `*.mp4`, `*.svg`, `*.woff2`, and (as of this
  session) `/vendor/*`. This is a static-host header file — Cloudflare
  Workers Static Assets honors it the same way Cloudflare Pages does (see
  §10.5).
- `scripts/optimize-media.mjs` is a **manual, one-off** script (`node
  scripts/optimize-media.mjs`) that converts `public/media/**/*.{jpg,png}`
  to `.webp`, extracts PNGs baked into `bg/*.svg` and re-encodes those too,
  then deletes the now-unused originals. It's not wired into the build —
  run it by hand after dropping in new raster art, before committing.
- `src/assets/` (as opposed to `public/`) holds the **bundled** polaroid
  category photos and the logo — these go through Vite's asset pipeline
  (hashed filenames, imported as modules), unlike everything in `public/`
  which is served byte-for-byte at a stable path.

---

## 8. Design system

Defined in `src/styles.css` (Tailwind v4 CSS-first config — there is no
`tailwind.config.js`):

| Token | Hex | Used for |
|---|---|---|
| `--color-rose-wine` | `#c1476d` | Primary brand color — section backgrounds, headings |
| `--color-blush-rose` | `#e1477e` | Prices, accents |
| `--color-dusty-rose` | `#ba7080` | Secondary text |
| `--color-pink-mist` | `#e5a8ba` | Muted labels/eyebrows on dark backgrounds |
| `--color-off-white` | `#fcfbfc` | Text/pills on the rose-wine backgrounds |

Display font: **Instrument Serif** (`--font-display`, applied to `h1–h4` and
`.font-display`) via `@fontsource/instrument-serif`. Body font: Plus Jakarta
Sans via `@fontsource/plus-jakarta-sans`. Both self-hosted (no Google Fonts
CDN call at runtime).

Recurring visual pattern across every product section: a `rounded-3xl
bg-rose-wine` panel, product cards with a `ring-2 ring-off-white` active
state, a pill "Select"/"Selected" button, and a small circular "View"/eye
button. New sections should match this exactly for visual consistency — see
any existing `*-section.tsx` file as the template.

---

## 9. Known quirks, technical debt, and footguns

### 9.1 Two lockfiles

`package-lock.json` (npm) and `bun.lock` (bun) are **both tracked** — this
predates this session (both were added together in an earlier commit,
`9044d7c`). `bunfig.toml` exists, suggesting bun is the "intended" package
manager, but the Friendship Card session used `npm install`/`npm uninstall`
(for `@google/model-viewer`) and only `package-lock.json` picked that up.

**This drift is exactly what broke the Cloudflare deploy** (a later
session): Cloudflare's build detects bun (via `bunfig.toml`/`bun.lock`) and
runs `bun install --frozen-lockfile`, which hard-fails — "lockfile had
changes, but lockfile is frozen" — the moment `bun.lock` doesn't exactly
match `package.json`. `bun.lock` turned out to be missing not just
`@google/model-viewer` but `sharp` too (the `scripts/optimize-media.mjs`
devDependency, §7) and was stale enough that a straight `bun install`
(bun 1.4.0 locally vs Cloudflare's bun 1.2.15 — the text lockfile format has
been stable since 1.2, so this didn't matter) also dropped a `tsx`/`esbuild`/
`rollup` subtree that only `package-lock.json`'s npm resolver had pulled in
as optional deps bun correctly skips — confirmed harmless by running a full
`bun run build` against the regenerated lockfile, which succeeded and
produced the same `.output/server` shape as the npm build.

**Going forward: if you add/remove a dependency, run *both* `npm install`
and `bun install` after editing `package.json`**, or `bun install
--frozen-lockfile` will eventually break the Cloudflare build again — no
tooling here enforces the two lockfiles stay in sync, so this is a
by-hand discipline, not something you can trust to just work.

### 9.2 Pervasive CRLF line endings

Much of the pre-existing codebase (this session's new files are LF-only) has
CRLF line endings, because `git config core.autocrlf` is `true` on the
Windows dev machine this was built on — Git silently converts LF→CRLF on
checkout. Running `npx eslint <file>` on almost any pre-existing file will
report hundreds of `prettier/prettier: Delete '␍'` errors. **This is not a
real defect and not something introduced by any single change** — it's an
environment artifact. `npm run lint` / `npm run format` across the whole
repo will surface ~10,000 such errors; don't mass-fix them in an unrelated
PR (huge, noisy diff) unless the user explicitly asks for a line-ending
normalization pass (ideally via a `.gitattributes` `* text=auto eol=lf` rule
plus a one-time re-normalization commit, not ad hoc `--fix` runs).

### 9.3 `npm run lint` / `npm run format` and `public/vendor/`

`public/vendor/model-viewer.min.js` is a **1MB pre-minified third-party
build**, not source code. Both are configured to skip it
(`eslint.config.js`'s `ignores` array includes `"public/vendor"`;
`.prettierignore` includes `public/vendor`) — **verify this is still true**
before running either tool broadly if you ever restructure those configs;
without the exclusion, `eslint .` hangs/times out trying to parse it, and
`prettier --write .` will expand it back toward its unminified form in
place, defeating the point of vendoring a minified build. `.gitattributes`
additionally marks `public/vendor/*.js` as `binary` so Git never rewrites
its line endings across machines.

### 9.4 The `<model-viewer>` 3D component — SSR-safety pattern

This is the most structurally unusual piece of the codebase and worth
understanding fully before touching `friendship-section.tsx` or adding
another 3D/browser-only widget.

**The problem:** `@google/model-viewer` is a ~1MB browser-only library
(registers a custom element via `customElements.define`, needs WebGL). A
naive `import("@google/model-viewer")` — even inside a `useEffect`, which
never runs during SSR — still got **statically pulled into the Cloudflare
Worker's server bundle** by Vite/Nitro's build graph analysis (bundlers
include dynamic-`import()` targets in every build target that can reach
them, regardless of whether that code path is actually reachable at
runtime in that target). This was measured directly: it inflated
`.output/server` from **1.5MB to 3.7MB** for code that would never execute
server-side. An attempt to fix this via Vite's `ssr.external` config had no
effect — Nitro's own Cloudflare-preset build pass appears to re-bundle
regardless (and the `@lovable.dev/vite-tanstack-config` wrapper doesn't
expose a knob into that pass — see §2.1).

**The fix that worked:** don't import the package as a JS module at all.
1. `@google/model-viewer` is a **devDependency only** — nothing in `src/`
   imports it. It exists purely to pin/update the vendored file's source
   version.
2. Its self-contained prebuilt bundle
   (`node_modules/@google/model-viewer/dist/model-viewer.min.js` — the
   plain, non-"-module" variant, which bundles Three.js internally and has
   **zero external `import` statements**, unlike the `-module` variant
   which still does `import {...} from "three"`) is copied byte-for-byte
   to `public/vendor/model-viewer.min.js`, with its trailing
   `//# sourceMappingURL=...` comment stripped (no matching `.map` is
   shipped, so leaving it in place just causes a harmless-but-noisy 404).
3. `friendship-section.tsx`'s `loadModelViewer()` loads it at **runtime**
   via `document.createElement("script"); script.type = "module"; script.src
   = "/vendor/model-viewer.min.js"` appended to `<head>` — a plain HTTP
   fetch of a static asset, completely outside Vite's JS module graph. This
   can never be pulled into any bundle, client or server.
4. Loading is further gated behind an `IntersectionObserver` (300px root
   margin) on the viewer's container, so the ~1MB file only downloads once
   the Friendship Card section actually scrolls near the viewport — not on
   every page load regardless of whether the visitor ever scrolls that far.
5. A module-level `modelViewerLoad` promise singleton + a
   `customElements.get("model-viewer")` check ensure the script tag is
   injected at most once even with multiple `<FriendshipModelViewer>`
   instances mounted (the main section + its "View" modal both use it).

**To update the vendored file** (e.g. after bumping the
`@google/model-viewer` devDependency): re-copy
`node_modules/@google/model-viewer/dist/model-viewer.min.js` to
`public/vendor/model-viewer.min.js` and re-strip the sourcemap comment.
There's no build step that does this automatically — it's a manual
step, same spirit as `scripts/optimize-media.mjs`.

**TypeScript for the custom element:** `src/types/model-viewer.d.ts`
augments `declare module "react" { namespace JSX { interface
IntrinsicElements { "model-viewer": {...} } } }`. **Not** `declare global {
namespace JSX {...} }`— with React 19's automatic JSX runtime
(`"jsx": "react-jsx"` in `tsconfig.json`), TypeScript resolves
`JSX.IntrinsicElements` from `react/jsx-runtime`'s re-exported `JSX`
namespace, not the classic global one. Augmenting the wrong namespace fails
silently with a confusing "Property 'model-viewer' does not exist" error —
if you add another custom element, augment `"react"`, not `global`.

React 19 passes hyphenated JSX props straight through to custom elements as
DOM attributes (this is why `<model-viewer auto-rotate camera-controls
src="...">` works with plain kebab-case JSX attribute names, no
`dangerouslySetInnerHTML`-style workaround needed).

**Rotation is driven manually, not via `auto-rotate` (§11a).** model-viewer's
built-in `auto-rotate` only orbits the *camera* around the model's Y axis
(a turntable) — there's no attribute for spinning the model on another axis.
The card is meant to spin in the screen plane (Z axis) rather than tumble
front-to-back (Y axis), so `FriendshipModelViewer` instead runs a
`requestAnimationFrame` loop that writes the `orientation` attribute
directly (`orientation="0deg 0deg <angle>deg"`), leaving `camera-controls`
untouched so drag-to-rotate still works. Which axis actually *reads* as
in-plane depends on the GLB's own local axis convention — untestable in this
sandbox (§9.5) — so the axis is a single named constant, `ROTATION_AXIS`, at
the top of `friendship-section.tsx`. **If a model swap makes the spin look
like tumbling instead of twirling, change that one constant** to `"x"` or
`"y"` rather than rewriting the animation loop.

**The GLB model itself is a placeholder.** No real product photography/scan
exists yet. `public/media/friendship/friendship-card-placeholder.glb` is a
hand-built glTF binary (~2.2KB) — a simple two-primitive box (cream front/back
faces, rose-wine-colored edge faces, no textures) constructed directly at
the byte level (no 3D authoring tool was used) and validated by loading it
through Three.js's actual `GLTFLoader`. See `Website_GUIDE/MEDIA.md` §2e for
how to swap it — same "same filename, no code change" convention as every
other media asset.

### 9.5 `wrangler dev` / `vite preview` don't work from this checkout as-is

Both were attempted for local smoke-testing during this session and failed:
- `vite dev` fails outright in some sandboxed Windows environments due to a
  native binary (`@oxc-parser`'s `.node` addon) being blocked by an
  Application Control / AppLocker policy — **this is a host-machine policy
  issue, not a project bug.** It should work fine on an unrestricted machine.
- `npx vite preview` fails because it expects a different build layout
  (`dist/server/server.js`) than what the `cloudflare-module` Nitro preset
  actually produces (`.output/server/index.mjs` + a generated
  `wrangler.json`) — `vite preview` is not the right tool for this preset;
  use `wrangler dev` (from `.output/server`, after a build) or a real
  deploy instead.
- `wrangler dev` (run from `.output/server`, per the generated
  `wrangler.json`) fails with **"Found both a user configuration file at
  wrangler.json and a deploy configuration file at
  ../../.wrangler/deploy/config.json. ... these do not share the same base
  path"** — a real conflict between the repo-root `.wrangler/deploy/`
  directory (generated by the Lovable/Nitro build tooling) and the
  per-build `wrangler.json` nested inside `.output/server/`. **Unresolved
  as of this writing.** Deleting `.wrangler/deploy/` before running
  `wrangler dev` did not fix it (it regenerates on the next build). This
  needs investigation before local `wrangler dev` iteration is usable —
  see §10.4 for what this means for actual deployment (deployment itself
  is a different, likely-unaffected code path from local `dev`).

**Practical implication:** no UI change in this codebase has been visually
verified in a live browser during recent sessions — only via `tsc
--noEmit`, `vite build` (which *does* succeed cleanly), targeted
`eslint`, and manual code tracing / isolated Node scripts replicating
specific logic (e.g. the invoice line-building function was verified by
copy-pasting its algorithm into a standalone `.mjs` script and inspecting
output, not by generating a real order). **Whoever picks this up next
should do a real browser pass** — ideally after resolving §9.5, or by
testing directly against an actual Cloudflare deployment (§10).

### 9.6 `prefer-const` lint warning in `store.ts`

`store.ts:356` (`selectCombo`) declares `let selectedTemplateIds: string[] =
[];` that's never reassigned — pre-existing, harmless, not introduced by
recent work. Low priority; a one-line fix if you're ever in that function
for another reason.

### 9.7 `npm audit` findings

4 high-severity advisories as of this session, **all pre-existing,
build-toolchain-only** (transitive deps of `eslint`/`vite`/`postcss` —
`brace-expansion`, `js-yaml`, `nanoid`, `postcss`), **not introduced by
adding `@google/model-viewer`** (verified: it has zero npm dependencies of
its own). None affect the shipped runtime bundle. Worth an `npm audit fix`
pass at some point, but out of scope for feature work unless asked.

---

## 10. Deploying to Cloudflare

### 10.1 Current state: live on Cloudflare Workers

The site is **now live on Cloudflare Workers** at `thelayout.layoutt.workers.dev`
(migrated 2026-08-26; Vercel was the previous host and its deployment is
being decommissioned). `SITE.links.customerReviews` in `site-content.ts`
was updated accordingly, from `https://thelayout.vercel.app/happy-customers`
to `https://thelayout.layoutt.workers.dev/happy-customers`. No custom
domain is wired up yet — it's on the bare `*.workers.dev` subdomain (see
§10.3's suggestion to add one later). The build tooling already **defaults
to Cloudflare** — Nitro's `cloudflare-module` preset is the wrapper's
default target whenever Nitro runs (see §2.1) — so the app was built
Cloudflare-ready well before the actual cutover happened. No `wrangler.toml`
is committed; Nitro generates a fresh `wrangler.json` inside
`.output/server/` on every build.

### 10.2 What Nitro's `cloudflare-module` preset produces

A `npm run build` (`vite build`) does three passes (client, SSR, and a
Nitro-specific pass) and produces:

```
.output/
  public/                    Static assets — copy of public/ plus client JS/CSS chunks (Cloudflare "Assets")
  server/
    index.mjs                 The Worker entry — exports `{ fetch(cfRequest, env, context) }`
    wrangler.json              Generated deploy config (worker name, compat flags, asset binding)
    _libs/, _ssr/, _chunks/    The actual server-side JS, code-split
```

`.output/server/wrangler.json` (as generated by this build):
```json
{
  "compatibility_date": "<today's date>",
  "main": "index.mjs",
  "assets": { "binding": "ASSETS", "directory": "..\\public" },
  "name": "ayushjadhavwork-ui-layout-revamp",
  "compatibility_flags": ["nodejs_compat"],
  "no_bundle": true,
  "rules": [{ "type": "ESModule", "globs": ["**/*.mjs", "**/*.js"] }]
}
```
`name` is auto-derived from the **git remote** (`ayushjadhavwork-ui/layout-revamp`
→ `ayushjadhavwork-ui-layout-revamp`), not from `package.json`'s `name`
field (which is still the generic scaffold value `"tanstack_start_ts"` —
harmless, just don't expect it to match the worker name). This means: **if
you rename the GitHub repo or fork it, the auto-generated worker name
changes too**, which could silently create a *second* Worker instead of
updating the existing deployment. Pin an explicit `name` if that matters to
you (see §10.3).

`assets.binding: ASSETS` + the Worker's `fetch` handler checking
`isPublicAssetURL(url.pathname)` and delegating to `env.ASSETS.fetch(...)`
is Cloudflare's newer unified **Workers Static Assets** feature (distinct
from, and the modern replacement for, both classic "Workers Sites" and
"Cloudflare Pages") — static files are served directly by Cloudflare's edge
without invoking your Worker's SSR code at all, and only actual route
requests hit the Worker/SSR path.

### 10.3 How to actually deploy

You need: a Cloudflare account, and the `wrangler` CLI (already resolvable
via `npx wrangler` — no global install needed; a fresh `npx wrangler`
install happened automatically mid-session and pulled `wrangler@4.125.0`).

```bash
npm run build                 # produces .output/server + .output/public
cd .output/server
npx wrangler login            # first time only — opens a browser OAuth flow
npx wrangler deploy           # ships it
```

Nitro's own build output also prints `npx nitro deploy --prebuilt` as an
alternative — that's a Nitro-native wrapper around essentially the same
`wrangler deploy` call; either should work, but this session only verified
the plain `wrangler deploy` path exists as an option (§9.5 documents that
`wrangler dev` itself is currently broken in this checkout — deploy is a
different code path and wasn't tested end-to-end due to no Cloudflare
account being available in this session).

**Recommended before your first real deploy:**
- Decide on and pin an explicit `name` in a checked-in Nitro/wrangler
  config (via the wrapper's `nitro: { preset: "cloudflare-module", ... }`
  option — see the narrow type surface in §2.1) rather than relying on the
  git-remote-derived auto name, so renaming the repo can never orphan or
  duplicate the deployment.
- Set up a **custom domain** in the Cloudflare dashboard (Workers & Pages →
  your worker → Settings → Domains & Routes) once you have one you want to
  point here — a bare `*.workers.dev` subdomain works out of the box with
  zero extra config for testing.
- Resolve the `wrangler dev`/config-conflict issue (§9.5) first if you want
  to iterate locally against the Cloudflare runtime before each deploy,
  rather than deploying blind.

### 10.4 Difficulties you're likely to hit, given the current scope

1. **The `wrangler dev` config conflict (§9.5) will probably also affect
   any local pre-deploy verification step.** If your workflow is "test
   locally with wrangler, then deploy," budget time to debug this first —
   it wasn't resolved in this session. `wrangler deploy` itself was not
   confirmed to hit the same issue (it wasn't tested, for lack of a
   Cloudflare account in this sandboxed environment) but investigate this
   before assuming a smooth first deploy.

2. **Two lockfiles, unclear CI intent (§9.1).** If deployment is automated
   (GitHub Actions, Cloudflare's Git integration, etc.), make sure whatever
   runs `npm install`/`bun install` matches whichever lockfile is actually
   current — a CI that picks the wrong one could install stale/mismatched
   dependency versions.

3. **`public/` is 41MB across 152 files** (measured this session), the
   largest single file being `showreel.mp4` at 11MB. This is comfortably
   under Cloudflare's published Workers Static Assets per-file and
   file-count limits as of when this was checked — but **confirm current
   limits on Cloudflare's docs at deploy time**, since platform limits do
   change, and if more large video/GLB assets get added later (e.g. a real
   Friendship Card scan replacing the 2.2KB placeholder — a real photogrammetry
   scan or CAD export could easily be 5–50MB) it's worth checking again.

4. **No environment variables or Cloudflare secrets are currently needed**
   — verified by grepping `src/` for `process.env`/`import.meta.env` usage
   beyond `import.meta.env.DEV` (a build-time-only dev/prod branch, not a
   runtime secret). `CONFIG.GAS_URL` and every other config value is a
   plain hardcoded constant in `catalog.ts`, baked in at build time. This
   simplifies deployment (nothing to configure in the Cloudflare dashboard
   for the app to function) but also means **the Apps Script backend URL
   is public in the client bundle** — this was already true on Vercel, so
   it's not a new exposure, just worth knowing it's unchanged.

5. **Google Apps Script CORS behavior should carry over unchanged** — the
   backend worked from the old Vercel origin without any origin-allowlisting
   on the Apps Script side (Web Apps deployed with "Anyone" access don't
   enforce CORS restrictively, and `gas.ts`'s `text/plain` trick avoids
   preflight entirely — see §6.1), and moving the frontend's origin to
   `thelayout.layoutt.workers.dev` required no Apps Script-side change.
   Still worth a real end-to-end order test on the new domain rather than
   assuming — this hasn't been independently confirmed in this session.

6. **`nodejs_compat` is already enabled** in the generated `wrangler.json`,
   and a grep across `src/` found no Node built-in imports (`node:fs`,
   `node:path`, etc.) in application code — so the SSR bundle shouldn't hit
   any Workers-runtime incompatibilities on that front. **The one thing to
   never do:** import `sharp` (the native image-processing library used
   only by the offline `scripts/optimize-media.mjs`) from anything that
   could end up in the server bundle — native `.node` addons cannot run in
   the Workers V8-isolate runtime at all, unlike a Node.js/Vercel server.
   It's correctly a `devDependency` today and nothing in `src/` imports it
   — keep it that way. If a future feature wants server-side image
   processing, it needs a different approach (e.g. Cloudflare Images, an
   external service, or WASM-based processing) — not `sharp`.

7. **The Worker script itself is comfortably small** — measured this
   session at **1.5MB** raw (`.output/server`, no minification breakdown
   done further) after the `@google/model-viewer` vendoring fix (§9.4)
   avoided what would otherwise have been 3.7MB. This is well within
   Cloudflare's Workers script-size limits on any plan as of this check —
   but re-verify current limits if the server bundle grows substantially
   (e.g. from adding another heavy browser-only library without applying
   the same vendoring pattern).

8. **`_headers` support**: Nitro logs "Adding Nitro fallback to `_headers`
   to handle all unmatched routes" and generates `.output/public/_headers`
   from the committed `public/_headers`. Cloudflare's Workers Static Assets
   honors `_headers`/`_redirects` files the same way Cloudflare Pages
   always has, so the existing long-cache-immutable rules for
   `/media/*`, `/vendor/*`, etc. should apply unchanged — this wasn't
   independently verified against a live Cloudflare deployment in this
   session (no account available), so confirm cache headers are actually
   applied correctly on the first real deploy (check response headers on a
   media file in production).

### 10.5 Post-deploy verification checklist

Steps 1–2 are done — the site is deployed and live at
`thelayout.layoutt.workers.dev`, and the Vercel deployment is being deleted
since it's no longer needed. Steps 3–6 have **not** been confirmed in any
session so far and are still worth working through:
1. ~~`npm run build`, confirm no errors.~~ Done.
2. ~~`cd .output/server && npx wrangler deploy` (accept the `*.workers.dev`
   URL it gives you — don't wire a custom domain yet).~~ Done.
3. Load the deployed URL — confirm the homepage renders (SSR working),
   confirm images/video/fonts load (static assets working), confirm the
   cart/checkout flow works end-to-end including a real Apps Script call
   (coupon validation is the cheapest thing to test first — it's a GET, no
   write).
4. Check response headers on a `/media/*` file — confirm
   `cache-control: public, max-age=31536000, immutable` is actually present.
5. Complete one full test order (including the payment-screenshot upload
   and `completeOrder` call) and confirm a row lands in `Completed Orders`
   with a real `invoiceUrl` (not an `ERROR:` string).
6. Optionally wire up a custom domain later (Workers & Pages → the worker →
   Settings → Domains & Routes) — the site currently runs on the bare
   `*.workers.dev` subdomain.

---

## 11. Recent work log (this session)

For fuller narrative context than the terse bullets below, the git log
messages themselves are accurate and descriptive — this is just an index.

- **Pocket Magazine** (commit `f9948fc`, merged `49c071b`): new standalone
  ₹250 product, strictly 6 pages, own 3-template allowance, shoppable
  alongside a normal magazine. Introduced the "two parallel magazine +
  templates systems" architecture described in §5.3. `code.gs` invoice
  change **not yet redeployed** (§6.6).
- **Friendship Card** (commit `3a8e2bb`): new standalone product, two SKUs
  (Single/Duo) with MRP-strikethrough pricing (new `mrp` field on `Product`,
  new `mrpOf()` helper in `prices.ts`), interactive auto-rotating 3D
  preview. Introduced the vendored-script SSR-safety pattern described in
  §9.4. `code.gs` invoice change **not yet redeployed** (§6.6, same
  redeploy also covers the Pocket Magazine change).
- Both features were built and verified without a working local dev server
  or browser (§9.5) — verification was `tsc --noEmit`, `vite build`,
  targeted `eslint`, and isolated Node scripts replicating specific pieces
  of logic (cart→invoice line transformation, GLB binary structure). **Real
  browser QA is still outstanding** for both features.

## 11a. Recent work log (this session — uncommitted as of this writing)

- **Pocket Magazine made multi-unit + repositioned** (§5.3, §4): a customer
  can now add several Pocket Magazines in one order, each with its own
  template picker rendered directly below the product card (instead of a
  single shared picker up in the Templates section). `store.ts` replaced
  `selectedPocketTemplateIds: string[]` with `pocketUnits:
  { uid, templateIds }[]` and added `addPocketUnit`/`removePocketUnit`;
  persisted-store `version` bumped to 2 with a `migrate()` that strips any
  pre-v2 `pocket`/`pocket-templates` cart lines (see §5.3's migration note —
  this was flagged as a real incomplete-checkout risk, not just cleanup).
  `pocket-section.tsx` and `templates-section.tsx` were both rewritten;
  their shared grid/detail-modal UI was extracted into new
  `template-picker.tsx` to avoid duplicating it. In `index.tsx`, the Pocket
  Magazine block moved from between Sizes and Templates to *after*
  Templates (`id="pocket"`), and the checkout gate's incomplete-pocket
  scroll target changed from `#templates` to the specific incomplete unit's
  `#pocket-unit-<uid>` anchor.
- **Scroll nudges added** (new `scroll-hint.tsx`, `<ScrollHint>`): shown
  under the Sizes grid once a size is picked but templates aren't yet
  complete (scrolls to `#templates`), and under each Pocket Magazine unit's
  own grid while it's incomplete (scrolls to that unit's anchor).
- **Friendship Card 3D viewer**: now spins on `ROTATION_AXIS` (Z by
  default) via a manual `orientation`-attribute rAF loop instead of
  model-viewer's Y-axis-only `auto-rotate` (see §9.4's expanded note — this
  is the one change in this session that's genuinely unverifiable without a
  real browser, per §9.5). Lighting also increased: `environment-image=
  "neutral"` + `tone-mapping="neutral"` (built-in presets, confirmed present
  in the vendored `model-viewer.min.js` by grepping for the `"neutral"`
  token before relying on it — no network fetch, so no new external
  dependency), plus higher `exposure`/`shadow-intensity`/`shadow-softness`.
- **Shipping labels** (§6.3a): `code.gs` gained
  `generateShippingLabelPdf_`/`buildShippingLabelHtml_` plus supporting
  `shippingItemLabel_`/`shippingItemSummaryHtml_`/`formatPlainINR_`
  helpers, wired into `completeOrder` alongside the existing invoice
  generation. New `shippingLabel` column in `Completed Orders`, right after
  `paymentVerified`. `shippingItemSummaryHtml_` (the category-count logic
  feeding the label's ITEM cell) was verified the same way this repo
  already verifies `code.gs` logic it can't run directly — copied into a
  standalone `.mjs` and run against synthetic carts (single item, 3 pocket
  units, a combo, delivery-only) before being pasted into `code.gs`.
- **All four changes verified via `tsc --noEmit`, targeted `eslint`, and
  `npm run build`** (all clean) — same constraint as the Pocket
  Magazine/Friendship Card session before this one: no working local dev
  server in this sandbox (§9.5), so **no real browser QA has been done for
  any of this**. Whoever picks this up next should do a full browser pass
  before shipping, and this `code.gs` needs a fresh Apps Script deployment
  (§6.6) — it now carries three undeployed changes, not two.

## 11b. Recent work log — Cloudflare cutover (2026-08-26)

- **Migrated production hosting from Vercel to Cloudflare Workers.** The
  Vercel Bun install was failing (`bun install --frozen-lockfile` rejected
  `bun.lock` as changed — root cause was a bun-version skew between what
  generated the lockfile locally and the older `bun@1.2.15` Vercel's build
  image used, and pinning `packageManager` in `package.json` did not make
  Vercel switch versions). Rather than keep chasing that, the site was
  deployed to Cloudflare Workers instead (the build was already
  Cloudflare-ready per §10.1) and now lives at
  `thelayout.layoutt.workers.dev`. The Vercel project/deployment is being
  deleted since it's no longer the live host.
- Two now-unused artifacts from the Vercel debugging remain in the repo,
  harmless but dead weight: a `packageManager: "bun@1.4.0"` entry in
  `package.json`, and a `vercel.json` overriding the install command to
  plain `bun install`. Fine to remove in a later cleanup pass.
- `SITE.links.customerReviews` in `site-content.ts` updated from
  `https://thelayout.vercel.app/happy-customers` to
  `https://thelayout.layoutt.workers.dev/happy-customers` — grepped for any
  other hardcoded reference to the old domain across `src/`, `public/`, and
  root config files and found none.
- §10 rewritten to reflect live status; see §10.5 for what's still
  unverified post-cutover (real browser QA, cache headers, a full test
  order end-to-end on the new domain — none of this was confirmed in this
  session).
