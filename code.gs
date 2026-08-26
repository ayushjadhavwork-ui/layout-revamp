const ss = () => SpreadsheetApp.getActiveSpreadsheet();

// The Layout's logo (public/logo.png in the site repo, downscaled to
// 160×160), embedded directly so invoices don't depend on any Drive file
// existing. To swap it, replace this string with a new base64-encoded PNG.
const INVOICE_LOGO_BASE64 = "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";

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
  if (action === "getSpinConfig") {
    return jsonOut(getSpinConfig());
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
      return jsonOut(withScriptLock_(function () { return logCart(body); }));
    case "completeOrder":
      return jsonOut(withScriptLock_(function () { return completeOrder(body); }));
    case "submitReview":
      return jsonOut(withScriptLock_(function () { return submitReview(body); }));
    case "deleteReview":
      return jsonOut(withScriptLock_(function () { return deleteReview(body); }));
    case "spinLead":
      return jsonOut(withScriptLock_(function () { return handleSpinLead(body); }));
    case "logError":
      // Best-effort client telemetry — never worth lock-contending with a
      // real order/cart write over, so it's the one write left unlocked.
      return jsonOut(logError(body));
    default:
      return jsonOut({ ok: false, error: "Unknown action: " + body.action });
  }
}

/* ============================================================ */
/* Concurrency                                                    */
/* ============================================================ */
// Every write handler below does an appendRow (and often an ensureHeaders
// read-modify-write on row 1) with no locking. Under concurrent traffic two
// requests can interleave mid-write — e.g. both read row 1 as the same
// "before" state, both append their own missing headers, and one order row
// ends up misaligned under the wrong columns, or a row is silently
// overwritten. A script-wide lock serializes every write handler so each
// runs start-to-finish before the next begins.
function withScriptLock_(fn) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return { ok: false, success: false, error: "Server is busy — please try again in a moment." };
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================ */
/* Coupons                                                       */
/* ============================================================ */
function validateCoupon(code) {
  const trimmed = String(code || "").trim().toUpperCase();
  if (!trimmed) return { valid: false, message: "Invalid code" };

  const sheet = ss().getSheetByName("Coupons");
  if (sheet) {
    const rows = sheet.getDataRange().getValues().slice(1); // skip header
    const match = rows.find((row) => String(row[0]).trim().toUpperCase() === trimmed);

    if (match) {
      const [, percent, active] = match;
      const isActive = active === true || Number(active) === 1 || String(active).trim().toUpperCase() === "TRUE";
      if (!isActive) {
        return { valid: false, message: "This code is no longer active" };
      }
      return { valid: true, percent: Number(percent) };
    }
  }

  // Not a manually-managed % coupon — check whether it's a live Spin-the-Wheel
  // prize code instead. Free-item prizes (e.g. SPINPOLA) carry 0% off; the
  // frontend grants the actual free item based on the code, so this only
  // needs to confirm the code is currently a real, active prize.
  const spin = getSpinConfig();
  if (spin.success) {
    const won = spin.segments.find((s) => String(s.code || "").trim().toUpperCase() === trimmed);
    if (won) return { valid: true, percent: 0 };
  }

  return { valid: false, message: "Invalid code" };
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
    "cart", "total", "coupon", "screenshotUrl", "timestamp", "invoiceUrl",
    "paymentVerified", "shippingLabel",
  ]);

  let screenshotUrl = "";
  if (body.screenshot && body.screenshotName) {
    try {
      const folder = getOrCreateFolder("The Layout — Payment Screenshots");
      // Accept either a full data URI ("data:image/jpeg;base64,...") or a
      // bare base64 string, in case the caller ever sends one without a
      // prefix. The frontend downscales screenshots to JPEG client-side, so
      // the mime type is read from the data URI rather than assumed.
      const raw = String(body.screenshot);
      const mimeMatch = raw.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
      const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, body.screenshotName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      screenshotUrl = file.getUrl();
    } catch (err) {
      // Don't let a Drive/permission failure block the order from being logged.
      screenshotUrl = "ERROR: " + err.message;
    }
  }

  const order = {
    orderId: body.orderId,
    customer: body.customer,
    cart: Array.isArray(body.cart) ? body.cart : [],
    total: body.total,
    coupon: body.coupon || "",
    ts: body.ts,
  };

  // Auto-generate a PDF invoice. Wrapped so a Drive failure never blocks the
  // order itself from being logged — same philosophy as the screenshot save
  // above.
  let invoiceUrl = "";
  try {
    const invoice = generateInvoicePdf_(order);
    invoiceUrl = invoice.url;
    // Not emailed automatically — the PDF is generated and saved to Drive
    // (link in the invoiceUrl column) for manual review/sending. To turn on
    // auto-email later, uncomment: sendInvoiceEmail_(order, invoice.blob);
  } catch (err) {
    invoiceUrl = "ERROR: " + err.message;
  }

  // Same generate-and-save treatment as the invoice above, just a different
  // document — a printable shipping label for whoever packs the order.
  let shippingLabelUrl = "";
  try {
    const label = generateShippingLabelPdf_(order);
    shippingLabelUrl = label.url;
  } catch (err) {
    shippingLabelUrl = "ERROR: " + err.message;
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
    invoiceUrl,
    "Pending...",
    shippingLabelUrl,
  ]);

  return { ok: true, orderId: body.orderId };
}

