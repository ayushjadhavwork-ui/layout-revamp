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
