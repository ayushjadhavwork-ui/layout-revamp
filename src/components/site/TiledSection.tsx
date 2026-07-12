import type { CSSProperties, ReactNode } from "react";
import type { Tiles } from "@/lib/site-content";

/**
 * TiledSection — renders a <section> with an optional tiled background.
 *
 *   head   → drawn once at the top (no-repeat, full width)
 *   repeat → tiled vertically to fill the middle (must be edge-seamless)
 *   tail   → drawn once at the bottom (no-repeat, full width)
 *
 * Pass any combination. Pass {} for no tiles at all.
 */
export function TiledSection({
  tiles,
  children,
  className = "",
  id,
}: {
  tiles?: Tiles;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const style: CSSProperties = {};
  const t = tiles ?? {};
  const layers: string[] = [];
  const positions: string[] = [];
  const repeats: string[] = [];
  const sizes: string[] = [];

  // ORDER MATTERS: first-listed layer paints ON TOP.
  // Head + tail sit above the repeating middle so they cover any overlap.
  if (t.head) {
    layers.push(`url("${t.head}")`);
    positions.push("top center");
    repeats.push("no-repeat");
    sizes.push("100% auto");
  }
  if (t.tail) {
    layers.push(`url("${t.tail}")`);
    positions.push("bottom center");
    repeats.push("no-repeat");
    sizes.push("100% auto");
  }
  if (t.repeat) {
    layers.push(`url("${t.repeat}")`);
    positions.push("center top");
    repeats.push("repeat-y");
    sizes.push("100% auto");
  }

  if (layers.length) {
    style.backgroundImage = layers.join(", ");
    style.backgroundPosition = positions.join(", ");
    style.backgroundRepeat = repeats.join(", ");
    style.backgroundSize = sizes.join(", ");
  }

  return (
    <section id={id} className={`relative ${className}`} style={style}>
      {children}
    </section>
  );
}