/* ============================================================ */
/* Invoices                                                      */
/* ============================================================ */
// Builds a fully custom-designed PDF invoice from an order (HTML + CSS
// rendered to PDF via Apps Script's blob conversion — no Docs/Slides
// template needed, so the design lives entirely in buildInvoiceHtml_ below
// and can be restyled without touching any external template file).
function generateInvoicePdf_(order) {
  const html = buildInvoiceHtml_(order);
  const htmlBlob = Utilities.newBlob(html, "text/html", "Invoice-" + order.orderId + ".html");
  const pdfBlob = htmlBlob.getAs("application/pdf").setName("Invoice-" + order.orderId + ".pdf");

  const folder = getOrCreateFolder("The Layout — Invoices");
  const file = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return { url: file.getUrl(), blob: pdfBlob };
}

function sendInvoiceEmail_(order, pdfBlob) {
  const email = order.customer && order.customer.email;
  if (!email) return;
  MailApp.sendEmail({
    to: email,
    subject: "Your Layout invoice — Order " + order.orderId,
    htmlBody:
      "<p>Hi " + escapeHtml_(order.customer.name || "") + ",</p>" +
      "<p>Thank you for your order! Your invoice is attached as a PDF.</p>" +
      "<p>Order ID: <strong>" + escapeHtml_(order.orderId) + "</strong><br/>" +
      "Total: <strong>" + formatINR_(order.total) + "</strong></p>" +
      "<p>We'll be in touch on WhatsApp shortly to confirm details. ♡ The Layout</p>",
    attachments: [pdfBlob],
    name: "The Layout",
  });
}

