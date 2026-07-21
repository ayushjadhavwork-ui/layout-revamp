import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Sparkles, Instagram, Twitter, Linkedin, Heart } from "lucide-react";
import { Toaster, toast } from "sonner";
import logoAsset from "@/assets/logo.png.asset.json";
import { CATALOG, type Category, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";
import { TiledSection } from "@/components/site/TiledSection";
import {
  ProductGrid, ProductModal, CartDrawer, CustomerInfoModal,
  PaymentModal, SuccessModal, CartButton, StepIndicator, ModalShell,
} from "@/components/site/shop";

import { StripsSection } from "@/components/site/strips-section";
import { PacksSection } from "@/components/site/packs-section";
import { TemplatesSection } from "@/components/site/templates-section";
import { SizesSection } from "@/components/site/sizes-section";
import { AddonsSection } from "@/components/site/addons-section";
import { CombosSection } from "@/components/site/combos-section";
import { SpinWheel } from "@/components/site/spin-wheel";


export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { property: "og:title", content: "The Layout — Custom Magazines" },
      { property: "og:description", content: "Design your own custom magazine with curated templates, polaroid packs, and gift add-ons." },
    ],
  }),
});

const NAV = [
  { label: "How", href: "#how" },
  { label: "Build", href: "#build" },
  { label: "Templates", href: "#templates" },
  { label: "Founders", href: "#founders" },
];

const STEPS = [
  { n: 1, t: "Select pages", d: "Choose the number of pages you want for your magazine." },
  { n: 2, t: "Pick templates", d: "Select the number of templates according to the pages you've chosen." },
  { n: 3, t: "Add extras", d: "Add any optional add-ons you'd like — gift wrapping, a personalised letter, or other extras." },
  { n: 4, t: "Choose delivery", d: "Pick your preferred delivery: Express Shipping (₹100) or Standard Shipping (Free)." },
  { n: 5, t: "Checkout & confirm", d: "Add everything to your cart, checkout, and send us a screenshot of your order summary to confirm." },
];

const MANDATORY: {
  t: string;
  d: string;
  long: string;
  bullets: string[];
}[] = [
  {
    t: "Front Cover",
    d: "Your title, hero image and issue mark.",
    long: "The Front Cover sets the tone of the entire magazine — your name or title, the issue number, and the hero photograph that anchors your story.",
    bullets: [
      "Custom title & issue mark",
      "Hero image with editorial framing",
      "Matte or gloss cover finish",
    ],
  },
  {
    t: "First Page",
    d: "A welcoming opener — a letter, a dedication.",
    long: "The First Page welcomes the reader — a personal letter, a dedication, or a quote that captures the spirit of your magazine.",
    bullets: [
      "Personal note or dedication",
      "Custom typography & layout",
      "Optional signature or photo",
    ],
  },
  {
    t: "Last Page",
    d: "A closing note, credits, a signature.",
    long: "The Last Page closes the story — a heartfelt sign-off, credits to contributors, or a final photo that lingers.",
    bullets: [
      "Closing note or signature",
      "Contributor credits",
      "Optional final photograph",
    ],
  },
  {
    t: "Back Cover",
    d: "Barcode, tagline and finishing details.",
    long: "The Back Cover is the finishing touch — tagline, barcode, and the little details that make your magazine feel real.",
    bullets: [
      "Custom tagline",
      "Editorial barcode",
      "Matching finish to front cover",
    ],
  },
];


const TIMELINE = [
  { t: "Design",   d: "1–2 working days" },
  { t: "Printing", d: "1 day after approval" },
  { t: "Delivery", d: "7–8 days (location dependent)" },
];

