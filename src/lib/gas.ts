import { CONFIG } from "./catalog";
import { reportError } from "./telemetry";

/**
 * Google Apps Script bridge.
 * All calls hit the deployed Web App URL configured in CONFIG.GAS_URL.
 *
 * HARDENING (why this file is more than a bare fetch):
 * Apps Script does not always answer with JSON. When it hits an execution
 * quota, a 6-minute timeout, or a deployment/permission problem it answers
 * with an HTML error page, or hangs indefinitely. A bare
 * `await (await fetch(url)).json()` would then either throw a confusing
 * SyntaxError or spin forever — which is why checkout could hang. So every
 * request here:
 *   1. has a hard timeout (AbortController),
 *   2. checks res.ok before parsing,
 *   3. verifies the body actually parses as JSON,
 *   4. retries transport-level failures (never a bad HTTP status),
 *   5. reports the failure to telemetry so you can see it in production.
 */

/** Hard ceiling per attempt. Uploads get a longer one — see UPLOAD_TIMEOUT_MS. */
const TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 60_000;
/** Total attempts (1 = no retry). Only transport failures are retried. */
const RETRIES = 2;

class GasError extends Error {}

async function fetchJson<T>(
  url: string,
  init: RequestInit,
  opts: { timeoutMs?: number; retries?: number; context: string },
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const attempts = opts.retries ?? RETRIES;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });

      // A non-2xx from Apps Script is a real answer — retrying it just burns
      // the customer's time, so fail fast instead.
      if (!res.ok) {
        throw new GasError(`Backend returned ${res.status}`);
      }

      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        // Almost always an Apps Script HTML error/login page.
        throw new GasError("Backend returned a non-JSON response");
      }
    } catch (err) {
      lastError = err;
      // Definitive server answers are not retried; timeouts/offline are.
      const retryable = !(err instanceof GasError);
      if (!retryable || attempt === attempts) break;
      await new Promise((r) => setTimeout(r, 600 * attempt)); // small backoff
    } finally {
      clearTimeout(timer);
    }
  }

  reportError(lastError, `gas:${opts.context}`);
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

async function post<T>(payload: Record<string, unknown>, opts?: { timeoutMs?: number; retries?: number }): Promise<T> {
  const action = String(payload["action"] || "post");
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    // No backend configured — return a mock success so the UI stays usable.
    // Deliberately logs only the action, never the payload (customer data).
    console.warn("[GAS] URL not configured — returning mock response for", action);
    return { ok: true, mock: true } as T;
  }
  return fetchJson<T>(
    CONFIG.GAS_URL,
    {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
      body: JSON.stringify(payload),
    },
    { ...opts, context: action },
  );
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; percent?: number; message?: string }> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    // Demo: LAYOUT10 → 10%
    if (code.trim().toUpperCase() === "LAYOUT10") return { valid: true, percent: 10 };
    return { valid: false, message: "Invalid code (backend not configured)" };
  }
  const url = `${CONFIG.GAS_URL}?action=validateCoupon&code=${encodeURIComponent(code)}`;
  try {
    return await fetchJson(url, {}, { context: "validateCoupon" });
  } catch {
    return { valid: false, message: "Could not check that code — try again." };
  }
}

export const logCart = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; cartId?: string }>({ action: "logCart", ...payload });

/**
 * The order write. Given the screenshot upload, this needs a much longer
 * timeout than a normal call — and it is NOT retried automatically, because
 * a retry after the row was already written would duplicate the order. The
 * customer retries explicitly via the button instead (the orderId stays the
 * same, so a duplicate is easy to spot in the sheet).
 */
export const completeOrder = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; orderId?: string }>(
    { action: "completeOrder", ...payload },
    { timeoutMs: UPLOAD_TIMEOUT_MS, retries: 1 },
  );

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
  try {
    const data = await fetchJson<{ reviews?: Review[] }>(url, {}, { context: "getReviews" });
    return data.reviews ?? [];
  } catch {
    // Reviews are decoration — never let them break a product page.
    return [];
  }
}

export const submitReview = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; id?: string }>({ action: "submitReview", ...payload });

export const deleteReview = (id: string, reviewerId: string) =>
  post<{ ok: boolean }>({ action: "deleteReview", id, reviewerId });

export function getReviewerId(): string {
  if (typeof window === "undefined") return ""; // SSR — resolved for real on client hydration
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
    const data = await fetchJson<{ success?: boolean; segments?: SpinSegment[]; error?: string }>(
      url, {}, { context: "getSpinConfig" },
    );
    if (!data.success || !Array.isArray(data.segments) || data.segments.length === 0) {
      // A failed config must not be cached — the next open should retry.
      spinConfigPromise = null;
      return { success: false, segments: [], error: data.error || "Spin wheel is not configured" };
    }
    return { success: true, segments: data.segments };
  } catch {
    spinConfigPromise = null;
    return { success: false, segments: [], error: "Could not load spin wheel config" };
  }
}

export async function spinLead(payload: {
  email: string; optIn: boolean; sessionId: string;
}): Promise<SpinResult> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    console.warn("[GAS] URL not configured — running spin locally");
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
