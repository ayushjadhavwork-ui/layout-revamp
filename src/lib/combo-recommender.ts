import { CATALOG, COMBO_RECIPES, IT_POLAROID_PRICE, fmt } from "./catalog";
import { SITE } from "./site-content";

// The Keepsake Matchmaker: picks one of the curated combos from an occasion,
// a recipient and a free-text note. Everything it knows about a combo comes
// from SITE.comboInfo (perfectFor, included, originalValue) and
// COMBO_RECIPES, so editing a combo there changes its recommendations too.
// Scoring runs in the browser; there is no AI call.

export const OCCASIONS = ["Birthday", "Anniversary", "Long Distance", "Farewell", "Travel", "Just Because"] as const;
export const RECIPIENTS = ["Best Friend", "Partner", "Parents", "Sibling", "Self"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type Recipient = (typeof RECIPIENTS)[number];

export type Recommendation = {
  comboId: string;
  headline: string;
  reasons: string[];
  // Set when the customer mentions more photos than the combo holds.
  polaroidTip?: string;
};

// Words to look for in a combo's perfectFor/description for each answer.
const OCCASION_TERMS: Record<Occasion, string[]> = {
  Birthday: ["birthday"],
  Anniversary: ["anniversar", "valentine", "love"],
  "Long Distance": ["couple", "partner", "love", "little gift", "surprise"],
  Farewell: ["milestone", "friend", "memory", "keepsake"],
  Travel: ["memory keeping", "archive", "memories", "collection"],
  "Just Because": ["just because", "little", "surprise"],
};

const RECIPIENT_TERMS: Record<Recipient, string[]> = {
  "Best Friend": ["best friend", "bestie", "friend", "duo"],
  Partner: ["couple", "partner", "love", "anniversar", "valentine"],
  Parents: ["special gift", "milestone", "premium", "keepsake"],
  Sibling: ["sibling", "birthday"],
  Self: ["memory keeping", "just because", "archive"],
};

// Roughly how many photos each part of a combo holds.
const PHOTOS_PER_STRIP = 4;
const PHOTOS_PER_MAGAZINE_PAGE = 1.5;
const NEWSPAPER_PHOTOS = 8;
const POCKET_PHOTOS = 6;

export function comboPhotoCapacity(comboId: string): number {
  const recipe = COMBO_RECIPES[comboId];
  if (!recipe) return 0;
  let photos = 0;
  const pages = Number(recipe.sizeId?.match(/sz-(\d+)/)?.[1] ?? 0);
  photos += pages * PHOTOS_PER_MAGAZINE_PAGE;
  if (recipe.newspaper) photos += NEWSPAPER_PHOTOS;
  photos += (recipe.pocketCount ?? 0) * POCKET_PHOTOS;
  if (recipe.polaroidId) {
    const pack = CATALOG.polaroids.find((p) => p.id === recipe.polaroidId);
    photos += Number(pack?.desc.match(/\d+/)?.[0] ?? 0);
  }
  photos += (recipe.stripCount ?? 0) * PHOTOS_PER_STRIP;
  photos += recipe.friendshipCount ?? 0;
  photos += recipe.memoryCardCount ?? 0;
  return Math.round(photos);
}

// "15 travel photos and 5 selfies" → 20. Only numbers followed (within two
// words, not counting "of") by a photo word count, so prices, years, ages
// and page counts are ignored: "Rs 500, 20 photos" → 20, "2 years of
// photos" → 0. No lookbehind: older Safari can't parse it.
const PHOTO_COUNT = /\b(\d{1,3})\s+(?:(?!of\b)[a-z'-]+\s+){0,2}(?:photo|pic|picture|selfie|image|snap|shot|polaroid|print)s?\b/gi;

export function photoCountIn(text: string): number {
  return [...text.matchAll(PHOTO_COUNT)]
    .map((m) => Number(m[1]))
    .reduce((sum, n) => sum + n, 0);
}

const has = (haystack: string, terms: string[]) => terms.filter((t) => haystack.includes(t));

export function recommendCombo(occasion: Occasion, recipient: Recipient, notes: string): Recommendation {
  const text = notes.toLowerCase();
  const photos = photoCountIn(notes);
  const prices = CATALOG.combos.map((c) => c.price);
  const [minPrice, maxPrice] = [Math.min(...prices), Math.max(...prices)];

  const scored = CATALOG.combos.map((combo) => {
    const info = SITE.comboInfo[combo.id];
    const recipe = COMBO_RECIPES[combo.id] ?? {};
    const tags = `${info.perfectFor} ${info.description}`.toLowerCase();
    const addons = recipe.addonIds ?? [];
    const priceRank = (combo.price - minPrice) / Math.max(1, maxPrice - minPrice); // 0 cheapest … 1 priciest
    let score = 0;

    // Answers set the baseline; extra matching words only nudge, so a named
    // product in the note can still outweigh them.
    const occasionHits = has(tags, OCCASION_TERMS[occasion]).length;
    const recipientHits = has(tags, RECIPIENT_TERMS[recipient]).length;
    score += occasionHits ? 5 + Math.min(occasionHits - 1, 2) * 0.5 : 0;
    score += recipientHits ? 3 + Math.min(recipientHits - 1, 2) * 0.5 : 0;

    if (/letter|note|message/.test(text) && addons.some((a) => a === "add-letter" || a === "add-combo")) score += 4;
    if (/wrap|gift[- ]?ready/.test(text) && addons.some((a) => a === "add-wrap" || a === "add-combo")) score += 3;
    if (/magazine/.test(text) && recipe.sizeId) score += 3;
    if (/newspaper/.test(text) && recipe.newspaper) score += 5;
    if (/pocket|tiny|small/.test(text) && recipe.pocketCount) score += 5;
    if (/card/.test(text) && (recipe.friendshipCount || recipe.memoryCardCount)) score += 2;
    if (/strip|photobooth|photo booth/.test(text) && recipe.stripCount) score += 2;
    if (/duo|two of us|both of us|pair|twin/.test(text) && (recipe.friendshipCount ?? 0) >= 2) score += 4;
    if (/budget|cheap|affordable|simple|small|tiny|little/.test(text)) score += (1 - priceRank) * 4;
    if (/premium|grand|all out|everything|big|ultimate|best/.test(text)) score += priceRank * 4;

    if (photos > 0) {
      const capacity = comboPhotoCapacity(combo.id);
      score += 4 * (1 - Math.min(1, Math.abs(capacity - photos) / Math.max(capacity, photos)));
    }
    return { combo, score };
  });

  // Highest score wins; ties go to the cheaper combo.
  scored.sort((a, b) => b.score - a.score || a.combo.price - b.combo.price);
  const { combo } = scored[0];
  const info = SITE.comboInfo[combo.id];
  const tags = info.perfectFor.toLowerCase();
  const matchedFor = info.perfectFor
    .split("•")
    .map((t) => t.trim())
    .filter((t) => [...OCCASION_TERMS[occasion], ...RECIPIENT_TERMS[recipient]].some((term) => t.toLowerCase().includes(term)));

  const reasons: string[] = [];
  reasons.push(
    matchedFor.length
      ? `Made for ${matchedFor.join(", ")} — a natural fit for a ${occasion.toLowerCase()} gift for your ${recipient.toLowerCase()}.`
      : `A well-rounded bundle for a ${occasion.toLowerCase()} gift${recipient === "Self" ? " to yourself" : ` for your ${recipient.toLowerCase()}`}.`,
  );
  reasons.push(`Includes ${info.included.join(", ")}.`);
  if (/letter|note|message/.test(notes.toLowerCase()) && info.included.some((i) => /letter/i.test(i))) {
    reasons.push("Comes with a handwritten letter for the heartfelt words you mentioned.");
  }
  if (info.originalValue > combo.price) {
    reasons.push(`You pay ${fmt(combo.price)} instead of ${fmt(info.originalValue)} — save ${fmt(info.originalValue - combo.price)}.`);
  }

  const capacity = comboPhotoCapacity(combo.id);
  const extra = photos - capacity;
  const polaroidTip = extra > 0
    ? `You mentioned about ${photos} photos and this combo holds around ${capacity}. Add ${extra} ${SITE.itPolaroids.name} (${fmt(IT_POLAROID_PRICE)} each) so every extra photo still gets printed.`
    : undefined;

  const forWhom = recipient === "Self" ? "you" : `your ${recipient.toLowerCase()}`;
  const headline = tags.includes(occasion.toLowerCase())
    ? `${info.name} is the ${occasion.toLowerCase()} pick for ${forWhom}`
    : `${info.name} is a lovely match for ${forWhom}`;

  return { comboId: combo.id, headline, reasons, polaroidTip };
}
