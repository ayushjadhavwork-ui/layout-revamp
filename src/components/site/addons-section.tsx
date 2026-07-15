import { useEffect, useState } from "react";
import { Gift, Mail, HeartHandshake, Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";

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

  const [reviews, setReviews] = useState<{ name: string; rating: number; text: string }[]>([]);
  const [rvName, setRvName] = useState("");
  const [rvText, setRvText] = useState("");
  const [rvRating, setRvRating] = useState(5);

  useEffect(() => {
    if (open) {
      setReviews([
        { name: "Neha J.", rating: 5, text: "The wrap made it feel like a proper gift." },
        { name: "Aarav P.", rating: 5, text: "The handwritten letter got me emotional 🥹" },
      ]);
      setRvName(""); setRvText(""); setRvRating(5);
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const meta = ADDON_META[item.id];
  const Icon = meta?.icon ?? Gift;
  const hero = addonHero(item.id);
  const inCart = cart.some((c) => c.category === "addons" && c.id === item.id);
  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 5;

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
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-blush-rose">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</span>
            <span className="text-dusty-rose">{avg} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
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
