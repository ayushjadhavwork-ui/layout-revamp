import { useState } from "react";
import { Newspaper, Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, NEWSPAPER_TEMPLATES, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";


function LayoutPlaceholder({ n }: { n: number }) {
  const palettes = [
    ["#f4c9d1", "#8b3a52"],
    ["#eadfd0", "#6e4a2c"],
  ];
  const [c1, c2] = palettes[(n - 1) % palettes.length];
  return (
    <div className="absolute inset-0 grid grid-cols-2">
      <div className="flex items-center justify-center border-r border-white/60" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <span className="font-display italic text-white/90 text-sm">Left</span>
      </div>
      <div className="flex items-center justify-center" style={{ background: `linear-gradient(225deg, ${c1}, ${c2})` }}>
        <span className="font-display italic text-white/90 text-sm">Right</span>
      </div>
    </div>
  );
}

// This section is entirely self-contained: its own product, its own preview
// images, no shared state with the magazine builder, any combo, or delivery
// (see COMBO_INDEPENDENT in store.ts). Both spreads are fixed and always
// come together — there's nothing to pick, just one flat-priced product.
export function NewspaperSection() {
  const [openSpreadId, setOpenSpreadId] = useState<string | null>(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  const product = CATALOG.newspaper[0];
  const cartItem = cart.find((c) => c.category === "newspaper" && c.id === product.id);
  const inCart = !!cartItem;

  const handleAdd = () => {
    addItem("newspaper", product);
    toast.success("Newspaper Magazine added ✨");
  };

  const handleRemove = () => {
    if (cartItem) removeItem(cartItem.key);
    toast.success("Newspaper Magazine removed");
  };

  return (
    <div className="mt-6 rounded-3xl p-6 md:p-10 bg-gradient-to-br from-rose-wine via-rose-wine to-blush-rose shadow-2xl ring-1 ring-pink-mist/30">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-off-white">
          <Newspaper className="h-5 w-5" />
          <span className="font-display text-2xl md:text-3xl tracking-[0.2em]">NEWSPAPER MAGAZINE</span>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
          ✧ A pocket-sized broadsheet keepsake ✧
        </p>
        <p className="mt-3 font-display italic text-off-white/80 text-sm md:text-base">
          Two landscape spreads, one flat price — {fmt(product.price)}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {NEWSPAPER_TEMPLATES.map((tpl, idx) => {
          const hero = SITE.productImages?.[tpl.id]?.[0];
          return (
            <div
              key={tpl.id}
              className="relative rounded-xl overflow-hidden bg-black/15 ring-1 ring-pink-mist/30"
            >
              <div className="relative w-full aspect-[2480/1754]">
                {hero ? (
                  <img src={hero} alt={tpl.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <LayoutPlaceholder n={idx + 1} />
                )}
              </div>
              <p className="py-2 text-center font-display tracking-[0.2em] text-xs text-off-white">
                {tpl.name}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        {inCart ? (
          <div className="flex flex-col items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-off-white px-5 py-2 text-sm font-semibold text-rose-wine shadow">
              <Check className="h-4 w-4" /> Added to cart
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full px-4 py-1.5 text-[0.7rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-full px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] bg-off-white text-rose-wine shadow-lg transition hover:scale-[1.02]"
          >
            Add to cart — {fmt(product.price)}
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-xs tracking-[0.25em] text-pink-mist">
        ♡ small format, big story ♡
      </p>
    </div>
  );
}
