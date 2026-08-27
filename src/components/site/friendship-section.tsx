import { useEffect, useRef, useState } from "react";
import { HeartHandshake, Check, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";
import { templateHero } from "./template-picker";

// A card-shaped placeholder for design thumbnails — deliberately not
// template-picker.tsx's TemplatePlaceholder, which draws a "Left | Right"
// two-page magazine spread rather than a single "Friendship Licence" card.
// Doubles as the fallback when a card_0N_front/back path is wired up in
// site-content.ts but the file itself is missing or fails to load (see the
// onError handlers below) — <img> has no built-in "file missing" signal,
// so without this a bad path just shows a broken-image icon.
function FriendshipDesignPlaceholder({ n }: { n: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-pink-mist/30 via-blush-rose/25 to-rose-wine/25 text-off-white">
      <HeartHandshake className="h-6 w-6 opacity-80" />
      <span className="font-display text-sm">Card {String(n).padStart(2, "0")}</span>
    </div>
  );
}

// What a customer can personalise — shown as static copy under the 3D
// viewer and again in each variant's modal. Not a step-2 picker like
// templates: these details are collected as free text via the Note field
// below, same as the Handwritten Letter add-on.
const CUSTOMISABLE = [
  "Names & friendship licence number",
  "Photo / photo placement",
  "Friendship date, place & funny details",
  "Mood, special rights, signatures & expiry",
  "Colours, text and overall layout direction",
];

/* ================================================================ */
/* 3D VIEWER — Google's <model-viewer> web component. It's loaded from     */
/* the vendored, self-contained build at /vendor/model-viewer.min.js via   */
/* a plain <script> tag rather than an ES import: that keeps the ~1MB      */
/* library (three.js included) entirely out of this app's JS module        */
/* graph, so it can never get pulled into the server/SSR bundle (it's      */
/* browser-only — registers a custom element, needs WebGL) and it only     */
/* fetches once the section actually scrolls near the viewport.            */
/*                                                                         */
/* public/vendor/model-viewer.min.js is copied as-is from                 */
/* node_modules/@google/model-viewer/dist/model-viewer.min.js (the        */
/* package is a devDependency purely to pin/update that source file — no  */
/* app code imports it). To update: bump the devDependency, re-copy the   */
/* dist file to the same vendor path, and strip its trailing              */
/* `//# sourceMappingURL=...` comment (no matching .map is shipped here). */
/* ================================================================ */
// model-viewer's built-in `auto-rotate` only turns the camera around the
// model's Y axis (a turntable) — there's no attribute for spinning the
// model itself. To get a Z-axis spin (the card twirling in the screen
// plane, like a badge, rather than tumbling front-to-back) we drive the
// model's own `orientation` attribute via rAF instead, leaving
// `camera-controls` alone so drag-to-rotate still works normally.
//
// Which axis reads as "in-plane" depends on how the GLB's own local axes
// are oriented — if a future model swap makes this spin look like it's
// tumbling instead of twirling, change ROTATION_AXIS below to "x" or "y".
const ROTATION_AXIS: "x" | "y" | "z" = "z";
const ROTATION_DEG_PER_SEC = 24;

let modelViewerLoad: Promise<void> | null = null;
function loadModelViewer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (!modelViewerLoad) {
    modelViewerLoad = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/vendor/model-viewer.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load 3D viewer"));
      document.head.appendChild(script);
    });
  }
  return modelViewerLoad;
}

