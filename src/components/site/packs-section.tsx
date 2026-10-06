import { useState } from "react";
import { Camera, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";

import miniPhoto from "@/assets/polaroids/mini.webp";
import classicPhoto from "@/assets/polaroids/classic.webp";
import memoryPhoto from "@/assets/polaroids/memory.webp";
import premiumPhoto from "@/assets/polaroids/premium.webp";

const PACK_META: Record<string, { photo: string; count: string }> = {
  "pol-mini":    { photo: miniPhoto,    count: "9 POLAROIDS" },
  "pol-classic": { photo: classicPhoto, count: "18 POLAROIDS" },
  "pol-memory":  { photo: memoryPhoto,  count: "27 POLAROIDS" },
  "pol-premium": { photo: premiumPhoto, count: "36 POLAROIDS" },
};

/* Resolve the hero image for a pack: prefer SITE.productImages override,
   fall back to the bundled placeholder. */
function packPhoto(id: string): string {
  const override = SITE.productImages?.[id]?.[0];
  return override || PACK_META[id]?.photo || "";
}

/* -------------------------------------------------------------- */
/* Real-polaroid tile — stacked-photo look                        */
/* -------------------------------------------------------------- */
function PolaroidTile({
  photo,
  active,
}: {
  photo: string;
  active: boolean;
}) {
  return (
    <div className="polaroid-tile relative w-full max-w-[220px] mx-auto aspect-square">
      {/* Backdrop cards for the "stack" effect */}
      <div
        className="polaroid-tile-backdrop-a absolute inset-0 bg-white rounded-sm shadow-md"
        style={{ transform: "rotate(-6deg) translate(-6px, 4px)" }}
      />
      <div
        className="polaroid-tile-backdrop-b absolute inset-0 bg-white rounded-sm shadow-md"
        style={{ transform: "rotate(3deg) translate(4px, 2px)" }}
      />
      {/* Front polaroid: photo + white bottom frame */}
      <div
        className={`polaroid-tile-frame absolute inset-0 bg-white rounded-sm shadow-lg flex flex-col p-2.5 pb-6 transition ${
          active ? "ring-2 ring-rose-wine" : ""
        }`}
      >
        <div className="flex-1 overflow-hidden bg-neutral-100 rounded-[2px]">
          {photo ? (
            <img
              src={photo}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-neutral-400">
              <Camera className="polaroid-tile-cam-icon h-8 w-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* PacksSection                                                    */
/* -------------------------------------------------------------- */
export function PacksSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  const items = CATALOG.polaroids;

  return (
    <>
      <div className="mt-6 rounded-3xl p-6 md:p-10 bg-rose-wine">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-off-white">
            <Camera className="h-5 w-5" />
            <span className="font-display text-2xl tracking-[0.2em]">POLAROID</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">Add-on to your order</p>
        </div>

        <div className="polaroid-pack-grid grid grid-cols-4 gap-2 sm:gap-5">
          {items.map((item) => {
            const cartItem = cart.find((c) => c.category === "polaroids" && c.id === item.id);
            const active = !!cartItem;
            const meta = PACK_META[item.id];
            const handleToggle = () => {
              if (active && cartItem) {
                removeItem(cartItem.key);
                toast.success(`${item.name} removed`);
              } else {
                addItem("polaroids", item, "");
                toast.success(`${item.name} added`);
              }
            };

            return (
              <div
                key={item.id}
                onClick={handleToggle}
                className={`polaroid-pack-card relative rounded-xl p-3 sm:p-4 md:p-5 flex flex-col items-center text-center transition bg-black/15 cursor-pointer select-none ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                }`}
              >
                {active && (
                  <span className="polaroid-pack-badge absolute top-2 right-2 sm:top-3 sm:right-3 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                <div className="polaroid-pack-camicon flex items-center gap-1.5 text-pink-mist mb-2">
                  <Camera className="h-4 w-4" />
                </div>
                <h4 className="polaroid-pack-title font-display uppercase tracking-[0.2em] text-xs sm:text-sm text-off-white leading-tight">
                  {item.name}
                </h4>

                <div
                  onClick={(e) => { e.stopPropagation(); setOpenId(item.id); }}
                  className="polaroid-pack-photo-wrap mt-3 sm:mt-4 w-full cursor-zoom-in"
                >
                  <PolaroidTile photo={packPhoto(item.id)} active={active} />
                </div>

                <p className="polaroid-pack-count mt-4 sm:mt-5 font-display tracking-[0.2em] text-[0.65rem] sm:text-xs text-off-white">
                  {meta?.count ?? ""}
                </p>
                <div className="polaroid-pack-divider my-2 h-px w-12 sm:w-16 bg-pink-mist/40" />
                <p className="polaroid-pack-label text-[0.55rem] sm:text-[0.6rem] uppercase tracking-[0.3em] text-pink-mist">Selling price</p>
                <p className="polaroid-pack-price mt-1 inline-block rounded-md px-3 sm:px-4 py-1 font-display text-lg sm:text-xl text-rose-wine bg-off-white">
                  {fmt(item.price)}
                </p>

                <div className="polaroid-pack-actions mt-4 flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={handleToggle}
                    className={`polaroid-pack-select flex-1 min-w-0 rounded-full px-2 sm:px-3 py-1.5 text-[0.65rem] sm:text-[0.7rem] font-medium transition border truncate ${
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
                    className="polaroid-pack-view grid shrink-0 place-items-center rounded-full px-2.5 sm:px-3 py-1.5 text-[0.65rem] sm:text-[0.7rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
                  >
                    <Eye className="h-3 w-3 sm:hidden" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>


        <p className="mt-6 text-center text-xs tracking-[0.2em] text-pink-mist">
          ♡ capture moments, keep them forever ♡
        </p>
      </div>

      <PackModal
        open={!!openId}
        packId={openId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}

/* -------------------------------------------------------------- */
/* PackModal — big polaroid frame + details                        */
/* -------------------------------------------------------------- */
function PackModal({
  open,
  packId,
  onClose,
}: {
  open: boolean;
  packId: string | null;
  onClose: () => void;
}) {
  const item = packId ? CATALOG.polaroids.find((p) => p.id === packId) ?? null : null;
  const addItem = useStore((s) => s.addItem);
  const cart = useStore((s) => s.cart);
  const {
    reviews, loading, posting, avg, reviewerId,
    rvName, setRvName, rvText, setRvText, rvRating, setRvRating,
    submitReview, deleteReview,
  } = useProductReviews(item?.id ?? null);

  if (!open || !item) return null;

  const photo = packPhoto(item.id);
  const meta = PACK_META[item.id];
  const inCart = cart.some((c) => c.category === "polaroids" && c.id === item.id);

  const handleAdd = () => {
    addItem("polaroids", item, "");
    toast.success(`${item.name} added to cart`);
    onClose();
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left — big polaroid framed photo */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-[320px]">
            <div className="bg-white rounded-sm shadow-2xl p-4 pb-12">
              <div className="aspect-square overflow-hidden bg-neutral-100">
                {photo ? (
                  <img src={photo} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-neutral-400">
                    <Camera className="h-10 w-10" />
                  </div>
                )}
              </div>
              <p className="mt-4 text-center font-display italic text-neutral-500 text-sm">
                {item.name}
              </p>
            </div>
          </div>
        </div>

        {/* Right — details */}
        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Polaroid Pack</p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{item.name}</h3>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-dusty-rose">{meta?.count}</p>
          <ReviewStars avg={avg} count={reviews.length} />
          <p className="mt-4 text-3xl font-semibold text-blush-rose">{fmt(item.price)}</p>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>• Real polaroid-style prints on thick photo card</li>
            <li>• Ships stacked in a keepsake sleeve</li>
            <li>• Perfect for gifting or scrapbooking</li>
          </ul>

          <button
            onClick={handleAdd}
            disabled={inCart}
            className="pill-btn pill-btn-hover pill-primary mt-6 w-full !py-3 !text-base disabled:opacity-60"
          >
            {inCart ? "Already in cart" : "Add to cart"}
          </button>
        </div>
      </div>

      {/* Reviews */}
      <ReviewsPanel
        reviews={reviews} loading={loading} posting={posting} reviewerId={reviewerId}
        rvName={rvName} setRvName={setRvName} rvText={rvText} setRvText={setRvText}
        rvRating={rvRating} setRvRating={setRvRating}
        onSubmit={submitReview} onDelete={deleteReview}
      />
    </ModalShell>
  );
}