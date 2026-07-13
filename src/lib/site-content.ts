// ==================================================================
// SITE CONTENT — the ONE file a non-coder edits.
// ------------------------------------------------------------------
// Rules of thumb for the client:
//  • Change any TEXT inside quotes — that's it.
//  • To swap a MEDIA file, drop the new file into /public/media/…
//    keeping the same filename (or update the path here).
//  • To change a link, just paste the new URL between the quotes.
// ==================================================================

export type Tiles = {
  head?: string;    // 1920×1080 (or any) image drawn once at the top
  repeat?: string;  // tiled vertically to fill the middle (edges MUST match)
  tail?: string;    // drawn once at the bottom
  tileHeight?: number; // px, only used to reserve padding — default 1080
};

export const SITE = {
  // ────────────────────────────────────────────────────────────────
  // BRAND
  // ────────────────────────────────────────────────────────────────
  brand: {
    name: "The Layout",
    tagline: "Handcrafted keepsakes, printed with love.",
  },

  // ────────────────────────────────────────────────────────────────
  // HERO
  // ────────────────────────────────────────────────────────────────
  hero: {
    eyebrow: "Welcome to",
    quote: "Editorial storytelling, printed with quiet obsession.",
  },

  // Showreel video — drop your file at /public/media/showreel.mp4
  showreelVideo: "/showreel.mp4",

  // ────────────────────────────────────────────────────────────────
  // TOP-BAR MARQUEE STRIP
  // ────────────────────────────────────────────────────────────────
  marquee: [
    "Use code LAYOUT10 for 10% off ✨",
    "Free standard shipping on all orders",
    "Handcrafted in small batches",
    "New templates dropped this month",
  ],

  // ────────────────────────────────────────────────────────────────
  // 19M-VIEWS MILESTONE REEL
  // ────────────────────────────────────────────────────────────────
  milestoneReel: {
    url: "https://www.instagram.com/reel/DUi4r8pCMgy/",
    heading: "19 million views later…",
    body:
      "What started as a simple moment on the internet became something far greater than we ever imagined. With over 19 million views, your love, support, and encouragement gave us the confidence to turn a dream into reality.",
  },

  // ────────────────────────────────────────────────────────────────
  // REELS CAROUSEL — paste any number of Instagram reel URLs
  // ────────────────────────────────────────────────────────────────
  reels: [
    "https://www.instagram.com/reel/DadWWA1I45L/",
    "https://www.instagram.com/reel/DaalBsgoITb/",
    "https://www.instagram.com/reel/DaWLtOkzxqR/",
    "https://www.instagram.com/reel/DaQZQ2TKI8L/",
  ],

  // ────────────────────────────────────────────────────────────────
  // EXTERNAL LINKS (open in new tab)
  // ────────────────────────────────────────────────────────────────
  links: {
    behindTheLayout: "https://www.instagram.com/the_layoutt",
    instagram:       "https://www.instagram.com/the_layoutt",
    linkedin:        "https://www.linkedin.com/company/the_layoutt",
    twitter:         "https://twitter.com/the_layoutt",
  },

  // ────────────────────────────────────────────────────────────────
  // JOURNEY / STATS  ← edit numbers or labels freely
  // ────────────────────────────────────────────────────────────────
  stats: {
    title: "Our Journey in Numbers",
    subtitle: "Trusted by shoppers across India",
    color: "#e1477e", // block background (dark red)
    blocks: [
      { big: "500+",   small: "Orders Delivered" },
      { big: "100+",   small: "Customer Reviews" },
      { big: "4.9 / 5.0", small: "Total Review Rating", progress: 90 },
    ] as { big: string; small: string; progress?: number }[],
  },

  // ────────────────────────────────────────────────────────────────
  // FOUNDERS
  // ────────────────────────────────────────────────────────────────
  founders: [
    {
      name: "Founder One",
      role: "Creative Director",
      bio: "A designer with an eye for editorial detail. She curates every layout, colour story and cover.",
      photo: "", // e.g. "/media/founders/founder-one.jpg" — leave "" to show initial avatar
    },
    {
      name: "Founder Two",
      role: "Operations & Print",
      bio: "The operator and storyteller. He handles print, quality and delivery.",
      photo: "",
    },
  ],

  // ────────────────────────────────────────────────────────────────
  // PRODUCT IMAGES (for the e-commerce modal)
  // Keys must match ids in src/lib/catalog.ts.
  // Give each product an array of image URLs — 3-5 works best.
  // Leave the array empty [] to fall back to the auto-generated gradient tile.
  // ────────────────────────────────────────────────────────────────





  productImages: {

    "tpl-24": ["/media/products/24.jpg","/media/products/24.jpg"],



    // Polaroid strips
    "str-1": ["/media/products/strips/1.jpeg"] as string[],
    "str-2": ["/media/products/strips/2.jpeg"] as string[],
    "str-3": ["/media/products/strips/3.jpeg"] as string[],
    "str-4": ["/media/products/strips/4.jpeg"] as string[],
    "str-5": ["/media/products/strips/5.jpeg"] as string[],
    // Polaroid packs
    "pol-mini":    [] as string[],
    "pol-classic": [] as string[],
    "pol-memory":  [] as string[],
    "pol-premium": [] as string[],

    // Add-ons
    "add-wrap":   [] as string[],
    "add-letter": [] as string[],
    "add-combo":  [] as string[],
  } as Record<string, string[]>,

  // ────────────────────────────────────────────────────────────────
  // BACKGROUNDS — tiled art for individual sections
  // Design tiles at 1920px wide. Middle tile edges must match.
  // Any tile you leave out is simply skipped.
  // ────────────────────────────────────────────────────────────────
  backgrounds: {
    hero: {
      head: "/media/bg/3.svg" // Replace with your actual filename


    } as Tiles,


    journey:  {} as Tiles,

    // Head + repeating middle + tail — for LONG sections
    customize: {} as Tiles,
    // e.g.
    // customize: {
    //   head:   "/media/bg/customize-head.jpg",
    //   repeat: "/media/bg/customize-mid.jpg",
    //   tail:   "/media/bg/customize-tail.jpg",
    // },
    
    founders: {
      tail: "/media/bg/1.svg"
    } as Tiles,
  } as Record<string, Tiles>,
};
