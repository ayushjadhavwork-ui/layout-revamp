import { useEffect } from "react";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import type { ComboStep } from "@/lib/combo-guide";
import type { ComboSection } from "@/lib/combo-validation";

const scrollTo = (section: ComboSection) =>
  document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });

// Bottom bar shown while a combo is in the cart (it replaces the floating
// "Cart · N" pill). Each progress segment is a jump link to its section.
export function ComboGuideBar({
  comboName,
  steps,
  next,
  showAll,
  cartCount,
  onToggleShowAll,
  onRemove,
  onCart,
}: {
  comboName: string;
  steps: ComboStep[];
  next: { section: ComboSection; label: string } | null;
  showAll: boolean;
  cartCount: number;
  onToggleShowAll: () => void;
  onRemove: () => void;
  onCart: () => void;
}) {
  // Lifts the floating spin-wheel/WhatsApp buttons clear of this bar.
  useEffect(() => {
    document.body.classList.add("combo-guide-open");
    return () => document.body.classList.remove("combo-guide-open");
  }, []);

  const done = steps.filter((s) => s.done).length;
  const complete = next === null;
  const percent = complete ? 100 : steps.length ? Math.round((done / steps.length) * 100) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-4" role="region" aria-label={`${comboName} progress`}>
      <div className="mx-auto max-w-3xl rounded-2xl bg-off-white/95 p-3 shadow-2xl ring-1 ring-pink-mist backdrop-blur">
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="min-w-0 truncate text-rose-wine">
            <span className="font-semibold">{comboName}</span>
            <span className="text-dusty-rose"> · {complete ? "Complete" : `${done} of ${steps.length} done`}</span>
          </p>
          <div className="flex shrink-0 items-center gap-3 text-dusty-rose">
            <button type="button" onClick={onToggleShowAll} title={showAll ? "Show only what your combo needs" : "Show all products"} className="underline underline-offset-2 hover:text-rose-wine">
              {showAll ? "Focus" : "Show all"}
            </button>
            <button type="button" onClick={onRemove} className="underline underline-offset-2 hover:text-rose-wine">
              Remove
            </button>
          </div>
        </div>

        <div className="mt-2 flex gap-1" aria-label={`${percent}% complete`}>
          {steps.map((step) => (
            <button
              key={step.section}
              type="button"
              title={step.label}
              aria-label={`${step.label}${step.done ? " (done)" : ""}`}
              onClick={() => scrollTo(step.section)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${step.done || complete ? "bg-blush-rose" : "bg-pink-mist/60 hover:bg-pink-mist"}`}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          {complete ? (
            <button type="button" onClick={onCart} className="pill-btn pill-btn-hover pill-primary flex-1 animate-pulse justify-center">
              <Check className="h-4 w-4" /> Combo complete — review in cart
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => next && scrollTo(next.section)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-rose-wine px-4 py-2 text-left text-sm text-off-white hover:bg-rose-wine/90"
              >
                <span className="truncate"><span className="opacity-75">Next:</span> {next?.label}</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
