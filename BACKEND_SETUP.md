# Backend Setup — Google Apps Script (Code.gs)

This project uses a Google Sheet + Apps Script Web App as its backend for
coupons, cart logs, completed orders, and product reviews. The frontend
talks to it through `src/lib/gas.ts` using the URL in
`CONFIG.GAS_URL` (see `src/lib/catalog.ts`).

---

## 1. Create the Google Sheet

Create a new Google Sheet named e.g. **"The Layout — Backend"** with these
tabs and header rows (row 1). Header names must match exactly.

### Tab: `Coupons`
| code | percent | active |
|------|---------|--------|
| LAYOUT10 | 10 | TRUE |

- `code`: coupon code (case-insensitive on validate)
- `percent`: number, e.g. `10` for 10%
- `active`: `TRUE` or `FALSE`

### Tab: `Cart Logs`
| cartId | name | phone | email | address | cart | total | timestamp |

(Headers auto-created on first write; you can leave the sheet empty.)

### Tab: `Completed Orders`
| orderId | cartId | name | phone | email | address | cart | total | coupon | screenshotUrl | timestamp |

(Headers auto-created on first write.)

### Tab: `Reviews`
| id | productId | name | rating | text | reviewerId | timestamp |

**Important:** Add this header row manually before first use — the script
does not auto-create it, and `getReviews` needs the header row to map
columns.

---

## 2. Add the Apps Script

1. In the sheet: **Extensions → Apps Script**.
2. Replace `Code.gs` with the project's `Code.gs` (the one you provided).
3. Save the project (name it e.g. "The Layout Backend").

### Optional hardening (recommended)

Add this at the top of `submitReview` so the Reviews sheet is
auto-initialized if empty:

```js
ensureHeaders(sheet, ["id","productId","name","rating","text","reviewerId","timestamp"]);
```

---

## 3. Deploy as Web App

1. Click **Deploy → New deployment**.
2. Type: **Web app**.
3. Description: `The Layout API v1`.
4. **Execute as**: `Me` (your Google account).
5. **Who has access**: `Anyone` (required — the site calls it without login).
6. Click **Deploy**, authorize the scopes when prompted
   (Sheets + Drive — Drive is needed to save payment screenshots).
7. Copy the **Web app URL** (ends in `/exec`).

### Re-deploying after edits
Every code change needs a new **version** to go live:
**Deploy → Manage deployments → pencil icon → Version: New version → Deploy**.
The URL stays the same.

---

## 4. Wire it into the frontend

Open `src/lib/catalog.ts` and set:

```ts
export const CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/XXXXXXXXXXXXXX/exec",
  // ...
};
```

Until this is set, `src/lib/gas.ts` runs in mock mode
(coupon `LAYOUT10` = 10%, empty reviews, no writes).

---

## 5. API contract (what the frontend sends)

All POSTs use `Content-Type: text/plain;charset=utf-8` (to avoid a CORS
preflight); the body is JSON. Apps Script reads it from
`e.postData.contents`.

| Action | Method | Payload | Response |
|--------|--------|---------|----------|
| `validateCoupon` | GET `?action=validateCoupon&code=XYZ` | — | `{ valid, percent?, message? }` |
| `getReviews` | GET `?action=getReviews&productId=strip-1` | — | `{ reviews: [...] }` |
| `logCart` | POST | `{ action, cartId, customer, cart, total, ts }` | `{ ok, cartId }` |
| `completeOrder` | POST | `{ action, orderId, cartId, customer, cart, total, coupon?, screenshot?, screenshotName?, ts }` | `{ ok, orderId }` |
| `submitReview` | POST | `{ action, productId, name, rating, text, reviewerId }` | `{ ok, id }` |
| `deleteReview` | POST | `{ action, id, reviewerId }` | `{ ok }` |

`screenshot` is a data URL (`data:image/png;base64,...`). The script
strips the prefix, saves the file to a Drive folder called
**"The Layout — Payment Screenshots"**, and stores the shareable URL.

---

## 6. Troubleshooting

- **"Invalid code (backend not configured)"** — `GAS_URL` still starts with
  `REPLACE`. Set it in `src/lib/catalog.ts`.
- **CORS error** — you edited `gas.ts` to send `application/json`. Keep it
  as `text/plain` so the browser skips the preflight.
- **`SpreadsheetApp.getActiveSpreadsheet()` returns null** — the script
  isn't bound to a sheet. Open the sheet → Extensions → Apps Script (do
  not create the script from script.google.com standalone).
- **Reviews return empty / column undefined** — the `Reviews` tab is
  missing the header row. Add it manually (see §1).
- **Changes not showing after edit** — you didn't publish a new version.
  Deploy → Manage deployments → New version.
- **Drive permission error on screenshots** — re-run the deployment flow
  and grant Drive access when prompted.

---

## 7. Spin-the-Wheel lead capture

The wheel's prizes are entirely sheet-driven — there is nothing to edit in
code to add, remove, reorder, reweight, or pause a prize. `Code.gs` already
implements `getSpinConfig` and `handleSpinLead`; you only need to create the
two tabs below.

### Tab: `Spin Config`
| Order | Label | Icon | Code | Weight | Active | Color |
|-------|-------|------|------|--------|--------|-------|
| 1 | FREE 1 Polaroid Strip | polaroid | SPINPOLA | 20 | TRUE | |
| 2 | FREE Personalized Letter | envelope | SPINLETTER | 20 | TRUE | |
| 3 | 10% OFF Your Magazine Order | tag | SPIN10 | 25 | TRUE | |
| 4 | FREE Sticker Pack | sticker | SPINSTICK | 20 | TRUE | |
| 5 | Better Luck Next Time | clover | | 15 | TRUE | |

- **Order**: controls slice position clockwise from the top (1, 2, 3…).
- **Label**: shown on the wheel slice and the result screen.
- **Icon**: a key the frontend maps to an icon — `polaroid`, `envelope`,
  `tag`, `sticker`, `clover`. An unrecognized key falls back to a default
  gift icon (and logs a console warning) instead of breaking anything.
- **Code**: coupon code to grant; leave blank for a non-prize segment
  ("Better luck next time").
- **Weight**: relative odds, any positive number — doesn't need to sum to
  100.
- **Active**: `TRUE`/`FALSE` (or `1`/`0`) — `FALSE` rows are excluded from
  both the wheel and the win-picking logic, so you can pause a prize
  without deleting its row/history.
- **Color**: optional hex code for the slice fill. Leave blank to let the
  frontend cycle through its default palette.

Add, remove, reorder, or edit rows any time — the site picks up changes on
the next page load, no redeploy required.

### Tab: `Spin Leads`
| Timestamp | Email | Marketing Opt-in | Segment Won | Coupon Code | Session ID | Redeemed | Expires At |

(Headers auto-created on first write.)

The homepage popup posts `{ action: "spinLead", email, optIn, sessionId }`;
the server enforces one spin per email and picks the winning segment
server-side (never trust the client) by reading the same `Spin Config` tab
the wheel rendered from, so the visible odds and the actual odds can never
drift apart. If `Spin Config` is missing, empty, or has no active rows,
both `getSpinConfig` and `handleSpinLead` return
`{ success: false, error: "Spin wheel is not configured" }` instead of
crashing — the frontend responds by hiding the spin trigger entirely
rather than showing a broken wheel.

The frontend falls back to a small local mock config if `GAS_URL` is not
yet configured, so the popup still works end-to-end during development.
