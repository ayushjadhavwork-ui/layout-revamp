import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ImageIcon } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import { SITE } from "@/lib/site-content";
import { Marquee, SectionHead, Footer } from "./index";
import { ModalShell } from "@/components/site/shop";

export const Route = createFileRoute("/happy-customers")({
  component: HappyCustomersPage,
  head: () => ({
    meta: [
      { property: "og:title", content: "Happy Customers — The Layout" },
      { property: "og:description", content: "Real messages from real customers of The Layout." },
    ],
  }),
});

function HappyCustomersPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const entries = SITE.happyCustomers;

  return (
    <div className="relative min-h-screen">
      <div className="orbs" aria-hidden>
        <span className="orb orb-1" /><span className="orb orb-2" /><span className="orb orb-3" />
      </div>

      <Marquee />

      <header className="sticky top-0 z-40 px-4 pt-4">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={logoAsset.url} alt={SITE.brand.name} className="h-9 w-9 shrink-0 object-contain" />
            <span className="font-display text-2xl text-rose-wine truncate">{SITE.brand.name}</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-wine hover:text-blush-rose transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>
        </nav>
      </header>

      <section className="relative z-10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="From our inbox"
            title="Happy customers"
            sub="Real messages from people who've received their Layout keepsake ♡"
          />

          {entries.length === 0 ? (
            <div className="glass mx-auto max-w-md rounded-3xl p-10 text-center">
              <Heart className="mx-auto h-8 w-8 text-blush-rose" strokeWidth={1.5} />
              <p className="mt-4 font-display text-xl text-rose-wine">More coming soon ♡</p>
              <p className="mt-2 text-sm text-dusty-rose">
                We're still gathering our favourite messages — check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenIdx(i)}
                  className="group text-left rounded-3xl overflow-hidden bg-white shadow-md ring-1 ring-rose-wine/10 hover:shadow-xl hover:-translate-y-0.5 transition"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                    {entry.images[0] ? (
                      <img
                        src={entry.images[0]}
                        alt={entry.heading || "Happy customer message"}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-rose-wine/40">
                        <ImageIcon className="h-10 w-10" strokeWidth={1.25} />
                      </div>
                    )}
                    {entry.images.length > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-rose-wine/90 px-2.5 py-1 text-[0.65rem] font-semibold text-off-white shadow">
                        +{entry.images.length - 1} more
                      </span>
                    )}
                  </div>
                  {entry.heading && (
                    <div className="p-4">
                      <p className="font-display text-lg text-rose-wine leading-tight">{entry.heading}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {openIdx !== null && entries[openIdx] && (
        <HappyCustomerLightbox
          entry={entries[openIdx]}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </div>
  );
}

function HappyCustomerLightbox({
  entry,
  onClose,
}: {
  entry: { heading: string; images: string[] };
  onClose: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const count = entry.images.length;
  const current = ((slide % count) + count) % count;
  const goPrev = () => setSlide((current - 1 + count) % count);
  const goNext = () => setSlide((current + 1) % count);

  return (
    <ModalShell onClose={onClose} maxW="max-w-lg">
      {entry.heading && (
        <h3 className="font-display text-2xl text-rose-wine mb-4 pr-8">{entry.heading}</h3>
      )}
      <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-100">
        <img
          src={entry.images[current]}
          alt={entry.heading || `Screenshot ${current + 1}`}
          className="block w-full max-h-[70vh] object-contain"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-rose-wine shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-rose-wine shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === current ? "bg-rose-wine" : "bg-rose-wine/25"}`} />
          ))}
        </div>
      )}
    </ModalShell>
  );
}
