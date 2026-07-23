import { useState } from "react";
import { Layers, Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";

function sizeHero(id: string): string | undefined {
  return SITE.productImages?.[id]?.[0];
}

function SizePlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-mist/30 via-blush-rose/25 to-rose-wine/25 text-off-white">
      <span className="font-display text-3xl md:text-4xl">{label}</span>
      <span className="mt-1 text-[0.55rem] uppercase tracking-[0.35em] opacity-80">Magazine pages</span>
    </div>
  );
}

/* -------------------------------------------------------------- */
export function SizesSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const setSize = useStore((s) => s.setSize);
  const removeItem = useStore((s) => s.removeItem);
  const cart = useStore((s) => s.cart);

  const items = CATALOG.sizes;

  const handleToggle = (id: string, name: string) => {
    if (selectedSizeId === id) {
      const item = cart.find((c) => c.category === "sizes" && c.id === id);
      if (item) removeItem(item.key);
      toast.success(`${name} deselected`);
    } else {
      setSize(id);
      toast.success(`${name} selected`);
    }
  };

  return (
    <>
      <div className="mt-6 rounded-3xl p-6 md:p-10 bg-rose-wine">


        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map((item) => {
            const active = selectedSizeId === item.id;
            const hero = sizeHero(item.id);

            return (
              <div
                key={item.id}
                className={`relative rounded-xl p-4 md:p-5 flex flex-col items-center text-center transition bg-black/15 ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                <div className="relative w-full aspect-[4/5] overflow-hidden rounded-md bg-white/5">
                  {hero ? (
                    <img src={hero} alt={item.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <SizePlaceholder label={item.name.replace(/\D/g, "")} />
                  )}
                </div>

                <h4 className="mt-4 font-display uppercase tracking-[0.2em] text-sm text-off-white">
                  {item.name}
                </h4>
                <p className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-pink-mist">
                  {item.templateLimit} template{item.templateLimit === 1 ? "" : "s"}
                </p>

                <div className="my-3 h-px w-16 bg-pink-mist/40" />
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-pink-mist">Selling price</p>
                <p className="mt-1 inline-block rounded-md px-4 py-1 font-display text-xl text-rose-wine bg-off-white">
                  {fmt(item.price)}
                </p>

                <div className="mt-4 flex gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id, item.name)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition border ${
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
                    className="rounded-full px-3 py-1.5 text-[0.7rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs tracking-[0.2em] text-pink-mist">
          ♡ more pages, more stories to tell ♡
        </p>
      </div>

      <SizeModal open={!!openId} sizeId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

/* -------------------------------------------------------------- */
function SizeModal({
  open,
  sizeId,
  onClose,
}: {
  open: boolean;
  sizeId: string | null;
  onClose: () => void;
}) {
  const item = sizeId ? CATALOG.sizes.find((s) => s.id === sizeId) ?? null : null;
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const setSize = useStore((s) => s.setSize);
  const {
    reviews, loading, posting, avg, reviewerId,
    rvName, setRvName, rvText, setRvText, rvRating, setRvRating,
    submitReview, deleteReview,
  } = useProductReviews(item?.id ?? null);

  if (!open || !item) return null;

  const hero = sizeHero(item.id);
  const active = selectedSizeId === item.id;

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-[320px] aspect-[4/5] rounded-xl overflow-hidden bg-white shadow-2xl ring-1 ring-rose-wine/10 relative">
            {hero ? (
              <img src={hero} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <SizePlaceholder label={item.name.replace(/\D/g, "")} />
            )}
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Magazine Package</p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{item.name}</h3>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-dusty-rose">
            {item.templateLimit} template{item.templateLimit === 1 ? "" : "s"} · covers included
          </p>
          <ReviewStars avg={avg} count={reviews.length} />
          <p className="mt-4 text-3xl font-semibold text-blush-rose">{fmt(item.price)}</p>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>• Premium matte-finish paper</li>
            <li>• Front &amp; back cover included</li>
            <li>• Editorial trim size</li>
          </ul>

          <button
            onClick={() => { setSize(item.id); toast.success(`${item.name} selected`); onClose(); }}
            className={`pill-btn pill-btn-hover mt-6 w-full !py-3 !text-base ${
              active ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-primary"
            }`}
          >
            {active ? "Selected — click to reconfirm" : `Choose ${item.name}`}
          </button>
        </div>
      </div>

      <ReviewsPanel
        reviews={reviews} loading={loading} posting={posting} reviewerId={reviewerId}
        rvName={rvName} setRvName={setRvName} rvText={rvText} setRvText={setRvText}
        rvRating={rvRating} setRvRating={setRvRating}
        onSubmit={submitReview} onDelete={deleteReview}
      />
    </ModalShell>
  );
}
