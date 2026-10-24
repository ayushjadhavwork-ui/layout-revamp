import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Heart, Maximize2, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";

import { CATALOG, PRODUCT_COUPONS, STICKER_BOOK_INCLUDED, fmt } from "@/lib/catalog";
import { SITE } from "@/lib/site-content";
import { useStore } from "@/lib/store";
import { ModalShell } from "./shop";

const info = SITE.stickerBook;
const slides = info.slides;
const product = CATALOG["sticker-book"][0];
const coupon = PRODUCT_COUPONS[info.couponCode];
const discounted = product.price - (coupon?.amount ?? 0);

// Hand-drawn style star, like the ones in the book's own artwork.
function Star({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <path d="M50 0 58 38 100 30 64 54 84 100 50 68 16 100 36 54 0 30 42 38Z" fill="currentColor" />
    </svg>
  );
}

export function StickerBookSection() {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const touchX = useRef<number | null>(null);
  const cart = useStore((s) => s.cart);
  const activeCoupon = useStore((s) => s.coupon);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);
  const line = cart.find((c) => c.category === "sticker-book");
  const couponApplied = activeCoupon?.code === info.couponCode && !!line;

  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(info.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.message(`Your code is ${info.couponCode} — paste it at checkout.`);
    }
  };

  const toggleCart = () => {
    if (line) {
      removeItem(line.key);
      toast.success(`${product.name} removed`);
    } else {
      addItem("sticker-book", product);
      toast.success(`${product.name} added 💌`, { description: `Use ${info.couponCode} in your cart for ${fmt(coupon?.amount ?? 0)} off.` });
    }
  };

  const slide = slides[index];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#fbf0d4] p-4 shadow-2xl ring-1 ring-[#e8d3a0] sm:p-8 md:p-12">
      <Star className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rotate-12 text-[#8e1b1b] sm:h-32 sm:w-32" />
      <Star className="pointer-events-none absolute -bottom-8 -right-6 h-28 w-28 -rotate-6 text-[#8e1b1b] sm:h-40 sm:w-40" />

      <div className="relative mx-auto max-w-2xl text-center">
        <p className="font-display text-2xl italic leading-snug text-[#8e1b1b] sm:text-3xl">{info.headline}</p>
        <p className="mt-3 text-sm leading-relaxed text-dusty-rose sm:text-base">{info.description}</p>
      </div>

      {/* Spread viewer */}
      <div className="relative mx-auto mt-6 max-w-5xl sm:mt-8">
        <div
          className="group relative overflow-hidden rounded-2xl bg-[#fdf6e3] shadow-[0_18px_40px_-18px_rgba(110,40,20,0.45)] ring-1 ring-[#e8d3a0]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button type="button" onClick={() => setZoomed(true)} className="block w-full cursor-zoom-in" aria-label={`Enlarge ${slide.caption}`}>
            <img src={slide.src} alt={slide.caption} width={1920} height={1080} className="block aspect-video w-full object-cover" />
          </button>
          <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-medium text-[#8e1b1b] shadow">
            <Maximize2 className="h-3 w-3" /> Tap to zoom
          </span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous spread" className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#8e1b1b] shadow sm:left-3 sm:h-11 sm:w-11">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next spread" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#8e1b1b] shadow sm:right-3 sm:h-11 sm:w-11">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-[#8e1b1b]" aria-live="polite">{slide.caption}</p>
          <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-dusty-rose">{index + 1} of {slides.length}</p>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show spread ${i + 1}`}
              aria-current={i === index}
              className={`shrink-0 overflow-hidden rounded-lg ring-2 transition ${i === index ? "ring-[#8e1b1b]" : "ring-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={s.thumb} alt="" width={400} height={225} loading="lazy" className="block h-12 w-20 object-cover sm:h-16 sm:w-28" />
            </button>
          ))}
        </div>
      </div>

      {/* Included keepsakes */}
      <div className="relative mx-auto mt-10 max-w-5xl">
        <h3 className="text-center font-display text-2xl text-[#8e1b1b] sm:text-3xl">Included in your combo</h3>
        <p className="mt-1 text-center text-xs text-dusty-rose">Pre-selected &amp; included with your sticker book — no manual selection needed!</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-5">
          {STICKER_BOOK_INCLUDED.map((inc) => {
            const image = SITE.productImages[inc.image]?.[0];
            return (
              <div key={inc.name} className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-[#e8d3a0] sm:flex-col sm:p-4 sm:text-center">
                <div className="grid h-20 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#fdf6e3] sm:h-36 sm:w-full">
                  {image && <img src={image} alt={inc.name} loading="lazy" className="h-full w-full object-contain p-1" />}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight text-[#8e1b1b]">{inc.name}</p>
                  <p className="mt-1 text-xs text-neutral-600">{inc.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="relative mx-auto mt-10 max-w-2xl text-center">
        <h3 className="font-display text-2xl text-[#8e1b1b]">How it works ♡</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">{info.howItWorks}</p>
        <p className="mt-3 font-display text-lg italic text-blush-rose">{info.tagline}</p>
      </div>

      {/* Coupon + add to cart */}
      <div className="relative mx-auto mt-8 max-w-xl">
        {coupon && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-200 via-amber-100 to-pink-200 p-4 text-center shadow ring-1 ring-amber-300 sm:flex-row sm:text-left">
            <p className="flex-1 text-sm font-semibold text-[#8e1b1b]">
              Use code <span className="font-mono tracking-wider">{info.couponCode}</span> to get it for just {fmt(discounted)}!
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[#8e1b1b] bg-white/90 px-4 py-2 text-xs font-semibold text-[#8e1b1b]"
            >
              {copied ? <><Check className="h-3.5 w-3.5" /> Copied! Paste at checkout</> : <><Copy className="h-3.5 w-3.5" /> Copy code {info.couponCode}</>}
            </button>
          </div>
        )}

        <button type="button" onClick={toggleCart} className={`pill-btn pill-btn-hover mt-4 w-full !py-4 !text-base ${line ? "" : "pill-primary"}`}>
          {line ? (
            <><Check className="h-5 w-5" /> In your cart — tap to remove</>
          ) : (
            <><ShoppingBag className="h-5 w-5" /> Add Love Sticker Book to Cart — {fmt(couponApplied ? discounted : product.price)}</>
          )}
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-dusty-rose">
          <Truck className="h-3.5 w-3.5" /> Free standard delivery
          <Heart className="h-3 w-3 fill-blush-rose text-blush-rose" />
          {couponApplied && <span className="text-green-700">· {info.couponCode} applied</span>}
        </p>
      </div>

      {zoomed && <SpreadLightbox index={index} onIndex={setIndex} onClose={() => setZoomed(false)} />}
    </div>
  );
}

function SpreadLightbox({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const go = (delta: number) => onIndex((index + delta + slides.length) % slides.length);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % slides.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + slides.length) % slides.length);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onIndex, onClose]);

  const slide = slides[index];
  return (
    <ModalShell onClose={onClose} maxW="max-w-6xl">
      <div className="relative mt-6">
        <img src={slide.src} alt={slide.caption} width={1920} height={1080} className="block w-full rounded-xl" />
        <button type="button" onClick={() => go(-1)} aria-label="Previous spread" className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#8e1b1b] shadow">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next spread" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#8e1b1b] shadow">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-rose-wine">{slide.caption} · {index + 1} of {slides.length}</p>
    </ModalShell>
  );
}
