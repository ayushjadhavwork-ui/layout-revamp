import { CONFIG } from "./catalog";
import { reportError } from "./telemetry";

/**
 * Google Apps Script bridge.
 * All calls hit the deployed Web App URL configured in CONFIG.GAS_URL.
 * The GAS backend implements:
 *   GET  ?action=validateCoupon&code=XYZ
 *   POST { action: 'logCart',     ...payload }
 *   POST { action: 'completeOrder', ...payload }
 *
 * Every call goes through fetchWithTimeout + a res.ok/JSON-parse guard —
 * when Apps Script hits its quota or the 6-min execution cap it returns an
 * HTML error page instead of JSON, which used to make res.json() throw deep
 * inside a promise chain and leave checkout spinning forever. Writes that
 * aren't safe to duplicate (completeOrder, submitReview, spinLead) never
 * auto-retry; idempotent reads and the best-effort cart log do.
 */

const DEFAULT_TIMEOUT_MS = 15000;

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function errStack(err: unknown): string | undefined {
  return err instanceof Error ? err.stack : undefined;
}

function isTransportFailure(err: unknown): boolean {
  // A dropped connection (TypeError from fetch) or our own abort-on-timeout
  // (DOMException "AbortError") — the kind of failure where the request may
  // never have reached the server, so retrying is safe. A non-ok HTTP
  // status or unparsable body means the server *did* respond, so retrying
  // immediately is unlikely to help and could duplicate a write.
  if (err instanceof DOMException && err.name === "AbortError") return true;
  return err instanceof TypeError;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // Apps Script quota/crash pages come back as HTML with a 200 status.
    throw new Error("Unexpected response from server");
  }
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, action }: { timeoutMs?: number; retries?: number; action: string },
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      return await parseJson<T>(res);
    } catch (err) {
      lastErr = err;
      if (!isTransportFailure(err) || attempt === retries) break;
    }
  }
  reportError(`gas.${action} failed: ${errMessage(lastErr)}`, { stack: errStack(lastErr), action });
  throw lastErr instanceof Error ? lastErr : new Error("Request failed");
}

async function post<T>(
  payload: Record<string, unknown>,
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    // No backend configured — return a mock success so the UI stays usable.
    console.warn(`[GAS] URL not configured — returning mock response for action "${payload.action}"`);
    return { ok: true, mock: true } as T;
  }
  return requestJson<T>(
    CONFIG.GAS_URL,
    {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
      body: JSON.stringify(payload),
    },
    { ...opts, action: String(payload.action) },
  );
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; percent?: number; message?: string }> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    // Demo: LAYOUT10 → 10%
    if (code.trim().toUpperCase() === "LAYOUT10") return { valid: true, percent: 10 };
    return { valid: false, message: "Invalid code (backend not configured)" };
  }
  try {
    const url = `${CONFIG.GAS_URL}?action=validateCoupon&code=${encodeURIComponent(code)}`;
    return await requestJson(url, { method: "GET" }, { retries: 1, action: "validateCoupon" });
  } catch {
    return { valid: false, message: "Could not validate — check your connection and try again." };
  }
}

export const logCart = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; cartId?: string }>({ action: "logCart", ...payload }, { retries: 1 });

// No auto-retry — a retried write after a timed-out-but-succeeded request
// would log the same order twice.
export const completeOrder = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; orderId?: string }>({ action: "completeOrder", ...payload }, { timeoutMs: 60000, retries: 0 });

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
  try {
    const url = `${CONFIG.GAS_URL}?action=getReviews&productId=${encodeURIComponent(productId)}`;
    const data = await requestJson<{ reviews?: Review[] }>(url, { method: "GET" }, { retries: 1, action: "getReviews" });
    return data.reviews ?? [];
  } catch {
    return [];
  }
}

// Not safe to retry — a duplicated write would post the same review twice.
export const submitReview = (payload: Record<string, unknown>) =>
  post<{ ok: boolean; id?: string }>({ action: "submitReview", ...payload }, { retries: 0 });

export const deleteReview = (id: string, reviewerId: string) =>
  post<{ ok: boolean }>({ action: "deleteReview", id, reviewerId }, { retries: 1 });

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
// A *failed* fetch is deliberately not cached (see getSpinConfig), so a
// transient quota/network blip doesn't permanently hide the wheel for the
// rest of the session.
let spinConfigPromise: Promise<SpinConfigResult> | null = null;

export function getSpinConfig(): Promise<SpinConfigResult> {
  if (!spinConfigPromise) {
    spinConfigPromise = fetchSpinConfig().then((result) => {
      if (!result.success) spinConfigPromise = null;
      return result;
    });
  }
  return spinConfigPromise;
}

async function fetchSpinConfig(): Promise<SpinConfigResult> {
  if (CONFIG.GAS_URL.startsWith("REPLACE")) {
    console.warn("[GAS] URL not configured — using mock spin config");
    return { success: true, segments: MOCK_SPIN_SEGMENTS };
  }
  try {
    const url = `${CONFIG.GAS_URL}?action=getSpinConfig`;
    const data = await requestJson<{ success: boolean; segments?: SpinSegment[]; error?: string }>(
      url,
      { method: "GET" },
      { retries: 1, action: "getSpinConfig" },
    );
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
  // Not safe to retry — a duplicated write would roll (and log) a second prize.
  const res = await post<{ success: boolean; alreadySpun?: boolean; result?: SpinResult; error?: string }>(
    { action: "spinLead", ...payload },
    { retries: 0 },
  );
  if (!res.success || !res.result) {
    throw new Error(res.error || "Could not spin — try again.");
  }
  return res.result;
}
