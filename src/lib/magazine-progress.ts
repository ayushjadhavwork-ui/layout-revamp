import { CATALOG } from "./catalog";

// Magazine Template Progress: how many templates each magazine in the cart
// still needs. Drives the bottom bar shown while building a Custom (A4/A5)
// or Pocket Magazine outside a combo — combos have their own guide bar.

export type MagazineTrack = {
  label: string;
  chosen: number;
  required: number;
  // Element id the "Pick templates" button scrolls to.
  anchor: string;
};

export type MagazineProgress = {
  tracks: MagazineTrack[];
  chosen: number;
  required: number;
  percent: number;
  // The first magazine still short of templates; null once all are done.
  next: MagazineTrack | null;
};

export function magazineTracks(input: {
  sizeId: string | null;
  templateCount: number;
  pocketUnits: { uid: string; templateIds: string[] }[];
  pocketLimit: number;
}): MagazineTrack[] {
  const tracks: MagazineTrack[] = [];
  const size = CATALOG.sizes.find((s) => s.id === input.sizeId);
  if (size?.templateLimit) {
    const format = size.format === "mini" ? "Mini A5" : "Standard A4";
    tracks.push({
      label: `Custom ${format} Magazine · ${size.name}`,
      chosen: Math.min(input.templateCount, size.templateLimit),
      required: size.templateLimit,
      anchor: "templates",
    });
  }
  if (input.pocketLimit > 0) {
    input.pocketUnits.forEach((unit, i) => {
      tracks.push({
        label: input.pocketUnits.length > 1 ? `Pocket Magazine #${i + 1}` : "Pocket Magazine",
        chosen: Math.min(unit.templateIds.length, input.pocketLimit),
        required: input.pocketLimit,
        anchor: `pocket-unit-${unit.uid}`,
      });
    });
  }
  return tracks;
}

export function magazineProgress(tracks: MagazineTrack[]): MagazineProgress {
  const chosen = tracks.reduce((sum, t) => sum + t.chosen, 0);
  const required = tracks.reduce((sum, t) => sum + t.required, 0);
  const percent = required ? Math.min(100, Math.round((chosen / required) * 100)) : 0;
  const next = tracks.find((t) => t.chosen < t.required) ?? null;
  return { tracks, chosen, required, percent, next };
}
