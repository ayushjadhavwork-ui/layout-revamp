import { useEffect, useState } from "react";
import { Layers, Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";

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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-off-white">
            <Layers className="h-5 w-5" />
            <span className="font-display text-2xl tracking-[0.2em]">CHOOSE YOUR PACKAGE</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
            Pricing scales with page count · covers included
          </p>
        </div>

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

  const [reviews, setReviews] = useState<{ name: string; rating: number; text: string }[]>([]);
  const [rvName, setRvName] = useState("");
  const [rvText, setRvText] = useState("");
  const [rvRating, setRvRating] = useState(5);

  useEffect(() => {
    if (open) {
      setReviews([
        { name: "Priya S.", rating: 5, text: "Perfect page count for a birthday gift." },
        { name: "Rohit K.", rating: 5, text: "The pages feel thick and premium." },
      ]);
      setRvName(""); setRvText(""); setRvRating(5);
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const hero = sizeHero(item.id);
  const active = selectedSizeId === item.id;
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
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-blush-rose">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</span>
            <span className="text-dusty-rose">{avg} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
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
