import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";

/* -------------------------------------------------------------- */
/* Placeholder tile — shown when SITE.productImages[str-N] is empty. */
/* -------------------------------------------------------------- */
function PlaceholderStrip({ n }: { n: number }) {
  const palettes = [
    ["#f4c9d1", "#e6a4b4", "#8b3a52"],
    ["#eadfd0", "#c9a37a", "#6e4a2c"],
    ["#f2d6c9", "#d98a7a", "#7a2a2a"],
    ["#dfe7d5", "#a9c29b", "#3f6b48"],
    ["#e0d3ee", "#a99cd4", "#4a3f7a"],
  ];
  const [c1, c2, c3] = palettes[(n - 1) % palettes.length];
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="h-[12%] flex items-center justify-center font-display italic text-[0.7rem] tracking-wide text-white/90" style={{ background: c3 }}>
        Strip {n}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-1 border-b border-white/40 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          <span className="font-display text-white/70 text-xs">◆</span>
        </div>
      ))}
      <div className="h-[8%] flex items-center justify-center text-[0.55rem] uppercase tracking-[0.3em] text-white/80" style={{ background: c3 }}>
        the layout
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* StripsSection                                                   */
/* -------------------------------------------------------------- */
export function StripsSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  const items = CATALOG.strips;

  return (
    <>
      <div className="mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item, idx) => {
            const cartItem = cart.find((c) => c.category === "strips" && c.id === item.id);
            const active = !!cartItem;
            const photos = SITE.productImages?.[item.id] ?? [];
            const hero = photos[0];

            const handleToggle = () => {
              if (active && cartItem) {
                removeItem(cartItem.key);
                toast.success(`${item.name} removed`);
              } else {
                addItem("strips", item, "");
                toast.success(`${item.name} added`);
              }
            };

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col rounded-2xl overflow-hidden transition ${
                  active ? "ring-2 ring-rose-wine shadow-lg" : "ring-1 ring-rose-wine/10"
                }`}
              >
                {/* Tall strip visual — 3:8 aspect */}
                <button
                  type="button"
                  onClick={handleToggle}
                  className="relative w-full aspect-[3/8] bg-white overflow-hidden cursor-pointer"
                  aria-label={`Select ${item.name}`}
                >
                  {hero ? (
                    <img
                      src={hero}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <PlaceholderStrip n={idx + 1} />
                  )}
                  {active && (
                    <span className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-rose-wine text-white shadow-md">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>

                {/* Info + actions */}
                <div className="p-3 bg-white/80 backdrop-blur-sm flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-display text-base text-rose-wine leading-tight">{item.name}</h4>
                    <p className="text-sm font-semibold text-blush-rose">{fmt(item.price)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleToggle}
                      className={`pill-btn !py-1.5 !px-2 !text-[0.7rem] flex-1 ${
                        active ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-btn-hover"
                      }`}
                    >
                      {active ? (
                        <span className="flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Selected</span>
                      ) : (
                        "Select"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      className="pill-btn pill-btn-hover !py-1.5 !px-2 !text-[0.7rem]"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <StripModal
        open={!!openId}
        stripIndex={items.findIndex((i) => i.id === openId)}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}

/* -------------------------------------------------------------- */
/* StripModal — tall image, right-side details, reviews below.     */
/* -------------------------------------------------------------- */
function StripModal({
  open,
  stripIndex,
  onClose,
}: {
  open: boolean;
  stripIndex: number;
  onClose: () => void;
}) {
  const item = stripIndex >= 0 ? CATALOG.strips[stripIndex] : null;
  const addItem = useStore((s) => s.addItem);
  const cart = useStore((s) => s.cart);

  const [reviews, setReviews] = useState<{ name: string; rating: number; text: string }[]>([]);
  const [rvName, setRvName] = useState("");
  const [rvText, setRvText] = useState("");
  const [rvRating, setRvRating] = useState(5);

  useEffect(() => {
    if (open) {
      setReviews([
        { name: "Ria K.", rating: 5, text: "The strip looks even better in person — pastel tones are perfect." },
        { name: "Meher T.", rating: 5, text: "Super sturdy, great print quality." },
      ]);
      setRvName(""); setRvText(""); setRvRating(5);
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const photos = SITE.productImages?.[item.id] ?? [];
  const hero = photos[0];
  const inCart = cart.some((c) => c.category === "strips" && c.id === item.id);
  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 5;

  const handleAdd = () => {
    addItem("strips", item, "");
    toast.success(`${item.name} added to cart`);
    onClose();
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rvName.trim() || !rvText.trim()) return toast.error("Add your name and review.");
    setReviews((r) => [{ name: rvName.trim(), rating: rvRating, text: rvText.trim() }, ...r]);
    setRvName(""); setRvText(""); setRvRating(5);
    toast.success("Review posted");
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left — full tall strip, real scale */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-[220px] aspect-[3/8] max-h-[560px] rounded-xl overflow-hidden bg-white border border-rose-wine/10 shadow-xl relative">
            {hero ? (
              <img src={hero} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <PlaceholderStrip n={stripIndex + 1} />
            )}
          </div>
        </div>

        {/* Right — details */}
        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Polaroid Strip</p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{item.name}</h3>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-blush-rose">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</span>
            <span className="text-dusty-rose">{avg} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-blush-rose">{fmt(item.price)}</p>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>• Printed on premium matte-finish photo paper</li>
            <li>• 4 photo cells per strip in editorial layout</li>
            <li>• Ships flat with a protective sleeve</li>
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
      <div className="mt-8 border-t border-white/60 pt-6">
        <h4 className="font-display text-2xl text-rose-wine">Customer reviews</h4>
        <form onSubmit={submitReview} className="mt-4 rounded-2xl bg-white/50 p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={rvName}
              onChange={(e) => setRvName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-rose-wine/20 bg-white/70 px-3 py-2 text-sm outline-none focus:border-rose-wine"
              maxLength={60}
            />
            <select
              value={rvRating}
              onChange={(e) => setRvRating(Number(e.target.value))}
              className="rounded-xl border border-rose-wine/20 bg-white/70 px-3 py-2 text-sm outline-none focus:border-rose-wine"
            >
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
            </select>
          </div>
          <textarea
            value={rvText}
            onChange={(e) => setRvText(e.target.value)}
            rows={2}
            placeholder="Share your experience…"
            className="w-full rounded-xl border border-rose-wine/20 bg-white/70 px-3 py-2 text-sm outline-none focus:border-rose-wine"
            maxLength={400}
          />
          <button type="submit" className="pill-btn pill-btn-hover !py-2 !px-4 !text-xs">Post review</button>
        </form>
        <ul className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
          {reviews.map((r, i) => (
            <li key={i} className="rounded-2xl bg-white/40 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-rose-wine text-sm">{r.name}</p>
                <span className="text-xs text-blush-rose">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-700">{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </ModalShell>
  );
}
