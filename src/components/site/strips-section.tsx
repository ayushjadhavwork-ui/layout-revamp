import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, COMBO_RECIPES, STRIP_BUNDLE_PACKS, STRIP_TIERS, STRIP_MAX, fmt, stripImage } from "@/lib/catalog";
import { useStore } from "@/lib/store";

const items = CATALOG.strips;
const count = items.length;

// Signed distance from the centred slide, wrapped so the carousel loops:
// with 12 strips, strip 12 sits just left of strip 1.
function offsetFrom(active: number, index: number): number {
  let d = (index - active + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

// How each position around the centre is drawn — scale, inward tilt and
// fade grow with distance, giving the curved, 3D look.
const DEPTH = [
  { scale: 1.08, rotate: 0, opacity: 1 },
  { scale: 0.92, rotate: 12, opacity: 0.9 },
  { scale: 0.82, rotate: 22, opacity: 0.6 },
  { scale: 0.72, rotate: 28, opacity: 0 },
];

/* -------------------------------------------------------------- */
/* Pricing banner                                                  */
/* -------------------------------------------------------------- */
function StripsPricingTable({ selected }: { selected: number }) {
  return (
    <div className="mx-auto mt-4 max-w-3xl rounded-2xl bg-white/70 backdrop-blur-sm ring-1 ring-rose-wine/10 p-3 sm:p-4">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-blush-rose">
        Bundle pricing
      </p>
      <div className="mt-3 flex snap-x gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-9 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {STRIP_BUNDLE_PACKS.map((n) => {
          const active = selected === n;
          return (
            <div
              key={n}
              className={`min-w-[4.25rem] shrink-0 snap-start rounded-xl px-1.5 py-2 text-center transition sm:min-w-0 ${
                active ? "bg-rose-wine text-white shadow-md" : "bg-white/70 text-rose-wine ring-1 ring-rose-wine/10"
              }`}
            >
              <p className="text-[0.6rem] uppercase tracking-[0.15em] opacity-80">
                {n} strip{n === 1 ? "" : "s"}
              </p>
              <p className="font-display text-base font-semibold">{fmt(STRIP_TIERS[n])}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-sm text-rose-wine">
        {selected > 0 ? (
          <>
            <span className="font-semibold">{selected}</span> strip{selected === 1 ? "" : "s"} selected ·{" "}
            <span className="font-semibold">{fmt(STRIP_TIERS[selected] ?? 0)}</span>
          </>
        ) : (
          <span className="text-dusty-rose">Pick any strips — the price follows how many you choose.</span>
        )}
      </p>
    </div>
  );
}

// Toggles a strip and reports the result. Shared by the carousel and the
// lightbox so both say the same thing.
function useStripToggle() {
  const selections = useStore((s) => s.stripSelections);
  const toggleStrip = useStore((s) => s.toggleStrip);
  const cart = useStore((s) => s.cart);
  const combo = cart.find((c) => c.category === "combos");
  const comboStrips = combo ? COMBO_RECIPES[combo.id]?.stripCount ?? 0 : 0;

  return (id: string, name: string) => {
    const already = selections.includes(id);
    if (!toggleStrip(id)) {
      toast.error(`You can only pick up to ${STRIP_MAX} strips.`);
      return;
    }
    // A full combo allowance swaps out the oldest pick (see toggleStrip).
    if (!already && comboStrips > 0 && selections.length >= comboStrips) {
      toast.success(`${name} swapped in — your combo includes ${comboStrips} strip${comboStrips === 1 ? "" : "s"}`);
      return;
    }
    toast.success(already ? `${name} removed` : `${name} added`);
  };
}

/* -------------------------------------------------------------- */
/* StripsSection — curved, looping 3D carousel                     */
/* -------------------------------------------------------------- */
export function StripsSection() {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const selections = useStore((s) => s.stripSelections);
  const toggle = useStripToggle();
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const go = (delta: number) => setActive((i) => (i + delta + count) % count);
  const current = items[active];
  const currentSelected = selections.includes(current.id);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };
  // A swipe must not also count as a tap on the slide under the finger.
  const wasDrag = () => {
    const moved = !!drag.current?.moved;
    drag.current = null;
    return moved;
  };

  const onSlideClick = (index: number) => {
    if (wasDrag()) return;
    if (index === active) toggle(items[index].id, items[index].name);
    else setActive(index);
  };

  return (
    <>
      <StripsPricingTable selected={selections.length} />

      <div
        className="relative mx-auto mt-6 h-[27rem] max-w-5xl touch-pan-y select-none overflow-hidden sm:h-[36rem]"
        style={{ perspective: "1200px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Polaroid strips"
        tabIndex={0}
      >
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {items.map((item, index) => {
            const d = offsetFrom(active, index);
            const distance = Math.abs(d);
            if (distance >= DEPTH.length) return null;
            const depth = DEPTH[distance];
            const selected = selections.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSlideClick(index)}
                aria-label={index === active ? `${selected ? "Remove" : "Select"} ${item.name}` : `Show ${item.name}`}
                aria-pressed={index === active ? selected : undefined}
                tabIndex={index === active ? 0 : -1}
                className={`absolute left-1/2 top-1/2 w-[7rem] rounded-xl bg-white p-1.5 transition-[transform,opacity,box-shadow] duration-500 ease-out sm:w-[9.5rem] sm:p-2 ${
                  selected ? "ring-4 ring-rose-wine shadow-[0_0_24px_rgba(193,71,109,0.55)]" : "ring-1 ring-rose-wine/10"
                } ${d === 0 ? "shadow-2xl" : "shadow-md"}`}
                style={{
                  transform: `translate(-50%, -50%) translateX(${d * 82}%) scale(${depth.scale}) rotateY(${-Math.sign(d) * depth.rotate}deg)`,
                  opacity: depth.opacity,
                  zIndex: 10 - distance,
                  pointerEvents: depth.opacity === 0 ? "none" : undefined,
                }}
              >
                <img
                  src={stripImage(item.id)}
                  alt={item.name}
                  loading={distance <= 1 ? "eager" : "lazy"}
                  draggable={false}
                  className="block aspect-[303/1000] w-full object-contain"
                />
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-rose-wine px-2 py-0.5 text-[0.6rem] font-semibold text-white shadow-md">
                    <Check className="h-3 w-3" /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous strip"
          className="absolute left-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-rose-wine shadow-md backdrop-blur-md transition hover:bg-white sm:left-4 sm:h-12 sm:w-12"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next strip"
          className="absolute right-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-rose-wine shadow-md backdrop-blur-md transition hover:bg-white sm:right-4 sm:h-12 sm:w-12"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Choose a strip">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={item.name}
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? "w-5 bg-rose-wine" : selections.includes(item.id) ? "w-1.5 bg-blush-rose" : "w-1.5 bg-rose-wine/25"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto mt-4 flex max-w-xs items-center gap-2">
        <button
          type="button"
          onClick={() => toggle(current.id, current.name)}
          className={`pill-btn flex-1 !py-2.5 ${currentSelected ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-btn-hover pill-primary"}`}
        >
          {currentSelected ? <><Check className="h-4 w-4" /> {current.name} selected</> : `Select ${current.name}`}
        </button>
        <button
          type="button"
          onClick={() => setLightbox(active)}
          aria-label={`View ${current.name} full size`}
          className="pill-btn pill-btn-hover shrink-0 !px-3 !py-2.5"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-[0.65rem] uppercase tracking-[0.2em] text-dusty-rose">
        Swipe or use the arrows · tap the centre strip to select
      </p>

      {lightbox !== null && (
        <StripLightbox index={lightbox} onIndex={(i) => { setLightbox(i); setActive(i); }} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}

/* -------------------------------------------------------------- */
/* StripLightbox — full-screen, uncropped, cycles every strip      */
/* -------------------------------------------------------------- */
function StripLightbox({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const selections = useStore((s) => s.stripSelections);
  const toggle = useStripToggle();
  const item = items[index];
  const selected = selections.includes(item.id);
  const go = (delta: number) => onIndex((index + delta + count) % count);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % count);
      if (e.key === "ArrowLeft") onIndex((index - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, onIndex, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/75 p-4 backdrop-blur-md" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        aria-label="Previous strip"
        className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(1); }}
        aria-label="Next strip"
        className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <img
        src={stripImage(item.id)}
        alt={item.name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[72vh] max-w-[70vw] rounded-lg bg-white object-contain p-2 shadow-2xl"
      />

      <div
        className="mt-4 flex w-full max-w-sm flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/95 p-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="font-display text-xl text-rose-wine">{item.name}</p>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-dusty-rose">
            {index + 1} of {count}
            {selections.length > 0 && ` · ${selections.length} selected · ${fmt(STRIP_TIERS[selections.length] ?? 0)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggle(item.id, item.name)}
          className={`pill-btn !py-2 ${selected ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-btn-hover pill-primary"}`}
        >
          {selected ? "Remove Strip" : "Select Strip"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
