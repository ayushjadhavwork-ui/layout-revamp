import { useState } from "react";
import { Gift, Mail, HeartHandshake, Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";

const ADDON_META: Record<
  string,
  { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; tag?: string; savings?: string }
> = {
  "add-wrap":   { icon: Gift,           tag: "Cute little touch" },
  "add-combo":  { icon: HeartHandshake, tag: "BEST VALUE ♡",         savings: "Save ₹20" },
  "add-letter": { icon: Mail,           tag: "Handwritten" },
};

function addonHero(id: string): string | undefined {
  return SITE.productImages?.[id]?.[0];
}

/* -------------------------------------------------------------- */
export function AddonsSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  const items = CATALOG.addons;

  return (
    <>
      <div className="mt-6 rounded-3xl p-6 md:p-10 bg-rose-wine">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-off-white">
            <Gift className="h-5 w-5" />
            <span className="font-display text-2xl tracking-[0.2em]">ADD-ONS</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
            ✧ Make it extra special ✧
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item) => {
            const cartItem = cart.find((c) => c.category === "addons" && c.id === item.id);
            const active = !!cartItem;
            const meta = ADDON_META[item.id];
            const Icon = meta?.icon ?? Gift;
            const hero = addonHero(item.id);
            const isCombo = item.id === "add-combo";

            const handleToggle = () => {
              if (active && cartItem) {
                removeItem(cartItem.key);
                toast.success(`${item.name} removed`);
              } else {
                addItem("addons", item, "");
                toast.success(`${item.name} added`);
              }
            };

            return (
              <div
                key={item.id}
                className={`relative rounded-xl p-5 md:p-6 flex flex-col items-center text-center transition bg-black/15 ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                } ${isCombo ? "md:scale-[1.02]" : ""}`}
              >
                {meta?.tag && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[0.6rem] font-semibold uppercase tracking-[0.25em] ${
                      isCombo
                        ? "bg-off-white text-rose-wine shadow"
                        : "bg-rose-wine text-off-white ring-1 ring-pink-mist/40"
                    }`}
                  >
                    {meta.tag}
                  </span>
                )}

                {active && (
                  <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                <div className="mt-4 relative w-full aspect-square overflow-hidden rounded-md bg-white/5 grid place-items-center">
                  {hero ? (
                    <img src={hero} alt={item.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-20 w-20 md:h-24 md:w-24 text-off-white/80" strokeWidth={1.25} />
                  )}
                </div>

                <h4 className="mt-4 font-display uppercase tracking-[0.2em] text-sm text-off-white">
                  {item.name}
                </h4>

                <div className="my-3 h-px w-16 bg-pink-mist/40" />
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-pink-mist">Selling price</p>
                <div className="mt-1 flex items-center gap-2">
                  {meta?.savings && (
                    <span className="font-display text-xs text-pink-mist/70 line-through">
                      {fmt(198)}
                    </span>
                  )}
                  <span className="inline-block rounded-md px-4 py-1 font-display text-xl text-rose-wine bg-off-white">
                    {fmt(item.price)}
                  </span>
                </div>
                {meta?.savings && (
                  <p className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-off-white/80">
                    {meta.savings}
                  </p>
                )}

                <div className="mt-4 flex gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={handleToggle}
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
          ♡ Little extras, more love ♡
        </p>
      </div>

      <AddonModal open={!!openId} addonId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

/* -------------------------------------------------------------- */
function AddonModal({
  open,
  addonId,
  onClose,
}: {
  open: boolean;
  addonId: string | null;
  onClose: () => void;
}) {
  const item = addonId ? CATALOG.addons.find((a) => a.id === addonId) ?? null : null;
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const {
    reviews, loading, posting, avg, reviewerId,
    rvName, setRvName, rvText, setRvText, rvRating, setRvRating,
    submitReview, deleteReview,
  } = useProductReviews(item?.id ?? null);

  if (!open || !item) return null;

  const meta = ADDON_META[item.id];
  const Icon = meta?.icon ?? Gift;
  const hero = addonHero(item.id);
  const inCart = cart.some((c) => c.category === "addons" && c.id === item.id);

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-[320px] aspect-square rounded-xl overflow-hidden bg-white shadow-2xl ring-1 ring-rose-wine/10 relative grid place-items-center">
            {hero ? (
              <img src={hero} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <Icon className="h-24 w-24 text-rose-wine/70" strokeWidth={1.25} />
            )}
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Add-on</p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{item.name}</h3>
          <ReviewStars avg={avg} count={reviews.length} />
          <p className="mt-4 text-3xl font-semibold text-blush-rose">{fmt(item.price)}</p>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>

          <button
            onClick={() => { addItem("addons", item, ""); toast.success(`${item.name} added`); onClose(); }}
            disabled={inCart}
            className="pill-btn pill-btn-hover pill-primary mt-6 w-full !py-3 !text-base disabled:opacity-60"
          >
            {inCart ? "Already in cart" : "Add to cart"}
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