function FriendshipModelViewer({ className = "" }: { className?: string }) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadModelViewer()
          .then(() => {
            if (!cancelled) setReady(true);
          })
          .catch(() => {}); // placeholder stays up — not fatal, just no 3D preview
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  // Continuously spins the model on ROTATION_AXIS by writing the
  // `orientation` attribute every frame — auto-rotate (camera-orbit around
  // Y) is deliberately left off so this doesn't fight with it, and drag
  // (camera-controls) keeps working since it only ever moves the camera.
  useEffect(() => {
    if (!ready) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    let raf = 0;
    let angle = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      angle = (angle + ROTATION_DEG_PER_SEC * dt) % 360;
      const parts = { x: "0deg", y: "0deg", z: "0deg" };
      parts[ROTATION_AXIS] = `${angle}deg`;
      viewer.setAttribute("orientation", `${parts.x} ${parts.y} ${parts.z}`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl bg-white border border-rose-wine/10 ${className}`}
    >
      {ready ? (
        <model-viewer
          ref={viewerRef}
          src={SITE.friendshipCardModel}
          alt="Interactive 3D preview of The Layout's Friendship Card"
          camera-controls
          interaction-prompt="none"
          environment-image="neutral"
          tone-mapping="neutral"
          shadow-intensity="1.1"
          shadow-softness="0.9"
          exposure="1.2"
          style={{ width: "100%", height: "100%", background: "transparent" }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-mist/30 via-blush-rose/25 to-rose-wine/25 text-off-white">
          <HeartHandshake className="h-8 w-8 opacity-80" />
          <span className="text-[0.65rem] uppercase tracking-[0.3em] opacity-80">
            Loading 3D preview…
          </span>
        </div>
      )}
    </div>
  );
}

/* ================================================================ */
/* SECTION                                                           */
/* ================================================================ */
export function FriendshipCardSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openDesignIdx, setOpenDesignIdx] = useState<number | null>(null);
  // Tracks design ids whose thumbnail 404'd (path wired up in
  // site-content.ts but no file dropped in yet) — see
  // FriendshipDesignPlaceholder's comment above.
  const [brokenDesignIds, setBrokenDesignIds] = useState<Set<string>>(new Set());
  const cart = useStore((s) => s.cart);
  const selectedFriendshipId = useStore((s) => s.selectedFriendshipId);
  const selectedFriendshipDesignIds = useStore((s) => s.selectedFriendshipDesignIds);
  const setFriendship = useStore((s) => s.setFriendship);
  const removeItem = useStore((s) => s.removeItem);
  const toggleFriendshipDesign = useStore((s) => s.toggleFriendshipDesign);
  const designLimit = useStore((s) => s.friendshipDesignLimit());

  const items = CATALOG.friendship;
  const designs = CATALOG["friendship-designs"];

  const handleToggleTier = (item: Product) => {
    const active = selectedFriendshipId === item.id;
    if (active) {
      const cartItem = cart.find((c) => c.category === "friendship" && c.id === item.id);
      if (cartItem) removeItem(cartItem.key);
      toast.success(`${item.name} deselected`);
      return;
    }
    const prevCount = selectedFriendshipDesignIds.length;
    const newLimit = item.designLimit ?? 1;
    setFriendship(item.id);
    toast.success(
      prevCount > newLimit
        ? `${item.name} selected — kept your first design, removed the rest to fit ${newLimit}.`
        : `${item.name} selected — pick ${newLimit} design${newLimit === 1 ? "" : "s"} below.`,
    );
  };

  const handleToggleDesign = (id: string, label: string) => {
    if (!selectedFriendshipId) return toast.error("Choose Single or Duo Card above first.");
    const already = selectedFriendshipDesignIds.includes(id);
    const ok = toggleFriendshipDesign(id);
    if (!ok)
      return toast.error(`You can only pick ${designLimit} design${designLimit === 1 ? "" : "s"} for this quantity.`);
    toast.success(already ? `${label} removed` : `${label} selected`);
  };

  return (
    <>
      <div className="mt-6 rounded-3xl p-6 md:p-10 bg-rose-wine">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-off-white">
            <HeartHandshake className="h-5 w-5" />
            <span className="font-display text-2xl md:text-3xl tracking-[0.2em]">
              FRIENDSHIP CARD
            </span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
            ✧ A fully personalised keepsake, made official ✧
          </p>
        </div>

        <div className="mx-auto max-w-sm">
          <FriendshipModelViewer className="aspect-square" />
          <p className="mt-3 text-center text-[0.65rem] uppercase tracking-[0.2em] text-pink-mist">
            Drag to rotate · scroll or pinch to zoom · rotates on its own
          </p>
        </div>

        {/* ── Step 1: quantity tier — always a single row of 2, kept
            compact (small text/padding) since it's a secondary choice next
            to the design grid below, and needs to fit two cards side by
            side even on narrow phones. ─────────────────────────────────── */}
        <p className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.25em] text-off-white">
          1. Choose your quantity
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 max-w-xs sm:max-w-sm mx-auto">
          {items.map((item) => {
            const active = selectedFriendshipId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleToggleTier(item)}
                className={`relative rounded-lg p-2.5 sm:p-3 flex flex-col items-center text-center transition bg-black/15 cursor-pointer select-none ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                }`}
              >
                {active && (
                  <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-3 w-3" />
                  </span>
                )}

                <h4 className="font-display uppercase tracking-[0.1em] text-[0.7rem] sm:text-xs text-off-white">
                  {item.name}
                </h4>

                <div className="mt-1.5 flex items-baseline gap-1.5">
                  {item.mrp && (
                    <span className="text-[0.6rem] text-pink-mist/70 line-through">{fmt(item.mrp)}</span>
                  )}
                  <span className="rounded-md px-2 py-0.5 font-display text-sm sm:text-base text-rose-wine bg-off-white">
                    {fmt(item.price)}
                  </span>
                </div>

                <div className="mt-2 flex gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleToggleTier(item)}
                    className={`flex-1 min-w-0 rounded-full px-2 py-1 text-[0.6rem] font-medium transition border truncate ${
                      active
                        ? "bg-off-white text-rose-wine border-off-white"
                        : "bg-transparent text-off-white border-pink-mist/50 hover:bg-off-white/10"
                    }`}
                  >
                    {active ? "Selected" : "Select"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId(item.id)}
                    aria-label={`View ${item.name}`}
                    className="grid shrink-0 place-items-center rounded-full px-2 py-1 text-[0.6rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Step 2: design pick(s) — always a 2-up grid ─────────────── */}
        <p className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.25em] text-off-white">
          2. Pick your design{designLimit === 2 ? "s" : ""}
        </p>
        <p className="mt-1 text-center text-[0.65rem] uppercase tracking-[0.2em] text-pink-mist">
          {selectedFriendshipId
            ? `${selectedFriendshipDesignIds.length} of ${designLimit} selected`
            : "Choose a quantity above to unlock designs"}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:gap-5 max-w-2xl mx-auto">
          {designs.map((item, idx) => {
            const active = selectedFriendshipDesignIds.includes(item.id);
            const disabled = !selectedFriendshipId || (selectedFriendshipDesignIds.length >= designLimit && !active);
            const hero = templateHero(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleToggleDesign(item.id, item.name)}
                className={`relative rounded-xl p-3 md:p-4 flex flex-col items-center text-center transition bg-black/15 cursor-pointer select-none ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {active && (
                  <span className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDesignIdx(idx);
                  }}
                  className="relative w-full overflow-hidden rounded-md bg-white cursor-zoom-in"
                >
                  {hero && !brokenDesignIds.has(item.id) ? (
                    // Frame fits the image (not the other way around) — same
                    // shape as the detail modal below: no fixed-aspect crop
                    // box, just w-full h-auto so the box's own height always
                    // matches the image's real proportions exactly, with
                    // nothing trimmed and no letterbox bars either. All 4
                    // designs share one physical card shape, so once real
                    // art is in, every thumbnail in the grid ends up the
                    // same height anyway.
                    <img
                      src={hero}
                      alt={item.name}
                      loading="lazy"
                      className="block w-full h-auto object-contain"
                      onError={() => setBrokenDesignIds((prev) => new Set(prev).add(item.id))}
                    />
                  ) : (
                    <div className="aspect-[1082/708] relative">
                      <FriendshipDesignPlaceholder n={idx + 1} />
                    </div>
                  )}
                </div>

                <p className="mt-3 font-display tracking-[0.2em] text-xs text-off-white">{item.name}</p>

                <div className="mt-3 flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleToggleDesign(item.id, item.name)}
                    className={`flex-1 min-w-0 rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition border truncate ${
                      active
                        ? "bg-off-white text-rose-wine border-off-white"
                        : "bg-transparent text-off-white border-pink-mist/50 hover:bg-off-white/10"
                    } disabled:cursor-not-allowed`}
                  >
                    {active ? "Selected" : "Select"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenDesignIdx(idx)}
                    aria-label={`View ${item.name}`}
                    className="grid shrink-0 place-items-center rounded-full px-3 py-1.5 text-[0.7rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 max-w-xl mx-auto rounded-2xl bg-black/15 p-5 ring-1 ring-pink-mist/30">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-off-white mb-3">
            What can be customised?
          </p>
          <ul className="space-y-1.5 text-sm text-pink-mist">
            {CUSTOMISABLE.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-off-white">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-xs tracking-[0.2em] text-pink-mist">
          ♡ friendship, made official ♡
        </p>
      </div>

      <FriendshipModal
        open={!!openId}
        product={items.find((i) => i.id === openId) ?? null}
        onClose={() => setOpenId(null)}
      />

      <FriendshipDesignDetailModal
        open={openDesignIdx !== null}
        item={openDesignIdx !== null ? designs[openDesignIdx] : null}
        index={openDesignIdx ?? -1}
        active={openDesignIdx !== null && selectedFriendshipDesignIds.includes(designs[openDesignIdx].id)}
        limit={designLimit}
        onToggle={toggleFriendshipDesign}
        onClose={() => setOpenDesignIdx(null)}
      />
    </>
  );
}

/* ================================================================ */
/* QUANTITY TIER MODAL                                               */
/* ================================================================ */
function FriendshipModal({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}) {
  const cart = useStore((s) => s.cart);
  const selectedFriendshipId = useStore((s) => s.selectedFriendshipId);
  const selectedFriendshipDesignIds = useStore((s) => s.selectedFriendshipDesignIds);
  const setFriendship = useStore((s) => s.setFriendship);
  const removeItem = useStore((s) => s.removeItem);
  const {
    reviews,
    loading,
    posting,
    avg,
    reviewerId,
    rvName,
    setRvName,
    rvText,
    setRvText,
    rvRating,
    setRvRating,
    submitReview,
    deleteReview,
  } = useProductReviews(product?.id ?? null);

  if (!open || !product) return null;

  const active = selectedFriendshipId === product.id;
  const newLimit = product.designLimit ?? 1;

  const handleAdd = () => {
    if (active) {
      const cartItem = cart.find((c) => c.category === "friendship" && c.id === product.id);
      if (cartItem) removeItem(cartItem.key);
      toast.success(`${product.name} removed`);
    } else {
      const prevCount = selectedFriendshipDesignIds.length;
      setFriendship(product.id);
      toast.success(
        prevCount > newLimit
          ? `${product.name} selected — kept your first design, removed the rest to fit ${newLimit}.`
          : `${product.name} added — pick ${newLimit} design${newLimit === 1 ? "" : "s"} below, we'll reach out for your customisation details.`,
      );
    }
    onClose();
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="mx-auto w-full max-w-[340px]">
            <FriendshipModelViewer className="aspect-square" />
            <p className="mt-2 text-center text-[0.65rem] uppercase tracking-[0.2em] text-dusty-rose">
              Drag to rotate · scroll to zoom
            </p>
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">
            Friendship Card
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">
            {product.name}
          </h3>
          <ReviewStars avg={avg} count={reviews.length} />

          <div className="mt-4 flex items-baseline gap-3">
            {product.mrp && (
              <span className="text-lg text-dusty-rose line-through">{fmt(product.mrp)}</span>
            )}
            <span className="text-3xl font-semibold text-blush-rose">{fmt(product.price)}</span>
          </div>

          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{product.desc}</p>

          <p className="mt-4 text-sm font-semibold text-rose-wine">What can be customised?</p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
            {CUSTOMISABLE.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>

          <button
            onClick={handleAdd}
            className={`pill-btn pill-btn-hover mt-6 w-full !py-3 !text-base ${
              active ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-primary"
            }`}
          >
            {active ? "Remove from cart" : "Add to cart"}
          </button>
        </div>
      </div>

      <ReviewsPanel
        reviews={reviews}
        loading={loading}
        posting={posting}
        reviewerId={reviewerId}
        rvName={rvName}
        setRvName={setRvName}
        rvText={rvText}
        setRvText={setRvText}
        rvRating={rvRating}
        setRvRating={setRvRating}
        onSubmit={submitReview}
        onDelete={deleteReview}
      />
    </ModalShell>
  );
}

/* ================================================================ */
/* DESIGN DETAIL MODAL — front/back swipe                            */
/* ================================================================ */
function FriendshipDesignDetailModal({
  open,
  item,
  index,
  active,
  limit,
  onToggle,
  onClose,
}: {
  open: boolean;
  item: Product | null;
  index: number;
  active: boolean;
  limit: number;
  onToggle: (id: string) => boolean;
  onClose: () => void;
}) {
  const [slide, setSlide] = useState<0 | 1>(0);
  // Per-slide 404 tracking — front and back are independent files, so one
  // can be broken (or missing) while the other loads fine.
  const [brokenSlides, setBrokenSlides] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setSlide(0);
      setBrokenSlides(new Set());
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const photos = SITE.productImages?.[item.id] ?? [];
  const front = photos[0];
  const back = photos[1];
  const slides = [front, back].filter((s): s is string => !!s);
  const current = slides[slide] ?? slides[0];
  const currentBroken = brokenSlides.has(slide);

  const handleToggle = () => {
    const already = active;
    const ok = onToggle(item.id);
    if (!ok) return toast.error(`You can only pick ${limit} design${limit === 1 ? "" : "s"}.`);
    toast.success(already ? `${item.name} removed` : `${item.name} selected`);
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-3xl">
      <div className="grid gap-6 md:grid-cols-12 items-start">
        <div className="md:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[380px] rounded-xl overflow-hidden bg-white shadow-2xl ring-1 ring-rose-wine/10">
            {current && !currentBroken ? (
              <img
                src={current}
                alt={`${item.name} — ${slide === 0 ? "front" : "back"}`}
                className="w-full h-auto object-contain"
                onError={() => setBrokenSlides((prev) => new Set(prev).add(slide))}
              />
            ) : (
              <div className="aspect-[1082/708] relative">
                <FriendshipDesignPlaceholder n={index + 1} />
              </div>
            )}

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s === 0 ? 1 : 0))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-rose-wine hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSlide((s) => (s === 0 ? 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-rose-wine hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {slides.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i === slide ? "bg-rose-wine" : "bg-rose-wine/30"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="mt-2 text-center text-[0.65rem] uppercase tracking-[0.2em] text-dusty-rose">
            {slides.length > 1 ? (slide === 0 ? "Front · swipe for back" : "Back · swipe for front") : "Front"}
          </p>
        </div>

        <div className="md:col-span-6 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">
            Friendship Card Design
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">
            {item.name}
          </h3>
          <p className="mt-4 text-3xl font-semibold text-blush-rose">Included</p>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>

          <button
            onClick={handleToggle}
            className={`pill-btn pill-btn-hover mt-6 w-full !py-3 !text-base ${
              active ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-primary"
            }`}
          >
            {active ? "Remove from selection" : "Add to selection"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
