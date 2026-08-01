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
  // COMMERCE — cart rules
  // ────────────────────────────────────────────────────────────────
  commerce: {
    // Minimum cart total (in ₹) required before checkout is allowed.
    minOrderValue: 249,
  },

  // ────────────────────────────────────────────────────────────────
  // TOP-BAR MARQUEE STRIP
  // ────────────────────────────────────────────────────────────────
  marquee: [
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
  // PHOTO GALLERY — "Wall of memories" section, below Reels.
  // Files live in /public/media/photo gallery/. The FIRST image in this
  // list always stays pinned in the center tile; the other 8 tiles keep
  // cycling through the rest of the list. Add or remove lines freely —
  // supports as many images as you drop in the folder (currently used
  // up to 15; room for up to 38 below, just uncomment and fix the
  // extension to match the actual file).
  // Note: extension CASE matters on the live site (1.JPG vs 1.jpg) —
  // copy the case exactly as the file appears in the folder.
  // ────────────────────────────────────────────────────────────────
  photoGallery: [
    "/media/photo%20gallery/1.JPG",
    "/media/photo%20gallery/2.JPG",
    "/media/photo%20gallery/3.JPG",
    "/media/photo%20gallery/4.JPG",
    "/media/photo%20gallery/5.JPG",
    "/media/photo%20gallery/6.JPG",
    "/media/photo%20gallery/7.JPG",
    "/media/photo%20gallery/8.JPG",
    "/media/photo%20gallery/9.jpg",
    "/media/photo%20gallery/10.jpg",
    "/media/photo%20gallery/11.jpg",
    "/media/photo%20gallery/12.jpg",
    "/media/photo%20gallery/13.jpg",
    "/media/photo%20gallery/14.jpg",
    "/media/photo%20gallery/15.jpg",
    // "/media/photo%20gallery/16.jpg",
    // "/media/photo%20gallery/17.jpg",
    // "/media/photo%20gallery/18.jpg",
    // "/media/photo%20gallery/19.jpg",
    // "/media/photo%20gallery/20.jpg",
    // "/media/photo%20gallery/21.jpg",
    // "/media/photo%20gallery/22.jpg",
    // "/media/photo%20gallery/23.jpg",
    // "/media/photo%20gallery/24.jpg",
    // "/media/photo%20gallery/25.jpg",
    // "/media/photo%20gallery/26.jpg",
    // "/media/photo%20gallery/27.jpg",
    // "/media/photo%20gallery/28.jpg",
    // "/media/photo%20gallery/29.jpg",
    // "/media/photo%20gallery/30.jpg",
    // "/media/photo%20gallery/31.jpg",
    // "/media/photo%20gallery/32.jpg",
    // "/media/photo%20gallery/33.jpg",
    // "/media/photo%20gallery/34.jpg",
    // "/media/photo%20gallery/35.jpg",
    // "/media/photo%20gallery/36.jpg",
    // "/media/photo%20gallery/37.jpg",
    // "/media/photo%20gallery/38.jpg",
  ],

  // ────────────────────────────────────────────────────────────────
  // EXTERNAL LINKS (open in new tab)
  // ────────────────────────────────────────────────────────────────
  links: {
    behindTheLayout: "https://www.instagram.com/the_layoutt",
    instagram:       "https://www.instagram.com/the_layoutt",
    youtube:         "https://www.youtube.com/@Layoutt",
    blog:            "https://thelayouttco.myportfolio.com/behind-the-scenes-1",
    whatsapp:        "https://wa.me/919137353151",
    customerReviews: "https://thelayouttco.myportfolio.com/customer-reviews",
  },

  // ────────────────────────────────────────────────────────────────
  // FAQ — shown at the bottom of the page, above the payment & return
  // policy. Add, remove, or edit questions freely.
  // ────────────────────────────────────────────────────────────────
  faq: [
    {
      q: "How long does it take to make my magazine?",
      a: "After you complete the order form and submit all required details, we typically take 2–3 business days to design and prepare your magazine.",
    },
    {
      q: "Will I receive a preview before printing?",
      a: "Yes, a digital preview will be shared for approval before printing on your WhatsApp number.",
    },
    {
      q: "How do I know my order is confirmed after the payment?",
      a: "We will contact you on WhatsApp within 6 hours of the payment.",
    },
    {
      q: "Where can I upload the images and text contents?",
      a: "We will send you the Google Drive link and Google Forms link for images and texts on WhatsApp.",
    },
    {
      q: "Do you ship across India?",
      a: "Yes, we deliver all across India only.",
    },
    {
      q: "Can I cancel my order?",
      a: "Because every magazine is custom-made and designed specifically for you, orders cannot be cancelled, returned, or refunded once payment has been completed.",
    },
  ] as { q: string; a: string }[],

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
  // HAPPY CUSTOMERS — screenshots of customer messages/reviews.
  // Shown on the "/happy-customers" page (linked from the homepage).
  //
  // To add one: drop the screenshot image(s) into
  // /public/media/happy-customers/ (any filename), then add an entry
  // below. "images" can hold more than one screenshot per entry — e.g.
  // a multi-message conversation — they'll be swipeable in a gallery.
  // To remove one, delete its whole { ... } block. To pause the whole
  // page, leave this array empty — the homepage button hides itself.
  //
  // Example:
  // {
  //   heading: "Aditi, Mumbai",
  //   images: ["/media/happy-customers/1.jpg", "/media/happy-customers/2.jpg"],
  // },
  // ────────────────────────────────────────────────────────────────
  happyCustomers: [] as { heading: string; images: string[] }[],

  // ────────────────────────────────────────────────────────────────
  // TEMPLATE COUNT
  // How many "Template NN" cards appear in the Templates section.
  // To add more templates: bump this number, then drop a matching
  // "tpl-<n>": ["/media/templates/<n>.jpg"] line into productImages
  // below (Template <n> just shows a placeholder until you do).
  // ────────────────────────────────────────────────────────────────
  templateCount: 24,

  // ────────────────────────────────────────────────────────────────
  // PRODUCT IMAGES (for the e-commerce modal)
  // Keys must match ids in src/lib/catalog.ts.
  // Give each product an array of image URLs — 3-5 works best.
  // Leave the array empty [] to fall back to the auto-generated gradient tile.
  // ────────────────────────────────────────────────────────────────





  productImages: {

      "mandatory-1": ["/media/mandatory/mandatory-front.jpg"], // For "Front Cover"
      "mandatory-2": ["/media/mandatory/mandatory-first.jpg"], // For "First Page"
      "mandatory-3": ["/media/mandatory/mandatory-last.jpg"],  // For "Last Page"
      "mandatory-4": ["/media/mandatory/mandatory-back.jpg"],  // For "Back Cover"

 







    // ── Templates (optional overrides — Template 01..24) ─────────
    // Drop a spread image at /public/media/products/templates/1.jpg (etc.)
    // and add the path here to override the built-in placeholder.
    // "tpl-1":  ["/media/products/templates/1.jpg"],
    // "tpl-2":  ["/media/products/templates/2.jpg"],
    // ...
      "tpl-1": ["/media/templates/1.jpg"],
      "tpl-2": ["/media/templates/2.jpg"],
      "tpl-3": ["/media/templates/3.jpg"],
      "tpl-4": ["/media/templates/4.jpg"],
      "tpl-5": ["/media/templates/5.jpg"],
      "tpl-6": ["/media/templates/6.jpg"],
      "tpl-7": ["/media/templates/7.jpg"],
      "tpl-8": ["/media/templates/8.jpg"],
      "tpl-9": ["/media/templates/9.jpg"],
      "tpl-10": ["/media/templates/10.jpg"],
      "tpl-11": ["/media/templates/11.jpg"],
      "tpl-12": ["/media/templates/12.jpg"],
      "tpl-13": ["/media/templates/13.jpg"],
      "tpl-14": ["/media/templates/14.jpg"],
      "tpl-15": ["/media/templates/15.jpg"],
      "tpl-16": ["/media/templates/16.jpg"],
      "tpl-17": ["/media/templates/17.jpg"],
      "tpl-18": ["/media/templates/18.jpg"],
      "tpl-19": ["/media/templates/19.jpg"],
      "tpl-20": ["/media/templates/20.jpg"],
      "tpl-21": ["/media/templates/21.jpg"],
      "tpl-22": ["/media/templates/22.jpg"],
      "tpl-23": ["/media/templates/23.jpg"],
      "tpl-24": ["/media/templates/24.jpg"],

    // ── Package / sizes (optional cover imagery) ─────────────────
    // "sz-4":  ["/media/products/sizes/4.jpg"],
    // "sz-6":  ["/media/products/sizes/6.jpg"],
    // ...
    // "sz-20": ["/media/products/sizes/20.jpg"],



      // Polaroid strips
      "strip-1": ["/media/strips/1.jpeg"] as string[],
      "strip-2": ["/media/strips/2.jpeg"] as string[],
      "strip-3": ["/media/strips/3.jpeg"] as string[],
      "strip-4": ["/media/strips/4.jpeg"] as string[],
      "strip-5": ["/media/strips/5.jpeg"] as string[],
      // Polaroid packs
      "pol-mini":    [] as string[],
      "pol-classic": [] as string[],
      "pol-memory":  [] as string[],
      "pol-premium": [] as string[],

      // Add-ons
      "add-wrap":   [] as string[],
      "add-letter": [] as string[],
      "add-combo":  [] as string[],

      // Combos (Curated bundles section) — optional cover imagery.
      // "combo-main": ["/media/combos/main.jpg"],
      // "combo-core": ["/media/combos/core.jpg"],
      // "combo-soft": ["/media/combos/soft.jpg"],

      // Delivery (Step 6) — optional cover imagery.
      // "del-std": ["/media/delivery/standard.jpg"],
      // "del-exp": ["/media/delivery/express.jpg"],

      // Newspaper Magazine — previews for its two fixed spreads (the
      // main "news-mag" product itself has no preview image slot; it
      // only ever shows the two spreads below).
      // "news-tpl-1":  ["/media/newspaper/spread-1.jpg"],
      // "news-tpl-2":  ["/media/newspaper/spread-2.jpg"],
  } as Record<string, string[]>,

  // ────────────────────────────────────────────────────────────────
  // BACKGROUNDS — tiled art for individual sections
  // Design tiles at 1920px wide. Middle tile edges must match.
  // Any tile you leave out is simply skipped.
  // ────────────────────────────────────────────────────────────────
  backgrounds: {
    hero: {
      repeat: "/media/bg/checkers.jpeg" // Replace with your actual filename


    } as Tiles,


    howToOrder: {
      repeat: "/media/bg/4.svg",
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
