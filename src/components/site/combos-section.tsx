import { useEffect, useState } from "react";
import { Heart, Sparkles, Rocket, Check, Package, Eye } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt, comboRealTotal } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";

type ComboMeta = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  emoji: string;
  includes: string[];
  tag?: string;
};

// Pricing (original/save) is computed live from comboRealTotal() below —
// never hand-typed, so it can't drift from the actual catalog prices.
const COMBO_META: Record<string, ComboMeta> = {
  "combo-main": {
    icon: Heart,
    emoji: "💌",
    includes: ["8-Page Custom Magazine", "Gift Wrap", "Personalized Letter"],
  },
  "combo-core": {
    icon: Sparkles,
    emoji: "📸",
    tag: "MOST LOVED ♡",
    includes: ["12-Page Custom Magazine", "Classic Polaroid Pack (18 Photos)", "1 Polaroid Strip"],
  },
  "combo-soft": {
    icon: Rocket,
    emoji: "✨",
    includes: ["16-Page Custom Magazine", "Memory Polaroid Pack (27 Photos)", "Gift Wrap", "Personalized Letter"],
  },
};

function comboHero(id: string): string | undefined {
  return SITE.productImages?.[id]?.[0];
}

export function CombosSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const cart = useStore((s) => s.cart);
  const selectCombo = useStore((s) => s.selectCombo);
  const deselectCombo = useStore((s) => s.deselectCombo);

  const items = CATALOG.combos;

  return (
    <>
      <div className="mt-6 rounded-3xl p-6 md:p-10 bg-gradient-to-br from-rose-wine via-rose-wine to-blush-rose shadow-2xl ring-1 ring-pink-mist/30">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-off-white">
            <Package className="h-5 w-5" />
            <span className="font-display text-2xl md:text-3xl tracking-[0.2em]">CURATED COMBOS</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
            ✧ Bundles that save you more ✧
          </p>
          <p className="mt-3 font-display italic text-off-white/80 text-sm md:text-base">
            Gen-Z coded. Premium wrapped. Made to be gifted.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-5">
          {items.map((item) => {
            const cartItem = cart.find((c) => c.category === "combos" && c.id === item.id);
            const active = !!cartItem;
            const meta = COMBO_META[item.id];
            const Icon = meta?.icon ?? Package;
            const hero = comboHero(item.id);
            const featured = item.id === "combo-core";
            const original = comboRealTotal(item.id);
            const save = Math.max(0, original - item.price);

            const handleToggle = () => {
              if (active) {
                deselectCombo(item.id);
                toast.success(`${item.name} removed`);
              } else {
                selectCombo(item);
                toast.success(`${item.name} added ✨`);
              }
            };

            return (
              <div
                key={item.id}
                onClick={handleToggle}
                className={`relative rounded-md sm:rounded-2xl p-1.5 sm:p-5 md:p-6 flex flex-col text-center transition bg-black/15 backdrop-blur-sm cursor-pointer select-none ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                } ${featured ? "md:scale-[1.04] md:-my-2 bg-black/25" : ""}`}
              >
                {meta?.tag && (
                  <span className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[0.45rem] sm:text-[0.6rem] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.25em] bg-off-white text-rose-wine shadow whitespace-nowrap">
                    {meta.tag}
                  </span>
                )}

                {active && (
                  <span className="absolute top-1 right-1 sm:top-3 sm:right-3 grid h-4 w-4 sm:h-6 sm:w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                  </span>
                )}

                <div
                  onClick={(e) => { e.stopPropagation(); setOpenId(item.id); }}
                  className="mt-1 sm:mt-2 mx-auto relative w-full aspect-[4/3] overflow-hidden rounded-sm sm:rounded-xl bg-white/5 grid place-items-center cursor-zoom-in"
                >
                  {hero ? (
                    <img src={hero} alt={item.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 sm:gap-2 text-off-white/85">
                      <span className="text-lg sm:text-4xl md:text-5xl">{meta?.emoji ?? "🎁"}</span>
                      <Icon className="hidden sm:block h-10 w-10" strokeWidth={1.25} />
                    </div>
                  )}
                </div>

                <h4 className="mt-1 sm:mt-4 flex min-h-[2.4em] sm:min-h-0 items-center justify-center font-display uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[0.6rem] sm:text-sm md:text-base text-off-white leading-tight sm:line-clamp-1">
                  {item.name}
                </h4>

                <ul className="mt-1 sm:mt-3 hidden sm:block space-y-1 text-[0.7rem] text-pink-mist/90 leading-relaxed">
                  {(meta?.includes ?? []).map((line) => (
                    <li key={line}>♡ {line}</li>
                  ))}
                </ul>

                <div className="my-1 sm:my-3 h-px w-8 sm:w-16 mx-auto bg-pink-mist/40" />

                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline font-display text-xs text-pink-mist/70 line-through">{fmt(original)}</span>
                  <span className="inline-block rounded sm:rounded-md px-1.5 sm:px-4 py-0.5 sm:py-1 font-display text-xs sm:text-xl text-rose-wine bg-off-white">
                    {fmt(item.price)}
                  </span>
                </div>
                {save > 0 && (
                  <p className="mt-0.5 sm:mt-1 hidden sm:block text-[0.6rem] uppercase tracking-[0.25em] text-off-white/80">
                    You save {fmt(save)}
                  </p>
                )}

                <div className="mt-1.5 sm:mt-4 flex gap-1 sm:gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={handleToggle}
                    className={`flex-1 min-w-0 rounded-full px-1 sm:px-3 py-1 sm:py-1.5 text-[0.5rem] sm:text-[0.7rem] font-medium transition border truncate ${
                      active
                        ? "bg-off-white text-rose-wine border-off-white"
                        : "bg-transparent text-off-white border-pink-mist/50 hover:bg-off-white/10"
                    }`}
                  >
                    {active ? "Selected" : "Add combo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId(item.id)}
                    aria-label={`View ${item.name}`}
                    className="grid shrink-0 place-items-center rounded-full px-1.5 sm:px-3 py-1 sm:py-1.5 text-[0.7rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
                  >
                    <Eye className="h-3 w-3 sm:hidden" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs tracking-[0.25em] text-pink-mist">
          ♡ hand-picked bundles, softly priced ♡
        </p>
      </div>

      <ComboModal open={!!openId} comboId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

function ComboModal({
  open, comboId, onClose,
}: { open: boolean; comboId: string | null; onClose: () => void }) {
  const item = comboId ? CATALOG.combos.find((c) => c.id === comboId) ?? null : null;
  const cart = useStore((s) => s.cart);
  const selectCombo = useStore((s) => s.selectCombo);

  useEffect(() => { /* noop */ }, [open, item?.id]);
  if (!open || !item) return null;

  const meta = COMBO_META[item.id];
  const Icon = meta?.icon ?? Package;
  const hero = comboHero(item.id);
  const inCart = cart.some((c) => c.category === "combos" && c.id === item.id);
  const original = comboRealTotal(item.id);
  const save = Math.max(0, original - item.price);

  return (
    <>
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12 items-start">
        <div className="md:col-span-6 flex justify-center">
          <div
            onClick={() => hero && setLightbox(true)}
            className={`w-full max-w-[560px] rounded-xl overflow-hidden bg-white shadow-2xl ring-1 ring-rose-wine/10 ${hero ? "cursor-zoom-in" : ""}`}
          >
            {hero ? (
              <img src={hero} alt={item.name} className="w-full h-auto object-contain" />
            ) : (
              <div className="aspect-[2480/1754] relative grid place-items-center bg-gradient-to-br from-pink-mist/40 to-blush-rose/40">
                <div className="flex flex-col items-center gap-3 text-rose-wine">
                  <span className="text-6xl">{meta?.emoji ?? "🎁"}</span>
                  <Icon className="h-14 w-14" strokeWidth={1.25} />
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Curated combo</p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{item.name}</h3>

          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-semibold text-blush-rose">{fmt(item.price)}</p>
            <p className="text-sm text-dusty-rose line-through">{fmt(original)}</p>
            {save > 0 && (
              <span className="rounded-full bg-blush-rose/15 px-2.5 py-0.5 text-xs font-semibold text-rose-wine">
                Save {fmt(save)}
              </span>
            )}
          </div>

          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-wine">Includes</p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-700">
              {(meta?.includes ?? []).map((line) => (
                <li key={line}>♡ {line}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => { selectCombo(item); toast.success(`${item.name} added ✨`); onClose(); }}
            disabled={inCart}
            className="pill-btn pill-btn-hover pill-primary mt-6 w-full !py-3 !text-base disabled:opacity-60"
          >
            {inCart ? "Already in cart" : "Add combo to cart"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
