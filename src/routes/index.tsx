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
  PaymentModal, SuccessModal, CartButton, StepIndicator,
} from "@/components/site/shop";

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

const REEL_19M = "https://www.instagram.com/reel/DUi4r8pCMgy/";


const MANDATORY = [
  { t: "Front Cover", d: "Your title, hero image and issue mark." },
  { t: "First Page",  d: "A welcoming opener — a letter, a dedication." },
  { t: "Last Page",   d: "A closing note, credits, a signature." },
  { t: "Back Cover",  d: "Barcode, tagline and finishing details." },
];

const TIMELINE = [
  { t: "Design",   d: "1–2 working days" },
  { t: "Printing", d: "1 day after approval" },
  { t: "Delivery", d: "7–8 days (location dependent)" },
];

const FOUNDERS = [
  { name: "Founder One", role: "Creative Director", bio: "A designer with an eye for editorial detail. She curates every layout, colour story and cover — obsessing over the little things so your keepsake feels timeless." },
  { name: "Founder Two", role: "Operations & Print", bio: "The operator and storyteller. He handles print, quality and delivery — making sure every magazine arrives exactly how you imagined it." },
];

const MARQUEE_ITEMS = [
  "Use code LAYOUT10 for 10% off ✨",
  "Free standard shipping on all orders",
  "Handcrafted in small batches",
  "New templates dropped this month",
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
      <Hero />
      <Showreel />
      <Milestone />

      <section className="pattern-gingham">
        <HowToOrder />
      </section>

      

      <section className="pattern-satin">
        <Mandatory />
        <Timeline />
      </section>


      <section id="build" className="relative z-10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHead eyebrow="Step 1" title="Choose your package" sub="Pricing scales with page count. Front & back covers included." />
          <ProductGrid category="sizes" items={CATALOG.sizes} onOpen={openProduct("sizes")} />
        </div>
      </section>

      <section id="templates" className="relative z-10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHead eyebrow="Step 2" title="Pick your templates" sub="Choose the exact number your package allows. Click a card for details." />
          <StepIndicator />
          <ProductGrid category="templates" items={CATALOG.templates} onOpen={openProduct("templates")} />
        </div>
      </section>

      <section id="extras" className="relative z-10 px-4 py-20">
        <div className="mx-auto max-w-6xl space-y-16">
          <div>
            <SectionHead eyebrow="Step 3" title="Add-ons" sub="Little extras that make the keepsake feel personal." />
            <ProductGrid category="addons" items={CATALOG.addons} onOpen={openProduct("addons")} cols="sm:grid-cols-2" />
          </div>
          <div>
            <SectionHead eyebrow="Step 4" title="Polaroid packs" />
            <ProductGrid category="polaroids" items={CATALOG.polaroids} onOpen={openProduct("polaroids")} cols="sm:grid-cols-2" />
          </div>
          <div>
            <SectionHead eyebrow="Step 5" title="Polaroid Strips" sub="Click a pill to add it, or tap View More for details." />
            <ProductGrid category="strips" items={CATALOG.strips} onOpen={openProduct("strips")} cols="sm:grid-cols-2 lg:grid-cols-3" />
          </div>
          <div>
            <SectionHead eyebrow="Step 6" title="Delivery" />
            <ProductGrid category="delivery" items={CATALOG.delivery} onOpen={openProduct("delivery")} cols="sm:grid-cols-2" />
          </div>
        </div>
      </section>

      <section className="pattern-gingham">
        <Founders />
        <Journey />
      </section>
      <Reels />
      <Policy />

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
              href="https://www.instagram.com/thelayout"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-rose-wine underline underline-offset-4 hover:text-blush-rose"
            >
              Behind The Layout →
            </a>
          </div>
        </div>
      </section>

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
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
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
          {REELS.map((url) => (
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
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="pill-btn pill-btn-hover">
            <Instagram className="h-4 w-4" /> Follow @thelayout
          </a>
        </div>
      </div>
    </section>
  );
}

function Nav({ onCart }: { onCart: () => void }) {
  return (
    <header className="sticky top-4 z-40 px-4 mt-4">
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
    <section className="px-4 pt-10 pb-16">
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
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#how" className="pill-btn pill-btn-hover">How it works</a>
          <a href="#build" className="pill-btn pill-btn-hover pill-primary">Customize magazine <ArrowUpRight className="h-4 w-4" /></a>
          <a href="#build" className="pill-btn pill-btn-hover">Personalised magazine <Sparkles className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}

function Showreel() {
  return (
    <section id="showreel" className="px-4 pb-16">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[2.5rem] border border-white/40 bg-black shadow-[0_40px_120px_-40px_rgba(193,71,109,0.5)]">
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/showreel.mp4" type="video/mp4" />
          </video>
        </div>
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
            data-instgrm-permalink={REEL_19M}
            data-instgrm-version="14"
            style={{ background: "#fff", border: 0, margin: 0, minWidth: "300px", width: "100%" }}
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-blush-rose">A moment we'll never forget</p>
          <h2 className="mt-3 font-display text-5xl md:text-6xl text-rose-wine leading-[0.95]">
            19 million <span className="italic text-blush-rose">views</span> later…
          </h2>
          <p className="mt-6 text-neutral-700 leading-relaxed">
            What started as a simple moment on the internet became something far greater than we ever imagined. With over 19 million views, your love, support, and encouragement gave us the confidence to turn a dream into reality. Every view, share, comment, and message reminded us that this journey was worth pursuing. This video is our way of saying thank you to everyone who has been a part of our story. We're incredibly grateful — and this is only the beginning. <Heart className="inline h-5 w-5 fill-rose-wine text-rose-wine" />
          </p>
          <a href={REEL_19M} target="_blank" rel="noreferrer" className="pill-btn pill-btn-hover pill-primary mt-6">
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


function Mandatory() {
  return (
    <div className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Included by default" title="Mandatory pages" sub="Every magazine ships with these four cornerstones — always." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MANDATORY.map((m) => (
            <div key={m.t} className="step-card text-center">
              <h4 className="font-display text-2xl text-rose-wine">{m.t}</h4>
              <p className="mt-2 text-sm text-neutral-700">{m.d}</p>
            </div>
          ))}
        </div>
      </div>
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
          {FOUNDERS.map((f, i) => (
            <div key={f.name} className="glass rounded-3xl p-8">
              <div className="flex gap-6">
                <div className={`grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${i === 0 ? "from-blush-rose to-rose-wine" : "from-pink-mist to-dusty-rose"} font-display text-4xl text-white shadow-lg`}>
                  {f.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-3xl text-rose-wine">{f.name}</h4>
                  <p className="text-xs uppercase tracking-[0.3em] text-dusty-rose">{f.role}</p>
                  <p className="mt-3 text-sm text-neutral-700">{f.bio}</p>
                  <div className="mt-4 flex gap-2">
                    <SocialIcon icon={<Instagram className="h-4 w-4" />} />
                    <SocialIcon icon={<Twitter className="h-4 w-4" />} />
                    <SocialIcon icon={<Linkedin className="h-4 w-4" />} />
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

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="grid h-9 w-9 place-items-center rounded-full border border-rose-wine/20 bg-white/50 text-rose-wine transition-colors hover:bg-rose-wine hover:text-white">
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
              <p className="font-display text-2xl text-rose-wine">The Layout</p>
              <p className="text-xs text-dusty-rose">Handcrafted keepsakes, printed with love.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <SocialIcon icon={<Instagram className="h-4 w-4" />} />
            <SocialIcon icon={<Twitter className="h-4 w-4" />} />
            <SocialIcon icon={<Linkedin className="h-4 w-4" />} />
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-dusty-rose">© {new Date().getFullYear()} The Layout. All rights reserved.</p>
      </div>
    </footer>
  );
}

function Journey() {
  const stats = [
    { big: "70,000+", small: "Orders Delivered" },
    { big: "45,000+", small: "Customer Reviews" },
    { big: "4.5 / 5.0", small: "Total Review Rating", progress: 90 },
  ];
  return (
    <div id="journey" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-wide text-rose-wine">
            Our Journey <span className="italic text-blush-rose">in Numbers</span>
          </h2>
          <p className="mt-2 text-sm text-dusty-rose">Trusted by shoppers across India</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.small}
              className="rounded-2xl p-8 text-center text-white shadow-[0_20px_60px_-20px_rgba(120,20,50,0.5)]"
              style={{ backgroundColor: "#7a1330" }}
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

// keep unused imports referenced if any tree-shake concern
void useRef;
