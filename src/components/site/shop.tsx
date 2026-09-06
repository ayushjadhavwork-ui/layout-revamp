import { useEffect, useState } from "react";
import { X, ShoppingBag, Trash2, Plus, Check, ArrowUpRight, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";;
import { toast } from "sonner";
import { CATALOG, CONFIG, fmt, comboRealTotal, COUPON_FREEBIES, type Category, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { validateCoupon, logCart, completeOrder } from "@/lib/gas";
import { SITE } from "@/lib/site-content";
import { createPortal } from "react-dom";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";

/* ================================================================ */
/* PRODUCT GRID + CARD                       */
/* ================================================================ */

export function ProductGrid({
  category,
  items,
  onOpen,
  cols,
}: {
  category: Category;
  items: Product[];
  onOpen: (item: Product) => void;
  cols?: string;
}) {
  const cart = useStore((s) => s.cart);
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const templateLimit = useStore((s) => s.templateLimit());
  
  // Bring in the store actions so we can trigger them directly from the card
  const setSize = useStore((s) => s.setSize);
  const toggleTemplate = useStore((s) => s.toggleTemplate);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  return (
    <div className={`grid gap-4 ${cols ?? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>

      {items.map((item) => {
        // Check current states
        const cartItem = cart.find((c) => c.category === category && c.id === item.id);
        const inCart = !!cartItem;
        const isSize = category === "sizes";
        const isTemplate = category === "templates";
        
        const templateSelected = isTemplate && selectedTemplateIds.includes(item.id);
        const templateDisabled = isTemplate && (!selectedSizeId || (selectedTemplateIds.length >= templateLimit && !templateSelected));
        const sizeSelected = isSize && selectedSizeId === item.id;
        
        const active = templateSelected || sizeSelected || (inCart && !isTemplate && !isSize);

        // The new toggle logic directly on the card
        const handleToggle = () => {
          if (templateDisabled && !templateSelected) {
            if (!selectedSizeId) toast.error("Pick a page package first.");
            else toast.error(`You can only pick ${templateLimit} template(s) for this package.`);
            return;
          }

          if (isSize) {
            if (sizeSelected && cartItem) {
              removeItem(cartItem.key);
              toast.success(`${item.name} deselected`);
            } else {
              setSize(item.id);
              toast.success(`${item.name} selected`);
            }
          } else if (isTemplate) {
            toggleTemplate(item.id);
          } else {
            if (inCart && cartItem) {
              removeItem(cartItem.key);
              toast.success(`${item.name} removed`);
            } else {
              addItem(category, item, "");
              toast.success(`${item.name} added`);
            }
          }
        };

        return (
          <div
            key={item.id}
            onClick={handleToggle}
            className={`step-card group relative flex flex-col overflow-hidden transition cursor-pointer select-none ${
              active ? "ring-2 ring-rose-wine bg-rose-wine/5" : ""
            } ${templateDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {/* NEW LOGIC: Check if this item has images in site-content.ts */}
            {/* Delivery options have no imagery — skip the thumbnail entirely. */}
            {category !== "delivery" && (() => {
              const photos = SITE.productImages?.[item.id] ?? [];
              const thumb = photos[0];

              return (
                <div
                  onClick={(e) => { e.stopPropagation(); onOpen(item); }}
                  className="group/thumb mb-3 flex h-48 w-full relative items-center justify-center rounded-xl bg-white border border-rose-wine/10 font-display text-4xl text-rose-wine overflow-hidden cursor-zoom-in"
                >

                  {thumb ? (
                    <img
                      src={thumb}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                  ) : (
                    item.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "✦"
                  )}
                  <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[0.65rem] font-medium text-rose-wine opacity-0 shadow-sm transition group-hover/thumb:opacity-100">
                    View full image
                  </span>
                </div>
            );
            })()}
            <h4 className="font-display text-xl text-rose-wine">{item.name}</h4>
            <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{item.desc}</p>
            <p className="mt-2 text-sm font-semibold text-blush-rose">
              {isTemplate ? "Included" : item.price ? fmt(item.price) : "Free"}
            </p>

            {/* Click stopPropagation prevents triggering handleToggle twice when clicking buttons */}
            <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleToggle}
                className={`pill-btn !py-2 !px-3 !text-xs flex-1 min-w-0 transition-all ${
                  active
                    ? "!bg-rose-wine !text-white !border-rose-wine shadow-md"
                    : "pill-btn-hover"
                }`}
                type="button"
              >
                {active ? (
                  <span className="flex min-w-0 items-center justify-center gap-1">
                    <Check className="h-3 w-3 shrink-0" /> <span className="truncate">Selected</span>
                  </span>
                ) : (
                  "Select"
                )}
              </button>

              {/* View More always visible for shoppable items; templates/sizes only when active.
                  Delivery options have no imagery or reviews, so no View More. */}
              {category !== "delivery" && (active || (!isSize && !isTemplate)) && (
                <button
                  onClick={() => onOpen(item)}
                  className="pill-btn pill-btn-hover !py-2 !px-3 !text-xs shrink-0"
                  type="button"
                >
                  View More
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================ */
/*                         PRODUCT MODAL                            */
/* ================================================================ */

export function ProductModal({
  open,
  category,
  product,
  onClose,
}: {
  open: boolean;
  category: Category | null;
  product: Product | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [slide, setSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const {
    reviews, loading: loadingReviews, posting, avg: avgRating, reviewerId,
    rvName, setRvName, rvText, setRvText, rvRating, setRvRating,
    submitReview: handleSubmitReview, deleteReview: handleDeleteReview,
  } = useProductReviews(product?.id ?? null);

  const setSize = useStore((s) => s.setSize);
  const toggleTemplate = useStore((s) => s.toggleTemplate);
  const addItem = useStore((s) => s.addItem);
  const templateLimit = useStore((s) => s.templateLimit());
  const selectedSizeId = useStore((s) => s.selectedSizeId);

  useEffect(() => {
    if (open && product) {
      setNote("");
      setSlide(0);
      setLightboxOpen(false);
    }
  }, [open, product?.id]);

  if (!open || !product || !category) return null;

  const isSize = category === "sizes";
  const isTemplate = category === "templates";

  const initials = product.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "✦";
  const gradients = [
    "from-pink-mist to-blush-rose",
    "from-blush-rose to-rose-wine",
    "from-dusty-rose to-pink-mist",
  ];
  const photos: string[] = SITE.productImages?.[product.id] ?? [];
  const slideCount = photos.length > 0 ? photos.length : gradients.length;
  const currentSlide = slide % slideCount;
  const goPrev = () => setSlide((currentSlide - 1 + slideCount) % slideCount);
  const goNext = () => setSlide((currentSlide + 1) % slideCount);

  const handleAdd = () => {
    if (isSize) {
      setSize(product.id);
      toast.success(`${product.name} selected — pick ${product.templateLimit} template(s).`);
    } else if (isTemplate) {
      if (!selectedSizeId) return toast.error("Pick a page package first.");
      const ok = toggleTemplate(product.id);
      if (!ok) return toast.error(`You can only pick ${templateLimit} template(s) for this package.`);
      toast.success(`${product.name} toggled.`);
    } else {
      addItem(category, product, note);
      toast.success(`${product.name} added to cart.`);
    }
    onClose();
  };



  return (
    <>
      <ModalShell onClose={onClose} maxW="max-w-6xl">
        <div className="grid gap-8 md:grid-cols-12">

          {/* ================= GALLERY ================= */}
          <div className="md:col-span-7">
            <div className="flex gap-3">
              {/* Vertical thumbnail rail — desktop, Amazon-style */}
              {slideCount > 1 && (
                <div className="hidden sm:flex flex-col gap-2 w-20 shrink-0 max-h-[440px] overflow-y-auto pr-0.5">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlide(i)}
                      className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                        i === currentSlide ? "border-rose-wine" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {photos.length > 0 ? (
                        <img src={photos[i]} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className={`h-full w-full grid place-items-center bg-gradient-to-br ${gradients[i]} font-display text-white text-sm`}>
                          {initials}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Main image — white background (not pink), click opens lightbox */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group relative flex-1 h-[420px] md:h-[500px] rounded-2xl overflow-hidden bg-white border border-rose-wine/10 cursor-zoom-in"
              >
                {photos.length > 0 ? (
                  <img
                    src={photos[currentSlide]}
                    alt={product.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-contain p-3"
                  />
                ) : (
                  <div className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradients[currentSlide]} font-display text-7xl text-white`}>
                    {initials}
                  </div>
                )}

                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-rose-wine opacity-0 shadow-sm transition group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" /> View full image
                </span>

                {slideCount > 1 && (
                  <>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); goPrev(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-rose-wine hover:bg-white z-10"
                      aria-label="Previous image"
                    ><ChevronLeft className="h-5 w-5" /></span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); goNext(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-rose-wine hover:bg-white z-10"
                      aria-label="Next image"
                    ><ChevronRight className="h-5 w-5" /></span>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 sm:hidden">
                      {Array.from({ length: slideCount }).map((_, i) => (
                        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === currentSlide ? "bg-rose-wine" : "bg-rose-wine/30"}`} />
                      ))}
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Mobile thumbnail row (below image, since no side rail on small screens) */}
            {slideCount > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
                {Array.from({ length: slideCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlide(i)}
                    className={`h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 ${
                      i === currentSlide ? "border-rose-wine" : "border-transparent opacity-70"
                    }`}
                  >
                    {photos.length > 0 ? (
                      <img src={photos[i]} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full grid place-items-center bg-gradient-to-br ${gradients[i]} font-display text-white text-sm`}>{initials}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= DETAILS ================= */}
          <div className="md:col-span-5 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">{category}</p>
            <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{product.name}</h3>

            {category !== "delivery" && <ReviewStars avg={avgRating} count={reviews.length} />}

            <p className="mt-4 text-3xl font-semibold text-blush-rose">
              {isTemplate ? "Included with package" : product.price ? fmt(product.price) : "Free"}
            </p>

            <div className="mt-4 h-px bg-rose-wine/10" />

            <p className="mt-4 text-sm leading-relaxed text-neutral-700">{product.desc}</p>

            {!isSize && !isTemplate && (
              <>
                <label className="mt-5 block text-sm font-medium text-rose-wine">Note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 p-3 text-sm outline-none focus:border-rose-wine"
                  maxLength={300}
                  placeholder="Anything we should know?"
                />
              </>
            )}

            <button onClick={handleAdd} className="pill-btn pill-btn-hover pill-primary mt-6 w-full !py-3 !text-base">
              {isSize ? "Select package" : isTemplate ? "Select" : "Add to cart"}
            </button>
          </div>
        </div>

        {/* Delivery options are not reviewable */}
        {category !== "delivery" && (
          <ReviewsPanel
            reviews={reviews} loading={loadingReviews} posting={posting} reviewerId={reviewerId}
            rvName={rvName} setRvName={setRvName} rvText={rvText} setRvText={setRvText}
            rvRating={rvRating} setRvRating={setRvRating}
            onSubmit={handleSubmitReview} onDelete={handleDeleteReview}
          />
        )}
      </ModalShell>

{/* ================= FULLSCREEN LIGHTBOX ================= */}
      {lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 z-10"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {slideCount > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
                aria-label="Previous image"
              ><ChevronLeft className="h-6 w-6" /></button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
                aria-label="Next image"
              ><ChevronRight className="h-6 w-6" /></button>
            </>
          )}

          {photos.length > 0 ? (
            <img
              src={photos[currentSlide]}
              alt={product.name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            />
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`h-72 w-72 grid place-items-center rounded-2xl bg-gradient-to-br ${gradients[currentSlide]} font-display text-8xl text-white`}
            >
              {initials}
            </div>
          )}

          {slideCount > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {Array.from({ length: slideCount }).map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === currentSlide ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

/* ================================================================ */
/*                          CART DRAWER                             */
/* ================================================================ */

// Shared promo-code entry point — used in the cart drawer AND surfaced again
// during checkout (customer info + payment steps), since a customer who
// clicks "Complete my order" without ever opening the cart drawer would
// otherwise never see anywhere to apply a coupon.
export function PromoCodeBox() {
  const coupon = useStore((s) => s.coupon);
  const setCoupon = useStore((s) => s.setCoupon);
  const applyCouponFreebie = useStore((s) => s.applyCouponFreebie);

  const [promo, setPromo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const applyPromo = async () => {
    if (!promo.trim()) return;
    setChecking(true);
    setMsg(null);
    try {
      const res = await validateCoupon(promo);
      const code = promo.trim().toUpperCase();
      if (res.valid) {
        setCoupon({ code, percent: res.percent || 0 });
        const freebieId = COUPON_FREEBIES[code];
        if (freebieId) {
          applyCouponFreebie(code);
          const product = CATALOG.promotions.find((p) => p.id === freebieId);
          setMsg(`Coupon applied — ${product?.name ?? "free gift"} added to cart 🎁`);
          toast.success(`${product?.name ?? "Free gift"} added to your cart`);
        } else {
          setMsg(`Coupon applied — ${res.percent}% off`);
          toast.success(`${res.percent}% off applied`);
        }
      } else {
        setCoupon(null);
        setMsg(res.message || "Invalid code");
      }
    } catch {
      setMsg("Could not validate — try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          placeholder="Promo code"
          className="flex-1 rounded-full border border-rose-wine/20 bg-white/60 px-4 py-2 text-sm outline-none focus:border-rose-wine"
        />
        <button type="button" onClick={applyPromo} disabled={checking} className="pill-btn pill-btn-hover">
          {checking ? "…" : "Apply"}
        </button>
      </div>
      {msg ? (
        <p className={`mt-2 text-xs ${coupon ? "text-green-700" : "text-rose-wine"}`}>{msg}</p>
      ) : coupon ? (
        <p className="mt-2 text-xs text-green-700">Code "{coupon.code}" applied — {coupon.percent}% off.</p>
      ) : null}
    </div>
  );
}

export function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const cart = useStore((s) => s.cart);
  const removeItem = useStore((s) => s.removeItem);
  const deselectCombo = useStore((s) => s.deselectCombo);
  const subtotal = useStore((s) => s.subtotal());
  const discount = useStore((s) => s.discount());
  const total = useStore((s) => s.total());
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const templateLimit = useStore((s) => s.templateLimit());
  const pocketUnits = useStore((s) => s.pocketUnits);
  const pocketTemplateLimit = useStore((s) => s.pocketTemplateLimit());
  const selectedFriendshipId = useStore((s) => s.selectedFriendshipId);
  const selectedFriendshipDesignIds = useStore((s) => s.selectedFriendshipDesignIds);
  const friendshipDesignLimit = useStore((s) => s.friendshipDesignLimit());
  const minOrder = SITE.commerce.minOrderValue;
  const belowMin = cart.length > 0 && total < minOrder;
  const templatesIncomplete = !!selectedSizeId && selectedTemplateIds.length < templateLimit;
  const pocketTemplatesIncomplete = pocketUnits.some((u) => u.templateIds.length < pocketTemplateLimit);
  const friendshipDesignsIncomplete =
    !!selectedFriendshipId && selectedFriendshipDesignIds.length < friendshipDesignLimit;
  // Delivery is no longer gated here — it's chosen either on-page (Step 6)
  // or inside the checkout popup (CustomerInfoModal), which blocks moving
  // on to payment until it's picked. Gating it a second time here would
  // just disable this button with no way to fix it from this drawer.
  // Numbered the same way templates are ("[1, 2, 3]" in CartSummaryPanel) —
  // extract the design's number from its id (card-1 -> "01") rather than
  // joining full names, so this subtext line matches the templates format.
  const friendshipDesignNumbers = cart
    .filter((c) => c.category === "friendship-designs")
    .map((c) => {
      const m = c.id.match(/card-(\d+)/);
      return m ? m[1].padStart(2, "0") : c.id;
    });

  const activeCombo = cart.find((c) => c.category === "combos");
  const comboOriginal = activeCombo ? comboRealTotal(activeCombo.id) : 0;
  const comboSavings = activeCombo ? Math.max(0, comboOriginal - activeCombo.price) : 0;

  const promoItems = cart.filter((c) => c.category === "promotions");
  // Friendship Card design picks are zero-cost sub-selections of the
  // "friendship" row (same relationship templates have to a magazine's
  // "sizes" row) — fold them into a note under that row (below) instead of
  // letting them leak through as their own bare ₹0.00-ish rows.
  const mainItems = cart.filter((c) => c.category !== "promotions" && c.category !== "friendship-designs");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-rose-wine/25 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col p-4 animate-[slideInRight_.3s_ease-out]">
        <style>{`@keyframes slideInRight{from{transform:translateX(100%);}to{transform:translateX(0);}}`}</style>
        <div className="glass flex h-full flex-col rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-3xl text-rose-wine">Your cart</h3>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-rose-wine/10" aria-label="Close">
              <X className="h-5 w-5 text-rose-wine" />
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {cart.length === 0 && <p className="text-center text-dusty-rose py-10">Your cart is empty.</p>}

            {cart.length > 0 && <CartSummaryPanel />}

            {mainItems.map((item) => (
              <div key={item.key} className="flex items-start gap-3 rounded-2xl bg-white/50 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-mist to-blush-rose font-display text-white">
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-rose-wine">{item.name}</p>
                  <p className="text-xs uppercase tracking-wider text-dusty-rose">
                    {item.category}{item.comboId ? " · in combo" : ""}
                  </p>
                  {item.category === "friendship" && friendshipDesignNumbers.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-600">
                      Design: [{friendshipDesignNumbers.join(", ")}]
                    </p>
                  )}
                  {item.note && <p className="mt-1 text-xs text-neutral-600 italic">"{item.note}"</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blush-rose">{item.price ? fmt(item.price) : "—"}</p>
                  {item.comboId ? (
                    <span className="mt-1 block text-[0.65rem] text-dusty-rose">included</span>
                  ) : (
                    <button
                      onClick={() => (item.category === "combos" ? deselectCombo(item.id) : removeItem(item.key))}
                      className="mt-1 text-neutral-400 hover:text-rose-wine"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {promoItems.length > 0 && (
              <div className="rounded-2xl bg-blush-rose/10 p-3 ring-1 ring-blush-rose/20">
                <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-blush-rose">
                  🎁 Promotions
                </p>
                <div className="space-y-2">
                  {promoItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-rose-wine">{item.name}</p>
                        <p className="text-[0.65rem] text-dusty-rose">redeemed with {item.promoCode}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-blush-rose">Free</span>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="text-neutral-400 hover:text-rose-wine"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/60 pt-4 text-sm">
            {activeCombo && comboSavings > 0 && (
              <div className="flex justify-between text-xs text-dusty-rose">
                <span>{activeCombo.name} value</span>
                <span className="line-through">{fmt(comboOriginal)}</span>
              </div>
            )}
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <PromoCodeBox />
            <div className="flex justify-between"><span>Discount</span><span>−{fmt(discount)}</span></div>
            <DeliveryEta />
            <div className="flex justify-between border-t border-white/60 pt-2 text-lg font-semibold">
              <span>Total</span><span className="text-blush-rose">{fmt(total)}</span>
            </div>
            {belowMin && (
              <p className="text-center text-xs text-rose-wine">
                Add {fmt(minOrder - total)} more to reach the {fmt(minOrder)} minimum order value.
              </p>
            )}
            {templatesIncomplete && (
              <p className="text-center text-xs text-rose-wine">
                Select {templateLimit - selectedTemplateIds.length} more template{templateLimit - selectedTemplateIds.length === 1 ? "" : "s"} for your magazine ({selectedTemplateIds.length}/{templateLimit} picked) before checking out.
              </p>
            )}
            {pocketTemplatesIncomplete && (
              <p className="text-center text-xs text-rose-wine">
                Finish picking templates for every Pocket Magazine in your cart before checking out.
              </p>
            )}
            {friendshipDesignsIncomplete && (
              <p className="text-center text-xs text-rose-wine">
                Select {friendshipDesignLimit - selectedFriendshipDesignIds.length} more Friendship Card design{friendshipDesignLimit - selectedFriendshipDesignIds.length === 1 ? "" : "s"} ({selectedFriendshipDesignIds.length}/{friendshipDesignLimit} picked) before checking out.
              </p>
            )}
          </div>

          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || belowMin || templatesIncomplete || pocketTemplatesIncomplete || friendshipDesignsIncomplete}
            className="pill-btn pill-btn-hover pill-primary mt-5 w-full disabled:opacity-50"
          >
            Checkout <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

/* ================================================================ */
/*                       CUSTOMER INFO MODAL                        */
/* ================================================================ */

export function CustomerInfoModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const setCustomer = useStore((s) => s.setCustomer);
  const setCartId = useStore((s) => s.setCartId);
  const customer = useStore((s) => s.customer);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const subtotal = useStore((s) => s.subtotal());
  const discount = useStore((s) => s.discount());
  const total = useStore((s) => s.total());
  const [submitting, setSubmitting] = useState(false);

  const deliveryItem = cart.find((c) => c.category === "delivery");

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deliveryItem) return toast.error("Choose a delivery option first.");
    const fd = new FormData(e.currentTarget);
    const info = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      pincode: String(fd.get("pincode") || "").trim(),
    };
    if (!info.name || !info.phone || !info.email || !info.address || !info.pincode)
      return toast.error("Fill all fields");
    if (!/^\d{6}$/.test(info.pincode)) return toast.error("Enter a valid 6-digit pincode");

    setSubmitting(true);
    setCustomer(info);
    try {
      const cartId = `TL-${Date.now().toString(36).toUpperCase()}`;
      setCartId(cartId);
      await logCart({ cartId, customer: info, cart, total, ts: new Date().toISOString() });
      onSubmit();
    } catch {
      toast.error("Could not save details — continuing anyway.");
      onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell onClose={onClose} maxW="max-w-lg">
      <h3 className="font-display text-3xl text-rose-wine">A few details first</h3>
      <p className="mt-1 text-sm text-dusty-rose">We need this to process and ship your order.</p>

      <div className="mt-4 rounded-xl bg-white/60 p-3 ring-1 ring-rose-wine/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-wine mb-2">Have a promo code?</p>
        <PromoCodeBox />
        <div className="mt-3 space-y-1 border-t border-rose-wine/10 pt-2 text-sm">
          <div className="flex justify-between text-dusty-rose"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-dusty-rose"><span>Discount</span><span>−{fmt(discount)}</span></div>}
          <div className="flex justify-between font-semibold text-rose-wine"><span>Total</span><span>{fmt(total)}</span></div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-wine mb-2">Choose delivery</p>
        <div className="grid grid-cols-2 gap-2">
          {CATALOG.delivery.map((d) => {
            const active = deliveryItem?.id === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => addItem("delivery", d)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-rose-wine bg-rose-wine/10"
                    : "border-rose-wine/20 bg-white/60 hover:border-rose-wine/40"
                }`}
              >
                <p className="flex items-center gap-1.5 text-sm font-medium text-rose-wine">
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />} {d.name}
                </p>
                <p className="text-xs text-dusty-rose">{d.price ? fmt(d.price) : "Free"}</p>
              </button>
            );
          })}
        </div>
        {!deliveryItem && (
          <p className="mt-2 text-xs text-rose-wine">Select a delivery option to continue.</p>
        )}
      </div>

      <form onSubmit={handle} className="mt-5 space-y-3">
        <Field label="Full name" name="name" required maxLength={100} defaultValue={customer?.name} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" name="phone" type="tel" required maxLength={20} defaultValue={customer?.phone} />
          <Field label="Email" name="email" type="email" required maxLength={200} defaultValue={customer?.email} />
        </div>
        <Field label="Shipping address" name="address" as="textarea" rows={3} required maxLength={400} defaultValue={customer?.address} />
        <button disabled={submitting || !deliveryItem} className="pill-btn pill-btn-hover pill-primary w-full mt-2 disabled:opacity-50" type="submit">
          {submitting ? "Saving…" : "Continue to payment"}
        </button>
      </form>
    </ModalShell>
  );
}

/* ================================================================ */
/*                        PAYMENT MODAL                             */
/* ================================================================ */

// A phone photo of a payment screenshot can be 15-20MB, which becomes
// ~27MB of base64 JSON with no upper bound — slow/failed on mobile data and
// large enough to risk hitting Apps Script's request-size limits. Redraw it
// through a canvas at a capped resolution, stepping quality (then size) down
// until the resulting JPEG data URL fits under the target.
const SCREENSHOT_MAX_BYTES = 1.5 * 1024 * 1024;
const SCREENSHOT_MAX_DIM = 1600;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function downscaleScreenshot(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return fileToDataUrl(file); // fall back to the original rather than block checkout
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return fileToDataUrl(file);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (width > SCREENSHOT_MAX_DIM || height > SCREENSHOT_MAX_DIM) {
    const scale = SCREENSHOT_MAX_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  let quality = 0.9;
  let dataUrl = "";
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    // Base64 runs ~4/3 the size of the decoded bytes.
    const approxBytes = (dataUrl.length * 3) / 4;
    if (approxBytes <= SCREENSHOT_MAX_BYTES) return dataUrl;
    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
    }
  }
  return dataUrl; // best effort after the attempt budget — still far smaller than the original
}

export function PaymentModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (orderId: string) => void;
}) {
  const total = useStore((s) => s.total());
  const cart = useStore((s) => s.cart);
  const customer = useStore((s) => s.customer);
  const cartId = useStore((s) => s.cartId);
  const coupon = useStore((s) => s.coupon);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  if (!open) return null;

  const upiLink = `upi://pay?pa=${encodeURIComponent(CONFIG.UPI_ID)}&pn=${encodeURIComponent(CONFIG.PAYEE)}&am=${total}&cu=INR&tn=${encodeURIComponent(cartId || "TheLayout")}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`;

  const submit = async () => {
    if (!file) return toast.error("Upload payment screenshot first.");
    setSubmitting(true);
    setLastError(null);
    try {
      const dataUrl = await downscaleScreenshot(file);
      const orderId = cartId || `TL-${Date.now().toString(36).toUpperCase()}`;
      await completeOrder({
        orderId, cartId, customer, cart, total,
        coupon: coupon?.code || null,
        screenshotName: file.name.replace(/\.\w+$/, "") + ".jpg",
        screenshot: dataUrl,
        ts: new Date().toISOString(),
      });
      onDone(orderId);
    } catch (err) {
      const message = err instanceof Error && err.message
        ? "Order could not be submitted — " + err.message + ". Your details are saved; tap Retry."
        : "Order could not be submitted. Your details are saved; tap Retry.";
      setLastError(message);
      toast.error("Order could not be submitted. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-lg">
      <h3 className="font-display text-3xl text-rose-wine">Complete payment</h3>
      <p className="mt-1 text-sm text-neutral-700">Scan the UPI QR, then upload your payment screenshot.</p>

      <div className="mt-4 rounded-xl bg-white/60 p-3 ring-1 ring-rose-wine/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-wine mb-2">Have a promo code?</p>
        <PromoCodeBox />
      </div>

      <div className="mt-5 flex flex-col items-center">
        <img src={qr} alt="UPI QR" className="h-56 w-56 rounded-2xl bg-white p-3 shadow-lg" />
        <p className="mt-3">Pay <span className="font-semibold text-blush-rose">{fmt(total)}</span> to <span className="font-medium">{CONFIG.UPI_ID}</span></p>
      </div>
      <label className="mt-5 block text-sm font-medium text-rose-wine">Payment screenshot</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => { setFile(e.target.files?.[0] || null); setLastError(null); }}
        className="mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-rose-wine file:px-4 file:py-1.5 file:text-white"
      />
      {lastError && <p className="mt-2 text-xs text-rose-wine">{lastError}</p>}
      <button onClick={submit} disabled={submitting || !file} className="pill-btn pill-btn-hover pill-primary w-full mt-5 disabled:opacity-50">
        {submitting ? "Submitting…" : lastError ? "Retry" : "Complete order"}
      </button>
    </ModalShell>
  );
}

/* ================================================================ */
/*                        SUCCESS MODAL                             */
/* ================================================================ */

export function SuccessModal({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string | null }) {
  if (!open) return null;
  return (
    <ModalShell onClose={onClose} maxW="max-w-md">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blush-rose to-rose-wine text-white">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="font-display text-4xl text-rose-wine mt-4">Thank you 🌸</h3>
        <p className="mt-2 text-neutral-700">Your order has been placed. We'll be in touch shortly.</p>
        {orderId && <p className="mt-2 text-xs text-dusty-rose">Order ID: {orderId}</p>}
        <button onClick={onClose} className="pill-btn pill-btn-hover pill-primary mt-5">Close</button>
      </div>
    </ModalShell>
  );
}

/* ================================================================ */
/*                            SHARED                                */
/* ================================================================ */

export function ModalShell({ children, onClose, maxW = "max-w-2xl" }: { children: React.ReactNode; onClose: () => void; maxW?: string }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-rose-wine/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`glass relative z-10 w-full ${maxW} rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto overscroll-contain`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-rose-wine shadow-md ring-1 ring-rose-wine/10 hover:bg-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function Field({
  label, name, type = "text", as = "input", rows, required, maxLength, defaultValue,
}: {
  label: string; name: string; type?: string; as?: "input" | "textarea"; rows?: number; required?: boolean; maxLength?: number; defaultValue?: string;
}) {
  const cls = "mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 px-4 py-2.5 text-sm outline-none focus:border-rose-wine transition-colors";
  return (
    <div>
      <label className="text-sm font-medium text-rose-wine">{label}</label>
      {as === "textarea" ? (
        <textarea name={name} rows={rows} required={required} maxLength={maxLength} defaultValue={defaultValue} className={cls} />
      ) : (
        <input name={name} type={type} required={required} maxLength={maxLength} defaultValue={defaultValue} className={cls} />
      )}
    </div>
  );
}

export function CartButton({ onOpen }: { onOpen: () => void }) {
  const count = useStore((s) => s.cart.length);
  return (
    <button onClick={onOpen} className="pill-btn pill-btn-hover relative shrink-0">
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-wine px-1.5 text-xs font-semibold text-white">
        {count}
      </span>
    </button>
  );
}

export function StepIndicator() {
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const limit = useStore((s) => s.templateLimit());

  if (!selectedSizeId) return (
    <p className="text-center text-sm text-dusty-rose mb-6">
      <Plus className="inline h-4 w-4 -mt-0.5" /> Pick a page package above to unlock templates.
    </p>
  );
  return (
    <div className="mb-6 space-y-1 text-center text-sm text-rose-wine">
      <p><Check className="inline h-4 w-4 -mt-0.5" /> Package selected — templates chosen {selectedTemplateIds.length}/{limit}</p>
    </div>
  );
}

/* ================================================================ */
/*                CART SUMMARY PANEL + DELIVERY ETA                 */
/* ================================================================ */

function CartSummaryPanel() {
  const cart = useStore((s) => s.cart);
  const selectedSizeId = useStore((s) => s.selectedSizeId);

  const sizeItem = CATALOG.sizes.find((s) => s.id === selectedSizeId);
  const templates = cart.filter((c) => c.category === "templates").map((c) => {
    const m = c.id.match(/tpl-(\d+)/);
    return m ? Number(m[1]) : c.id;
  });
  const pocketItems = cart.filter((c) => c.category === "pocket");
  const pocketTemplatesFor = (unit?: string) =>
    cart
      .filter((c) => c.category === "pocket-templates" && c.unit === unit)
      .map((c) => {
        const m = c.id.match(/tpl-(\d+)/);
        return m ? Number(m[1]) : c.id;
      });
  const addons = cart.filter((c) => c.category === "addons").map((c) => c.name).join(", ") || "—";
  const polaroids = cart.filter((c) => c.category === "polaroids").map((c) => c.name).join(", ") || "—";
  const stripsItems = cart.filter((c) => c.category === "strips");
  const stripsSummary = stripsItems.length
    ? stripsItems.map((c) => c.name).join(", ")
    : "—";
  const stripCount = stripsItems.reduce((n, c) => {
    const m = c.name.match(/(\d+)/);
    return n + (m ? Number(m[1]) : 0);
  }, 0);

  return (
    <div className="rounded-2xl bg-white/60 p-4 border border-white/60">
      <p className="text-xs uppercase tracking-[0.25em] text-blush-rose mb-3">Order summary</p>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-semibold text-rose-wine uppercase tracking-wider mb-2">Magazine</p>
          <p className="text-neutral-700">
            <span className="text-dusty-rose">Pages:</span>{" "}
            {sizeItem ? sizeItem.name : "—"}
          </p>
          <p className="mt-1 text-neutral-700">
            <span className="text-dusty-rose">Templates:</span>{" "}
            {templates.length ? `[${templates.join(", ")}]` : "—"}
          </p>
        </div>
        <div>
          <p className="font-semibold text-rose-wine uppercase tracking-wider mb-2">Add-ons</p>
          <p className="text-neutral-700">
            <span className="text-dusty-rose">Gift Wrap & Letter:</span> {addons}
          </p>
          <p className="mt-1 text-neutral-700">
            <span className="text-dusty-rose">Polaroids:</span> {polaroids}
          </p>
          <p className="mt-1 text-neutral-700">
            <span className="text-dusty-rose">Polaroid Strips:</span>{" "}
            {stripCount ? `${stripCount} Strips — ${stripsSummary}` : "—"}
          </p>
        </div>
      </div>

      {pocketItems.map((item, i) => {
        const templates = pocketTemplatesFor(item.unit);
        return (
          <div key={item.key} className="mt-4 border-t border-white/60 pt-3 text-xs">
            <p className="font-semibold text-rose-wine uppercase tracking-wider mb-2">
              Pocket Magazine{pocketItems.length > 1 ? ` #${i + 1}` : ""}
            </p>
            <p className="text-neutral-700">
              <span className="text-dusty-rose">Pages:</span> 6 Pages (Pocket Size)
            </p>
            <p className="mt-1 text-neutral-700">
              <span className="text-dusty-rose">Templates:</span>{" "}
              {templates.length ? `[${templates.join(", ")}]` : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Formats a date as "15 Aug".
function etaLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function DeliveryEta() {
  const cart = useStore((s) => s.cart);
  const delivery = cart.find((c) => c.category === "delivery");
  const isExpress = delivery?.id === "del-exp";
  const range = isExpress
    ? { min: 3, max: 4, label: "Express Shipping" }
    : { min: 7, max: 8, label: "Standard Shipping" };

  // Estimated window = shipping range + a 3-day production/dispatch buffer.
  const BUFFER_DAYS = 3;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + range.min + BUFFER_DAYS);
  const end = new Date(now);
  end.setDate(end.getDate() + range.max + BUFFER_DAYS);

  return (
    <div className="rounded-xl bg-rose-wine/5 px-3 py-2 text-xs leading-relaxed text-rose-wine">
      {delivery ? (
        <>
          <span className="font-semibold">{range.label}</span> · Estimated delivery:{" "}
          <span className="font-semibold">{etaLabel(start)} – {etaLabel(end)}</span>{" "}
          ({range.min}–{range.max} days of shipping, plus a short window for your magazine to be
          finalised and dispatched).
        </>
      ) : (
        <>
          <span className="font-semibold">Delivery</span> · Choose a delivery option in Step 6 to see
          your estimated timeframe. Delivery days are counted after your magazine is completed by our
          team.
        </>
      )}
    </div>
  );
}

