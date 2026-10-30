import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Gift, Mail, Tag, Sticker, Clover, Image as ImageIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo.png.asset.json";
import { SITE } from "@/lib/site-content";
import { getSpinConfig, spinLead, type SpinResult, type SpinSegment } from "@/lib/gas";
import { redeemCoupon } from "@/lib/coupons";

/* ────────────────────────────────────────────────────────────
   Prize config now lives entirely in the "Spin Config" Google
   Sheet tab (see getSpinConfig() in Code.gs) — nothing here is
   hardcoded. Icon is a string key from the sheet; this map is
   the only place that has to know what it looks like.
   ──────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
  polaroid: ImageIcon,
  envelope: Mail,
  tag: Tag,
  sticker: Sticker,
  clover: Clover,
};
const DEFAULT_PALETTE = ["#f7c4d3", "#fbe0e8"];
const TEXT_COLOR = "#7d2b45";

const STORAGE_KEY = "spinWheelState";     // persistent status
const SESSION_DISMISS = "spinWheelDismissed"; // per-session

type Status = "unseen" | "closed" | "dismissed" | "spun";
type StoredState = {
  status: Status;
  result?: SpinResult;
  email?: string;
  wonAt?: number; // ms
  applied?: boolean; // the prize made it into the cart
};

// Where putting the prize into the cart stands.
type Redeem = "pending" | "applied" | "failed";

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: "unseen" };
    return JSON.parse(raw) as StoredState;
  } catch {
    return { status: "unseen" };
  }
}
function saveState(s: StoredState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function IconFor({ kind, className }: { kind: string; className?: string }) {
  const Icon = ICON_MAP[kind];
  if (!Icon) {
    console.warn(`[SpinWheel] Unknown icon key "${kind}" in Spin Config sheet — using default.`);
    return <Gift className={className} strokeWidth={1.4} />;
  }
  return <Icon className={className} strokeWidth={1.4} />;
}

/* ────────────────────────────────────────────────────────────
   Wheel — SVG, segments driven entirely by sheet config
   ──────────────────────────────────────────────────────────── */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
}

function WheelSkeleton() {
  return (
    <div
      className="mx-auto grid place-items-center rounded-full bg-pink-mist/30 animate-pulse"
      style={{ width: 320, height: 320 }}
    >
      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-rose-wine/50">Loading…</span>
    </div>
  );
}

