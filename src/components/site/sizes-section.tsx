import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, COMBO_RECIPES, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE, type MagazineSizeLabel } from "@/lib/site-content";

const content = SITE.createYourOwnMagazine;
const slides = content.carouselImages;
const pocket = CATALOG.pocket[0];
const POCKET_PAGES = 6;

// Every page count the A4/A5 packages come in (both formats share them).
const PAGE_COUNTS = CATALOG.sizes
  .filter((s) => s.format === "standard")
  .map((s) => Number(s.id.replace(/\D/g, "")));

// The catalogue size an A4/A5 pick maps to (A6 is the Pocket Magazine).
function sizeIdFor(size: MagazineSizeLabel, pages: number): string {
  return size === "A5" ? `sz-${pages}-mini` : `sz-${pages}`;
}

function priceFor(size: MagazineSizeLabel, pages: number): number {
  if (size === "A6") return pocket.price;
  return CATALOG.sizes.find((s) => s.id === sizeIdFor(size, pages))?.price ?? 0;
}

function scrollToSection(id: string) {
  // Give a freshly revealed section a moment to render first.
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
}

// Larger formats get a larger outline icon, so the three cards read as sizes.
const ICON_SIZE: Record<MagazineSizeLabel, string> = { A4: "h-7 w-7", A5: "h-6 w-6", A6: "h-5 w-5" };

/* -------------------------------------------------------------- */
/* Left column — looping swipe carousel                            */
/* -------------------------------------------------------------- */
function MagazineCarousel() {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);
  const slide = slides[index];

  return (
    <div>
      <div
        className="group relative aspect-[4/3] select-none overflow-hidden rounded-2xl border border-blush-rose/30 bg-[#fdf6f4] shadow-inner touch-pan-y sm:aspect-square"
        onPointerDown={(e) => { drag.current = { x: e.clientX, moved: false }; }}
        onPointerMove={(e) => {
          if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true;
        }}
        onPointerUp={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              tabIndex={i === index ? 0 : -1}
              onClick={() => {
                // A swipe must not also open the lightbox.
                const moved = drag.current?.moved;
                drag.current = null;
                if (!moved) setZoomed(true);
              }}
              aria-label={`Enlarge: ${s.caption}`}
              className="h-full w-full shrink-0 cursor-zoom-in"
            >
              <img
                src={s.src}
                alt={s.alt}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous image"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-rose-wine shadow-md backdrop-blur-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next image"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-rose-wine shadow-md backdrop-blur-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 backdrop-blur-xs">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white"}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-dusty-rose" aria-live="polite">{slide.caption}</p>

      {zoomed && <CarouselLightbox index={index} onIndex={setIndex} onClose={() => setZoomed(false)} />}
    </div>
  );
}

function CarouselLightbox({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const go = (delta: number) => onIndex((index + delta + slides.length) % slides.length);
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % slides.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, onIndex, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
        <X className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); go(1); }}
        aria-label="Next image"
        className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <img
        src={slides[index].src}
        alt={slides[index].alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] max-w-full rounded-lg object-contain"
      />
      <p className="mt-3 text-sm text-white/80">{slides[index].caption}</p>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------- */
