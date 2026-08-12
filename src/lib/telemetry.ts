import { CONFIG } from "./catalog";

/**
 * Lightweight client-side error telemetry. Uncaught errors and unhandled
 * promise rejections are the only production signal we have besides
 * console.error (invisible once a customer closes the tab) — this ships
 * them to the same GAS backend as everything else, capped and deduped so a
 * tight error loop can't spam Apps Script or the customer's data plan.
 */

const MAX_ERRORS_PER_SESSION = 10;
let sentCount = 0;
let installed = false;
const seenKeys = new Set<string>();

function dedupeKey(message: string, stack?: string): string {
  return `${message}::${(stack ?? "").slice(0, 300)}`;
}

export function reportError(message: string, extra?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (CONFIG.GAS_URL.startsWith("REPLACE")) return; // no backend configured
  if (sentCount >= MAX_ERRORS_PER_SESSION) return;

  const stack = typeof extra?.stack === "string" ? extra.stack : undefined;
  const key = dedupeKey(message, stack);
  if (seenKeys.has(key)) return;
  seenKeys.add(key);
  sentCount += 1;

  const payload = JSON.stringify({
    action: "logError",
    message: String(message).slice(0, 2000),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ts: new Date().toISOString(),
    ...extra,
  });

  try {
    const sent = navigator.sendBeacon?.(
      CONFIG.GAS_URL,
      new Blob([payload], { type: "text/plain;charset=utf-8" }),
    );
    if (!sent) {
      fetch(CONFIG.GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Telemetry must never itself throw.
  }
}

// Idempotent — safe to call from every route/layout mount.
export function installTelemetry(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    reportError(event.message || "Uncaught error", {
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: event.filename,
      line: event.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    reportError(message, {
      stack: reason instanceof Error ? reason.stack : undefined,
      kind: "unhandledrejection",
    });
  });
}
