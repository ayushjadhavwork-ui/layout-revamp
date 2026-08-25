import { useEffect, useRef, useState } from "react";
import { HeartHandshake, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";

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

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl bg-white border border-rose-wine/10 ${className}`}
    >
      {ready ? (
        <model-viewer
          src={SITE.friendshipCardModel}
          alt="Interactive 3D preview of The Layout's Friendship Card"
          auto-rotate
          auto-rotate-delay="0"
          rotation-per-second="14deg"
          camera-controls
          interaction-prompt="none"
          shadow-intensity="1"
          exposure="1.05"
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
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  const items = CATALOG.friendship;

  const handleToggle = (item: Product) => {
    const cartItem = cart.find((c) => c.category === "friendship" && c.id === item.id);
    if (cartItem) {
      removeItem(cartItem.key);
      toast.success(`${item.name} deselected`);
    } else {
      addItem("friendship", item);
      toast.success(`${item.name} selected`);
    }
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

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-2xl mx-auto">
          {items.map((item) => {
            const active = cart.some((c) => c.category === "friendship" && c.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item)}
                className={`relative rounded-xl p-4 md:p-5 flex flex-col items-center text-center transition bg-black/15 cursor-pointer select-none ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                <h4 className="font-display uppercase tracking-[0.15em] text-sm text-off-white">
                  {item.name}
                </h4>

                <div className="mt-3 flex items-baseline gap-2">
                  {item.mrp && (
                    <span className="text-xs text-pink-mist/70 line-through">{fmt(item.mrp)}</span>
                  )}
                  <span className="rounded-md px-3 py-1 font-display text-lg text-rose-wine bg-off-white">
                    {fmt(item.price)}
                  </span>
                </div>

                <div className="mt-4 flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className={`flex-1 min-w-0 rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition border truncate ${
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
    </>
  );
}

/* ================================================================ */
/* MODAL                                                             */
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
  const [note, setNote] = useState("");
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
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

  useEffect(() => {
    if (open) setNote("");
  }, [open, product?.id]);

  if (!open || !product) return null;

  const cartItem = cart.find((c) => c.category === "friendship" && c.id === product.id);
  const active = !!cartItem;

  const handleAdd = () => {
    if (active && cartItem) {
      removeItem(cartItem.key);
      toast.success(`${product.name} removed`);
    } else {
      addItem("friendship", product, note);
      toast.success(`${product.name} added — we'll reach out for your customisation details.`);
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

          <label className="mt-5 block text-sm font-medium text-rose-wine">
            Customisation details (optional — you can also share these with us later)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 p-3 text-sm outline-none focus:border-rose-wine"
            maxLength={400}
            placeholder="Names, photo, date, place, inside jokes…"
          />

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
