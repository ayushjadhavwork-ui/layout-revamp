import { useEffect, useState } from "react";
import { Camera, Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";

import { IT_POLAROID_PRICE, IT_POLAROIDS_MAX, IT_POLAROIDS_MIN, fmt } from "@/lib/catalog";
import { PRICES } from "@/lib/prices";
import { SITE } from "@/lib/site-content";
import { clampItPolaroidsQty, useStore } from "@/lib/store";

const info = SITE.itPolaroids;

export function ItPolaroidsSection() {
  const inCart = useStore((s) => s.itPolaroidsQty());
  const addItPolaroids = useStore((s) => s.addItPolaroids);
  const removeItPolaroids = useStore((s) => s.removeItPolaroids);
  // The stepper edits a draft; the cart only changes on "Add to cart". Kept
  // as text so the customer can clear the box while typing a new number.
  const [draft, setDraft] = useState(String(inCart || IT_POLAROIDS_MIN));
  useEffect(() => {
    if (inCart) setDraft(String(inCart));
  }, [inCart]);

  const qty = clampItPolaroidsQty(Number(draft) || IT_POLAROIDS_MIN);
  const step = (delta: number) => setDraft(String(clampItPolaroidsQty(qty + delta)));

  const onType = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 3);
    if (Number(digits) > IT_POLAROIDS_MAX) {
      toast.error(`You can order up to ${IT_POLAROIDS_MAX} polaroids at a time.`);
      setDraft(String(IT_POLAROIDS_MAX));
      return;
    }
    setDraft(digits);
  };

  const add = () => {
    addItPolaroids(qty);
    setDraft(String(qty));
    toast.success(`${info.name} × ${qty} ${inCart ? "updated" : "added"} — ${fmt(qty * IT_POLAROID_PRICE)}`);
  };

  const remove = () => {
    removeItPolaroids();
    setDraft(String(IT_POLAROIDS_MIN));
    toast.success(`${info.name} removed`);
  };

  return (
    <div className="overflow-hidden rounded-xl bg-rose-wine p-3 sm:p-6 md:p-10">
      <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
        {/* Poster in a polaroid frame, with two blank frames fanned behind it. */}
        <div className="relative mx-auto w-full max-w-sm px-3 pt-3 sm:max-w-md md:px-6 md:pt-6">
          <div aria-hidden className="absolute inset-x-8 top-6 bottom-10 hidden rotate-[-7deg] rounded-sm bg-off-white/70 shadow-lg sm:block" />
          <div aria-hidden className="absolute inset-x-8 top-6 bottom-10 hidden rotate-[5deg] rounded-sm bg-off-white/85 shadow-lg sm:block" />
          <figure className="relative rotate-[-1.5deg] rounded-sm bg-off-white p-2.5 pb-10 shadow-2xl sm:p-3 sm:pb-14">
            <img
              src={info.poster}
              alt={`${info.name} — instant photo prints`}
              width={1092}
              height={1440}
              loading="lazy"
              className="block aspect-[1092/1440] w-full rounded-[2px] object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-2.5 text-center font-display text-base italic text-rose-wine sm:bottom-4 sm:text-lg">
              {info.tagline}
            </figcaption>
          </figure>
        </div>

        <div className="min-w-0 text-off-white">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-mist">
            <Camera className="h-4 w-4" /> Instant keepsakes
          </p>
          <h3 className="mt-2 font-display text-4xl leading-none sm:text-5xl">{info.name}</h3>
          <p className="mt-2 font-display text-lg italic text-pink-mist sm:text-xl">{info.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-off-white/90">{info.description}</p>

          <ul className="mt-4 space-y-1.5 text-sm">
            {info.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-pink-mist" /> <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-lg bg-black/15 p-4 ring-1 ring-pink-mist/30">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-3xl">
                {fmt(IT_POLAROID_PRICE)} <span className="text-sm font-sans text-pink-mist">per polaroid</span>
              </p>
              <p className="text-[0.65rem] uppercase text-pink-mist">
                {IT_POLAROIDS_MIN}–{IT_POLAROIDS_MAX} · 1 photo each
              </p>
            </div>

            <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={qty <= IT_POLAROIDS_MIN}
                aria-label="Fewer polaroids"
                className="grid h-11 w-11 place-items-center rounded-full border border-pink-mist/60 disabled:opacity-35"
              >
                <Minus className="h-4 w-4" />
              </button>
              <label className="flex h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-off-white px-3 text-rose-wine">
                <span className="text-xs font-semibold uppercase">Qty</span>
                <input
                  inputMode="numeric"
                  aria-label="Number of polaroids"
                  value={draft}
                  onChange={(e) => onType(e.target.value)}
                  onBlur={() => setDraft(String(qty))}
                  className="w-12 bg-transparent text-center text-lg font-semibold outline-none"
                />
              </label>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={qty >= IT_POLAROIDS_MAX}
                aria-label="More polaroids"
                className="grid h-11 w-11 place-items-center rounded-full border border-pink-mist/60 disabled:opacity-35"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-center text-sm" aria-live="polite">
              {fmt(IT_POLAROID_PRICE)} × {qty} = <span className="font-display text-2xl">{fmt(IT_POLAROID_PRICE * qty)}</span>
            </p>

            <button
              type="button"
              onClick={add}
              disabled={inCart === qty}
              className="pill-btn pill-btn-hover mt-3 w-full !bg-off-white !text-rose-wine disabled:opacity-60"
            >
              <ShoppingBag className="h-4 w-4" />
              {inCart === qty ? `In cart · ${qty}` : inCart ? `Update cart to ${qty}` : "Add to cart"}
            </button>
            {inCart > 0 && (
              <button type="button" onClick={remove} className="mt-2 w-full text-center text-xs text-pink-mist underline underline-offset-2">
                Remove from cart
              </button>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-off-white/80">{info.howToOrder}</p>
          <p className="mt-2 flex items-start gap-2 text-xs text-pink-mist">
            <Truck className="mt-0.5 h-4 w-4 shrink-0" />
            Polaroids on their own ship for {fmt(PRICES.deliveryPolaroidsOnly["del-std"])}. Add any magazine (A4, A5, A6 or Newspaper) for free standard shipping.
          </p>
        </div>
      </div>
    </div>
  );
}
