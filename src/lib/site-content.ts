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

  // Friendship Card — interactive 3D preview (.glb). Swap the file at the
  // same path to update the model; no code change needed. This is a
  // placeholder box model — replace with a real scan/model of the card
  // whenever it's ready.
  friendshipCardModel: "/media/friendship/card.glb",

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
  // cycling through the rest of the list. Add or remove lines freely.
  // ────────────────────────────────────────────────────────────────
  photoGallery: [
    "/media/photo%20gallery/1.webp",
    "/media/photo%20gallery/2.webp",
    "/media/photo%20gallery/3.webp",
    "/media/photo%20gallery/4.webp",
    "/media/photo%20gallery/5.webp",
    "/media/photo%20gallery/6.webp",
    "/media/photo%20gallery/7.webp",
    "/media/photo%20gallery/8.webp",
    "/media/photo%20gallery/9.webp",
    "/media/photo%20gallery/10.webp",
    "/media/photo%20gallery/11.webp",
    "/media/photo%20gallery/12.webp",
    "/media/photo%20gallery/13.webp",
    "/media/photo%20gallery/14.webp",
    "/media/photo%20gallery/15.webp",
    "/media/photo%20gallery/16.webp",
    "/media/photo%20gallery/17.webp",
    "/media/photo%20gallery/18.webp",
    "/media/photo%20gallery/19.webp",
    "/media/photo%20gallery/20.webp",
    "/media/photo%20gallery/21.webp",
    "/media/photo%20gallery/22.webp",
    "/media/photo%20gallery/23.webp",
    "/media/photo%20gallery/24.webp",
    "/media/photo%20gallery/25.webp",
    "/media/photo%20gallery/26.webp",
    "/media/photo%20gallery/27.webp",
    "/media/photo%20gallery/28.webp",
    "/media/photo%20gallery/29.webp",
    "/media/photo%20gallery/30.webp",
    "/media/photo%20gallery/31.webp",
    "/media/photo%20gallery/32.webp",
    "/media/photo%20gallery/33.webp",
    "/media/photo%20gallery/34.webp",
    "/media/photo%20gallery/35.webp",
    "/media/photo%20gallery/36.webp",
    "/media/photo%20gallery/37.webp",
    "/media/photo%20gallery/38.webp",
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
    customerReviews: "https://thelayout.layoutt.workers.dev/happy-customers",
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
  // FOUNDERS — a single banner image is shown for the whole section.
  // Swap the file (or the path) to change it. Portrait/4:5 works best.
  // ────────────────────────────────────────────────────────────────
  foundersImage: "/media/founders/foudners_banner.webp",
  foundersImageAlt: "The founders of The Layout",


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
  //   images: ["/media/happy-customers/1.webp", "/media/happy-customers/2.webp"],
  // },
  // ────────────────────────────────────────────────────────────────
  happyCustomers: [
      {heading: "Balasubramanian",
       images: ["/media/happy_customers/1.webp",]
      },
      {heading: "Anushka",
       images: ["/media/happy_customers/2.webp",]
      },
      {heading: "Riya",
       images: ["/media/happy_customers/3.webp",]
      },
      {heading: "Harsh",
       images: ["/media/happy_customers/4.webp",]
      },
      {heading: "Pushkar",
       images: ["/media/happy_customers/5.webp",]
      },
      {heading: "Cindrella, Mumbai",
       images: ["/media/happy_customers/6.webp",]
      },
      
    



  ] as { heading: string; images: string[] }[],

  // ────────────────────────────────────────────────────────────────
  // TEMPLATE COUNT
  // How many "Template NN" cards appear in the Templates section.
  // To add more templates: bump this number, then drop a matching
  // "tpl-<n>": ["/media/templates/<n>.webp"] line into productImages
  // below (Template <n> just shows a placeholder until you do).
  // ────────────────────────────────────────────────────────────────
  templateCount: 34,       

  // ────────────────────────────────────────────────────────────────
  // PRODUCT IMAGES (for the e-commerce modal)
  // Keys must match ids in src/lib/catalog.ts.
  // Give each product an array of image URLs — 3-5 works best.
  // Leave the array empty [] to fall back to the auto-generated gradient tile.
  // ────────────────────────────────────────────────────────────────





  productImages: {

      "mandatory-1": ["/media/mandatory/mandatory-front.webp"], // For "Front Cover"
      "mandatory-2": ["/media/mandatory/mandatory-first.webp"], // For "First Page"
      "mandatory-3": ["/media/mandatory/mandatory-last.webp"],  // For "Last Page"
      "mandatory-4": ["/media/mandatory/mandatory-back.webp"],  // For "Back Cover"

 







    // ── Templates (optional overrides — Template 01..24) ─────────
    // Drop a spread image at /public/media/products/templates/1.webp (etc.)
    // and add the path here to override the built-in placeholder.
    // "tpl-1":  ["/media/products/templates/1.webp"],
    // "tpl-2":  ["/media/products/templates/2.webp"],
    // ...
      "tpl-1": ["/media/templates/1.webp"],
      "tpl-2": ["/media/templates/2.webp"],
      "tpl-3": ["/media/templates/3.webp"],
      "tpl-4": ["/media/templates/4.webp"],
      "tpl-5": ["/media/templates/5.webp"],
      "tpl-6": ["/media/templates/6.webp"],
      "tpl-7": ["/media/templates/7.webp"],
      "tpl-8": ["/media/templates/8.webp"],
      "tpl-9": ["/media/templates/9.webp"],
      "tpl-10": ["/media/templates/10.webp"],
      "tpl-11": ["/media/templates/11.webp"],
      "tpl-12": ["/media/templates/12.webp"],
      "tpl-13": ["/media/templates/13.webp"],
      "tpl-14": ["/media/templates/14.webp"],
      "tpl-15": ["/media/templates/15.webp"],
      "tpl-16": ["/media/templates/16.webp"],
      "tpl-17": ["/media/templates/17.webp"],
      "tpl-18": ["/media/templates/18.webp"],
      "tpl-19": ["/media/templates/19.webp"],
      "tpl-20": ["/media/templates/20.webp"],
      "tpl-21": ["/media/templates/21.webp"],
      "tpl-22": ["/media/templates/22.webp"],
      "tpl-23": ["/media/templates/23.webp"],
      "tpl-24": ["/media/templates/24.webp"],
      "tpl-25": ["/media/templates/25.webp"],
      "tpl-26": ["/media/templates/26.webp"],
      "tpl-27": ["/media/templates/27.webp"],
      "tpl-28": ["/media/templates/28.webp"],
      "tpl-29": ["/media/templates/29.webp"],
      "tpl-30": ["/media/templates/30.webp"],
      "tpl-31": ["/media/templates/31.webp"],
      "tpl-32": ["/media/templates/32.webp"],
      "tpl-33": ["/media/templates/33.webp"],
      "tpl-34": ["/media/templates/34.webp"],

    // ── Package / sizes thumbnails + size guides ─────────────────
    // By default the site auto-loads:
    //   Standard (A4): /media/sizes/<pages>_pages_magazine.webp      (thumbnail)
    //                  /media/sizes/<pages>_pages_sizeGuide.webp     (detail)
    //   Mini (A5):     /media/sizes-mini/<pages>_pages_magazine.webp (thumbnail)
    //                  /media/sizes-mini/<pages>_pages_sizeGuide.webp(detail)
    // To use a different file, uncomment a line below and change the path.
    // First image = thumbnail, any following images = detail gallery.
    // Standard (A4):
    // "sz-4":  ["/media/sizes/4_pages_magazine.webp", "/media/sizes/4_pages_sizeGuide.webp"],
    // "sz-6":  ["/media/sizes/6_pages_magazine.webp", "/media/sizes/6_pages_sizeGuide.webp"],
    // ... sz-8, sz-12, sz-14, sz-16, sz-18, sz-20
    // Mini (A5):
    "sz-4-mini":  ["/media/sizes-mini/4_pages_mini_magazine.webp", "/media/sizes-mini/4_mini_sizeGuide.webp"],
    "sz-6-mini":  ["/media/sizes-mini/6_pages_mini_magazine.webp", "/media/sizes-mini/6_mini_sizeGuide.webp"],
    "sz-8-mini" :  ["/media/sizes-mini/8_pages_mini_magazine.webp", "/media/sizes-mini/8_mini_sizeGuide.webp"],
    "sz-12-mini" :  ["/media/sizes-mini/12_pages_mini_magazine.webp", "/media/sizes-mini/12_mini_sizeGuide.webp"],
    "sz-14-mini" :  ["/media/sizes-mini/14_pages_mini_magazine.webp", "/media/sizes-mini/14_mini_sizeGuide.webp"],
    "sz-16-mini" :  ["/media/sizes-mini/16_pages_mini_magazine.webp", "/media/sizes-mini/16_mini_sizeGuide.webp"],
    "sz-18-mini" :  ["/media/sizes-mini/18_pages_mini_magazine.webp", "/media/sizes-mini/18_mini_sizeGuide.webp"],
    "sz-20-mini" :  ["/media/sizes-mini/20_pages_mini_magazine.webp", "/media/sizes-mini/20_mini_sizeGuide.webp"],
    // ... sz-8-mini, sz-12-mini, sz-14-mini, sz-16-mini, sz-18-mini, sz-20-mini




      // Polaroid strips
      "strip-1": ["/media/strips/1.webp"] as string[],
      "strip-2": ["/media/strips/2.webp"] as string[],
      "strip-3": ["/media/strips/3.webp"] as string[],
      "strip-4": ["/media/strips/4.webp"] as string[],
      "strip-5": ["/media/strips/5.webp"] as string[],
      // Polaroid packs
      "pol-mini":    ["/media/polaroids/1.webp"] as string[],
      "pol-classic": ["/media/polaroids/2.webp"] as string[],
      "pol-memory":  ["/media/polaroids/3.webp"] as string[],
      "pol-premium": ["/media/polaroids/4.webp"] as string[],

      // Add-ons
      "add-wrap":   ["/media/addons/wrap.webp"] as string[],
      "add-letter": ["/media/addons/letter.webp"] as string[],
      "add-combo":  ["/media/addons/combo.webp"] as string[],

      // Combos (Curated bundles section) — optional cover imagery.
      "combo-main": ["/media/combos/main_character_pack.webp"],
      "combo-core": ["/media/combos/core_memory_pack.webp"],
      "combo-soft": ["/media/combos/soft_launch_pack.webp"],

      // Delivery (Step 6) — optional cover imagery.
      // "del-std": ["/media/delivery/standard.webp"],
      // "del-exp": ["/media/delivery/express.webp"],

      // Newspaper Magazine — previews for its two fixed spreads (the
      // main "news-mag" product itself has no preview image slot; it
      // only ever shows the two spreads below).
      "news-tpl-1":  ["/media/newspaper/1.webp"],
      "news-tpl-2":  ["/media/newspaper/2.webp"],

      // Pocket Magazine — first entry is the product-card thumbnail, any
      // further entries become extra gallery images in its modal.
      "pocket-mag":  ["/media/pocket/pocket-hero.webp"],
  } as Record<string, string[]>,

  // ────────────────────────────────────────────────────────────────
  // BACKGROUNDS — tiled art for individual sections
  // Design tiles at 1920px wide. Middle tile edges must match.
  // Any tile you leave out is simply skipped.
  // ────────────────────────────────────────────────────────────────
  backgrounds: {
    hero: {
      repeat: "/media/bg/checkers.webp" // Replace with your actual filename


    } as Tiles,


    howToOrder: {
      repeat: "/media/bg/4.svg",
    } as Tiles,

    journey:  {} as Tiles,

    // Head + repeating middle + tail — for LONG sections
    customize: {} as Tiles,
    // e.g.
    // customize: {
    //   head:   "/media/bg/customize-head.webp",
    //   repeat: "/media/bg/customize-mid.webp",
    //   tail:   "/media/bg/customize-tail.webp",
    // },
    
    founders: {
      tail: "/media/bg/1.svg"
    } as Tiles,
  } as Record<string, Tiles>,
};
