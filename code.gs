const ss = () => SpreadsheetApp.getActiveSpreadsheet();

/* ============================================================ */
/* Entry points                                                  */
/* ============================================================ */
function doGet(e) {
  const action = e.parameter.action;

  if (action === "validateCoupon") {
    return jsonOut(validateCoupon(e.parameter.code));
  }
  if (action === "getReviews") {
    return jsonOut(getReviews(e.parameter.productId));
  }
  return jsonOut({ error: "Unknown or missing action" });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: "Invalid JSON body" });
  }

  switch (body.action) {
    case "logCart":
      return jsonOut(logCart(body));
    case "completeOrder":
      return jsonOut(completeOrder(body));
    case "submitReview":
      return jsonOut(submitReview(body));
    case "deleteReview":
      return jsonOut(deleteReview(body));
    case "spinLead":
      return jsonOut(handleSpinLead(body));
    default:
      return jsonOut({ ok: false, error: "Unknown action: " + body.action });
  }
}

/* ============================================================ */
/* Coupons                                                       */
/* ============================================================ */
function validateCoupon(code) {
  const sheet = ss().getSheetByName("Coupons");
  if (!sheet) return { valid: false, message: "Coupons sheet not found" };

  const rows = sheet.getDataRange().getValues().slice(1); // skip header
  const match = rows.find(
    (row) => String(row[0]).trim().toUpperCase() === String(code || "").trim().toUpperCase()
  );

  if (!match) return { valid: false, message: "Invalid code" };

  const [, percent, active] = match;
  const isActive = active === true || Number(active) === 1 || String(active).trim().toUpperCase() === "TRUE";
  if (!isActive) {
    return { valid: false, message: "This code is no longer active" };
  }
  return { valid: true, percent: Number(percent) };
}

/* ============================================================ */
/* Cart Logs                                                     */
/* ============================================================ */
function logCart(body) {
  const sheet = ss().getSheetByName("Cart Logs");
  if (!sheet) return { ok: false, error: "Cart Logs sheet not found" };
  ensureHeaders(sheet, ["cartId", "name", "phone", "email", "address", "cart", "total", "timestamp"]);

  sheet.appendRow([
    body.cartId,
    body.customer.name,
    body.customer.phone,
    body.customer.email,
    body.customer.address,
    JSON.stringify(body.cart),
    body.total,
    body.ts,
  ]);

  return { ok: true, cartId: body.cartId };
}

/* ============================================================ */
/* Completed Orders                                              */
/* ============================================================ */
function completeOrder(body) {
  const sheet = ss().getSheetByName("Completed Orders");
  if (!sheet) return { ok: false, error: "Completed Orders sheet not found" };
  ensureHeaders(sheet, [
    "orderId", "cartId", "name", "phone", "email", "address",
    "cart", "total", "coupon", "screenshotUrl", "timestamp",
  ]);

  let screenshotUrl = "";
  if (body.screenshot && body.screenshotName) {
    try {
      const folder = getOrCreateFolder("The Layout — Payment Screenshots");
      const base64 = body.screenshot.split(",")[1];
      const blob = Utilities.newBlob(Utilities.base64Decode(base64), "image/png", body.screenshotName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      screenshotUrl = file.getUrl();
    } catch (err) {
      // Don't let a Drive/permission failure block the order from being logged.
      screenshotUrl = "ERROR: " + err.message;
    }
  }

  sheet.appendRow([
    body.orderId,
    body.cartId,
    body.customer.name,
    body.customer.phone,
    body.customer.email,
    body.customer.address,
    JSON.stringify(body.cart),
    body.total,
    body.coupon || "",
    screenshotUrl,
    body.ts,
  ]);

  return { ok: true, orderId: body.orderId };
}

/* ============================================================ */
/* Reviews                                                       */
/* ============================================================ */
function getReviews(productId) {
  const sheet = ss().getSheetByName("Reviews");
  if (!sheet) return { reviews: [] };

  const data = sheet.getDataRange().getValues();
  const [headers, ...rows] = data;

  const reviews = rows
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    })
    .filter((r) => r.productId === productId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { reviews };
}

function submitReview(body) {
  const sheet = ss().getSheetByName("Reviews");
  if (!sheet) return { ok: false, error: "Reviews sheet not found" };
  ensureHeaders(sheet, ["id", "productId", "name", "rating", "text", "reviewerId", "timestamp"]);

  const id = Utilities.getUuid();
  sheet.appendRow([
    id,
    body.productId,
    body.name,
    body.rating,
    body.text,
    body.reviewerId,
    new Date().toISOString(),
  ]);

  return { ok: true, id };
}

function deleteReview(body) {
  const sheet = ss().getSheetByName("Reviews");
  if (!sheet) return { ok: false, error: "Reviews sheet not found" };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.id && data[i][5] === body.reviewerId) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: "Not found or not yours" };
}

/* ============================================================ */
/* Spin the Wheel                                                */
/* ============================================================ */
// Must mirror SPIN_SEGMENTS in src/lib/gas.ts and SPIN_PRIZES in
// src/components/site/spin-wheel.tsx — labels, codes, and weights.
const SPIN_SEGMENTS = [
  { label: "FREE 1 Polaroid Strip",       code: "SPINPOLA",   weight: 20 },
  { label: "FREE Personalized Letter",    code: "SPINLETTER", weight: 20 },
  { label: "10% OFF Your Magazine Order", code: "SPIN10",     weight: 25 },
  { label: "FREE Sticker Pack",           code: "SPINSTICK",  weight: 20 },
  { label: "Better Luck Next Time",       code: null,         weight: 15 },
];

function handleSpinLead(body) {
  const sheet = ss().getSheetByName("Spin Leads");
  if (!sheet) return { ok: false, error: "Spin Leads sheet not found — create this tab first" };

  const headers = ["Timestamp", "Email", "Marketing Opt-in", "Segment Won", "Coupon Code", "Session ID", "Redeemed", "Expires At"];
  ensureHeaders(sheet, headers);

  const email = String(body.email || "").trim().toLowerCase();
  const sessionId = String(body.sessionId || "");
  const optIn = !!body.optIn;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    const emailCol = headers.indexOf("Email");
    const segmentCol = headers.indexOf("Segment Won");
    const codeCol = headers.indexOf("Coupon Code");
    const expiryCol = headers.indexOf("Expires At");

    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][emailCol]).toLowerCase() === email) {
        return {
          ok: true,
          alreadySpun: true,
          result: { label: rows[i][segmentCol], code: rows[i][codeCol] || null },
          expiresAt: rows[i][expiryCol] ? new Date(rows[i][expiryCol]).toISOString() : null,
        };
      }
    }
  }

  const won = pickWeighted(SPIN_SEGMENTS);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  sheet.appendRow([new Date(), email, optIn, won.label, won.code || "", sessionId, false, expiresAt]);

  return {
    ok: true,
    alreadySpun: false,
    result: { label: won.label, code: won.code },
    expiresAt: expiresAt.toISOString(),
  };
}

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

/* ============================================================ */
/* Helpers                                                        */
/* ============================================================ */
function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
