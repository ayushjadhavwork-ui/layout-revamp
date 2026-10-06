import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Eye, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { CATALOG, fmt, MEMORY_CARD_MAX, MEMORY_CARD_TIERS, type Product } from "@/lib/catalog";
import { SITE } from "@/lib/site-content";
import { useStore } from "@/lib/store";
import { ModalShell } from "./shop";

export function MemoryCardSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const selectedIds = useStore((state) => state.selectedMemoryCardDesignIds);
  const addDesign = useStore((state) => state.addMemoryCardDesign);
  const removeDesign = useStore((state) => state.removeMemoryCardDesign);
  const designs = CATALOG["memory-card-designs"];
  const total = selectedIds.length;

  const add = (item: Product) => {
    if (!addDesign(item.id)) return toast.error(`You can select up to ${MEMORY_CARD_MAX} Memory Cards.`);
    const next = total + 1;
    toast.success(`${item.name} — Qty ×${selectedIds.filter((id) => id === item.id).length + 1}. Bundle total: ${fmt(MEMORY_CARD_TIERS[next])}`);
  };

  const remove = (item: Product) => {
    const count = selectedIds.filter((id) => id === item.id).length;
    if (!removeDesign(item.id)) return;
    toast.success(count > 1 ? `${item.name} — Qty ×${count - 1}` : `${item.name} removed`);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-rose-wine p-3 sm:p-6 md:p-10">
        <img
          src={SITE.memoryCardBanner}
          alt="The Memory Card collection"
          className="block w-full rounded-lg object-cover"
        />

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg bg-black/15 p-3 text-center text-off-white ring-1 ring-pink-mist/30 sm:mx-auto sm:max-w-lg sm:gap-4 sm:p-4">
          {[1, 2, 3].map((quantity) => (
            <div key={quantity}>
              <p className="text-[0.6rem] uppercase text-pink-mist sm:text-xs">{quantity} Card{quantity === 1 ? "" : "s"}</p>
              <p className="mt-1 font-display text-lg sm:text-2xl">{fmt(MEMORY_CARD_TIERS[quantity])}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase text-off-white">Choose any mix of up to three cards</p>
          <p className="mt-1 text-[0.65rem] uppercase text-pink-mist">
            {total === 0 ? "Nothing selected yet" : `${total} of ${MEMORY_CARD_MAX} selected · Bundle ${fmt(MEMORY_CARD_TIERS[total])}`}
          </p>
        </div>

        <div className="mx-auto mt-4 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {designs.map((item, index) => {
            const count = selectedIds.filter((id) => id === item.id).length;
            const active = count > 0;
            const disabled = total >= MEMORY_CARD_MAX && !active;
            const thumbnail = SITE.productImages[item.id]?.[0];
            return (
              <article
                key={item.id}
                className={`flex min-w-0 flex-col rounded-lg bg-black/15 p-2 ring-1 transition sm:p-4 ${
                  active ? "ring-2 ring-off-white" : "ring-pink-mist/30"
                } ${index === 2 ? "col-span-2 mx-auto w-[calc(50%-0.375rem)] md:col-span-1 md:w-auto" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-off-white"
                  aria-label={`View ${item.name}`}
                >
                  {thumbnail && <img src={thumbnail} alt={item.name} className="h-full w-full object-cover" loading="lazy" />}
                  {active && (
                    <span className="absolute right-1.5 top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-off-white px-1 text-[0.65rem] font-bold text-rose-wine shadow">
                      {count > 1 ? `×${count}` : <Check className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </button>

                <h3 className="mt-3 min-h-8 text-center font-display text-[0.7rem] leading-tight text-off-white sm:text-base">
                  {SITE.memoryCardInfo[item.id].name}
                </h3>

                <div className="mt-auto pt-3">
                  {active ? (
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
                      <button type="button" onClick={() => remove(item)} aria-label={`Decrease ${item.name} quantity`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-pink-mist/60 text-off-white">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex h-8 min-w-0 items-center justify-center rounded-full bg-off-white px-1 text-[0.65rem] font-semibold text-rose-wine sm:text-xs">Qty ×{count}</span>
                      <button type="button" onClick={() => add(item)} disabled={total >= MEMORY_CARD_MAX} aria-label={`Increase ${item.name} quantity`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-pink-mist/60 text-off-white disabled:opacity-35">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => add(item)} disabled={disabled} className="h-8 w-full rounded-full border border-pink-mist/60 text-[0.65rem] font-semibold text-off-white disabled:opacity-35 sm:text-xs">
                      Select
                    </button>
                  )}
                  <button type="button" onClick={() => setOpenIndex(index)} className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-full border border-pink-mist/60 text-[0.65rem] text-off-white sm:text-xs">
                    <Eye className="h-3.5 w-3.5" /> View More
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <MemoryCardDetailModal
        item={openIndex === null ? null : designs[openIndex]}
        count={openIndex === null ? 0 : selectedIds.filter((id) => id === designs[openIndex]?.id).length}
        total={total}
        onAdd={add}
        onRemove={remove}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}

function MemoryCardDetailModal({
  item,
  count,
  total,
  onAdd,
  onRemove,
  onClose,
}: {
  item: Product | null;
  count: number;
  total: number;
  onAdd: (item: Product) => void;
  onRemove: (item: Product) => void;
  onClose: () => void;
}) {
  const [slide, setSlide] = useState(0);

  useEffect(() => setSlide(0), [item?.id]);
  if (!item) return null;

  const info = SITE.memoryCardInfo[item.id];
  const photos = SITE.productImages[item.id] ?? [];
  const current = photos[slide] ?? photos[0];
  const changeSlide = (direction: number) => setSlide((currentSlide) => (currentSlide + direction + photos.length) % photos.length);

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-lg bg-off-white">
            {current && <img src={current} alt={`${info.name} — image ${slide + 1}`} className="block w-full object-contain" />}
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => changeSlide(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-off-white/90 text-rose-wine">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => changeSlide(1)} aria-label="Next image" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-off-white/90 text-rose-wine">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <p className="mt-2 text-center text-[0.65rem] uppercase text-dusty-rose">{slide === 0 ? "Open card" : "Card cover"}</p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-blush-rose">The Memory Card</p>
          <h3 className="mt-2 font-display text-3xl leading-tight text-rose-wine md:text-4xl">{info.name}</h3>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{info.description}</p>
          <div className="mt-5 space-y-4 border-t border-rose-wine/10 pt-5">
            <div>
              <p className="text-xs font-semibold uppercase text-blush-rose">Photos Required</p>
              <p className="mt-1 text-sm text-neutral-700">{info.photosRequired}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-blush-rose">Details Required</p>
              <p className="mt-1 text-sm text-neutral-700">{info.detailsRequired}</p>
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold text-rose-wine">
            {total === 0 ? `Starts at ${fmt(MEMORY_CARD_TIERS[1])}` : `${total} card${total === 1 ? "" : "s"} · ${fmt(MEMORY_CARD_TIERS[total])}`}
          </p>
          {count > 0 ? (
            <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <button type="button" onClick={() => onRemove(item)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-wine/30 text-rose-wine" aria-label={`Decrease ${item.name} quantity`}><Minus className="h-4 w-4" /></button>
              <span className="flex h-10 min-w-0 items-center justify-center rounded-full bg-rose-wine text-sm font-semibold text-off-white">Qty ×{count}</span>
              <button type="button" onClick={() => onAdd(item)} disabled={total >= MEMORY_CARD_MAX} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-wine/30 text-rose-wine disabled:opacity-35" aria-label={`Increase ${item.name} quantity`}><Plus className="h-4 w-4" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => onAdd(item)} disabled={total >= MEMORY_CARD_MAX} className="pill-btn pill-btn-hover pill-primary mt-5 w-full disabled:opacity-35">Select this card</button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}