function Wheel({
  segments, rotation, spinning,
}: { segments: SpinSegment[]; rotation: number; spinning: boolean }) {
  const size = 320;
  const r = 150;
  const cx = size / 2;
  const cy = size / 2;
  const seg = 360 / segments.length; // equal visual size — weight only affects actual odds

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* Heart pointer */}
      <svg
        aria-hidden
        viewBox="0 0 40 40"
        className="absolute left-1/2 -top-3 -translate-x-1/2 z-20 drop-shadow"
        style={{ width: 32, height: 32 }}
      >
        <path
          d="M20 34 C 6 24, 4 12, 12 8 C 16 6, 19 8, 20 11 C 21 8, 24 6, 28 8 C 36 12, 34 24, 20 34 Z"
          fill="#e1477e"
          stroke="#fff"
          strokeWidth="1.5"
        />
      </svg>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 4.5s cubic-bezier(0.22, 0.9, 0.24, 1)" : "none",
        }}
      >
        {/* Ring */}
        <circle cx={cx} cy={cy} r={r + 6} fill="#f4a4b7" />
        <circle cx={cx} cy={cy} r={r + 2} fill="#fff" />
        {segments.map((p, i) => {
          const startDeg = i * seg;
          const endDeg = (i + 1) * seg;
          const midDeg = startDeg + seg / 2;
          const iconPos = polar(cx, cy, r * 0.62, midDeg);
          const textPos = polar(cx, cy, r * 0.4, midDeg);
          const wedgeColor = p.color || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          return (
            <g key={`${p.order}-${p.label}`}>
              <path d={wedgePath(cx, cy, r, startDeg, endDeg)} fill={wedgeColor} stroke="#fff" strokeWidth={1.5} />
              {/* icon */}
              <foreignObject
                x={iconPos.x - 14}
                y={iconPos.y - 14}
                width={28}
                height={28}
                style={{ transform: `rotate(${midDeg}deg)`, transformOrigin: `${iconPos.x}px ${iconPos.y}px` }}
              >
                <div style={{ width: 28, height: 28, color: TEXT_COLOR }} className="grid place-items-center">
                  <IconFor kind={p.icon} className="h-5 w-5" />
                </div>
              </foreignObject>
              {/* label */}
              <foreignObject
                x={textPos.x - 42}
                y={textPos.y - 20}
                width={84}
                height={40}
                style={{ transform: `rotate(${midDeg}deg)`, transformOrigin: `${textPos.x}px ${textPos.y}px` }}
              >
                <div
                  style={{ color: TEXT_COLOR }}
                  className="w-full h-full flex items-center justify-center text-center text-[9px] font-semibold leading-tight uppercase tracking-wide px-1"
                >
                  {p.label}
                </div>
              </foreignObject>
            </g>
          );
        })}
        {/* Hub */}
        <circle cx={cx} cy={cy} r={34} fill="#fff" stroke="#f4a4b7" strokeWidth={2} />
      </svg>

      {/* Hub logo (does not rotate) */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white shadow ring-2 ring-pink-mist/60">
          <img src={logoAsset.url} alt="" className="h-8 w-8 object-contain" />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────── */
export function SpinWheel() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<StoredState>({ status: "unseen" });
  const [open, setOpen] = useState(false);
  const [floatingHidden, setFloatingHidden] = useState(false);

  // Sheet-driven config
  const [segments, setSegments] = useState<SpinSegment[] | null>(null); // null = still loading
  const [configError, setConfigError] = useState(false);

  // Wheel spin runtime
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [redeem, setRedeem] = useState<Redeem>("pending");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const openTimer = useRef<number | null>(null);

  // Hydrate from storage + fetch sheet config once per page load. The wheel
  // opens on its own only for a visitor who has never seen it, and a visitor
  // who has spun never gets the wheel again (see showFloating below).
  useEffect(() => {
    setMounted(true);
    const s = loadState();
    setState(s);
    // A spin whose prize never reached the cart can still be applied.
    if (s.status === "spun" && s.result) {
      setResult(s.result);
      setRedeem(s.applied || !s.result.code ? "applied" : "failed");
    }
    setFloatingHidden(sessionStorage.getItem(SESSION_DISMISS) === "1");

    if (s.status === "unseen") {
      openTimer.current = window.setTimeout(() => setOpen(true), 4000);
    }

    getSpinConfig()
      .then((cfg) => {
        if (!cfg.success || cfg.segments.length === 0) {
          setConfigError(true);
        } else {
          setSegments(cfg.segments);
        }
      })
      .catch(() => setConfigError(true));

    return () => { if (openTimer.current) window.clearTimeout(openTimer.current); };
  }, []);

  // Esc + click-outside close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reads the saved status rather than `state`: the Esc listener keeps the
  // handler from when the popup opened, which predates a spin made since.
  const handleClose = () => {
    setOpen(false);
    const saved = loadState();
    if (saved.status === "unseen") {
      const next = { ...saved, status: "closed" as const };
      setState(next); saveState(next);
    }
  };

  const handleReopen = () => setOpen(true);

  const handleDismissFloating = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(SESSION_DISMISS, "1");
    setFloatingHidden(true);
  };

  const winningIndex = useMemo(() => {
    if (!result || !segments) return -1;
    return segments.findIndex((p) => p.label === result.label);
  }, [result, segments]);

  const runSpinAnimation = (idx: number, count: number) => {
    if (idx < 0) return;
    const seg = 360 / count;
    const centerAngle = idx * seg + seg / 2;
    // Rotate so segment center is at top (0deg pointer).
    // Wheel rotation R such that (R + centerAngle) mod 360 === 0.
    const base = 360 - centerAngle;
    const spins = 6; // full rotations
    const final = spins * 360 + base + rotation - (rotation % 360);
    setSpinning(true);
    setRotation(final);
  };

  const applyPrize = (spun: StoredState) => {
    const code = spun.result?.code;
    if (!code) return setRedeem("applied");
    setRedeem("pending");
    redeemCoupon(code)
      .then((res) => {
        if (!res.ok) throw new Error(res.message);
        setRedeem("applied");
        const next = { ...spun, applied: true };
        setState(next); saveState(next);
        toast.success("Reward unlocked and applied directly to your cart! 🎁");
      })
      .catch(() => {
        setRedeem("failed");
        toast.error("We couldn't add your reward yet — tap Try again.");
      });
  };

  const handleSpin = async () => {
    if (!segments) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return toast.error("Enter a valid email");
    }
    if (!optIn) return toast.error("Please tick the marketing consent box");
    setSubmitting(true);
    try {
      const res = await spinLead({ email: email.trim(), optIn, sessionId: crypto.randomUUID() });
      const idx = segments.findIndex((p) => p.label === res.label);
      if (idx < 0) throw new Error("Bad server response");
      runSpinAnimation(idx, segments.length);
      // Reveal after animation, then put the prize straight into the cart —
      // the customer never sees or copies a raw code.
      window.setTimeout(() => {
        setResult(res);
        setSpinning(false);
        const next: StoredState = { status: "spun", result: res, email: email.trim(), wonAt: Date.now() };
        setState(next); saveState(next);
        applyPrize(next);
      }, 4600);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not spin — try again.");
      setSubmitting(false);
    }
  };

  if (!mounted) return null;
  // Backend not configured / sheet empty — don't show a broken trigger or wheel at all.
  if (configError) return null;

  const loadingConfig = segments === null;
  // Once spun, the wheel is done for good — unless the prize still has to
  // reach the cart, when the trigger stays so the customer can retry.
  const showFloating = !floatingHidden && !loadingConfig
    && (state.status === "closed" || state.status === "dismissed" || (state.status === "spun" && redeem === "failed"));

  return (
    <>
      {open && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-rose-wine/30 backdrop-blur-sm" onClick={handleClose} />
          <div
            className="relative z-10 w-full max-w-md rounded-3xl bg-[#fce9ef] p-6 md:p-8 shadow-2xl ring-1 ring-pink-mist/60 max-h-[92vh] overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-30 grid h-8 w-8 place-items-center rounded-full bg-white/80 hover:bg-white text-rose-wine"
            >
              <X className="h-4 w-4" />
            </button>

            {loadingConfig || !segments ? (
              <WheelSkeleton />
            ) : (
              <Wheel segments={segments} rotation={rotation} spinning={spinning} />
            )}

            <div className="mt-4 text-center">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-blush-rose">{SITE.brand.name}</p>
              <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-1 leading-tight">
                Your Chance to Win Big!
              </h3>
              <p className="mt-2 text-sm text-dusty-rose">
                Spin the wheel to unlock a little surprise from us ♡
              </p>
            </div>

            {loadingConfig ? null : result ? (
              <ResultCard
                result={result}
                segments={segments!}
                redeem={redeem}
                onRetry={() => applyPrize(state)}
                onViewCart={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent("open-cart"));
                }}
              />
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSpin(); }}
                className="mt-5 space-y-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={spinning || submitting}
                  className="w-full rounded-full border border-pink-mist bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-rose-wine"
                />
                <label className="flex items-start gap-2 text-xs text-dusty-rose">
                  <input
                    type="checkbox"
                    checked={optIn}
                    onChange={(e) => setOptIn(e.target.checked)}
                    className="mt-0.5 accent-rose-wine"
                    disabled={spinning || submitting}
                  />
                  <span>I agree to receive marketing emails from {SITE.brand.name}.</span>
                </label>
                <button
                  type="submit"
                  disabled={spinning || submitting}
                  className="w-full rounded-full bg-rose-wine px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-off-white shadow-lg transition hover:bg-blush-rose disabled:opacity-60"
                >
                  {spinning ? "Spinning…" : submitting ? "…" : "Spin Now"}
                </button>
              </form>
            )}

            <p className="mt-4 text-center text-[0.65rem] text-dusty-rose">
              <span className="rounded-full border border-pink-mist/70 px-3 py-1 inline-block">
                One spin per visitor • Reward valid for 24 hours • Cannot be combined with other offers
              </span>
            </p>

            <p className="mt-3 text-center font-display italic text-sm text-rose-wine">
              Thank you for being part of our story ♡
            </p>
          </div>
        </div>,
        document.body
      )}

      {showFloating && !open && createPortal(
        <button
          onClick={handleReopen}
          aria-label="Open Spin the Wheel"
          className="float-above-guide fixed bottom-24 right-4 z-[95] grid h-14 w-14 place-items-center rounded-full bg-blush-rose text-off-white shadow-xl ring-2 ring-white hover:scale-105 transition"
        >
          <Gift className="h-6 w-6" />
          <span
            role="button"
            aria-label="Dismiss for this session"
            onClick={handleDismissFloating}
            className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-rose-wine shadow ring-1 ring-pink-mist cursor-pointer"
          >
            <X className="h-3 w-3" />
          </span>
        </button>,
        document.body
      )}
    </>
  );
}

