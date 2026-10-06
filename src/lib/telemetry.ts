/**
 * Lightweight production error telemetry.
 *
 * Any uncaught error, unhandled promise rejection, or explicitly reported
 * failure is sent (fire-and-forget) to the Google Apps Script backend, which
 * appends it to an "Errors" sheet tab. That tab is your production log —
 * without it, breakage on a customer's phone is completely invisible.
 *
 * Nothing here can ever break the site: every send is wrapped, silently
 * ignores failures, and is rate-limited so a render loop can't spam the sheet.
 */
import { CONFIG } from "./catalog";

const MAX_PER_SESSION = 10;
let sent = 0;
const seen = new Set<string>();

function describe(err: unknown): { message: string; stack: string } {
  if (err instanceof Error) return { message: err.message, stack: String(err.stack || "") };
  try {
    return { message: typeof err === "string" ? err : JSON.stringify(err), stack: "" };
  } catch {
    return { message: "Unknown error", stack: "" };
  }
}

/** Report a handled-but-notable failure (e.g. a checkout call that failed). */
export function reportError(err: unknown, context?: string) {
  try {
    if (typeof window === "undefined") return;
    if (CONFIG.GAS_URL.startsWith("REPLACE")) return; // no backend configured
    if (sent >= MAX_PER_SESSION) return;

    const { message, stack } = describe(err);
    // Collapse duplicates — the same error re-firing adds no information.
    const fingerprint = `${context || ""}|${message}`;
    if (seen.has(fingerprint)) return;
    seen.add(fingerprint);
    sent += 1;

    const payload = JSON.stringify({
      action: "logError",
      message: message.slice(0, 500),
      stack: stack.slice(0, 2000),
      context: context || "",
      url: window.location.href,
      userAgent: navigator.userAgent,
      ts: new Date().toISOString(),
    });

    // sendBeacon survives page unload; fetch+keepalive is the fallback.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.GAS_URL, new Blob([payload], { type: "text/plain;charset=utf-8" }));
    } else {
      void fetch(CONFIG.GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* telemetry must never throw */
  }
}

let installed = false;

/** Called once on the client (see src/routes/__root.tsx). */
export function installTelemetry() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => reportError(e.error ?? e.message, "window.onerror"));
  window.addEventListener("unhandledrejection", (e) => reportError(e.reason, "unhandledrejection"));
}
