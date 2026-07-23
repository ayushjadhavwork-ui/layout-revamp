import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, STRIP_TIERS, STRIP_MAX, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";

/* -------------------------------------------------------------- */
/* Placeholder tile — shown when SITE.productImages[strip-N] empty */
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
/* Pricing table                                                   */
/* -------------------------------------------------------------- */
function StripsPricingTable({ count }: { count: number }) {
  return (
    <div className="mx-auto mt-4 max-w-xl rounded-2xl bg-white/70 backdrop-blur-sm ring-1 ring-rose-wine/10 p-4">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-blush-rose">
        Bundle pricing
      </p>
      <div className="mt-3 grid grid-cols-5 gap-1 text-center">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = count === n;
          return (
            <div
              key={n}
              className={`rounded-xl px-1.5 py-2 transition ${
                active
                  ? "bg-rose-wine text-white shadow-md"
                  : "bg-white/70 text-rose-wine ring-1 ring-rose-wine/10"
              }`}
            >
              <p className="text-[0.6rem] uppercase tracking-[0.2em] opacity-80">
                {n} strip{n === 1 ? "" : "s"}
              </p>
              <p className="font-display text-base font-semibold">{fmt(STRIP_TIERS[n])}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- */
/* StripsSection                                                   */
/* -------------------------------------------------------------- */
export function StripsSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const selections = useStore((s) => s.stripSelections);
  const toggleStrip = useStore((s) => s.toggleStrip);

  const items = CATALOG.strips;
  const count = selections.length;
  const tierPrice = count > 0 ? STRIP_TIERS[count] : 0;

  const handleToggle = (id: string, name: string) => {
    const already = selections.includes(id);
    const ok = toggleStrip(id);
    if (!ok) {
      toast.error(`You can only pick up to ${STRIP_MAX} strips.`);
      return;
    }
    toast.success(already ? `${name} removed` : `${name} added`);
  };

  return (
    <>
      <StripsPricingTable count={count} />

      <div className="mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item, idx) => {
            const active = selections.includes(item.id);
            const photos = SITE.productImages?.[item.id] ?? [];
            const hero = photos[0];

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col rounded-2xl overflow-hidden transition ${
                  active ? "ring-2 ring-rose-wine shadow-lg" : "ring-1 ring-rose-wine/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, item.name)}
                  className="relative w-full aspect-[3/8] bg-white overflow-hidden cursor-pointer p-3"
                  aria-label={`Select ${item.name}`}
                >
                  {hero ? (
                    <img
                      src={hero}
                      alt={item.name}
                      loading="lazy"
                      className="block w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <PlaceholderStrip n={idx + 1} />
                    </div>
                  )}
                  {active && (
                    <span className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-rose-wine text-white shadow-md">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>

                <div className="p-3 bg-white/80 backdrop-blur-sm flex flex-col gap-2">
                  <h4 className="font-display text-base text-rose-wine leading-tight text-center">
                    {item.name}
                  </h4>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id, item.name)}
                      className={`pill-btn !py-1.5 !px-2 !text-[0.7rem] flex-1 ${
                        active ? "!bg-rose-wine !text-white !border-rose-wine" : "pill-btn-hover"
                      }`}
                    >
                      {active ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check className="h-3 w-3" /> Selected
                        </span>
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

        {count > 0 && (
          <p className="mt-4 text-center text-sm text-rose-wine">
            <span className="font-semibold">{count}</span> strip{count === 1 ? "" : "s"} selected ·{" "}
            <span className="font-semibold">{fmt(tierPrice)}</span>
          </p>
        )}
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
/* StripModal — tall image + right-side details + reviews          */
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
  const selections = useStore((s) => s.stripSelections);
  const toggleStrip = useStore((s) => s.toggleStrip);
  const {
    reviews, loading, posting, avg, reviewerId,
    rvName, setRvName, rvText, setRvText, rvRating, setRvRating,
    submitReview, deleteReview,
  } = useProductReviews(item?.id ?? null);

  if (!open || !item) return null;

  const photos = SITE.productImages?.[item.id] ?? [];
  const hero = photos[0];
  const active = selections.includes(item.id);

  const handleToggle = () => {
    const already = active;
    const ok = toggleStrip(item.id);
    if (!ok) return toast.error(`You can only pick up to ${STRIP_MAX} strips.`);
    toast.success(already ? `${item.name} removed` : `${item.name} added`);
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-[220px] aspect-[3/8] max-h-[560px] rounded-xl overflow-hidden bg-white border border-rose-wine/10 shadow-xl relative p-4">
            {hero ? (
              <img src={hero} alt={item.name} className="block w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0">
                <PlaceholderStrip n={stripIndex + 1} />
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-7 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Polaroid Strip</p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{item.name}</h3>
          <ReviewStars avg={avg} count={reviews.length} />
          <div className="mt-4 rounded-xl bg-white/60 p-3 ring-1 ring-rose-wine/10">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-blush-rose">Bundle pricing</p>
            <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="rounded-md bg-white px-1 py-1.5 ring-1 ring-rose-wine/10">
                  <p className="text-[0.6rem] text-dusty-rose">{n}</p>
                  <p className="font-semibold text-rose-wine">{fmt(STRIP_TIERS[n])}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>• Printed on premium matte-finish photo paper</li>
            <li>• 4 photo cells per strip in editorial layout</li>
            <li>• Ships flat with a protective sleeve</li>
          </ul>

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

      <ReviewsPanel
        reviews={reviews} loading={loading} posting={posting} reviewerId={reviewerId}
        rvName={rvName} setRvName={setRvName} rvText={rvText} setRvText={setRvText}
        rvRating={rvRating} setRvRating={setRvRating}
        onSubmit={submitReview} onDelete={deleteReview}
      />
    </ModalShell>
  );
}