function ResultCard({
  result, segments, redeem, onRetry, onViewCart,
}: { result: SpinResult; segments: SpinSegment[]; redeem: Redeem; onRetry: () => void; onViewCart: () => void }) {
  const prize = segments.find((p) => p.label === result.label);
  if (!result.code) {
    return (
      <div className="mt-5 rounded-2xl bg-white/70 p-5 text-center shadow-sm ring-1 ring-pink-mist/50">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-rose/15 text-rose-wine">
          <IconFor kind={prize?.icon ?? ""} className="h-7 w-7" />
        </div>
        <p className="mt-3 font-display text-2xl text-rose-wine leading-tight">{result.label}</p>
        <p className="mt-3 text-sm text-dusty-rose">A better spin awaits next time ♡</p>
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-2xl bg-white/90 p-4 text-center ring-1 ring-pink-mist/60">
      <p className="font-display text-xl text-rose-wine">🎉 Congratulations!</p>
      <p className="mt-1 text-sm text-dusty-rose">
        Your reward <span className="font-semibold text-rose-wine">"{result.label}"</span>{" "}
        {redeem === "applied"
          ? "has been automatically added to your cart."
          : redeem === "pending"
            ? "is being added to your cart…"
            : "couldn't be added to your cart just yet."}
      </p>
      {redeem === "failed" ? (
        <button type="button" onClick={onRetry} className="pill-btn pill-btn-hover pill-primary mt-4 w-full">
          Try again
        </button>
      ) : (
        <button type="button" onClick={onViewCart} disabled={redeem === "pending"} className="pill-btn pill-btn-hover pill-primary mt-4 w-full disabled:opacity-60">
          View My Cart →
        </button>
      )}
      <p className="mt-3 text-[0.65rem] uppercase tracking-[0.3em] text-dusty-rose">Valid for 24 hours</p>
    </div>
  );
}
