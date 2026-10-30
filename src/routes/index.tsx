import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Instagram, Youtube, Heart } from "lucide-react";
import { Toaster, toast } from "sonner";
import logoAsset from "@/assets/logo.png.asset.json";
import { CONFIG } from "@/lib/catalog";
import { useStore, useComboIssues } from "@/lib/store";
import { comboSteps, guidedVisibleSections, nextComboAction, type GuidedSection } from "@/lib/combo-guide";
import { SITE } from "@/lib/site-content";
import { TiledSection } from "@/components/site/TiledSection";
import {
  CartDrawer, CustomerInfoModal,
  PaymentModal, SuccessModal, CartButton, StepIndicator,
} from "@/components/site/shop";

import { StripsSection } from "@/components/site/strips-section";
import { PacksSection } from "@/components/site/packs-section";
import { TemplatesSection } from "@/components/site/templates-section";
import { SizesSection } from "@/components/site/sizes-section";
import { PocketTemplatePickers } from "@/components/site/pocket-section";
import { AddonsSection } from "@/components/site/addons-section";
import { CombosSection } from "@/components/site/combos-section";
import { NewspaperSection } from "@/components/site/newspaper-section";
import { MemoryCardSection } from "@/components/site/memory-card-section";
import { FriendshipCardSection } from "@/components/site/friendship-section";
import { ItPolaroidsSection } from "@/components/site/it-polaroids-section";
import { StickerBookSection } from "@/components/site/sticker-book-section";
import { KeepsakeMatchmaker } from "@/components/site/keepsake-matchmaker";
import { ComboGuideBar } from "@/components/site/combo-guide";
import { MagazineProgressBar } from "@/components/site/magazine-progress";
import { magazineProgress, magazineTracks } from "@/lib/magazine-progress";
import { SpinWheel } from "@/components/site/spin-wheel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "The Layout — Custom Magazines & Keepsakes" },
      { name: "description", content: "Create custom magazines, Memory Cards, License Cards, polaroid keepsakes, and personalised gifts from The Layout." },
      { property: "og:title", content: "The Layout — Custom Magazines & Keepsakes" },
      { property: "og:description", content: "Create custom magazines, Memory Cards, License Cards, polaroid keepsakes, and personalised gifts from The Layout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const NAV = [
  { label: "Build", href: "#build" },
  { label: "Templates", href: "#templates" },
  { label: "Sticker Book", href: "#sticker-book" },
  { label: "IT Polaroids", href: "#it-polaroids" },
  { label: "The Team", href: "#founders" },
];

