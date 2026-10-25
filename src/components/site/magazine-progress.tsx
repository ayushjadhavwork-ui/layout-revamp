import { useEffect } from "react";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import type { MagazineProgress } from "@/lib/magazine-progress";

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

// Bottom bar shown while a Custom or Pocket Magazine still needs templates
// and no combo is active (ComboGuideBar takes this spot then). Like that bar,
// it replaces the floating "Cart · N" pill.
export function MagazineProgressBar({
  progress,
  cartCount,
  onCart,
}: {
  progress: MagazineProgress;
  cartCount: number;
  onCart: () => void;
}) {
  // Lifts the floating spin-wheel/WhatsApp buttons clear of this bar.
  useEffect(() => {
    document.body.classList.add("combo-guide-open");
    return () => document.body.classList.remove("combo-guide-open");
  }, []);

  const { next, chosen, required, percent, tracks } = progress;
  const title = tracks.length === 1 ? tracks[0].label : "Your magazines";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-4" role="region" aria-label="Magazine template progress">
      <div className="mx-auto max-w-3xl rounded-2xl bg-off-white/95 p-3 shadow-2xl ring-1 ring-pink-mist backdrop-blur">
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="min-w-0 truncate font-semibold text-rose-wine">{title}</p>
          {/* Phones get the short count so the magazine's name still fits. */}
          <p className="shrink-0 text-dusty-rose" aria-live="polite">
            {next ? (
              <>
                <span className="sm:hidden">{chosen} of {required} · {percent}%</span>
                <span className="hidden sm:inline">Template Selection: {chosen} of {required} picked · {percent}%</span>
              </>
            ) : `✓ All ${required} templates`}
          </p>
        </div>

        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-pink-mist/50"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="h-full rounded-full bg-rose-wine transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          {next ? (
            <>
              <button
                type="button"
                onClick={() => scrollTo(next.anchor)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-rose-wine px-4 py-2 text-left text-sm text-off-white hover:bg-rose-wine/90"
              >
                <span className="truncate">
                  <span className="opacity-75">Pick templates:</span> {tracks.length > 1 ? `${next.label} · ` : ""}{next.chosen} of {next.required}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={onCart}
                aria-label={`Open cart, ${cartCount} items`}
                className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm text-rose-wine ring-1 ring-pink-mist hover:bg-pink-mist/30"
              >
                <ShoppingBag className="h-4 w-4" /> {cartCount}
              </button>
            </>
          ) : (
            <button type="button" onClick={onCart} className="pill-btn pill-btn-hover pill-primary flex-1 justify-center">
              <Check className="h-4 w-4" /> Templates complete — review in cart · {cartCount}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