/* SizesSection — "Create Your Own Magazine" configurator          */
/* -------------------------------------------------------------- */
export function SizesSection() {
  const cart = useStore((s) => s.cart);
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const format = useStore((s) => s.format);
  const setFormat = useStore((s) => s.setFormat);
  const setSize = useStore((s) => s.setSize);
  const addPocketUnit = useStore((s) => s.addPocketUnit);
  const pocketUnits = useStore((s) => s.pocketUnits);

  const activeCombo = cart.find((c) => c.category === "combos");
  const recipe = activeCombo ? COMBO_RECIPES[activeCombo.id] : undefined;
  const comboSize = recipe?.sizeId ? CATALOG.sizes.find((s) => s.id === recipe.sizeId) : undefined;
  const comboHasMagazine = !!comboSize || !!recipe?.pocketCount;

  // The magazine in the cart (A4/A5), if any — the builder starts on it.
  const cartSize = selectedSizeId ? CATALOG.sizes.find((s) => s.id === selectedSizeId) : undefined;
  const fromCatalog = (s: { id: string; format?: string }) => ({
    size: (s.format === "mini" ? "A5" : "A4") as MagazineSizeLabel,
    pages: Number(s.id.replace(/\D/g, "")),
  });

  // Size and page picks stay local until "Add to cart", so browsing the
  // options never resets templates or drops a combo.
  const [size, setSizeLabel] = useState<MagazineSizeLabel>(cartSize ? fromCatalog(cartSize).size : "A4");
  const [pages, setPages] = useState<number>(cartSize ? fromCatalog(cartSize).pages : 12);

  // Follow the cart when a combo (or the cart drawer) changes the magazine.
  useEffect(() => {
    const source = comboSize ?? cartSize;
    if (source) {
      const pick = fromCatalog(source);
      setSizeLabel(pick.size);
      setPages(pick.pages);
    } else if (recipe?.pocketCount) {
      setSizeLabel("A6");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSizeId, activeCombo?.id]);

  // The product directory's Custom/Pocket Magazine buttons pre-select a size.
  useEffect(() => {
    const onConfigure = (e: Event) => {
      const label = (e as CustomEvent<MagazineSizeLabel>).detail;
      if (label === "A4" || label === "A5" || label === "A6") setSizeLabel(label);
    };
    window.addEventListener("configure-magazine", onConfigure);
    return () => window.removeEventListener("configure-magazine", onConfigure);
  }, []);

  const shownPages = size === "A6" ? POCKET_PAGES : pages;
  const price = priceFor(size, shownPages);
  const targetId = size === "A6" ? null : sizeIdFor(size, pages);
  const alreadyInCart = !!targetId && selectedSizeId === targetId;

  const chooseSize = (label: MagazineSizeLabel) => {
    if (comboHasMagazine) return toast.message(`Your magazine is included in ${activeCombo?.name} — remove the combo to build your own.`);
    setSizeLabel(label);
  };
  const choosePages = (n: number) => {
    if (comboHasMagazine) return toast.message(`Your magazine is included in ${activeCombo?.name} — remove the combo to build your own.`);
    setPages(n);
  };

  const addToCart = () => {
    if (size === "A6") {
      addPocketUnit();
      toast.success(`Pocket Magazine (A6) added — pick ${pocket.templateLimit} templates for it.`);
      scrollToSection("pocket");
      return;
    }
    if (!targetId) return;
    if (!alreadyInCart) {
      const wanted = size === "A5" ? "mini" : "standard";
      if (format !== wanted) setFormat(wanted);
      setSize(targetId);
      const added = CATALOG.sizes.find((s) => s.id === targetId);
      toast.success(`${size} · ${added?.name} added — now pick ${added?.templateLimit} template${added?.templateLimit === 1 ? "" : "s"}.`);
    }
    scrollToSection("templates");
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-pink-mist/50 bg-white/95 p-6 shadow-sm sm:p-10">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <MagazineCarousel />
        </div>

        <div className="lg:col-span-7">
          <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-rose-wine sm:text-3xl">
            {content.title}
          </h2>
          <div className="mt-3 space-y-2 font-sans text-xs leading-relaxed text-foreground/85 sm:text-sm">
            {content.descriptionParagraphs.map((p) => <p key={p}>{p}</p>)}
          </div>
          <div className="mt-3.5 rounded-xl border border-blush-rose/40 bg-pink-mist/30 px-4 py-2.5 text-xs font-medium text-rose-wine sm:text-sm">
            {content.highlightBox}
          </div>

          <p className="mb-2.5 mt-6 text-[0.7rem] font-bold uppercase tracking-wider text-foreground/70">1. Choose your size</p>
          <div className="grid grid-cols-3 gap-3">
            {content.sizes.map((s) => {
              const on = size === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => chooseSize(s.label)}
                  className={`flex flex-col items-center rounded-xl px-1.5 py-3 text-center transition ${
                    on
                      ? "border-2 border-rose-wine bg-blush-rose/15 text-rose-wine shadow-sm"
                      : "border border-border/80 bg-white text-foreground hover:border-blush-rose/80"
                  }`}
                >
                  <span className="grid h-8 place-items-center">
                    <BookOpen className={ICON_SIZE[s.label]} strokeWidth={1.5} />
                  </span>
                  <span className="mt-1 font-display text-lg font-semibold leading-none">{s.label}</span>
                  <span className="mt-1 text-[0.6rem] text-muted-foreground sm:text-[0.7rem]">{s.dimensions}</span>
                </button>
              );
            })}
          </div>

          <p className="mb-2.5 mt-5 text-[0.7rem] font-bold uppercase tracking-wider text-foreground/70">2. Select number of pages</p>
          {size === "A6" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rose-wine px-3.5 py-1.5 text-xs font-medium text-white shadow-sm">{POCKET_PAGES} Pages</span>
              <span className="text-xs text-dusty-rose">{content.pocketNote}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {PAGE_COUNTS.map((n) => {
                const on = pages === n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={on}
                    onClick={() => choosePages(n)}
                    className={`rounded-full px-3.5 py-1.5 text-xs transition ${
                      on
                        ? "bg-rose-wine font-medium text-white shadow-sm"
                        : "border border-border bg-white text-foreground/80 hover:border-rose-wine/60"
                    }`}
                  >
                    {n} Pages
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Price</p>
              {comboHasMagazine ? (
                <p className="font-display text-lg font-semibold text-rose-wine sm:text-xl">✨ Included in {activeCombo?.name} (₹0)</p>
              ) : (
                <p className="font-display text-2xl font-bold text-rose-wine sm:text-3xl">{fmt(price)}</p>
              )}
            </div>
            {comboHasMagazine ? (
              <button
                type="button"
                onClick={() => scrollToSection(comboSize ? "templates" : "pocket")}
                className="shrink-0 rounded-full bg-rose-wine px-5 py-3 text-xs font-medium text-white shadow-md transition-transform hover:bg-rose-wine/90 active:scale-95 sm:px-7 sm:text-sm"
              >
                Select Templates ➜
              </button>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                className="shrink-0 rounded-full bg-rose-wine px-5 py-3 text-xs font-medium text-white shadow-md transition-transform hover:bg-rose-wine/90 active:scale-95 sm:px-7 sm:text-sm"
              >
                {alreadyInCart ? "In cart · Pick templates ➜" : "ADD TO CART 🛒"}
              </button>
            )}
          </div>

          {!comboHasMagazine && (cartSize || pocketUnits.length > 0) && (
            <p className="mt-3 text-xs text-dusty-rose">
              In your cart:{" "}
              {[
                cartSize && `${fromCatalog(cartSize).size} · ${cartSize.name}`,
                pocketUnits.length > 0 && `Pocket Magazine (A6)${pocketUnits.length > 1 ? ` × ${pocketUnits.length}` : ""}`,
              ].filter(Boolean).join(" + ")}
              {size !== "A6" && cartSize && !alreadyInCart && " — adding this one replaces your A4/A5 magazine."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