function Home() {
  const [modalCat, setModalCat] = useState<Category | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const clear = useStore((s) => s.clear);
  const customer = useStore((s) => s.customer);
  const cartCount = useStore((s) => s.cart.length);

  const openProduct = (cat: Category) => (p: Product) => {
    setModalCat(cat);
    setModalProduct(p);
  };

  const startCheckout = () => {
    if (cartCount === 0) {
      toast.error("Add something to your cart first.");
      return;
    }
    setCartOpen(false);
    if (!customer || !customer.name || !customer.phone || !customer.email || !customer.address) {
      toast.message("Please fill your details to continue.");
      setInfoOpen(true);
    } else {
      setPayOpen(true);
    }
  };

  return (
    <div id="top" className="relative min-h-screen">
      <Toaster position="top-center" richColors />
      <div className="orbs" aria-hidden>
        <span className="orb orb-1" /><span className="orb orb-2" /><span className="orb orb-3" />
      </div>

      <Marquee />
      <Nav onCart={() => setCartOpen(true)} />
      <Showreel />
      <CustomImageSection />
      
      <Hero />




      <Milestone />



      <TiledSection tiles={SITE.backgrounds.howToOrder}>
        <HowToOrder />
      </TiledSection>

      
      <CreateMagazineSection />

      <section className="pattern-satin">
        <Mandatory />
        
      </section>


      <TiledSection tiles={SITE.backgrounds.customize}>
        <div id="build" className="relative z-10 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Step 1" title="Choose your package" sub="Pricing scales with page count. Front & back covers included." />
            <SizesSection />
          </div>
        </div>

        <div id="templates" className="relative z-10 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Step 2" title="Pick your templates" sub="Choose the exact number your package allows. Click a card for details." />
            <StepIndicator />
            <TemplatesSection />
          </div>
        </div>

        <div id="extras" className="relative z-10 px-4 py-20">
          <div className="mx-auto max-w-6xl space-y-16">
            <div>
              <SectionHead eyebrow="Curated" title="Combos" sub="Bundled favourites at a soft price — pick one and go." />
              <CombosSection />
            </div>
            <div>
              <SectionHead eyebrow="Step 3" title="Add-ons" sub="Little extras that make the keepsake feel personal." />
              <AddonsSection />
            </div>
            <div>
              <SectionHead eyebrow="Step 4" title="Polaroid packs" sub="Real polaroid keepsakes — tap a pack to add, or View for the full look." />
              <PacksSection />
            </div>

            <div>
              <SectionHead eyebrow="Step 5" title="Polaroid Strips" sub="Click a strip to add it, or tap View for details." />
              <StripsSection />
            </div>
            <div>
              <SectionHead eyebrow="Step 6" title="Delivery" />
              <ProductGrid category="delivery" items={CATALOG.delivery} onOpen={openProduct("delivery")} cols="sm:grid-cols-2" />
            </div>
          </div>
        </div>

      <section className="relative z-10 px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="glass rounded-3xl p-8 md:p-10 text-center">
            <h3 className="font-display text-3xl md:text-4xl text-rose-wine">Ready to place your order?</h3>
            <p className="mt-2 text-dusty-rose">We'll ask for your shipping details and take you to payment.</p>
            <button
              onClick={startCheckout}
              className="pill-btn pill-btn-hover pill-primary mt-6 mx-auto"
              type="button"
            >
              Complete my order <ArrowUpRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-xs text-dusty-rose">{cartCount} item{cartCount === 1 ? "" : "s"} in cart</p>
            <a
              href={SITE.links.behindTheLayout}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-rose-wine underline underline-offset-4 hover:text-blush-rose"
            >
              Behind The Layout →
            </a>
          </div>
        </div>
      </section>

      <section className="pattern-satin"></section>
        <Timeline />
      <section/>
      
      </TiledSection>
      <TiledSection tiles={SITE.backgrounds.founders}>
        <Founders />
      </TiledSection>

      <section className="pattern-gingham">
        <Journey />
      </section>         

      <Reels />
      <Policy />



      <Footer />

      <ProductModal open={!!modalProduct} category={modalCat} product={modalProduct} onClose={() => setModalProduct(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={startCheckout} />
      <CustomerInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} onSubmit={() => { setInfoOpen(false); setPayOpen(true); }} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onDone={(id) => { setPayOpen(false); setOrderId(id); setSuccessOpen(true); }} />
      <SuccessModal open={successOpen} onClose={() => { setSuccessOpen(false); clear(); }} orderId={orderId} />

      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 pill-btn pill-btn-hover pill-primary shadow-xl"
        >
          Cart · {cartCount}
        </button>
      )}
    </div>
  );
}

