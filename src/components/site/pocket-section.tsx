import { useState } from "react";
import { Wallet, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";

function pocketHero(): string | undefined {
  return SITE.productImages?.["pocket-mag"]?.[0];
}
function pocketGallery(): string[] {
  const imgs = SITE.productImages?.["pocket-mag"] ?? [];
  return imgs.slice(1);
}

function PocketPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-mist/30 via-blush-rose/25 to-rose-wine/25 text-off-white">
      <span className="font-display text-3xl md:text-4xl">6</span>
      <span className="mt-1 w-full px-1 text-center text-[0.5rem] sm:text-[0.55rem] uppercase tracking-[0.05em] sm:tracking-[0.35em] opacity-80">
        Pocket pages
      </span>
    </div>
  );
}

// A standalone product, same spirit as the Newspaper Magazine, except it's
// surfaced right below "Choose your package" because it's conceptually part
// of Step 1: a customer can add it alongside — or instead of — a
// Standard/Mini magazine. Its own template picks happen in Step 2 (see
// templates-section.tsx), tracked under the "pocket-templates" category so
// they never collide with a normal magazine's template selection.
export function PocketMagazineSection() {
  const [openModal, setOpenModal] = useState(false);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  const product = CATALOG.pocket[0];
  const cartItem = cart.find((c) => c.category === "pocket" && c.id === product.id);
  const inCart = !!cartItem;
  const hero = pocketHero();

  const handleToggle = () => {
    if (inCart && cartItem) {
      removeItem(cartItem.key);
      toast.success("Pocket Magazine deselected");
    } else {
      addItem("pocket", product);
      toast.success(`Pocket Magazine selected — pick ${product.templateLimit} template(s) below.`);
    }
  };

  return (
    <>
      <div className="mt-6 rounded-3xl p-6 md:p-10 bg-rose-wine">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-off-white">
            <Wallet className="h-5 w-5" />
            <span className="font-display text-2xl tracking-[0.2em]">POCKET MAGAZINE</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
            ✧ Tiny in size, made to hold the biggest memories ✧
          </p>
          <p className="mt-3 font-display italic text-off-white/80 text-sm md:text-base">
            A standalone keepsake — add it alongside your magazine above, or all on its own.
          </p>
        </div>

        <div className="mx-auto max-w-xs">
          <div
            onClick={handleToggle}
            className={`relative rounded-md sm:rounded-xl p-3 sm:p-4 md:p-5 flex flex-col items-center text-center transition bg-black/15 cursor-pointer select-none ${
              inCart ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
            }`}
          >
            {inCart && (
              <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}

            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpenModal(true);
              }}
              className="relative w-full aspect-[4/5] overflow-hidden rounded-sm sm:rounded-md bg-white/5 cursor-zoom-in"
            >
              {hero ? (
                <img
                  src={hero}
                  alt={product.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <PocketPlaceholder />
              )}
            </div>

            <h4 className="mt-4 font-display uppercase tracking-[0.2em] text-sm text-off-white">
              {product.name}
            </h4>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-pink-mist">
              6 pages · {product.templateLimit} templates · pocket size
            </p>

            <div className="my-3 h-px w-16 bg-pink-mist/40" />
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-pink-mist">Selling price</p>
            <p className="mt-1 inline-block rounded-md px-4 py-1 font-display text-xl text-rose-wine bg-off-white">
              {fmt(product.price)}
            </p>

            <div className="mt-4 flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleToggle}
                className={`flex-1 min-w-0 rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition border truncate ${
                  inCart
                    ? "bg-off-white text-rose-wine border-off-white"
                    : "bg-transparent text-off-white border-pink-mist/50 hover:bg-off-white/10"
                }`}
              >
                {inCart ? "Selected" : "Select"}
              </button>
              <button
                type="button"
                onClick={() => setOpenModal(true)}
                aria-label={`View ${product.name}`}
                className="grid shrink-0 place-items-center rounded-full px-3 py-1.5 text-[0.7rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs tracking-[0.2em] text-pink-mist">
          ♡ a whole story, pocket-sized ♡
        </p>
      </div>

      <PocketModal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
}

/* -------------------------------------------------------------- */
function PocketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const product = CATALOG.pocket[0];
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
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
  } = useProductReviews(product.id);

  if (!open) return null;

  const inCart = cart.some((c) => c.category === "pocket" && c.id === product.id);
  const hero = pocketHero();
  const gallery = pocketGallery();
  const slides = gallery.length ? gallery : hero ? [hero] : [];

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="mx-auto w-full max-w-[340px]">
            {slides.length ? (
              <img
                src={slides[0]}
                alt={product.name}
                className="w-full h-auto rounded-xl bg-white shadow-2xl ring-1 ring-rose-wine/10 object-contain"
              />
            ) : (
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-rose-wine/10">
                <PocketPlaceholder />
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">
            Standalone Product
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">
            {product.name}
          </h3>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-dusty-rose">
            {product.templateLimit} templates · covers included · pocket size
          </p>
          <ReviewStars avg={avg} count={reviews.length} />
          <p className="mt-4 text-3xl font-semibold text-blush-rose">{fmt(product.price)}</p>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{product.desc}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>• Strictly 6 pages + front &amp; back cover</li>
            <li>• Pocket-sized — stylish, personal, easy to carry</li>
            <li>• Pick any 3 templates in Step 2 below</li>
            <li>• Can be ordered alongside your Standard or Mini magazine</li>
          </ul>

          <button
            onClick={() => {
              if (!inCart) {
                addItem("pocket", product);
                toast.success(
                  `${product.name} selected — pick ${product.templateLimit} template(s).`,
                );
              }
              onClose();
            }}
            className={`pill-btn pill-btn-hover mt-6 w-full !py-3 !text-base ${
              inCart ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-primary"
            }`}
          >
            {inCart ? "Selected — click to close" : `Choose ${product.name}`}
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
