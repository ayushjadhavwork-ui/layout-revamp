import { CONFIG } from "./catalog";

/**
 * Google Apps Script bridge.
 * All calls hit the deployed Web App URL configured in CONFIG.GAS_URL.
 * The GAS backend implements:
 *   GET  ?action=validateCoupon&code=XYZ
 *   POST { action: 'logCart',     ...payload }
 *   POST { action: 'completeOrder', ...payload }
 */

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    // No backend configured — return a mock success so the UI stays usable.
    console.warn("[GAS] URL not configured — returning mock response for", payload);
    return { ok: true, mock: true } as T;
  }
  const res = await fetch(CONFIG.GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
    body: JSON.stringify(payload),
  });
  return (await res.json()) as T;
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; percent?: number; message?: string }> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    // Demo: LAYOUT10 → 10%
    if (code.trim().toUpperCase() === "LAYOUT10") return { valid: true, percent: 10 };
    return { valid: false, message: "Invalid code (backend not configured)" };
  }
  const url = `${CONFIG.GAS_URL}?action=validateCoupon&code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  return res.json();
}

export const logCart = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; cartId?: string }>({ action: "logCart", ...payload });

export const completeOrder = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; orderId?: string }>({ action: "completeOrder", ...payload });

export type Review = {
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  reviewerId: string;
  timestamp: string;
};

export async function getReviews(productId: string): Promise<Review[]> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    console.warn("[GAS] URL not configured — returning empty reviews for", productId);
    return [];
  }
  const url = `${CONFIG.GAS_URL}?action=getReviews&productId=${encodeURIComponent(productId)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.reviews ?? [];
}

export const submitReview = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; id?: string }>({ action: "submitReview", ...payload });

export const deleteReview = (id: string, reviewerId: string) =>
  post<{ ok: boolean }>({ action: "deleteReview", id, reviewerId });

export function getReviewerId(): string {
  const key = "reviewerId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