function Marquee() {
  const items = [...SITE.marquee, ...SITE.marquee];
  return (
    <div className="relative z-40 w-full overflow-hidden bg-rose-wine text-off-white">
      <div className="marquee-track py-2 text-sm font-medium tracking-wide">
        {items.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            {t}
            <span className="opacity-60">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const REELS = [
  "https://www.instagram.com/reel/DadWWA1I45L/",
  "https://www.instagram.com/reel/DaalBsgoITb/",
  "https://www.instagram.com/reel/DaWLtOkzxqR/",
  "https://www.instagram.com/reel/DaQZQ2TKI8L/",
];

function useInstagramEmbeds() {
  useEffect(() => {
    const id = "ig-embed-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id; s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      document.body.appendChild(s);
    } else {
      // @ts-expect-error instgrm global
      window.instgrm?.Embeds?.process?.();
    }
  }, []);
}

function Reels() {
  useInstagramEmbeds();
  return (
    <section id="reels" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="From our feed" title="Reels & stories" sub="Peek into recent projects, unboxings and behind-the-scenes moments." />
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory">
          {SITE.reels.map((url) => (
            <div key={url} className="snap-center shrink-0 w-[320px] sm:w-[360px] glass rounded-3xl p-3">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={url}
                data-instgrm-version="14"
                style={{ background: "#fff", border: 0, margin: 0, minWidth: "300px", width: "100%" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <a href={SITE.links.instagram} target="_blank" rel="noreferrer" className="pill-btn pill-btn-hover">
            <Instagram className="h-4 w-4" /> Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

function Nav({ onCart }: { onCart: () => void }) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-3">
        <a href="#top" className="flex items-center gap-3 min-w-0">
          <img src={logoAsset.url} alt="The Layout" className="h-9 w-9 shrink-0 object-contain" />
          <span className="font-display text-2xl text-rose-wine truncate">The Layout</span>
        </a>
        <ul className="hidden items-center gap-6 text-sm text-neutral-700 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="hover:text-rose-wine transition-colors">{n.label}</a>
            </li>
          ))}
        </ul>
        <CartButton onOpen={onCart} />
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <TiledSection 
      tiles={SITE.backgrounds.hero} 
      className="px-4 pt-10 pb-16"
    >
      <div className="glass mx-auto max-w-[1400px] rounded-[2.5rem] px-6 py-20 md:px-16 md:py-28 text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-dusty-rose">Welcome to</p>
        <img
          src={logoAsset.url}
          alt="The Layout"
          className="mx-auto mt-6 h-40 w-40 md:h-56 md:w-56 object-contain"
        />
        <p className="mx-auto mt-6 max-w-2xl text-xl md:text-2xl font-display italic text-rose-wine">
          Editorial storytelling, printed with <span className="text-blush-rose">quiet obsession.</span>
        </p>

      </div>
    </TiledSection>
  );
}

function Showreel() {
  return (
    // 1. Removed side/bottom padding (px-4 pb-16) so it touches the absolute edges
    // 2. Added 'w-full' to ensure it spans the entire screen
    <section id="showreel" className="relative z-10 w-full">
      {/* Removed the 'max-w-[1400px]' limit, the 'rounded-[2.5rem]', 
        the border, and the shadow. 
      */}
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={SITE.showreelVideo} type="video/mp4" />
        </video>
      </div>
    </section>
  );
}

function Milestone() {
  useInstagramEmbeds();
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div className="glass rounded-3xl p-3 overflow-hidden">
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={SITE.milestoneReel.url}
            data-instgrm-version="14"
            style={{ background: "#fff", border: 0, margin: 0, minWidth: "300px", width: "100%" }}
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-blush-rose">A moment we'll never forget</p>
          <h2 className="mt-3 font-display text-5xl md:text-6xl text-rose-wine leading-[0.95]">
            {SITE.milestoneReel.heading}
          </h2>
          <p className="mt-6 text-neutral-700 leading-relaxed">
            {SITE.milestoneReel.body} <Heart className="inline h-5 w-5 fill-rose-wine text-rose-wine" />
          </p>
          <a href={SITE.milestoneReel.url} target="_blank" rel="noreferrer" className="pill-btn pill-btn-hover pill-primary mt-6">
            Watch on Instagram <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}


function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-blush-rose">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl md:text-6xl text-rose-wine">{title}</h2>
      {sub && <p className="mt-3 text-dusty-rose max-w-2xl mx-auto">{sub}</p>}
    </div>
  );
}

function HowToOrder() {
  return (
    <div id="how" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Process" title="How to order" sub="Five simple steps from idea to doorstep." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="step-card">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-4xl text-rose-wine/70">0{s.n}</span>
                <span className="h-2 w-2 rounded-full bg-blush-rose" />
              </div>
              <h4 className="font-display text-2xl text-rose-wine">{s.t}</h4>
              <p className="mt-2 text-sm text-neutral-700">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function MandatoryPlaceholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blush-rose/30 via-pink-mist/40 to-rose-wine/20 text-rose-wine">
      <span className="font-display italic text-lg opacity-70">The Layout</span>
      <span className="mt-1 text-[0.6rem] uppercase tracking-[0.35em] opacity-70">{label}</span>
    </div>
  );
}

function Mandatory() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const active = openIdx !== null ? MANDATORY[openIdx] : null;
  const photo = active ? SITE.productImages?.[`mandatory-${openIdx! + 1}`]?.[0] : undefined;

  return (
    <div className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Included by default" title="Mandatory pages" sub="Tap any page to view it in isolation." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MANDATORY.map((m, i) => {
            const hero = SITE.productImages?.[`mandatory-${i + 1}`]?.[0];
            return (
              <button
                key={m.t}
                type="button"
                onClick={() => setOpenIdx(i)}
                className="group text-left rounded-2xl overflow-hidden bg-white shadow-md ring-1 ring-rose-wine/10 hover:shadow-xl hover:-translate-y-0.5 transition"
              >
                <div className="relative aspect-[7/10] overflow-hidden bg-neutral-100">
                  {hero ? (
                    <img src={hero} alt={m.t} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-center" />
                  ) : (
                    <MandatoryPlaceholder label={m.t} />
                  )}
                </div>
                <div className="p-4 text-center">
                  <h4 className="font-display text-xl text-rose-wine">{m.t}</h4>
                  <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{m.d}</p>
                  <span className="mt-3 inline-block text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-blush-rose group-hover:text-rose-wine">
                    View page →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <ModalShell onClose={() => setOpenIdx(null)} maxW="max-w-3xl">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-[340px] aspect-[7/10] rounded-xl overflow-hidden bg-white shadow-2xl ring-1 ring-rose-wine/10 relative">
                {photo ? (
                  <img src={photo} alt={active.t} className="absolute inset-0 h-full w-full object-cover object-center" />
                ) : (
                  <MandatoryPlaceholder label={active.t} />
                )}
              </div>
            </div>
            <div className="md:col-span-6 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blush-rose">Mandatory page</p>
              <h3 className="font-display text-3xl md:text-4xl text-rose-wine mt-2 leading-tight">{active.t}</h3>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700">{active.long}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-neutral-700">
                {active.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-dusty-rose italic">
                Included with every magazine at no extra cost.
              </p>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}


function Timeline() {
  return (
    <div id="timeline" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Timeline" title="From design to your hands" />
        <div className="grid gap-4 md:grid-cols-3">
          {TIMELINE.map((t, i) => (
            <div key={t.t} className="step-card">
              <span className="font-display text-4xl text-rose-wine/60">0{i + 1}</span>
              <h4 className="mt-2 font-display text-2xl text-rose-wine">{t.t}</h4>
              <p className="mt-1 text-sm text-neutral-700">{t.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Founders() {
  return (
    <div id="founders" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="The team" title="Meet the founders" />
        <div className="grid gap-6 md:grid-cols-2">
          {SITE.founders.map((f, i) => (
            <div key={f.name} className="glass rounded-3xl p-8">
              <div className="flex gap-6">
                {f.photo ? (
                  <img src={f.photo} alt={f.name} className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className={`grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${i === 0 ? "from-blush-rose to-rose-wine" : "from-pink-mist to-dusty-rose"} font-display text-4xl text-white shadow-lg`}>
                    {f.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-display text-3xl text-rose-wine">{f.name}</h4>
                  <p className="text-xs uppercase tracking-[0.3em] text-dusty-rose">{f.role}</p>
                  <p className="mt-3 text-sm text-neutral-700">{f.bio}</p>
                  <div className="mt-4 flex gap-2">
                    <SocialIcon icon={<Instagram className="h-4 w-4" />} href={SITE.links.instagram} />
                    <SocialIcon icon={<Twitter className="h-4 w-4" />} href={SITE.links.twitter} />
                    <SocialIcon icon={<Linkedin className="h-4 w-4" />} href={SITE.links.linkedin} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Policy() {
  return (
    <section id="policy" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="glass rounded-3xl p-8 md:p-10">
          <h2 className="font-display text-4xl text-rose-wine">Payment & return policy</h2>
          <ul className="mt-6 space-y-3 text-neutral-700">
            <li className="flex gap-3"><span className="text-blush-rose">•</span> We only accept prepaid orders.</li>
            <li className="flex gap-3"><span className="text-blush-rose">•</span> Payments accepted via UPI ID / QR code / bank transfer.</li>
            <li className="flex gap-3"><span className="text-blush-rose">•</span> Order processing starts only after payment confirmation.</li>
            <li className="flex gap-3"><span className="text-blush-rose">•</span> No return or refund policy once the order is placed.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function SocialIcon({ icon, href = "#" }: { icon: React.ReactNode; href?: string }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-rose-wine/20 bg-white/50 text-rose-wine transition-colors hover:bg-rose-wine hover:text-white">
      {icon}
    </a>
  );
}

function Footer() {
  return (
    <footer id="contact" className="relative z-10 px-4 pb-10">
      <div className="glass mx-auto max-w-6xl rounded-3xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" className="h-10 w-10" />
            <div>
              <p className="font-display text-2xl text-rose-wine">{SITE.brand.name}</p>
              <p className="text-xs text-dusty-rose">{SITE.brand.tagline}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <SocialIcon icon={<Instagram className="h-4 w-4" />} href={SITE.links.instagram} />
            <SocialIcon icon={<Twitter className="h-4 w-4" />} href={SITE.links.twitter} />
            <SocialIcon icon={<Linkedin className="h-4 w-4" />} href={SITE.links.linkedin} />
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-dusty-rose">© {new Date().getFullYear()} The Layout. All rights reserved.</p>
      </div>
    </footer>
  );
}

function Journey() {
  const { title, subtitle, blocks, color } = SITE.stats;
  return (
    <div id="journey" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-wide text-rose-wine">
            {title}
          </h2>
          <p className="mt-2 text-sm text-dusty-rose">{subtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {blocks.map((s) => (
            <div
              key={s.small}
              className="rounded-2xl p-8 text-center text-white shadow-[0_20px_60px_-20px_rgba(120,20,50,0.5)]"
              style={{ backgroundColor: color }}
            >
              <p className="font-display text-4xl md:text-5xl font-bold tracking-tight">{s.big}</p>
              {s.progress != null && (
                <div className="mt-3 mx-auto h-1.5 w-3/4 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${s.progress}%` }} />
                </div>
              )}
              <p className="mt-3 text-xs uppercase tracking-[0.25em] text-white/80">{s.small}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomImageSection() {
  return (
    // Removed all side padding (px-4) and spacing so it touches the absolute edges
    <section className="relative z-10 w-full">
      {/* 1. Removed the 'max-w-6xl' wrapper so it can span 100% of the screen.
        2. Removed 'rounded' and 'shadow' classes.
        3. Kept the aspect ratio and object-cover so the text stays perfectly centered.
      */}
      <img 
        src="/media/bg/2.svg" 
        alt="Showcase" 
        className="block w-full aspect-[4/3] md:aspect-auto object-cover object-center"
      />
    </section>
  );
}

function CreateMagazineSection() {
  return (
    <section className="relative z-10 w-full">
      <img 
        src="/media/bg/3.svg" 
        alt="Showcase" 
        // Swapped aspect-[4/3] and object-cover for h-auto
        // This makes the image scale proportionally without ever cropping the sides
        className="block w-full h-auto object-center"
      />
    </section>
  );
}




// keep unused imports referenced if any tree-shake concern
void useRef;
