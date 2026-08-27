import { useState } from "react";
import { Wallet, Check, Eye, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { ModalShell } from "./shop";
import { useProductReviews } from "@/lib/use-product-reviews";
import { ReviewsPanel, ReviewStars } from "./reviews-panel";
import { TemplateGrid, TemplateDetailModal } from "./template-picker";
import { ScrollHint } from "./scroll-hint";

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

// A standalone product surfaced after the normal magazine's templates
// (Step 2) — deliberately positioned here rather than up in Step 1 so
// choosing to buy one immediately reveals its own template picker right
// below, instead of sending the customer hunting for it elsewhere. A
// customer can buy several Pocket Magazines in one order; each gets its own
// card + template picker below (tracked as one "unit" per Pocket Magazine —
// see pocketUnits in store.ts), since each one needs its own templates.
export function PocketMagazineSection() {
  const [openModal, setOpenModal] = useState(false);
  const [openUnitCtx, setOpenUnitCtx] = useState<{ uid: string; index: number } | null>(null);

  const pocketUnits = useStore((s) => s.pocketUnits);
  const addPocketUnit = useStore((s) => s.addPocketUnit);
  const removePocketUnit = useStore((s) => s.removePocketUnit);
  const togglePocketTemplate = useStore((s) => s.togglePocketTemplate);
  const randomizePocketTemplates = useStore((s) => s.randomizePocketTemplates);
  const pocketLimit = useStore((s) => s.pocketTemplateLimit());

  const product = CATALOG.pocket[0];
  const quantity = pocketUnits.length;
  const inCart = quantity > 0;
  const hero = pocketHero();
  const items = CATALOG["pocket-templates"];

  const handleAdd = () => {
    addPocketUnit();
    toast.success(
      quantity === 0
        ? `Pocket Magazine selected — pick ${product.templateLimit} template(s) below.`
        : `Another Pocket Magazine added — pick ${product.templateLimit} template(s) for it below.`,
    );
  };

  const handleRemoveLast = () => {
    const last = pocketUnits[pocketUnits.length - 1];
    if (!last) return;
    removePocketUnit(last.uid);
    toast.success("Pocket Magazine removed");
  };

  const openUnitItem = openUnitCtx ? items[openUnitCtx.index] : null;
  const openUnit = openUnitCtx ? pocketUnits.find((u) => u.uid === openUnitCtx.uid) : null;

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
            A standalone keepsake — add it alongside your magazine above, or all on its own. Want more
            than one? Add as many as you like — you'll pick templates for each individually below.
          </p>
        </div>

        <div className="mx-auto max-w-xs">
          <div
            onClick={() => (inCart ? undefined : handleAdd())}
            className={`relative rounded-md sm:rounded-xl p-3 sm:p-4 md:p-5 flex flex-col items-center text-center transition bg-black/15 select-none ${
              inCart ? "ring-2 ring-off-white" : "ring-1 ring-pink-mist/30 cursor-pointer"
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

            {inCart ? (
              <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handleRemoveLast}
                  aria-label="Remove one Pocket Magazine"
                  className="grid h-8 w-8 place-items-center rounded-full border border-pink-mist/50 text-off-white hover:bg-off-white/10"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-10 font-display text-lg text-off-white">× {quantity}</span>
                <button
                  type="button"
                  onClick={handleAdd}
                  aria-label="Add another Pocket Magazine"
                  className="grid h-8 w-8 place-items-center rounded-full border border-pink-mist/50 text-off-white hover:bg-off-white/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 min-w-0 rounded-full px-3 py-1.5 text-[0.7rem] font-medium transition border truncate bg-transparent text-off-white border-pink-mist/50 hover:bg-off-white/10"
                >
                  Select
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
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs tracking-[0.2em] text-pink-mist">
          ♡ a whole story, pocket-sized ♡
        </p>
      </div>

      {pocketUnits.map((unit, i) => {
        const anchorId = `pocket-unit-${unit.uid}`;
        const incomplete = unit.templateIds.length < pocketLimit;
        return (
          <div key={unit.uid} id={anchorId} className="relative">
            <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
              <button
                type="button"
                onClick={() => {
                  removePocketUnit(unit.uid);
                  toast.success(`Pocket Magazine #${i + 1} removed`);
                }}
                aria-label={`Remove Pocket Magazine #${i + 1}`}
                className="grid h-7 w-7 place-items-center rounded-full bg-off-white/15 text-off-white hover:bg-off-white/25"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <TemplateGrid
              icon={<Wallet className="h-5 w-5" />}
              heading={`POCKET MAGAZINE #${i + 1} TEMPLATES`}
              statusLabel={`${unit.templateIds.length} of ${pocketLimit} selected`}
              items={items}
              selectedIds={unit.templateIds}
              limit={pocketLimit}
              onToggle={(id, label) => {
                const already = unit.templateIds.includes(id);
                const ok = togglePocketTemplate(unit.uid, id);
                if (!ok)
                  return toast.error(
                    `You can only pick ${pocketLimit} template(s) for this Pocket Magazine.`,
                  );
                toast.success(already ? `${label} removed` : `${label} selected`);
              }}
              onRandomize={() => {
                const n = randomizePocketTemplates(unit.uid);
                if (n > 0) toast.success(`Randomised ${n} template${n === 1 ? "" : "s"} ✨`);
              }}
              onOpen={(index) => setOpenUnitCtx({ uid: unit.uid, index })}
            />
            {incomplete && (
              <ScrollHint
                text={`Pick your ${pocketLimit} template${pocketLimit === 1 ? "" : "s"} for Pocket Magazine #${i + 1}`}
                targetId={anchorId}
              />
            )}
          </div>
        );
      })}

      <TemplateDetailModal
        open={!!openUnitCtx}
        item={openUnitItem}
        templateIndex={openUnitCtx?.index ?? -1}
        active={!!openUnitItem && !!openUnit?.templateIds.includes(openUnitItem.id)}
        limit={pocketLimit}
        eyebrow="Pocket Magazine Spread"
        limitErrorSuffix="for this Pocket Magazine"
        onToggle={(id) => (openUnitCtx ? togglePocketTemplate(openUnitCtx.uid, id) : false)}
        onClose={() => setOpenUnitCtx(null)}
      />

      <PocketModal open={openModal} onClose={() => setOpenModal(false)} />
    </>
  );
}

/* -------------------------------------------------------------- */
function PocketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const product = CATALOG.pocket[0];
  const pocketUnits = useStore((s) => s.pocketUnits);
  const addPocketUnit = useStore((s) => s.addPocketUnit);
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

  const inCart = pocketUnits.length > 0;
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
            <li>• Pick any 3 templates below, per Pocket Magazine</li>
            <li>• Buy more than one — each gets its own template picks</li>
            <li>• Can be ordered alongside your Standard or Mini magazine</li>
          </ul>

          <button
            onClick={() => {
              addPocketUnit();
              toast.success(
                inCart
                  ? `Another ${product.name} added — pick ${product.templateLimit} template(s) for it.`
                  : `${product.name} selected — pick ${product.templateLimit} template(s).`,
              );
              onClose();
            }}
            className="pill-btn pill-btn-hover pill-primary mt-6 w-full !py-3 !text-base"
          >
            {inCart ? "Add another one" : `Choose ${product.name}`}
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