function buildInvoiceHtml_(order) {
  const cart = order.cart;
  const customer = order.customer || {};

  const comboNameById = {};
  cart.forEach((c) => { if (c.category === "combos") comboNameById[c.id] = c.name; });

  const subtotal = cart.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const discount = Math.max(0, subtotal - (Number(order.total) || 0));

  // Templates are always zero-cost picks tied to the magazine's page size —
  // one invoice row per template just pads the itemized list with a run of
  // ₹0.00 lines. Fold them into a single subtext line under the magazine
  // (sizes) row instead, same spirit as the on-site cart summary. The Pocket
  // Magazine is a separate standalone product with its own template picks
  // (category "pocket-templates"), folded the same way under its own row —
  // never mixed with the normal magazine's "templates" list.
  const templateItems = cart.filter((c) => c.category === "templates");
  const templateLabels = templateItems.map((t) => {
    const m = String(t.id).match(/tpl-(\d+)/);
    return m ? m[1] : escapeHtml_(t.name);
  });
  // A customer can buy several Pocket Magazines in one order (see
  // pocketUnits in store.ts) — each "pocket" cart line and its
  // "pocket-templates" lines share a `unit` id, so group template labels by
  // that unit instead of one flat list, or every Pocket Magazine row would
  // show *every* unit's templates instead of just its own. Cart lines from
  // before multi-unit Pocket Magazine existed have no `unit` field; those
  // fall into the "" bucket together, same as the old flat-list behavior.
  const pocketTemplateItems = cart.filter((c) => c.category === "pocket-templates");
  const pocketTemplateLabelsByUnit = {};
  pocketTemplateItems.forEach((t) => {
    const m = String(t.id).match(/tpl-(\d+)/);
    const label = m ? m[1] : escapeHtml_(t.name);
    const uk = t.unit || "";
    (pocketTemplateLabelsByUnit[uk] = pocketTemplateLabelsByUnit[uk] || []).push(label);
  });
  const invoiceCart = cart.filter((c) => c.category !== "templates" && c.category !== "pocket-templates");

  const rows = invoiceCart.map((item) => {
    const isSize = item.category === "sizes";
    const isPocket = item.category === "pocket";
    const isFriendship = item.category === "friendship";
    // Standard and Mini share the same item.name ("8 Pages", etc.) — the
    // format only shows up in the id suffix (sz-8 vs sz-8-mini) — so spell
    // it out here or the invoice can't tell the customer which one they got.
    const isMini = isSize && /-mini$/.test(String(item.id));
    const formatLabel = isMini ? "Mini Magazine, A5" : "Normal Magazine, A4";
    const label = isSize
      ? ("Custom Magazine (" + item.name + ", " + formatLabel + ")")
      : isPocket
        ? "Pocket Magazine (6 Pages, Pocket Size)"
        // "Single Card" / "Duo Card — BESTIE SET" read fine on-site (under a
        // section already titled Friendship Card) but are ambiguous on a
        // flat invoice line. Parenthesise rather than prefix with a dash —
        // the item name already contains "Duo Card — BESTIE SET", and a
        // second leading dash there reads as a typo, not two separate names.
        : isFriendship
          ? ("Friendship Card (" + item.name + ")")
          : item.name;
    const notes = [];
    if (item.note) notes.push(escapeHtml_(item.note));
    if (item.comboId) notes.push("Included in " + escapeHtml_(comboNameById[item.comboId] || "combo"));
    if (item.promoCode) notes.push("Free — redeemed with " + escapeHtml_(item.promoCode));
    if (isSize && templateLabels.length) notes.push("Templates:- " + templateLabels.join(", "));
    if (isPocket) {
      const pocketLabels = pocketTemplateLabelsByUnit[item.unit || ""] || [];
      if (pocketLabels.length) notes.push("Templates:- " + pocketLabels.join(", "));
    }
    const noteHtml = notes.length ? ('<div class="item-note">' + notes.join(" · ") + "</div>") : "";
    return (
      "<tr>" +
      "<td>" + escapeHtml_(label) + noteHtml + "</td>" +
      '<td class="num">1</td>' +
      '<td class="num">' + formatINR_(item.price) + "</td>" +
      '<td class="num">' + formatINR_(item.price) + "</td>" +
      "</tr>"
    );
  }).join("");

  const discountRow = discount > 0
    ? (
      "<tr><td colspan=\"3\">Discount" + (order.coupon ? (" (" + escapeHtml_(order.coupon) + ")") : "") + "</td>" +
      '<td class="num">-' + formatINR_(discount) + "</td></tr>"
    )
    : "";

  const addressHtml = escapeHtml_(customer.address || "").replace(/\n/g, "<br/>");
  const logoTag = getLogoImgTag_();

  return (
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>" +
    "body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; background: #fce9ef; }" +
    ".header { display: table; width: 100%; }" +
    ".header-left, .header-right { display: table-cell; vertical-align: top; }" +
    ".header-right { text-align: right; }" +
    ".brand { font-size: 14px; font-weight: bold; color: #c1476d; }" +
    ".invoice-no { font-size: 14px; font-weight: bold; color: #c1476d; }" +
    ".invoice-date { font-size: 12px; color: #ba7080; }" +
    ".rule { border-top: 3px solid #e5a8ba; margin: 16px 0 24px; }" +
    "h1.title { font-size: 32px; margin: 0 0 24px; font-weight: 400; color: #c1476d; }" +
    ".meta { display: table; width: 100%; margin-bottom: 24px; }" +
    ".meta-col { display: table-cell; width: 33%; vertical-align: top; padding-right: 16px; }" +
    ".meta-label { font-size: 10px; font-weight: bold; letter-spacing: 1px; color: #ba7080; margin-bottom: 4px; }" +
    ".meta-value { font-size: 12px; line-height: 1.5; }" +
    "table.items { width: 100%; border-collapse: collapse; margin-bottom: 8px; background: #fffafc; }" +
    "table.items th { background: #f4c6d3; text-align: left; font-size: 10px; letter-spacing: 1px; padding: 8px; color: #7d2b45; }" +
    "table.items th.num, table.items td.num { text-align: right; }" +
    "table.items td { padding: 10px 8px; font-size: 12px; border-bottom: 1px solid #f6dde5; vertical-align: top; }" +
    ".item-note { color: #ba7080; font-size: 10px; margin-top: 2px; }" +
    ".total-row td { font-weight: bold; font-size: 14px; border-top: 2px solid #c1476d; padding-top: 12px; border-bottom: none; }" +
    ".footer { margin-top: 24px; font-size: 11px; color: #444; line-height: 1.6; }" +
    ".terms-title { font-weight: bold; }" +
    ".footer-logo { text-align: center; margin-top: 32px; }" +
    "</style></head><body>" +
    "<div class=\"header\">" +
    "<div class=\"header-left\">" + logoTag + "<div class=\"brand\">The Layout</div></div>" +
    "<div class=\"header-right\"><div class=\"invoice-no\"># " + escapeHtml_(order.orderId) + "</div>" +
    "<div class=\"invoice-date\">" + formatInvoiceDate_(order.ts) + "</div></div>" +
    "</div>" +
    "<div class=\"rule\"></div>" +
    "<h1 class=\"title\">INVOICE</h1>" +
    "<div class=\"meta\">" +
    "<div class=\"meta-col\"><div class=\"meta-label\">BILL TO</div>" +
    "<div class=\"meta-value\"><strong>" + escapeHtml_(customer.name || "") + "</strong><br/>" +
    escapeHtml_(customer.phone || "") + "<br/>" + escapeHtml_(customer.email || "") + "</div></div>" +
    "<div class=\"meta-col\"><div class=\"meta-label\">SHIP TO</div>" +
    "<div class=\"meta-value\">" + addressHtml + "</div></div>" +
    "<div class=\"meta-col\"><div class=\"meta-label\">PAYMENT</div>" +
    "<div class=\"meta-value\">Payment Terms: Non-refundable</div></div>" +
    "</div>" +
    "<table class=\"items\">" +
    "<tr><th>ITEM</th><th class=\"num\">QTY</th><th class=\"num\">RATE</th><th class=\"num\">AMOUNT</th></tr>" +
    rows + discountRow +
    "<tr class=\"total-row\"><td colspan=\"3\">Total</td><td class=\"num\">" + formatINR_(order.total) + "</td></tr>" +
    "</table>" +
    "<div class=\"footer\">" +
    "<p>Thank you for choosing The Layout. We appreciate your trust in us. Please keep this invoice for your records. We hope you love your personalized magazine!</p>" +
    "<p><span class=\"terms-title\">Terms &amp; Conditions:</span> Full payment is required before production begins. " +
    "As all products are personalized, orders are non-refundable and non-returnable once confirmed. Customers are " +
    "responsible for verifying all details before approving the final design. Delivery timelines are estimates and " +
    "may vary. This invoice serves as proof of purchase.</p>" +
    "</div>" +
    "<div class=\"footer-logo\">" + getLogoImgTag_() + "</div>" +
    "</body></html>"
  );
}

