import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Sparkles, Instagram, Youtube, Heart } from "lucide-react";
import { Toaster, toast } from "sonner";
import logoAsset from "@/assets/logo.png.asset.json";
import { CATALOG, CONFIG, type Category, type Product } from "@/lib/catalog";
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
import { PocketMagazineSection } from "@/components/site/pocket-section";
import { AddonsSection } from "@/components/site/addons-section";
import { CombosSection } from "@/components/site/combos-section";
import { NewspaperSection } from "@/components/site/newspaper-section";
import { FriendshipCardSection } from "@/components/site/friendship-section";
import { SpinWheel } from "@/components/site/spin-wheel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


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
  { label: "Build", href: "#build" },
  { label: "Templates", href: "#templates" },
  { label: "The Team", href: "#founders" },
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
  const cart = useStore((s) => s.cart);
  const cartCount = useStore((s) => s.cart.length);
  const total = useStore((s) => s.total());
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const templateLimit = useStore((s) => s.templateLimit());
  const pocketUnits = useStore((s) => s.pocketUnits);
  const pocketTemplateLimit = useStore((s) => s.pocketTemplateLimit());
  const selectedFriendshipId = useStore((s) => s.selectedFriendshipId);
  const selectedFriendshipDesignIds = useStore((s) => s.selectedFriendshipDesignIds);
  const friendshipDesignLimit = useStore((s) => s.friendshipDesignLimit());

  const openProduct = (cat: Category) => (p: Product) => {
    setModalCat(cat);
    setModalProduct(p);
  };

  const startCheckout = () => {
    if (cartCount === 0) {
      toast.error("Add something to your cart first.");
      return;
    }
    if (selectedSizeId && selectedTemplateIds.length < templateLimit) {
      toast.error(`Pick your ${templateLimit} template${templateLimit === 1 ? "" : "s"} before ordering — ${selectedTemplateIds.length}/${templateLimit} selected.`);
      document.getElementById("templates")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const incompletePocketUnit = pocketUnits.find((u) => u.templateIds.length < pocketTemplateLimit);
    if (incompletePocketUnit) {
      const idx = pocketUnits.indexOf(incompletePocketUnit) + 1;
      toast.error(`Pick your ${pocketTemplateLimit} template${pocketTemplateLimit === 1 ? "" : "s"} for Pocket Magazine #${idx} before ordering — ${incompletePocketUnit.templateIds.length}/${pocketTemplateLimit} selected.`);
      document.getElementById(`pocket-unit-${incompletePocketUnit.uid}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (selectedFriendshipId && selectedFriendshipDesignIds.length < friendshipDesignLimit) {
      toast.error(`Pick your ${friendshipDesignLimit} design${friendshipDesignLimit === 1 ? "" : "s"} for the Friendship Card before ordering — ${selectedFriendshipDesignIds.length}/${friendshipDesignLimit} selected.`);
      document.getElementById("friendship-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (total < SITE.commerce.minOrderValue) {
      toast.error(`Minimum order value is ${CONFIG.CURRENCY}${SITE.commerce.minOrderValue}. Add ${CONFIG.CURRENCY}${SITE.commerce.minOrderValue - total} more.`);
      return;
    }
    setCartOpen(false);
    // Delivery is no longer a hard gate here — it's chosen either on-page
    // (Step 6) or inside the checkout popup itself (CustomerInfoModal),
    // which won't let the customer continue to payment without it. Route
    // to that popup whenever either piece is still missing; only skip
    // straight to payment once both are already in place.
    const customerComplete = !!customer && !!customer.name && !!customer.phone && !!customer.email && !!customer.address;
    const hasDelivery = cart.some((c) => c.category === "delivery");
    if (!customerComplete || !hasDelivery) {
      if (!customerComplete) toast.message("Please fill your details to continue.");
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
      <OrderWaitTimeSection />

      <Hero />




      <Milestone />



      <TiledSection tiles={SITE.backgrounds.howToOrder}>
        <HowToOrder />
      </TiledSection>

      <ImageUploadSection />


      <CreateMagazineSection />

      <section className="pattern-satin">
        <Mandatory />
        
      </section>

      <TiledSection tiles={SITE.backgrounds.customize}>
        <div id="combos" className="relative z-10 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Curated" title="Combos" sub="Bundled favourites at a soft price — pick one, then choose your own templates below." />
            <CombosSection />
          </div>
        </div>
      </TiledSection>

      <TiledSection tiles={SITE.backgrounds.customize}>
        <div id="build" className="relative z-10 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Step 1" title="Choose your package" sub="Pricing scales with page count. Front & back covers included." />
            <SizesSection />
          </div>
        </div>

        <div id="templates" className="relative z-10 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Step 2" title="Pick your templates" sub="Choose the exact number your package allows. Click a card for details." />
            <StepIndicator />
            <TemplatesSection />
          </div>
        </div>

        <div id="pocket" className="relative z-10 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Add it on" title="Pocket Magazine" sub="A standalone product of its own — strictly 6 pages, pocket-sized, ₹250 flat. Add it alongside your magazine above, or all on its own. Buying more than one? Pick templates for each individually below." />
            <PocketMagazineSection />
          </div>
        </div>

        <div id="newspaper" className="relative z-10 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Something different" title="Newspaper Magazine" sub="A special standalone keepsake — not part of the package above." />
            <NewspaperSection />
          </div>
        </div>

        <div id="friendship-card" className="relative z-10 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Something different" title="Friendship Card" sub="A fully personalised keepsake card — not part of the package above." />
            <FriendshipCardSection />
          </div>
        </div>

        <div id="extras" className="relative z-10 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl space-y-10 sm:space-y-16">
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
              <ProductGrid category="delivery" items={CATALOG.delivery} onOpen={openProduct("delivery")} cols="grid-cols-2" />
            </div>
          </div>
        </div>

      <section className="relative z-10 px-4 pb-10 sm:pb-16">
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
      <PhotoGallery />
      <HappyCustomersBanner />
      <Faq />
      <Policy />



      <Footer />

      <ProductModal open={!!modalProduct} category={modalCat} product={modalProduct} onClose={() => setModalProduct(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={startCheckout} />
      <CustomerInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} onSubmit={() => { setInfoOpen(false); setPayOpen(true); }} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onDone={(id) => { setPayOpen(false); setOrderId(id); setSuccessOpen(true); }} />
      <SuccessModal open={successOpen} onClose={() => { setSuccessOpen(false); clear(); }} orderId={orderId} />
      <SpinWheel />


      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 pill-btn pill-btn-hover pill-primary shadow-xl"
        >
          Cart · {cartCount}
        </button>
      )}

      <WhatsAppButton />
    </div>
  );
}

function WhatsAppButton() {
  return (
    <a
      href={SITE.links.whatsapp}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-23.5 left-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] shadow-xl ring-2 ring-white hover:scale-105 transition"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" aria-hidden>
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.652 4.527 1.785 6.395L4 29l7.805-1.746A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.994 16.98c-.297.836-1.47 1.53-2.418 1.734-.645.137-1.488.246-4.328-.93-3.63-1.5-5.965-5.19-6.148-5.43-.176-.242-1.469-1.957-1.469-3.734 0-1.777.93-2.648 1.262-3.012.297-.324.645-.406.86-.406.215 0 .43.004.617.012.199.008.465-.075.727.555.297.688.988 2.375 1.074 2.547.086.172.145.375.03.617-.116.242-.174.39-.343.602-.172.211-.363.473-.516.633-.172.18-.352.375-.152.734.199.36.887 1.465 1.906 2.375 1.31 1.168 2.414 1.53 2.777 1.703.363.172.574.145.786-.086.211-.234.906-1.055 1.148-1.418.242-.363.484-.297.816-.18.332.117 2.117.996 2.48 1.176.363.18.605.27.695.418.09.15.09.867-.207 1.703Z"/>
      </svg>
    </a>
  );
}

export function Marquee() {
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

// Middle tile of the 3x3 grid — always shows SITE.photoGallery[0].
const GALLERY_CENTER_SLOT = 4;

function PhotoGallery() {
  const images = SITE.photoGallery;

  const [tiles, setTiles] = useState(() => {
    const arr = Array.from({ length: 9 }, (_, i) => (i % (images.length - 1 || 1)) + 1);
    arr[GALLERY_CENTER_SLOT] = 0;
    return arr;
  });

  useEffect(() => {
    if (images.length <= 2) return;
    const id = setInterval(() => {
      setTiles((prev) => {
        const slots = prev.map((_, i) => i).filter((i) => i !== GALLERY_CENTER_SLOT);
        const slot = slots[Math.floor(Math.random() * slots.length)];
        let next: number;
        do {
          next = 1 + Math.floor(Math.random() * (images.length - 1));
        } while (next === prev[slot]);
        const copy = [...prev];
        copy[slot] = next;
        return copy;
      });
    }, 2200);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <section id="gallery" className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHead eyebrow="Straight from the studio" title="Wall of memories" sub="A living peek at prints, packs and unboxings — refreshing in real time." />
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {tiles.map((imgIdx, slot) => (
            <div key={slot} className="relative aspect-square overflow-hidden rounded-lg sm:rounded-2xl bg-white/40 shadow-sm">
              <img
                key={imgIdx}
                src={images[imgIdx]}
                alt=""
                loading="lazy"
                className="gallery-fade absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    <section id="reels" className="relative z-10 px-4 py-12 sm:py-20">
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href={SITE.links.instagram} target="_blank" rel="noreferrer" className="pill-btn pill-btn-hover">
            <Instagram className="h-4 w-4" /> Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

function HappyCustomersBanner() {
  return (
    <section className="relative z-10 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-wine via-blush-rose to-rose-wine px-8 py-14 text-center shadow-2xl ring-1 ring-pink-mist/30">
          <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden>
            <Heart className="absolute -left-6 -top-6 h-32 w-32 rotate-[-12deg] fill-off-white text-off-white" />
            <Heart className="absolute -right-8 -bottom-8 h-40 w-40 rotate-[10deg] fill-off-white text-off-white" />
          </div>
          <span className="relative inline-flex items-center gap-2 rounded-full bg-off-white/15 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-off-white ring-1 ring-off-white/30">
            ✧ Real stories, real love ✧
          </span>
          <h3 className="relative mt-5 font-display text-4xl md:text-5xl text-off-white leading-tight">
            Loved by hundreds of<br className="hidden sm:block" /> happy customers
          </h3>
          <p className="relative mt-4 max-w-xl mx-auto text-pink-mist/90">
            See the real messages, reactions and reviews from people who've received their Layout keepsake ♡
          </p>
          <a
            href={SITE.links.customerReviews}
            target="_blank"
            rel="noreferrer"
            className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-off-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-rose-wine shadow-lg transition hover:scale-[1.05] hover:shadow-xl"
          >
            <Heart className="h-4 w-4 fill-rose-wine" /> Check out our happy customers
          </a>
        </div>
      </div>
    </section>
  );
}

function Nav({ onCart }: { onCart: () => void }) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav className="glass mx-auto flex max-w-6xl items-center gap-2 sm:gap-4 rounded-full px-3 sm:px-5 py-2.5 sm:py-3">
        <a href="#top" className="flex items-center gap-3 shrink-0">
          <img src={logoAsset.url} alt="The Layout" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 object-contain" />
          <span className="hidden sm:inline font-display text-2xl text-rose-wine truncate">The Layout</span>
        </a>
        <ul className="flex flex-1 min-w-0 items-center justify-start lg:justify-center gap-3 sm:gap-6 overflow-x-auto whitespace-nowrap text-xs sm:text-sm text-neutral-700 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((n) => (
            <li key={n.href} className="shrink-0">
              <a href={n.href} className="hover:text-rose-wine transition-colors">{n.label}</a>
            </li>
          ))}
          <li className="shrink-0">
            <a href={SITE.links.customerReviews} target="_blank" rel="noreferrer" className="hover:text-rose-wine transition-colors">
              Happy Customers
            </a>
          </li>
          <li className="shrink-0">
            <a href={SITE.links.blog} target="_blank" rel="noreferrer" className="hover:text-rose-wine transition-colors">
              Blog
            </a>
          </li>
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
          className="mx-auto mt-1 h-40 w-40 md:h-56 md:w-56 object-contain"
        />
        <p className="mx-auto mt-1 max-w-2xl text-xl md:text-2xl font-display italic text-rose-wine">
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
        <img
          src={SITE.showreelVideo}
          alt="Showreel"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    </section>
  );
}

function Milestone() {
  useInstagramEmbeds();
  return (
    <section className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-6 sm:gap-10 md:grid-cols-2">
        <div className="glass rounded-3xl p-3 overflow-hidden">
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={SITE.milestoneReel.url}
            data-instgrm-version="14"
            style={{ background: "#fff", border: 0, margin: 0, minWidth: "300px", width: "100%" }}
          />
        </div>
        <div className="text-center md:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-blush-rose">A moment we'll never forget</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl text-rose-wine leading-[0.95]">
            {SITE.milestoneReel.heading}
          </h2>
          <p className="mt-4 sm:mt-6 text-neutral-700 leading-relaxed">
            {SITE.milestoneReel.body} <Heart className="inline h-5 w-5 fill-rose-wine text-rose-wine" />
          </p>
          <a href={SITE.milestoneReel.url} target="_blank" rel="noreferrer" className="pill-btn pill-btn-hover pill-primary mt-6 mx-auto md:mx-0">
            Watch on Instagram <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}


export function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-blush-rose">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl md:text-6xl text-rose-wine">{title}</h2>
      {sub && <p className="mt-3 text-dusty-rose max-w-2xl mx-auto">{sub}</p>}
    </div>
  );
}

function StepCard({ s, className = "" }: { s: (typeof STEPS)[number]; className?: string }) {
  return (
    <div className={`step-card !p-2.5 sm:!p-4 lg:!p-6 ${className}`}>
      <div className="mb-1.5 sm:mb-4 flex items-center justify-between">
        <span className="font-display text-lg sm:text-2xl lg:text-4xl text-rose-wine/70">0{s.n}</span>
        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blush-rose shrink-0" />
      </div>
      <h4 className="font-display text-xs sm:text-lg lg:text-2xl text-rose-wine leading-tight">{s.t}</h4>
      <p className="mt-1 sm:mt-2 text-[0.6rem] sm:text-xs lg:text-sm text-neutral-700 leading-snug">{s.d}</p>
    </div>
  );
}

function HowToOrder() {
  const firstRow = STEPS.slice(0, 3);
  const lastRow = STEPS.slice(3);
  return (
    <div id="how" className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Process" title="How to order" sub="Five simple steps from idea to doorstep." />
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          {firstRow.map((s) => <StepCard key={s.n} s={s} />)}
          {/* Incomplete last row (2 cards in a 3-col grid) centers as a pair on
              mobile/tablet instead of hugging the left edge; at lg the wrapper
              becomes `contents` so these rejoin the single 5-col row normally. */}
          <div className="col-span-3 flex justify-center gap-2 sm:gap-4 lg:contents">
            {lastRow.map((s) => (
              <StepCard key={s.n} s={s} className="w-[calc(33.333%-0.4rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-auto" />
            ))}
          </div>
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
    <div className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Included by default" title="Mandatory pages" sub="Tap any page to view it in isolation." />
        <div className="grid grid-cols-4 gap-1.5 sm:gap-4 md:gap-5">
          {MANDATORY.map((m, i) => {
            const hero = SITE.productImages?.[`mandatory-${i + 1}`]?.[0];
            return (
              <button
                key={m.t}
                type="button"
                onClick={() => setOpenIdx(i)}
                className="group text-left rounded-md sm:rounded-2xl overflow-hidden bg-white shadow-md ring-1 ring-rose-wine/10 hover:shadow-xl hover:-translate-y-0.5 transition"
              >
                <div className="relative aspect-[2480/3508] overflow-hidden bg-neutral-100">
                  {hero ? (
                    <img src={hero} alt={m.t} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-center" />
                  ) : (
                    <MandatoryPlaceholder label={m.t} />
                  )}
                </div>
                <div className="p-1 sm:p-3 md:p-4 text-center">
                  <h4 className="font-display text-[0.65rem] sm:text-base md:text-xl text-rose-wine leading-tight">{m.t}</h4>
                  <p className="mt-1 hidden sm:block text-xs text-neutral-600 line-clamp-2">{m.d}</p>
                  <span className="mt-1 sm:mt-3 hidden sm:inline-block text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-blush-rose group-hover:text-rose-wine">
                    View page →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {SITE.mandatoryNote && (
          <p className="mt-6 text-center text-sm text-neutral-600">{SITE.mandatoryNote}</p>
        )}
      </div>


      {active && (
        <ModalShell onClose={() => setOpenIdx(null)} maxW="max-w-3xl">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-[340px] aspect-[2480/3508] rounded-xl overflow-hidden bg-white shadow-2xl ring-1 ring-rose-wine/10 relative">
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
    <div id="timeline" className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Timeline" title="From design to your hands" />
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          {TIMELINE.map((t, i) => (
            <div key={t.t} className="step-card !p-2.5 sm:!p-4 md:!p-6">
              <span className="font-display text-lg sm:text-2xl md:text-4xl text-rose-wine/60">0{i + 1}</span>
              <h4 className="mt-1 sm:mt-2 font-display text-xs sm:text-lg md:text-2xl text-rose-wine leading-tight">{t.t}</h4>
              <p className="mt-1 text-[0.6rem] sm:text-sm text-neutral-700 leading-snug">{t.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Founders() {
  return (
    <div id="founders" className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="" title="The Team" />
        <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-rose-wine/10">
          <img
            src={SITE.foundersImage}
            alt={SITE.foundersImageAlt}
            loading="lazy"
            className="block h-auto w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}


function Faq() {
  return (
    <section id="faq" className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHead eyebrow="Questions" title="FAQ" sub="Everything you need to know before you order." />
        <div className="glass rounded-3xl p-6 md:p-10">
          <Accordion type="single" collapsible className="w-full">
            {SITE.faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-rose-wine/10">
                <AccordionTrigger className="text-left font-display text-lg text-rose-wine hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-neutral-700">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function Policy() {
  return (
    <section id="policy" className="relative z-10 px-4 py-12 sm:py-20">
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

export function Footer() {
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
            <SocialIcon icon={<Youtube className="h-4 w-4" />} href={SITE.links.youtube} />
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
    <div id="journey" className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-wide text-rose-wine">
            {title}
          </h2>
          <p className="mt-2 text-sm text-dusty-rose">{subtitle}</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          {blocks.map((s) => (
            <div
              key={s.small}
              className="rounded-lg sm:rounded-2xl p-2.5 sm:p-5 md:p-8 text-center text-white shadow-[0_20px_60px_-20px_rgba(120,20,50,0.5)]"
              style={{ backgroundColor: color }}
            >
              <p className="font-display text-lg sm:text-3xl md:text-5xl font-bold tracking-tight">{s.big}</p>
              {s.progress != null && (
                <div className="mt-2 sm:mt-3 mx-auto h-1 sm:h-1.5 w-3/4 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${s.progress}%` }} />
                </div>
              )}
              <p className="mt-1.5 sm:mt-3 text-[0.5rem] sm:text-xs uppercase tracking-[0.05em] sm:tracking-[0.25em] text-white/80 leading-tight">{s.small}</p>
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
        className="block w-full h-auto object-center"
      />
      {/* "Cherished Moments" banner — button sits just below the banner's
          text, roughly 3/4 of the way down the image. */}
      <div className="absolute inset-x-0 z-20 flex justify-center" style={{ top: "75%" }}>
        <a
          href={SITE.links.blog}
          target="_blank"
          rel="noreferrer"
          className="pill-btn pill-btn-hover pill-primary"
        >
          View our blog posts <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function OrderWaitTimeSection() {
  return (
    // Same "full-bleed, scale by width, never crop" treatment as the other
    // bg banners (CustomImageSection/CreateMagazineSection) — w-full + h-auto
    // keeps the image's own aspect ratio intact at every screen size, so it
    // scales down cleanly on mobile instead of being stretched/squished.
    <section className="relative z-10 w-full">
      <img
        src="/media/bg/order_waittime.webp"
        alt="Order today, get it soon — Express shipping in 7 days or Normal shipping in 12 days"
        className="block w-full h-auto object-center"
      />
    </section>
  );
}

function ImageUploadSection() {
  return (
    <section className="relative z-10 w-full">
      <img
        src="/media/bg/image_upload.webp"
        alt="Showcase"
        className="block w-full h-auto object-center"
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
