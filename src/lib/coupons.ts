import { CATALOG, COUPON_FREEBIES, fmt } from "./catalog";
import { validateCoupon } from "./gas";
import { productCouponCheck, useStore } from "./store";

export type RedeemResult = { ok: boolean; message: string };

// Applies a coupon code to the cart — shared by the promo-code box and the
// spin wheel (which applies its prize directly, so the customer never has to
// copy a code). Product coupons (e.g. PATAKA200) are checked here against the
// cart; any other code is validated by the Coupons sheet. A code that grants
// a free item (COUPON_FREEBIES) also adds that item. A failed code leaves the
// current coupon alone — clearing it is the caller's choice.
export async function redeemCoupon(rawCode: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  const { cart, setCoupon, applyCouponFreebie } = useStore.getState();

  const productCoupon = productCouponCheck(code, cart);
  if (productCoupon) {
    if (!productCoupon.valid) return { ok: false, message: productCoupon.message };
    applyCouponFreebie(code); // clears any freebie from an earlier code
    setCoupon({ code, percent: 0, amount: productCoupon.amount });
    return { ok: true, message: `${fmt(productCoupon.amount)} off` };
  }

  const res = await validateCoupon(code);
  if (!res.valid) return { ok: false, message: res.message || "Invalid code" };
  setCoupon({ code, percent: res.percent || 0 });
  const freebieId = COUPON_FREEBIES[code];
  if (freebieId) {
    applyCouponFreebie(code);
    const product = CATALOG.promotions.find((p) => p.id === freebieId);
    return { ok: true, message: `${product?.name ?? "Free gift"} added to your cart 🎁` };
  }
  return { ok: true, message: `${res.percent}% off` };
}
