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

// The wheel's prizes live entirely in the "Spin Config" Google Sheet tab —
// see getSpinConfig() in Code.gs. This is the single source of truth for
// both the wheel's visual segments and the backend's actual win odds.
export type SpinSegment = {
  order: number;
  label: string;
  icon: string;
  code: string | null;
  weight: number;
  color: string | null;
};

export type SpinConfigResult = { success: boolean; segments: SpinSegment[]; error?: string };

// Only used when GAS_URL isn't configured yet (local dev without a backend).
const MOCK_SPIN_SEGMENTS: SpinSegment[] = [
  { order: 1, label: "FREE 1 Polaroid Strip",       icon: "polaroid", code: "SPINPOLA",   weight: 20, color: null },
  { order: 2, label: "FREE Personalized Letter",    icon: "envelope", code: "SPINLETTER", weight: 20, color: null },
  { order: 3, label: "10% OFF Your Magazine Order", icon: "tag",      code: "SPIN10",     weight: 25, color: null },
  { order: 4, label: "FREE Sticker Pack",           icon: "sticker",  code: "SPINSTICK",  weight: 20, color: null },
  { order: 5, label: "Better Luck Next Time",       icon: "clover",   code: null,         weight: 15, color: null },
];

function weightedPick(segments: SpinSegment[]): SpinSegment {
  const total = segments.reduce((s, x) => s + x.weight, 0);
  let n = Math.random() * total;
  for (const s of segments) {
    if ((n -= s.weight) <= 0) return s;
  }
  return segments[segments.length - 1];
}

// Cached for the lifetime of the page — cleared naturally on a fresh reload.
let spinConfigPromise: Promise<SpinConfigResult> | null = null;

export function getSpinConfig(): Promise<SpinConfigResult> {
  if (!spinConfigPromise) spinConfigPromise = fetchSpinConfig();
  return spinConfigPromise;
}

async function fetchSpinConfig(): Promise<SpinConfigResult> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    console.warn("[GAS] URL not configured — using mock spin config");
    return { success: true, segments: MOCK_SPIN_SEGMENTS };
  }
  try {
    const url = `${CONFIG.GAS_URL}?action=getSpinConfig`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.segments) || data.segments.length === 0) {
      return { success: false, segments: [], error: data.error || "Spin wheel is not configured" };
    }
    return { success: true, segments: data.segments };
  } catch {
    return { success: false, segments: [], error: "Could not load spin wheel config" };
  }
}

export async function spinLead(payload: {
  email: string; optIn: boolean; sessionId: string;
}): Promise<SpinResult> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    console.warn("[GAS] URL not configured — running spin locally", payload);
    const won = weightedPick(MOCK_SPIN_SEGMENTS);
    return { label: won.label, code: won.code };
  }
  const res = await post<{ success: boolean; alreadySpun?: boolean; result?: SpinResult; error?: string }>({
    action: "spinLead",
    ...payload,
  });
  if (!res.success || !res.result) {
    throw new Error(res.error || "Could not spin — try again.");
  }
  return res.result;
}

