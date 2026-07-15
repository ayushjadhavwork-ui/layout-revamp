import { useEffect, useState } from "react";
import { BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";

/* Decorative magazine-spread placeholder (uses only design tokens) */
function TemplatePlaceholder({ n }: { n: number }) {
  const palettes = [
    ["#f4c9d1", "#8b3a52"],
    ["#eadfd0", "#6e4a2c"],
    ["#f2d6c9", "#7a2a2a"],
    ["#dfe7d5", "#3f6b48"],
    ["#e0d3ee", "#4a3f7a"],
  ];
  const [c1, c2] = palettes[(n - 1) % palettes.length];
  return (
    <div className="absolute inset-0 grid grid-cols-2">
      <div
        className="flex items-center justify-center border-r border-white/60"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        <span className="font-display italic text-white/90 text-lg">Left</span>
      </div>
      <div
        className="flex items-center justify-center"
        style={{ background: `linear-gradient(225deg, ${c1}, ${c2})` }}
      >
        <span className="font-display italic text-white/90 text-lg">Right</span>
      </div>
    </div>
  );
}

function templateHero(id: string): string | undefined {
  return SITE.productImages?.[id]?.[0];
}

/* -------------------------------------------------------------- */
/* Section                                                         */
/* -------------------------------------------------------------- */
export function TemplatesSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedIds = useStore((s) => s.selectedTemplateIds);
  const limit = useStore((s) => s.templateLimit());
  const toggleTemplate = useStore((s) => s.toggleTemplate);

  const items = CATALOG.templates;

  const handleToggle = (id: string, name: string) => {
    if (!selectedSizeId) return toast.error("Pick a page package first.");
    const already = selectedIds.includes(id);
    const ok = toggleTemplate(id);
    if (!ok) return toast.error(`You can only pick ${limit} template(s) for this package.`);
    toast.success(already ? `${name} removed` : `${name} selected`);
  };

  return (
    <>
      <div className="mt-6 rounded-3xl p-6 md:p-10 bg-rose-wine">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-off-white">
            <BookOpen className="h-5 w-5" />
            <span className="font-display text-2xl tracking-[0.2em]">RIGHT – LEFT SIDE TEMPLATES</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
            {selectedSizeId
              ? `${selectedIds.length} of ${limit} selected`
              : "Pick a package first to unlock"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {items.map((item, idx) => {
            const active = selectedIds.includes(item.id);
            const disabled =
              !selectedSizeId || (selectedIds.length >= limit && !active);
            const hero = templateHero(item.id);
            const label = `Template ${String(idx + 1).padStart(2, "0")}`;

            return (
              <div
                key={item.id}
                className={`relative rounded-xl p-3 md:p-4 flex flex-col items-center text-center transition bg-black/15 ${
                  active ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30"
                } ${disabled ? "opacity-50" : ""}`}
              >
                {active && (
                  <span className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}

                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-white/5">
                  {hero ? (
                    <img
                      src={hero}
                      alt={label}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <TemplatePlaceholder n={idx + 1} />
                  )}
                </div>

                <p className="mt-3 font-display tracking-[0.2em] text-xs text-off-white">
                  {label}
                </p>

                <div className="mt-3 flex gap-1.5 w-full">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleToggle(item.id, label)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition border ${
                      active
                        ? "bg-off-white text-rose-wine border-off-white"
                        : "bg-transparent text-off-white border-pink-mist/50 hover:bg-off-white/10"
                    } disabled:cursor-not-allowed`}
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
          ♡ mix &amp; match your favourite spreads ♡
        </p>
      </div>

      <TemplateModal
        open={!!openId}
        templateIndex={items.findIndex((t) => t.id === openId)}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}

/* -------------------------------------------------------------- */
/* Modal                                                           */
/* -------------------------------------------------------------- */
function TemplateModal({
  open,
  templateIndex,
  onClose,
}: {
  open: boolean;
  templateIndex: number;
  onClose: () => void;
}) {
  const item = templateIndex >= 0 ? CATALOG.templates[templateIndex] : null;
  const selectedIds = useStore((s) => s.selectedTemplateIds);
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const limit = useStore((s) => s.templateLimit());
  const toggleTemplate = useStore((s) => s.toggleTemplate);

  const [reviews, setReviews] = useState<{ name: string; rating: number; text: string }[]>([]);
  const [rvName, setRvName] = useState("");
  const [rvText, setRvText] = useState("");
  const [rvRating, setRvRating] = useState(5);

  useEffect(() => {
    if (open) {
      setReviews([
        { name: "Ishita B.", rating: 5, text: "Loved the layout — exactly what I imagined." },
        { name: "Karan D.", rating: 5, text: "Print looks so premium in person." },
      ]);
      setRvName(""); setRvText(""); setRvRating(5);
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const label = `Template ${String(templateIndex + 1).padStart(2, "0")}`;
  const hero = templateHero(item.id);
  const active = selectedIds.includes(item.id);
  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 5;

  const handleToggle = () => {
    if (!selectedSizeId) return toast.error("Pick a page package first.");
    const already = active;
    const ok = toggleTemplate(item.id);
    if (!ok) return toast.error(`You can only pick ${limit} template(s) for this package.`);
    toast.success(already ? `${label} removed` : `${label} selected`);
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
      <div className="grid gap-6 md:grid-cols-12 items-start">
        <div className="md:col-span-6 flex justify-center">
          <div className="w-full max-w-[560px] rounded-xl overflow-hidden bg-white shadow-2xl ring-1 ring-rose-wine/10">
            {hero ? (
              <img src={hero} alt={label} className="w-full h-auto object-contain" />
            ) : (
              <div className="aspect-[4/3] relative">
                <TemplatePlaceholder n={templateIndex + 1} />
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-6 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Magazine Spread</p>
          <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{label}</h3>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-blush-rose">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</span>
            <span className="text-dusty-rose">{avg} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-blush-rose">Included</p>
          <div className="mt-4 h-px bg-rose-wine/10" />
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">{item.desc}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
            <li>• Symmetric right–left spread</li>
            <li>• Editorial typography &amp; grid</li>
            <li>• Fully customised with your photos</li>
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
