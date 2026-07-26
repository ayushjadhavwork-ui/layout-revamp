import { useState } from "react";
import { Newspaper, Check } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, NEWSPAPER_TEMPLATES, fmt } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { SITE } from "@/lib/site-content";

const PICK_COUNT = 2;

function LayoutPlaceholder({ n }: { n: number }) {
  const palettes = [
    ["#f4c9d1", "#8b3a52"],
    ["#eadfd0", "#6e4a2c"],
    ["#f2d6c9", "#7a2a2a"],
    ["#dfe7d5", "#3f6b48"],
    ["#e0d3ee", "#4a3f7a"],
    ["#f7dfae", "#8a5a2b"],
  ];
  const [c1, c2] = palettes[(n - 1) % palettes.length];
  return (
    <div className="absolute inset-0 grid grid-cols-2">
      <div className="flex items-center justify-center border-r border-white/60" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <span className="font-display italic text-white/90 text-sm">Left</span>
      </div>
      <div className="flex items-center justify-center" style={{ background: `linear-gradient(225deg, ${c1}, ${c2})` }}>
        <span className="font-display italic text-white/90 text-sm">Right</span>
      </div>
    </div>
  );
}

// This section is entirely self-contained: its own product, its own template
// pool, its own local selection state. It doesn't touch the magazine builder
// (sizes/templates), any combo, or delivery — see COMBO_INDEPENDENT in store.ts.
export function NewspaperSection() {
  const [picked, setPicked] = useState<string[]>([]);
  const cart = useStore((s) => s.cart);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  const product = CATALOG.newspaper[0];
  const cartItem = cart.find((c) => c.category === "newspaper" && c.id === product.id);
  const inCart = !!cartItem;

  const togglePick = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= PICK_COUNT) {
        toast.error(`Pick just ${PICK_COUNT} layouts for your newspaper.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAdd = () => {
    if (picked.length !== PICK_COUNT) {
      toast.error(`Choose ${PICK_COUNT} layouts first.`);
      return;
    }
    const names = picked
      .map((id) => NEWSPAPER_TEMPLATES.find((t) => t.id === id)?.name ?? id)
      .join(", ");
    addItem("newspaper", product, `Layouts: ${names}`);
    toast.success("Newspaper Magazine added ✨");
  };

  const handleRemove = () => {
    if (cartItem) removeItem(cartItem.key);
    setPicked([]);
    toast.success("Newspaper Magazine removed");
  };

  return (
    <div className="mt-6 rounded-3xl p-6 md:p-10 bg-gradient-to-br from-rose-wine via-rose-wine to-blush-rose shadow-2xl ring-1 ring-pink-mist/30">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-off-white">
          <Newspaper className="h-5 w-5" />
          <span className="font-display text-2xl md:text-3xl tracking-[0.2em]">NEWSPAPER MAGAZINE</span>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.35em] text-pink-mist">
          ✧ A pocket-sized broadsheet keepsake ✧
        </p>
        <p className="mt-3 font-display italic text-off-white/80 text-sm md:text-base">
          Two landscape spreads, one flat price — {fmt(product.price)}.
        </p>
      </div>

      {inCart ? (
        <div className="mx-auto max-w-md rounded-2xl bg-black/15 p-6 text-center ring-1 ring-off-white/40">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-off-white text-rose-wine shadow">
            <Check className="h-5 w-5" />
          </span>
          <p className="mt-3 font-display text-xl text-off-white">Newspaper Magazine added</p>
          {cartItem?.note && <p className="mt-1 text-xs text-pink-mist/90">{cartItem.note}</p>}
          <button
            type="button"
            onClick={handleRemove}
            className="mt-4 rounded-full px-4 py-1.5 text-[0.7rem] font-medium text-off-white border border-pink-mist/50 hover:bg-off-white/10"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <p className="text-center text-xs text-pink-mist mb-4">
            Pick {PICK_COUNT} layouts ({picked.length}/{PICK_COUNT} selected)
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {NEWSPAPER_TEMPLATES.map((tpl, idx) => {
              const active = picked.includes(tpl.id);
              const hero = SITE.productImages?.[tpl.id]?.[0];
              return (
                <div
                  key={tpl.id}
                  className={`relative rounded-xl overflow-hidden bg-black/15 ring-1 transition ${
                    active ? "ring-2 ring-off-white" : "ring-pink-mist/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => togglePick(tpl.id)}
                    aria-label={`Select ${tpl.name}`}
                    className="relative block w-full aspect-[4/3]"
                  >
                    {hero ? (
                      <img src={hero} alt={tpl.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <LayoutPlaceholder n={idx + 1} />
                    )}
                    {active && (
                      <span className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-off-white text-rose-wine shadow z-10">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                  <p className="py-2 text-center font-display tracking-[0.2em] text-xs text-off-white">
                    {tpl.name}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleAdd}
              disabled={picked.length !== PICK_COUNT}
              className="rounded-full px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] bg-off-white text-rose-wine shadow-lg transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to cart — {fmt(product.price)}
            </button>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs tracking-[0.25em] text-pink-mist">
        ♡ small format, big story ♡
      </p>
    </div>
  );
}