function getLogoImgTag_() {
  return '<img src="data:image/png;base64,' + INVOICE_LOGO_BASE64 + '" alt="The Layout" style="height:64px;width:64px;object-fit:contain;margin-bottom:6px;" />';
}

function formatINR_(n) {
  const num = Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatInvoiceDate_(isoString) {
  const d = isoString ? new Date(isoString) : new Date();
  return Utilities.formatDate(d, "Asia/Kolkata", "MMM d, yyyy");
}

function escapeHtml_(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================================================ */
/* Shipping labels                                                */
/* ============================================================ */
// Same generate-to-Drive shape as the invoice above (own folder, "anyone
// with the link" sharing, wrapped so a Drive failure never blocks the order
// row) but a different, purpose-built document: a compact label a packer
// can print and stick straight on the parcel, styled after a physical
// courier label rather than a billing document.
function generateShippingLabelPdf_(order) {
  const html = buildShippingLabelHtml_(order);
  const htmlBlob = Utilities.newBlob(html, "text/html", "ShippingLabel-" + order.orderId + ".html");
  const pdfBlob = htmlBlob.getAs("application/pdf").setName("ShippingLabel-" + order.orderId + ".pdf");

  const folder = getOrCreateFolder("The Layout — Shipping Labels");
  const file = folder.createFile(pdfBlob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return { url: file.getUrl(), blob: pdfBlob };
}

// Cart-line category → the generic product name that belongs on a shipping
// label. Deliberately coarser than the invoice's per-item labels (no page
// count, no format spelled out beyond A4/A5, no note text) — a packer needs
// to know *what to grab off the shelf*, not the customer's exact spec.
function shippingItemLabel_(item) {
  switch (item.category) {
    case "sizes": {
      const isMini = /-mini$/.test(String(item.id));
      return isMini ? "A5 Magazine" : "A4 Magazine";
    }
    case "pocket": return "Pocket Magazine";
    case "newspaper": return "Newspaper Magazine";
    case "friendship": return "Friendship Card";
    case "polaroids": return "Polaroid Pack";
    case "strips": return "Polaroid Strips";
    case "addons": return "Add-on";
    case "combos": return String(item.name || "Combo");
    case "promotions": return String(item.name || "Free Gift");
    default: return String(item.name || item.category || "Item");
  }
}

// Builds the multi-line "ITEM" cell content: one line per distinct product
// category in the order, collapsed to a count (e.g. "Pocket Magazine × 3")
// rather than one line per unit — a 3-pocket-magazine order shouldn't
// produce three identical lines. Templates are zero-cost sub-selections
// (same reason the invoice folds them into a note, not a row) and delivery
// drives the banner text instead of appearing here, so both are excluded;
// combo-linked lines (comboId set) are skipped since the combo's own line
// already represents them.
function shippingItemSummaryHtml_(cart) {
  const EXCLUDE = { templates: true, "pocket-templates": true, delivery: true };
  const counts = {};
  const order = [];
  cart.forEach((item) => {
    if (EXCLUDE[item.category]) return;
    if (item.comboId) return;
    const label = shippingItemLabel_(item);
    if (!(label in counts)) order.push(label);
    counts[label] = (counts[label] || 0) + 1;
  });
  if (!order.length) return "—";
  return order
    .map((label) => escapeHtml_(counts[label] > 1 ? (label + " × " + counts[label]) : label))
    .join("<br/>");
}

// The reference label design shows a plain "999/-" style amount, not the
// invoice's "₹999.00" — kept as its own formatter rather than reusing
// formatINR_ so the two documents can diverge without one editing the other.
function formatPlainINR_(n) {
  const num = Math.round(Number(n) || 0);
  return num.toLocaleString("en-IN") + "/-";
}

function buildShippingLabelHtml_(order) {
  const cart = order.cart;
  const customer = order.customer || {};

  const delivery = cart.find((c) => c.category === "delivery");
  // Express Shipping's id is "del-exp" — see CATALOG.delivery in catalog.ts.
  const isExpress = !!delivery && /exp/i.test(String(delivery.id));
  const bannerText = isExpress ? "EXPRESS SHIPPING" : "NORMAL SHIPPING";

  const itemHtml = shippingItemSummaryHtml_(cart);
  const addressHtml = escapeHtml_(customer.address || "").replace(/\n/g, "<br/>");
  const logoTag = getLogoImgTag_().replace(
    'style="height:64px;width:64px;object-fit:contain;margin-bottom:6px;"',
    'style="height:46px;width:46px;object-fit:contain;"',
  );

  return (
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>" +
    "@page { size: 6in 4in; margin: 0; }" +
    "* { box-sizing: border-box; }" +
    "body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0.18in; width: 6in; background: #fff; }" +
    ".label { border: 3px solid #000; }" +
    ".banner { background: #000; display: table; width: 100%; table-layout: fixed; }" +
    ".banner-text { display: table-cell; vertical-align: middle; padding: 12px 14px; font-size: 26px; font-weight: 800; letter-spacing: 1px; color: #fff; }" +
    ".banner-logo { display: table-cell; width: 66px; vertical-align: middle; text-align: center; padding: 6px; background: #fff; }" +
    ".body-row { display: table; width: 100%; table-layout: fixed; border-bottom: 2px solid #000; min-height: 2.4in; }" +
    ".col-left, .col-right { display: table-cell; vertical-align: top; padding: 12px 14px; }" +
    ".col-left { width: 62%; }" +
    ".col-right { width: 38%; border-left: 2px solid #000; padding: 0; }" +
    ".field { margin-bottom: 10px; }" +
    ".field:last-child { margin-bottom: 0; }" +
    ".field-label { font-size: 9px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }" +
    ".field-value { font-size: 11px; margin-top: 2px; line-height: 1.4; }" +
    ".right-row { padding: 9px 14px; border-bottom: 1px solid #000; }" +
    ".right-row:last-child { border-bottom: none; }" +
    ".footer-row { display: table; width: 100%; table-layout: fixed; padding: 10px 14px; }" +
    ".footer-left, .footer-right { display: table-cell; vertical-align: middle; }" +
    ".footer-right { text-align: right; font-size: 10px; font-style: italic; line-height: 1.4; }" +
    ".order-label { font-size: 9px; font-weight: 800; text-transform: uppercase; }" +
    ".order-value { font-size: 18px; font-weight: 800; letter-spacing: 1px; }" +
    "</style></head><body>" +
    "<div class=\"label\">" +
    "<div class=\"banner\"><div class=\"banner-text\">" + escapeHtml_(bannerText) + "</div>" +
    "<div class=\"banner-logo\">" + logoTag + "</div></div>" +
    "<div class=\"body-row\">" +
    "<div class=\"col-left\">" +
    "<div class=\"field\"><div class=\"field-label\">Name:</div><div class=\"field-value\">" + escapeHtml_(customer.name || "") + "</div></div>" +
    "<div class=\"field\"><div class=\"field-label\">Phone No.</div><div class=\"field-value\">" + escapeHtml_(customer.phone || "") + "</div></div>" +
    "<div class=\"field\"><div class=\"field-label\">Email ID:</div><div class=\"field-value\">" + escapeHtml_(customer.email || "") + "</div></div>" +
    "<div class=\"field\"><div class=\"field-label\">Ship To:</div><div class=\"field-value\">" + addressHtml + "</div></div>" +
    "</div>" +
    "<div class=\"col-right\">" +
    "<div class=\"right-row\"><div class=\"field-label\">From :</div><div class=\"field-value\">The Layout</div></div>" +
    "<div class=\"right-row\"><div class=\"field-label\">Payment Status:</div><div class=\"field-value\">PRE-PAID</div></div>" +
    "<div class=\"right-row\"><div class=\"field-label\">Amount:</div><div class=\"field-value\">" + formatPlainINR_(order.total) + "</div></div>" +
    "<div class=\"right-row\"><div class=\"field-label\">Item :</div><div class=\"field-value\">" + itemHtml + "</div></div>" +
    "</div>" +
    "</div>" +
    "<div class=\"footer-row\">" +
    "<div class=\"footer-left\"><span class=\"order-label\">Order Number : </span><span class=\"order-value\">" + escapeHtml_(order.orderId) + "</span></div>" +
    "<div class=\"footer-right\">Thank you for shopping<br/>from &quot;The Layout&quot; :)</div>" +
    "</div>" +
    "</div>" +
    "</body></html>"
  );
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
/* Error Telemetry                                                */
/* ============================================================ */
// Fed by src/lib/telemetry.ts — uncaught client errors and unhandled
// rejections, capped and deduped on the frontend before they ever get here.
// If the "Errors" tab doesn't exist yet, the report is silently dropped
// rather than breaking sendBeacon's fire-and-forget POST.
function logError(body) {
  const sheet = ss().getSheetByName("Errors");
  if (!sheet) return { ok: true };
  ensureHeaders(sheet, ["timestamp", "message", "stack", "url", "userAgent", "extra"]);

  const known = { message: 1, stack: 1, url: 1, userAgent: 1, ts: 1, action: 1 };
  const extra = {};
  Object.keys(body).forEach((k) => { if (!known[k]) extra[k] = body[k]; });

  sheet.appendRow([
    body.ts || new Date().toISOString(),
    String(body.message || "").slice(0, 2000),
    String(body.stack || "").slice(0, 4000),
    String(body.url || ""),
    String(body.userAgent || ""),
    Object.keys(extra).length ? JSON.stringify(extra) : "",
  ]);

  return { ok: true };
}

/* ============================================================ */
/* Spin the Wheel                                                */
/* ============================================================ */
// Single source of truth for both the wheel's visual segments and the
// actual win odds — read fresh from the sheet on every call so the two
// can never drift out of sync. Edit the "Spin Config" tab to add,
// remove, reorder, reweight, or pause prizes; no redeploy needed.
//
// Used only as a bootstrap default before the "Spin Config" tab exists,
// so the wheel works out of the box. Once that tab exists, it fully
// takes over — including the ability to intentionally empty/deactivate
// every row to pause the whole feature.
const DEFAULT_SPIN_SEGMENTS = [
  { order: 1, label: "FREE 1 Polaroid Strip",       icon: "polaroid", code: "SPINPOLA",   weight: 20, color: null },
  { order: 2, label: "FREE Personalized Letter",    icon: "envelope", code: "SPINLETTER", weight: 20, color: null },
  { order: 3, label: "10% OFF Your Magazine Order", icon: "tag",      code: "SPIN10",     weight: 25, color: null },
  { order: 4, label: "FREE Sticker Pack",           icon: "sticker",  code: "SPINSTICK",  weight: 20, color: null },
  { order: 5, label: "Better Luck Next Time",       icon: "clover",   code: null,         weight: 15, color: null },
];

function getSpinConfig() {
  const sheet = ss().getSheetByName("Spin Config");
  if (!sheet) return { success: true, segments: DEFAULT_SPIN_SEGMENTS, usingDefaults: true };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, segments: [], error: "Spin wheel is not configured" };

  const [headers, ...rows] = data;
  const idx = {
    order: headers.indexOf("Order"),
    label: headers.indexOf("Label"),
    icon: headers.indexOf("Icon"),
    code: headers.indexOf("Code"),
    weight: headers.indexOf("Weight"),
    active: headers.indexOf("Active"),
    color: headers.indexOf("Color"),
  };
  const isActive = (v) => v === true || Number(v) === 1 || String(v).trim().toUpperCase() === "TRUE";

  const segments = rows
    .filter((r) => isActive(r[idx.active]))
    .map((r) => ({
      order: Number(r[idx.order]) || 0,
      label: String(r[idx.label] || "").trim(),
      icon: String(r[idx.icon] || "").trim(),
      code: String(r[idx.code] || "").trim() || null,
      weight: Number(r[idx.weight]) || 1,
      color: String(r[idx.color] || "").trim() || null,
    }))
    .filter((s) => s.label)
    .sort((a, b) => a.order - b.order);

  if (segments.length === 0) return { success: false, segments: [], error: "Spin wheel is not configured" };
  return { success: true, segments };
}

function handleSpinLead(body) {
  const sheet = ss().getSheetByName("Spin Leads");
  if (!sheet) return { success: false, error: "Spin Leads sheet not found — create this tab first" };

  const headers = ["Timestamp", "Email", "Marketing Opt-in", "Segment Won", "Coupon Code", "Session ID", "Redeemed", "Expires At"];
  ensureHeaders(sheet, headers);

  const email = String(body.email || "").trim().toLowerCase();
  const sessionId = String(body.sessionId || "");
  const optIn = !!body.optIn;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email" };
  }

  // No per-email lock — every visit is a fresh chance to spin, so we always
  // roll a new prize and log a new row rather than replaying a past result.
  const config = getSpinConfig();
  if (!config.success) {
    return { success: false, error: config.error };
  }

  const won = pickWeighted(config.segments);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  sheet.appendRow([new Date(), email, optIn, won.label, won.code || "", sessionId, false, expiresAt]);

  return {
    success: true,
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
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }
  // Lightweight migration: append any headers this sheet doesn't have yet
  // onto the end of row 1, so existing sheets (with existing data) pick up
  // new columns automatically instead of needing a manual edit.
  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const missing = headers.filter((h) => existing.indexOf(h) === -1);
  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  }
}

function getOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
