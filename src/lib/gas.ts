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

/* ─── Spin-the-Wheel lead capture ─────────────────────────── */
export type SpinResult = { label: string; code: string | null };

// Weights MUST mirror Code.gs and src/components/site/spin-wheel.tsx.
const SPIN_SEGMENTS: { label: string; code: string | null; weight: number }[] = [
  { label: "FREE 1 Polaroid Strip",       code: "SPINPOLA",   weight: 20 },
  { label: "FREE Personalized Letter",    code: "SPINLETTER", weight: 20 },
  { label: "10% OFF Your Magazine Order", code: "SPIN10",     weight: 25 },
  { label: "FREE Sticker Pack",           code: "SPINSTICK",  weight: 20 },
  { label: "Better Luck Next Time",       code: null,         weight: 15 },
];

function weightedPick(): SpinResult {
  const total = SPIN_SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let n = Math.random() * total;
  for (const s of SPIN_SEGMENTS) {
    if ((n -= s.weight) <= 0) return { label: s.label, code: s.code };
  }
  const last = SPIN_SEGMENTS[SPIN_SEGMENTS.length - 1];
  return { label: last.label, code: last.code };
}

export async function spinLead(payload: {
  email: string; optIn: boolean; sessionId: string;
}): Promise<SpinResult> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    console.warn("[GAS] URL not configured — running spin locally", payload);
    return weightedPick();
  }
  const res = await post<{ ok: boolean; label?: string; code?: string | null; result?: SpinResult }>({
    action: "spinLead",
    ...payload,
  });
  if (res.result) return res.result;
  if (res.label !== undefined) return { label: res.label, code: res.code ?? null };
  // Fallback if backend didn't understand action
  return weightedPick();
}

