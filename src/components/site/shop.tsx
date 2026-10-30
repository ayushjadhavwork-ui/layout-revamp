import { useEffect, useState } from "react";
import { X, ShoppingBag, Trash2, Plus, Minus, Check, ArrowUpRight, Truck } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, CONFIG, fmt, comboRealTotal, STICKER_BOOK_INCLUDED, IT_POLAROIDS_MAX, IT_POLAROIDS_MIN, type Category } from "@/lib/catalog";
import { PRICES } from "@/lib/prices";
import { useStore, useComboIssues, isPolaroidsOnlyCart, deliveryPriceFor, itPolaroidsQtyIn } from "@/lib/store";
import { logCart, completeOrder } from "@/lib/gas";
import { redeemCoupon } from "@/lib/coupons";
import { SITE } from "@/lib/site-content";
import { createPortal } from "react-dom";

/* ================================================================ */
/*                          CART DRAWER                             */
/* ================================================================ */

// Shared promo-code entry point — used in the cart drawer AND surfaced again
// during checkout (customer info + payment steps), since a customer who
// clicks "Complete my order" without ever opening the cart drawer would
// otherwise never see anywhere to apply a coupon.
export function PromoCodeBox() {
  const coupon = useStore((s) => s.coupon);
  const setCoupon = useStore((s) => s.setCoupon);

  const [promo, setPromo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  // A product coupon is dropped when its product leaves the cart — don't
  // leave its "applied" message behind.
  useEffect(() => {
    if (!coupon) setMsg((m) => (m?.startsWith("Coupon applied") ? null : m));
  }, [coupon]);

  const applyPromo = async () => {
    if (!promo.trim()) return;
    setMsg(null);
    setChecking(true);
    try {
      const res = await redeemCoupon(promo);
      if (res.ok) {
        setMsg(`Coupon applied — ${res.message}`);
        toast.success(res.message);
      } else {
        setCoupon(null);
        setMsg(res.message);
      }
    } catch {
      setMsg("Could not validate — try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          placeholder="Promo code"
          className="flex-1 rounded-full border border-rose-wine/20 bg-white/60 px-4 py-2 text-sm outline-none focus:border-rose-wine"
        />
        <button type="button" onClick={applyPromo} disabled={checking} className="pill-btn pill-btn-hover">
          {checking ? "…" : "Apply"}
        </button>
      </div>
      {msg ? (
        <p className={`mt-2 text-xs ${coupon ? "text-green-700" : "text-rose-wine"}`}>{msg}</p>
      ) : coupon ? (
        <p className="mt-2 text-xs text-green-700">Code "{coupon.code}" applied — {coupon.amount ? fmt(coupon.amount) : `${coupon.percent}%`} off.</p>
      ) : null}
    </div>
  );
}

// Cart badges show the category key, except where the key's internal name
// differs from what customers see.
const CATEGORY_BADGE: Partial<Record<Category, string>> = {
  "memory-card": "memory card",
  friendship: "license card",
  "it-polaroids": "instant polaroids",
  "sticker-book": "sticker book bundle",
};

// Shipping nudge shown in the cart drawer and checkout popup: polaroid-only
// carts pay for Standard Delivery (see standardDeliveryPrice in store.ts),
// any cart with something else in it ships free. Hidden once Express
// Shipping is picked, since neither message applies to it.

export function ShippingBanner() {
  const cart = useStore((s) => s.cart);
  if (!cart.some((c) => c.price > 0)) return null;
  if (cart.some((c) => c.category === "delivery" && c.id === "del-exp")) return null;
  if (isPolaroidsOnlyCart(cart)) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
        <Truck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>🚚 Polaroid Shipping: {fmt(PRICES.deliveryPolaroidsOnly["del-std"])}. Tip: Add anything else — a magazine, card, sticker book or combo — to unlock FREE shipping!</span>
      </p>
    );
  }
  return (
    <p className="rounded-2xl bg-rose-wine/5 p-3 text-center text-xs font-medium text-rose-wine ring-1 ring-rose-wine/10">
      ✨ Free Standard Shipping on this order ♡
    </p>
  );
}

// Quantity stepper for THE IT POLAROIDS' cart line.
function ItPolaroidsStepper() {
  const qty = useStore((s) => itPolaroidsQtyIn(s.cart));
  const setQty = useStore((s) => s.setItPolaroidsQty);
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <button type="button" onClick={() => setQty(qty - 1)} disabled={qty <= IT_POLAROIDS_MIN} aria-label="Fewer polaroids" className="grid h-7 w-7 place-items-center rounded-full border border-rose-wine/30 text-rose-wine disabled:opacity-35">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="rounded-full bg-rose-wine px-3 py-1 text-xs font-semibold text-off-white">Qty: {qty}</span>
      <button type="button" onClick={() => setQty(qty + 1)} disabled={qty >= IT_POLAROIDS_MAX} aria-label="More polaroids" className="grid h-7 w-7 place-items-center rounded-full border border-rose-wine/30 text-rose-wine disabled:opacity-35">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const cart = useStore((s) => s.cart);
  const removeItem = useStore((s) => s.removeItem);
  const deselectCombo = useStore((s) => s.deselectCombo);
  const subtotal = useStore((s) => s.subtotal());
  const discount = useStore((s) => s.discount());
  const total = useStore((s) => s.total());
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const templateLimit = useStore((s) => s.templateLimit());
  const pocketUnits = useStore((s) => s.pocketUnits);
  const pocketTemplateLimit = useStore((s) => s.pocketTemplateLimit());
  const selectedFriendshipId = useStore((s) => s.selectedFriendshipId);
  const selectedFriendshipDesignIds = useStore((s) => s.selectedFriendshipDesignIds);
  const friendshipDesignLimit = useStore((s) => s.friendshipDesignLimit());
  const minOrder = SITE.commerce.minOrderValue;
  const belowMin = cart.length > 0 && total < minOrder;
  const templatesIncomplete = !!selectedSizeId && selectedTemplateIds.length < templateLimit;
  const pocketTemplatesIncomplete = pocketUnits.some((u) => u.templateIds.length < pocketTemplateLimit);
  const friendshipDesignsIncomplete =
    !!selectedFriendshipId && selectedFriendshipDesignIds.length < friendshipDesignLimit;
  // Combo gaps first (each names exactly what's missing), then the general
  // picks every order needs — skipped when a combo issue already covers that
  // section so the same gap isn't listed twice.
  const comboIssues = useComboIssues();
  const comboSections = new Set(comboIssues.map((issue) => issue.section));
  const checkoutIssues = [
    ...comboIssues.map((issue) => issue.message),
    ...(templatesIncomplete && !comboSections.has("templates")
      ? [`Select ${templateLimit - selectedTemplateIds.length} more template${templateLimit - selectedTemplateIds.length === 1 ? "" : "s"} for your magazine (${selectedTemplateIds.length}/${templateLimit} picked).`]
      : []),
    ...(pocketTemplatesIncomplete && !comboSections.has("pocket")
      ? ["Finish picking templates for every Pocket Magazine in your cart."]
      : []),
    ...(friendshipDesignsIncomplete && !comboSections.has("friendship-card")
      ? [`Select ${friendshipDesignLimit - selectedFriendshipDesignIds.length} more card design${friendshipDesignLimit - selectedFriendshipDesignIds.length === 1 ? "" : "s"} (${selectedFriendshipDesignIds.length}/${friendshipDesignLimit} picked).`]
      : []),
  ];
  // Delivery is no longer gated here — it's chosen inside the checkout
  // popup (CustomerInfoModal), which blocks moving on to payment until it's
  // picked. Gating it a second time here would
  // just disable this button with no way to fix it from this drawer.
  // Numbered the same way templates are ("[1, 2, 3]" in CartSummaryPanel) —
  // extract the design's number from its id (card-1 -> "01") rather than
  // joining full names, so this subtext line matches the templates format.
  const friendshipDesignNumbers = cart
    .filter((c) => c.category === "friendship-designs")
    .map((c) => {
      const m = c.id.match(/card-(\d+)/);
      return m ? m[1].padStart(2, "0") : c.id;
    });

  const memoryCardDesigns = cart
    .filter((c) => c.category === "memory-card-designs")
    .map((c) => c.name);

  const activeCombo = cart.find((c) => c.category === "combos");
  const comboOriginal = activeCombo ? comboRealTotal(activeCombo.id) : 0;
  const comboSavings = activeCombo ? Math.max(0, comboOriginal - activeCombo.price) : 0;

  const promoItems = cart.filter((c) => c.category === "promotions" && !c.comboId);
  // License Card design picks are zero-cost sub-selections of the
  // "friendship" row (same relationship templates have to a magazine's
  // "sizes" row) — fold them into a note under that row (below) instead of
  // letting them leak through as their own bare ₹0.00-ish rows.
  const mainItems = cart.filter((c) => c.category !== "promotions" && c.category !== "friendship-designs" && c.category !== "memory-card-designs" && !c.comboId);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-rose-wine/25 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col p-4 animate-[slideInRight_.3s_ease-out]">
        <style>{`@keyframes slideInRight{from{transform:translateX(100%);}to{transform:translateX(0);}}`}</style>
        <div className="glass flex h-full flex-col rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-3xl text-rose-wine">Your cart</h3>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-rose-wine/10" aria-label="Close">
              <X className="h-5 w-5 text-rose-wine" />
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {cart.length === 0 && <p className="text-center text-dusty-rose py-10">Your cart is empty.</p>}

            {cart.length > 0 && <CartSummaryPanel />}

            <ShippingBanner />

            {mainItems.map((item) => (
              <div key={item.key} className="flex items-start gap-3 rounded-2xl bg-white/50 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-mist to-blush-rose font-display text-white">
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-rose-wine">
                    {item.category === "it-polaroids" ? `${SITE.itPolaroids.name} (Qty: ${itPolaroidsQtyIn(cart)})` : item.name}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-dusty-rose">
                    {CATEGORY_BADGE[item.category] ?? item.category}{item.comboId ? " · in combo" : ""}
                  </p>
                  {item.category === "friendship" && friendshipDesignNumbers.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-600">
                      Design: [{friendshipDesignNumbers.join(", ")}]
                    </p>
                  )}
                  {item.category === "sticker-book" && (
                    <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                      <li>• A5 sticker book + 16 photo stickers</li>
                      {STICKER_BOOK_INCLUDED.map((inc) => <li key={inc.name}>• {inc.name}</li>)}
                    </ul>
                  )}
                  {item.category === "it-polaroids" && (
                    <>
                      <p className="mt-1 text-xs text-neutral-600">
                        {itPolaroidsQtyIn(cart)} photo{itPolaroidsQtyIn(cart) === 1 ? "" : "s"} (1 photo per polaroid)
                      </p>
                      <ItPolaroidsStepper />
                    </>
                  )}
                  {item.category === "memory-card" && memoryCardDesigns.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-600">
                      Designs: {memoryCardDesigns.join(", ")}
                    </p>
                  )}
                  {item.category === "combos" && (
                    <ul className="mt-2 space-y-0.5 text-xs text-neutral-600">
                      {cart.filter((included) => included.comboId === item.id && included.category !== "friendship-designs" && included.category !== "memory-card-designs").map((included) => (
                        <li key={included.key}>• {included.name}</li>
                      ))}
                    </ul>
                  )}
                  {item.note && <p className="mt-1 text-xs text-neutral-600 italic">"{item.note}"</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blush-rose">{item.price ? fmt(item.price) : "—"}</p>
                  {item.comboId ? (
                    <span className="mt-1 block text-[0.65rem] text-dusty-rose">included</span>
                  ) : (
                    <button
                      onClick={() => (item.category === "combos" ? deselectCombo(item.id) : removeItem(item.key))}
                      className="mt-1 text-neutral-400 hover:text-rose-wine"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {promoItems.length > 0 && (
              <div className="rounded-2xl bg-blush-rose/10 p-3 ring-1 ring-blush-rose/20">
                <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-blush-rose">
                  🎁 Promotions
                </p>
                <div className="space-y-2">
                  {promoItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-rose-wine">{item.name}</p>
                        <p className="text-[0.65rem] text-dusty-rose">redeemed with {item.promoCode}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-blush-rose">Free</span>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="text-neutral-400 hover:text-rose-wine"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/60 pt-4 text-sm">
            {activeCombo && comboSavings > 0 && (
              <div className="flex justify-between text-xs text-dusty-rose">
                <span>{activeCombo.name} value</span>
                <span className="line-through">{fmt(comboOriginal)}</span>
              </div>
            )}
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <PromoCodeBox />
            <div className="flex justify-between"><span>Discount</span><span>−{fmt(discount)}</span></div>
            <DeliveryEta />
            <div className="flex justify-between border-t border-white/60 pt-2 text-lg font-semibold">
              <span>Total</span><span className="text-blush-rose">{fmt(total)}</span>
            </div>
            {belowMin && (
              <p className="text-center text-xs text-rose-wine">
                Add {fmt(minOrder - total)} more to reach the {fmt(minOrder)} minimum order value.
              </p>
            )}
          </div>

          {checkoutIssues.length > 0 && (
            <div role="alert" className="mt-3 text-rose-wine text-xs bg-rose-50 border border-rose-200 rounded-md p-3 space-y-1">
              <p className="font-semibold">Complete your order before checking out:</p>
              <ul className="space-y-0.5">
                {checkoutIssues.map((issue) => <li key={issue}>• {issue}</li>)}
              </ul>
            </div>
          )}

          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || belowMin || checkoutIssues.length > 0}
            className="pill-btn pill-btn-hover pill-primary mt-5 w-full disabled:opacity-50"
          >
            Checkout <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

/* ================================================================ */
/*                       CUSTOMER INFO MODAL                        */
/* ================================================================ */

export function CustomerInfoModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const setCustomer = useStore((s) => s.setCustomer);
  const setCartId = useStore((s) => s.setCartId);
  const customer = useStore((s) => s.customer);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const subtotal = useStore((s) => s.subtotal());
  const discount = useStore((s) => s.discount());
  const total = useStore((s) => s.total());
  const [submitting, setSubmitting] = useState(false);

  const ensureStandardDelivery = useStore((s) => s.ensureStandardDelivery);
  const deliveryItem = cart.find((c) => c.category === "delivery");
  const minDeliveryDate = earliestDeliveryDate();

  // Standard Delivery is pre-selected whenever the popup opens without one;
  // the options below still let the customer switch to Express.
  useEffect(() => {
    if (open) ensureStandardDelivery();
  }, [open, ensureStandardDelivery]);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deliveryItem) return toast.error("Choose a delivery option first.");
    const fd = new FormData(e.currentTarget);
    const info = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      pincode: String(fd.get("pincode") || "").trim(),
      whatsapp: String(fd.get("whatsapp") || "").trim(),
      // Optional — an empty value just means "as soon as possible".
      preferredDeliveryDate: String(fd.get("preferredDeliveryDate") || "").trim(),
    };
    if (!info.name || !info.phone || !info.email || !info.address || !info.pincode || !info.whatsapp)
      return toast.error("Fill all fields");
    if (!/^\d{6}$/.test(info.pincode)) return toast.error("Enter a valid 6-digit pincode");
    if (info.whatsapp.replace(/\D/g, "").length < 10) return toast.error("Enter a valid WhatsApp number");
    if (info.preferredDeliveryDate && info.preferredDeliveryDate < minDeliveryDate)
      return toast.error(`Pick a delivery date at least ${DELIVERY_BUFFER_DAYS} days from today.`);


    setSubmitting(true);
    setCustomer(info);
    try {
      const cartId = `TL-${Date.now().toString(36).toUpperCase()}`;
      setCartId(cartId);
      await logCart({ cartId, customer: info, cart, total, ts: new Date().toISOString() });
      onSubmit();
    } catch {
      toast.error("Could not save details — continuing anyway.");
      onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell onClose={onClose} maxW="max-w-lg">
      <h3 className="font-display text-3xl text-rose-wine">A few details first</h3>
      <p className="mt-1 text-sm text-dusty-rose">We need this to process and ship your order.</p>

      <div className="mt-4 rounded-xl bg-white/60 p-3 ring-1 ring-rose-wine/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-wine mb-2">Have a promo code?</p>
        <PromoCodeBox />
        <div className="mt-3 space-y-1 border-t border-rose-wine/10 pt-2 text-sm">
          <div className="flex justify-between text-dusty-rose"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-dusty-rose"><span>Discount</span><span>−{fmt(discount)}</span></div>}
          <div className="flex justify-between font-semibold text-rose-wine"><span>Total</span><span>{fmt(total)}</span></div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-wine mb-2">Choose delivery</p>
        <div className="grid grid-cols-2 gap-2">
          {CATALOG.delivery.map((d) => {
            const active = deliveryItem?.id === d.id;
            const eta = getEstimatedDeliveryDate(d.id === "del-exp");
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => addItem("delivery", d)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-rose-wine bg-rose-wine/10"
                    : "border-rose-wine/20 bg-white/60 hover:border-rose-wine/40"
                }`}
              >
                <p className="flex items-center gap-1.5 text-sm font-medium text-rose-wine">
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />} {d.name}
                </p>
                <p className="text-xs text-dusty-rose">{deliveryPriceFor(d, cart) ? fmt(deliveryPriceFor(d, cart)) : "Free"}</p>
                <p className="mt-0.5 text-[0.7rem] text-neutral-600">
                  Arrives by {eta.formatted} ({eta.days} days)
                </p>
              </button>
            );
          })}
        </div>
        {!deliveryItem && (
          <p className="mt-2 text-xs text-rose-wine">Select a delivery option to continue.</p>
        )}
        <div className="mt-2"><ShippingBanner /></div>
      </div>

      <form onSubmit={handle} className="mt-5 space-y-3">
        <Field label="Full name" name="name" required maxLength={100} defaultValue={customer?.name} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Shipping phone" name="phone" type="tel" required maxLength={20} defaultValue={customer?.phone} />
          <Field label="Email" name="email" type="email" required maxLength={200} defaultValue={customer?.email} />
        </div>
        <p className="-mt-1 text-xs text-dusty-rose">
          This shipping phone number is used only for delivery-related contact, and appears on the invoice and shipping label.
        </p>
        <Field label="Shipping address" name="address" as="textarea" rows={3} required maxLength={400} defaultValue={customer?.address} />
        <Field label="Pincode" name="pincode" inputMode="numeric" required maxLength={6} defaultValue={customer?.pincode} />
        <Field label="WhatsApp number (for photo upload link)" name="whatsapp" type="tel" required maxLength={20} defaultValue={customer?.whatsapp} />
        <p className="-mt-1 text-xs text-dusty-rose">
          We'll message this number the Google Drive link where you upload the photos for your magazine. It never appears on the
          invoice or shipping label — so if this is a gift, the surprise stays safe.
        </p>
        <Field label="Preferred delivery date" name="preferredDeliveryDate" type="date" min={minDeliveryDate} defaultValue={customer?.preferredDeliveryDate} />
        <p className="-mt-1 text-xs text-dusty-rose">
          Select your desired delivery date. We will try our best to deliver it by that date!
        </p>


        <button disabled={submitting || !deliveryItem} className="pill-btn pill-btn-hover pill-primary w-full mt-2 disabled:opacity-50" type="submit">
          {submitting ? "Saving…" : "Continue to payment"}
        </button>
      </form>
    </ModalShell>
  );
}

/* ================================================================ */
/*                        PAYMENT MODAL                             */
/* ================================================================ */

// A phone photo of a payment screenshot can be 15-20MB, which becomes
// ~27MB of base64 JSON with no upper bound — slow/failed on mobile data and
// large enough to risk hitting Apps Script's request-size limits. Redraw it
// through a canvas at a capped resolution, stepping quality (then size) down
// until the resulting JPEG data URL fits under the target.
const SCREENSHOT_MAX_BYTES = 1.5 * 1024 * 1024;
const SCREENSHOT_MAX_DIM = 1600;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function downscaleScreenshot(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return fileToDataUrl(file); // fall back to the original rather than block checkout
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return fileToDataUrl(file);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (width > SCREENSHOT_MAX_DIM || height > SCREENSHOT_MAX_DIM) {
    const scale = SCREENSHOT_MAX_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  let quality = 0.9;
  let dataUrl = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    // Base64 runs ~4/3 the size of the decoded bytes.
    const approxBytes = (dataUrl.length * 3) / 4;
    if (approxBytes <= SCREENSHOT_MAX_BYTES) return dataUrl;
    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
    }
  }
  return dataUrl; // best effort after the attempt budget — still far smaller than the original
}

export function PaymentModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (orderId: string) => void;
}) {
  const total = useStore((s) => s.total());
  const cart = useStore((s) => s.cart);
  const customer = useStore((s) => s.customer);
  const cartId = useStore((s) => s.cartId);
  const coupon = useStore((s) => s.coupon);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  if (!open) return null;

  const upiLink = `upi://pay?pa=${encodeURIComponent(CONFIG.UPI_ID)}&pn=${encodeURIComponent(CONFIG.PAYEE)}&am=${total}&cu=INR&tn=${encodeURIComponent(cartId || "TheLayout")}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`;

  const submit = async () => {
    if (!file) return toast.error("Upload payment screenshot first.");
    setSubmitting(true);
    setLastError(null);
    try {
      const dataUrl = await downscaleScreenshot(file);
      const orderId = cartId || `TL-${Date.now().toString(36).toUpperCase()}`;
      await completeOrder({
        orderId, cartId, customer, cart, total,
        coupon: coupon?.code || null,
        screenshotName: file.name.replace(/\.\w+$/, "") + ".jpg",
        screenshot: dataUrl,
        ts: new Date().toISOString(),
      });
      onDone(orderId);
    } catch (err) {
      const message = err instanceof Error && err.message
        ? "Order could not be submitted — " + err.message + ". Your details are saved; tap Retry."
        : "Order could not be submitted. Your details are saved; tap Retry.";
      setLastError(message);
      toast.error("Order could not be submitted. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-lg">
      <h3 className="font-display text-3xl text-rose-wine">Complete payment</h3>
      <p className="mt-1 text-sm text-neutral-700">Scan the UPI QR, then upload your payment screenshot.</p>

      <div className="mt-4 rounded-xl bg-white/60 p-3 ring-1 ring-rose-wine/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-wine mb-2">Have a promo code?</p>
        <PromoCodeBox />
      </div>

      <div className="mt-5 flex flex-col items-center">
        <img src={qr} alt="UPI QR" className="h-56 w-56 rounded-2xl bg-white p-3 shadow-lg" />
        <p className="mt-3">Pay <span className="font-semibold text-blush-rose">{fmt(total)}</span> to <span className="font-medium">{CONFIG.UPI_ID}</span></p>
      </div>
      <label className="mt-5 block text-sm font-medium text-rose-wine">Payment screenshot</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => { setFile(e.target.files?.[0] || null); setLastError(null); }}
        className="mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-rose-wine file:px-4 file:py-1.5 file:text-white"
      />
      {lastError && <p className="mt-2 text-xs text-rose-wine">{lastError}</p>}
      <button onClick={submit} disabled={submitting || !file} className="pill-btn pill-btn-hover pill-primary w-full mt-5 disabled:opacity-50">
        {submitting ? "Submitting…" : lastError ? "Retry" : "Complete order"}
      </button>
    </ModalShell>
  );
}

/* ================================================================ */
/*                        SUCCESS MODAL                             */
/* ================================================================ */

export function SuccessModal({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string | null }) {
  if (!open) return null;
  return (
    <ModalShell onClose={onClose} maxW="max-w-md">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blush-rose to-rose-wine text-white">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="font-display text-4xl text-rose-wine mt-4">Thank you 🌸</h3>
        <p className="mt-2 text-neutral-700">Your order has been placed. We'll be in touch shortly.</p>
        {orderId && <p className="mt-2 text-xs text-dusty-rose">Order ID: {orderId}</p>}
        <button onClick={onClose} className="pill-btn pill-btn-hover pill-primary mt-5">Close</button>
      </div>
    </ModalShell>
  );
}

/* ================================================================ */
/*                            SHARED                                */
/* ================================================================ */

export function ModalShell({ children, onClose, maxW = "max-w-2xl" }: { children: React.ReactNode; onClose: () => void; maxW?: string }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-rose-wine/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`glass relative z-10 w-full ${maxW} rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto overscroll-contain`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-rose-wine shadow-md ring-1 ring-rose-wine/10 hover:bg-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

// The preferred delivery date can be no sooner than Standard Delivery's
// 12-day estimate (see getEstimatedDeliveryDate). Built from local date parts
// (not toISOString, which is UTC and lands a day early before 05:30 IST).
const DELIVERY_BUFFER_DAYS = 12;
function earliestDeliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + DELIVERY_BUFFER_DAYS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Field({
  label, name, type = "text", as = "input", rows, required, maxLength, defaultValue, inputMode, min,
}: {
  label: string; name: string; type?: string; as?: "input" | "textarea"; rows?: number; required?: boolean; maxLength?: number; defaultValue?: string; inputMode?: "text" | "numeric" | "tel" | "email"; min?: string;
}) {
  const cls = "mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 px-4 py-2.5 text-sm outline-none focus:border-rose-wine transition-colors";
  return (
    <div>
      <label className="text-sm font-medium text-rose-wine">{label}</label>
      {as === "textarea" ? (
        <textarea name={name} rows={rows} required={required} maxLength={maxLength} defaultValue={defaultValue} className={cls} />
      ) : (
        <input name={name} type={type} inputMode={inputMode} required={required} maxLength={maxLength} defaultValue={defaultValue} min={min} className={cls} />
      )}

    </div>
  );
}

export function CartButton({ onOpen }: { onOpen: () => void }) {
  const count = useStore((s) => s.cart.length);
  return (
    <button onClick={onOpen} className="pill-btn pill-btn-hover relative shrink-0">
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-wine px-1.5 text-xs font-semibold text-white">
        {count}
      </span>
    </button>
  );
}

export function StepIndicator() {
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const limit = useStore((s) => s.templateLimit());

  if (!selectedSizeId) return (
    <p className="text-center text-sm text-dusty-rose mb-6">
      <Plus className="inline h-4 w-4 -mt-0.5" /> Pick a page package above to unlock templates.
    </p>
  );
  return (
    <div className="mb-6 space-y-1 text-center text-sm text-rose-wine">
      <p><Check className="inline h-4 w-4 -mt-0.5" /> Package selected — templates chosen {selectedTemplateIds.length}/{limit}</p>
    </div>
  );
}

/* ================================================================ */
/*                CART SUMMARY PANEL + DELIVERY ETA                 */
/* ================================================================ */

function CartSummaryPanel() {
  const cart = useStore((s) => s.cart);
  const selectedSizeId = useStore((s) => s.selectedSizeId);

  const sizeItem = CATALOG.sizes.find((s) => s.id === selectedSizeId);
  const templates = cart.filter((c) => c.category === "templates").map((c) => {
    const m = c.id.match(/tpl-(\d+)/);
    return m ? Number(m[1]) : c.id;
  });
  const pocketItems = cart.filter((c) => c.category === "pocket");
  const pocketTemplatesFor = (unit?: string) =>
    cart
      .filter((c) => c.category === "pocket-templates" && c.unit === unit)
      .map((c) => {
        const m = c.id.match(/tpl-(\d+)/);
        return m ? Number(m[1]) : c.id;
      });
  const addons = cart.filter((c) => c.category === "addons").map((c) => c.name).join(", ") || "—";
  const polaroids = cart.filter((c) => c.category === "polaroids" || c.category === "it-polaroids").map((c) => c.name).join(", ") || "—";
  const stripsItems = cart.filter((c) => c.category === "strips");
  const stripsSummary = stripsItems.length
    ? stripsItems.map((c) => c.name).join(", ")
    : "—";
  const stripCount = stripsItems.reduce((n, c) => {
    const m = c.name.match(/(\d+)/);
    return n + (m ? Number(m[1]) : 0);
  }, 0);

  return (
    <div className="rounded-2xl bg-white/60 p-4 border border-white/60">
      <p className="text-xs uppercase tracking-[0.25em] text-blush-rose mb-3">Order summary</p>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-semibold text-rose-wine uppercase tracking-wider mb-2">Magazine</p>
          <p className="text-neutral-700">
            <span className="text-dusty-rose">Pages:</span>{" "}
            {sizeItem ? sizeItem.name : "—"}
          </p>
          <p className="mt-1 text-neutral-700">
            <span className="text-dusty-rose">Templates:</span>{" "}
            {templates.length ? `[${templates.join(", ")}]` : "—"}
          </p>
        </div>
        <div>
          <p className="font-semibold text-rose-wine uppercase tracking-wider mb-2">Add-ons</p>
          <p className="text-neutral-700">
            <span className="text-dusty-rose">Gift Wrap & Letter:</span> {addons}
          </p>
          <p className="mt-1 text-neutral-700">
            <span className="text-dusty-rose">Polaroids:</span> {polaroids}
          </p>
          <p className="mt-1 text-neutral-700">
            <span className="text-dusty-rose">Polaroid Strips:</span>{" "}
            {stripCount ? `${stripCount} Strips — ${stripsSummary}` : "—"}
          </p>
        </div>
      </div>

      {pocketItems.map((item, i) => {
        const templates = pocketTemplatesFor(item.unit);
        return (
          <div key={item.key} className="mt-4 border-t border-white/60 pt-3 text-xs">
            <p className="font-semibold text-rose-wine uppercase tracking-wider mb-2">
              Pocket Magazine{pocketItems.length > 1 ? ` #${i + 1}` : ""}
            </p>
            <p className="text-neutral-700">
              <span className="text-dusty-rose">Pages:</span> 6 Pages (Pocket Size)
            </p>
            <p className="mt-1 text-neutral-700">
              <span className="text-dusty-rose">Templates:</span>{" "}
              {templates.length ? `[${templates.join(", ")}]` : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Standard Delivery arrives about 12 days after the order, Express about 8 —
// production and dispatch included.
function getEstimatedDeliveryDate(isExpress: boolean): { date: Date; formatted: string; days: number } {
  const days = isExpress ? 8 : 12;
  const date = new Date();
  date.setDate(date.getDate() + days);
  const formatted = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return { date, formatted, days };
}

function DeliveryEta() {
  const cart = useStore((s) => s.cart);
  const delivery = cart.find((c) => c.category === "delivery");
  const isExpress = delivery?.id === "del-exp";
  const { formatted, days } = getEstimatedDeliveryDate(isExpress);

  return (
    <div className="rounded-xl bg-rose-wine/5 px-3 py-2.5 text-xs leading-relaxed text-rose-wine">
      <span className="font-semibold">{isExpress ? "Express Shipping" : "Standard Delivery"}</span> · Estimated delivery by{" "}
      <span className="font-bold underline decoration-rose-wine/30">{formatted}</span>{" "}
      ({days} days from order date, including production &amp; dispatch).
    </div>
  );
}