function Home() {
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
  const selectedMemoryCardDesignIds = useStore((s) => s.selectedMemoryCardDesignIds);
  const activeCombo = cart.find((item) => item.category === "combos");
  const comboIssues = useComboIssues();
  const deselectCombo = useStore((s) => s.deselectCombo);
  const ensureStandardDelivery = useStore((s) => s.ensureStandardDelivery);

  // Guided Combo Mode: with a combo in the cart, only the sections it needs
  // are shown unless the customer asks to see everything. "Show all" is
  // per-combo, so picking a different combo starts focused again.
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [activeCombo?.id]);
  const guided = !!activeCombo && !showAll;
  const visibleSections = activeCombo ? guidedVisibleSections(activeCombo.id, comboIssues, cart) : null;
  const show = (section: GuidedSection) => !guided || !!visibleSections?.has(section);
  const comboGuideSteps = activeCombo ? comboSteps(activeCombo.id, comboIssues) : [];

  // Magazine Template Progress bar — only outside a combo, which has its own.
  const magazineTrackList = activeCombo ? [] : magazineTracks({
    sizeId: selectedSizeId,
    templateCount: selectedTemplateIds.length,
    pocketUnits,
    pocketLimit: pocketTemplateLimit,
  });
  const magazineGuide = magazineTrackList.length ? magazineProgress(magazineTrackList) : null;
  const bottomBar = !!activeCombo || !!magazineGuide;

  // In-page links (e.g. the nav's "Build") can point at a hidden section:
  // reveal everything, then scroll once it has rendered.
  useEffect(() => {
    if (!guided) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      if (!id || document.getElementById(id)) return;
      event.preventDefault();
      setShowAll(true);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [guided]);

  // Other widgets (e.g. the spin wheel's "View My Cart") open the drawer by
  // dispatching this event rather than reaching into Home's state.
  useEffect(() => {
    const onOpenCart = () => setCartOpen(true);
    window.addEventListener("open-cart", onOpenCart);
    return () => window.removeEventListener("open-cart", onOpenCart);
  }, []);

  const removeActiveCombo = () => {
    if (!activeCombo) return;
    if (!window.confirm(`Remove ${activeCombo.name} and everything included with it?`)) return;
    deselectCombo(activeCombo.id);
    toast.success(`${activeCombo.name} removed`);
  };

  const startCheckout = () => {
    if (cartCount === 0) {
      toast.error("Add something to your cart first.");
      return;
    }
    // Hard stop: every item a combo includes must be picked before checkout.
    // Same issue list the cart drawer shows, so the two gates always agree.
    if (comboIssues.length > 0) {
      toast.error("Please complete your combo selection before checking out!", {
        description: comboIssues.map((issue) => issue.message).join(" "),
      });
      setCartOpen(false);
      // Scroll to whichever missing section comes first on the page.
      const targets = comboIssues
        .map((issue) => document.getElementById(issue.section))
        .filter((el): el is HTMLElement => !!el)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      targets[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      toast.error(`Pick your ${friendshipDesignLimit} design${friendshipDesignLimit === 1 ? "" : "s"} for your ${selectedFriendshipId === "friend-duo" ? "Duo License Card" : "License Card"} before ordering — ${selectedFriendshipDesignIds.length}/${friendshipDesignLimit} selected.`);
      document.getElementById("friendship-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const comboMemoryLines = activeCombo
      ? cart.filter((item) => item.comboId === activeCombo.id && item.category === "memory-card-designs")
      : [];
    const expectedMemoryCards = comboMemoryLines.reduce((sum, item) => {
      const match = item.name.match(/×(\d+)/);
      return sum + (match ? Number(match[1]) : 1);
    }, 0);
    if (expectedMemoryCards > 0 && selectedMemoryCardDesignIds.length < expectedMemoryCards) {
      toast.error(`Pick ${expectedMemoryCards} Memory Card design${expectedMemoryCards === 1 ? "" : "s"} included in your combo before ordering.`);
      document.getElementById("memory-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (total < SITE.commerce.minOrderValue) {
      toast.error(`Minimum order value is ${CONFIG.CURRENCY}${SITE.commerce.minOrderValue}. Add ${CONFIG.CURRENCY}${SITE.commerce.minOrderValue - total} more.`);
      return;
    }
    setCartOpen(false);
    // Standard Delivery is added automatically when none is picked, so
    // checkout never stalls on it. When it was just added, still route
    // through the checkout popup so the customer sees it and can switch to
    // Express; otherwise skip straight to payment once details are in place.
    const addedDelivery = ensureStandardDelivery();
    const customerComplete = !!customer && !!customer.name && !!customer.phone && !!customer.email && !!customer.address;
    if (!customerComplete || addedDelivery) {
      if (!customerComplete) toast.message("Please fill your details to continue.");
      setInfoOpen(true);
    } else {
      setPayOpen(true);
    }
  };

  return (
    <div id="top" className={`relative min-h-screen ${bottomBar ? "pb-32" : ""}`}>
      <Toaster position="top-center" richColors />
      <div className="orbs" aria-hidden>
        <span className="orb orb-1" /><span className="orb orb-2" /><span className="orb orb-3" />
      </div>

      <Marquee />
      <Nav onCart={() => setCartOpen(true)} />
      <Showreel />

      <Hero />

      <Milestone />

      <TiledSection tiles={SITE.backgrounds.howToOrder}>
        <LayoutProductsSection />
      </TiledSection>

      <TiledSection tiles={SITE.backgrounds.customize}>
        <div id="combos" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHead eyebrow="Curated" title="Combos" sub="Bundled favourites at a soft price — pick one, then choose your own templates below." />
            <KeepsakeMatchmaker />
            <CombosSection />
          </div>
        </div>

        {show("sticker-book") && (
          <div id="sticker-book" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SectionHead eyebrow="New · All-in-one" title={SITE.stickerBook.name} sub="Everything's included — flip through the whole book, then add it in one tap." />
              <StickerBookSection />
            </div>
          </div>
        )}
      </TiledSection>

      <TiledSection tiles={SITE.backgrounds.customize}>
        {show("build") && (
          <div id="build" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SizesSection />
            </div>
          </div>
        )}

        {/* With only Pocket Magazines in the cart, their own pickers below
            replace the A4/A5 template section. */}
        {show("templates") && (selectedSizeId || pocketUnits.length === 0) && (
          <div id="templates" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SectionHead eyebrow="Templates" title="Pick your templates" sub="Choose the exact number your package allows. Click a card for details." />
              <StepIndicator />
              <TemplatesSection />
            </div>
          </div>
        )}

        {show("pocket") && pocketUnits.length > 0 && (
          <div id="pocket" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SectionHead eyebrow="Templates" title="Pocket Magazine templates" sub={`Pick ${pocketTemplateLimit} templates for each Pocket Magazine (A6) in your cart.`} />
              <PocketTemplatePickers />
            </div>
          </div>
        )}

        {show("newspaper") && (
          <div id="newspaper" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SectionHead eyebrow="Something different" title="Newspaper Magazine" sub="A special standalone keepsake — not part of the package above." />
              <NewspaperSection />
            </div>
          </div>
        )}

        {show("memory-card") && (
          <div id="memory-card" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SectionHead eyebrow="Turn moments into keepsakes" title="The Memory Card" sub="Choose one, two, or three cards — mix the designs or repeat your favourite." />
              <MemoryCardSection />
            </div>
          </div>
        )}

        {show("it-polaroids") && (
          <div id="it-polaroids" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SectionHead eyebrow="New" title={SITE.itPolaroids.name} sub={SITE.itPolaroids.howToOrder} />
              <ItPolaroidsSection />
            </div>
          </div>
        )}

        {show("friendship-card") && (
          <div id="friendship-card" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-6xl">
              <SectionHead eyebrow="Personalised Keepsakes" title="License Cards" sub="A fully personalised keepsake card — not part of the package above." />
              <FriendshipCardSection />
            </div>
          </div>
        )}

        <div id="extras" className="relative z-10 scroll-mt-24 px-4 py-12 sm:py-20">
          <div className="mx-auto max-w-6xl space-y-10 sm:space-y-16">
            {show("addons") && <div id="addons" className="scroll-mt-24">
              <SectionHead eyebrow="Add-ons" title="Add-ons" sub="Little extras that make the keepsake feel personal." />
              <AddonsSection />
            </div>}
            {show("packs") && <div id="packs" className="scroll-mt-24">
              <SectionHead eyebrow="Keepsakes" title="Polaroid packs" sub="Real polaroid keepsakes — tap a pack to add, or View for the full look." />
              <PacksSection />
            </div>}

            {show("strips") && <div id="strips" className="scroll-mt-24">
              <SectionHead eyebrow="Strips" title="Polaroid Strips" sub="Swipe through every strip — tap the centre one to add it, or open it full size." />
              <StripsSection />
            </div>}
          </div>
        </div>
      </TiledSection>

      <Reels />

      <TiledSection tiles={SITE.backgrounds.founders}>
        <Founders />
      </TiledSection>

      <section className="pattern-gingham">
        <Journey />
      </section>         

      <HappyCustomersBanner />
      <Faq />
      <Policy />

      <Footer />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={startCheckout} />
      <CustomerInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} onSubmit={() => { setInfoOpen(false); setPayOpen(true); }} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onDone={(id) => { setPayOpen(false); setOrderId(id); setSuccessOpen(true); }} />
      <SuccessModal open={successOpen} onClose={() => { setSuccessOpen(false); clear(); }} orderId={orderId} />
      <SpinWheel />


      {activeCombo ? (
        <ComboGuideBar
          comboName={activeCombo.name}
          steps={comboGuideSteps}
          next={nextComboAction(comboGuideSteps, comboIssues)}
          showAll={showAll}
          cartCount={cartCount}
          onToggleShowAll={() => setShowAll((v) => !v)}
          onRemove={removeActiveCombo}
          onCart={() => setCartOpen(true)}
        />
      ) : magazineGuide ? (
        <MagazineProgressBar progress={magazineGuide} cartCount={cartCount} onCart={() => setCartOpen(true)} />
      ) : cartCount > 0 && (
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
      // Smaller and tucked into the corner on phones, where it would
      // otherwise sit over headings as the page scrolls past.
      className="float-above-guide fixed bottom-4 left-3 z-30 grid h-11 w-11 place-items-center rounded-full bg-[#25D366] shadow-xl ring-2 ring-white hover:scale-105 transition sm:bottom-23.5 sm:left-4 sm:h-14 sm:w-14"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-white sm:h-7 sm:w-7" aria-hidden>
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
          <li className="shrink-0">
            <KeepsakeMatchmaker variant="pill" />
          </li>
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
            <a href={SITE.links.deliveryCheck} target="_blank" rel="noreferrer" className="hover:text-rose-wine transition-colors">
              Check Delivery
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

// "The Layout Products" directory — one card per entry in
// SITE.layoutProducts, each jumping to that product's section. They're
// in-page links so Guided Combo Mode's link handler (in Home) can reveal a
// section the combo is hiding before scrolling to it.
function LayoutProductsSection() {
  const jump = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string, magazineSize?: string) => {
    // Pre-select the size in the magazine builder — after a beat, so a
    // builder Guided Combo Mode was hiding has rendered by then.
    if (magazineSize) setTimeout(() => window.dispatchEvent(new CustomEvent("configure-magazine", { detail: magazineSize })), 80);
    const el = document.getElementById(targetId);
    if (!el) return; // hidden by Guided Combo Mode — Home's handler takes over
    event.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="products-directory" className="relative z-10 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Directory" title="The Layout Products" sub="Tap any product below to jump directly to its customisation options." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {SITE.layoutProducts.map((p) => (
            <a
              key={p.id}
              href={`#${p.targetId}`}
              onClick={(e) => jump(e, p.targetId, p.magazineSize)}
              // Warm vintage yellow, matching the Love Sticker Book section.
              className="group relative flex min-h-[5.5rem] flex-col items-center justify-center rounded-2xl border border-[#e8d3a0] bg-[#fbf0d4]/90 p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8e1b1b]/40 hover:bg-[#faeec7] hover:shadow-md active:scale-[0.98] sm:p-5"
            >
              {p.badge && (
                <span className="absolute -top-2.5 right-2 rounded-full bg-[#8e1b1b] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-off-white shadow-sm">
                  {p.badge}
                </span>
              )}
              <span className="font-display text-sm font-medium text-[#8e1b1b] sm:text-base">{p.name}</span>
              {p.subtitle && (
                <span className="mt-1 line-clamp-2 text-[11px] text-dusty-rose transition-colors group-hover:text-neutral-700 sm:text-xs">{p.subtitle}</span>
              )}
            </a>
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
