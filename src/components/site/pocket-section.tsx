import { useState } from "react";
import { Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { CATALOG } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { TemplateGrid, TemplateDetailModal } from "./template-picker";
import { ScrollHint } from "./scroll-hint";

// Template pickers for the Pocket Magazines (A6) in the cart — one per
// Pocket Magazine, since each needs its own 3 templates (see pocketUnits in
// store.ts). Pocket Magazines are added from the magazine builder
// (sizes-section.tsx) or a combo; this only handles their template picks.
export function PocketTemplatePickers() {
  const [openUnitCtx, setOpenUnitCtx] = useState<{ uid: string; index: number } | null>(null);

  const pocketUnits = useStore((s) => s.pocketUnits);
  const cart = useStore((s) => s.cart);
  const removePocketUnit = useStore((s) => s.removePocketUnit);
  const togglePocketTemplate = useStore((s) => s.togglePocketTemplate);
  const randomizePocketTemplates = useStore((s) => s.randomizePocketTemplates);
  const pocketLimit = useStore((s) => s.pocketTemplateLimit());

  const items = CATALOG["pocket-templates"];
  const openUnitItem = openUnitCtx ? items[openUnitCtx.index] : null;
  const openUnit = openUnitCtx ? pocketUnits.find((u) => u.uid === openUnitCtx.uid) : null;

  return (
    <>
      {pocketUnits.map((unit, i) => {
        const anchorId = `pocket-unit-${unit.uid}`;
        const incomplete = unit.templateIds.length < pocketLimit;
        // A combo's Pocket Magazine can only go by removing the combo.
        const inCombo = cart.some((c) => c.category === "pocket" && c.unit === unit.uid && c.comboId);
        return (
          <div key={unit.uid} id={anchorId} className="relative">
            {!inCombo && (
              <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
                <button
                  type="button"
                  onClick={() => {
                    removePocketUnit(unit.uid);
                    toast.success(`Pocket Magazine #${i + 1} removed`);
                  }}
                  aria-label={`Remove Pocket Magazine #${i + 1}`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-off-white/15 text-off-white hover:bg-off-white/25"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <TemplateGrid
              icon={<Wallet className="h-5 w-5" />}
              heading={`POCKET MAGAZINE${pocketUnits.length > 1 ? ` #${i + 1}` : ""} TEMPLATES`}
              statusLabel={`${unit.templateIds.length} of ${pocketLimit} selected`}
              items={items}
              selectedIds={unit.templateIds}
              limit={pocketLimit}
              onToggle={(id, label) => {
                const already = unit.templateIds.includes(id);
                const ok = togglePocketTemplate(unit.uid, id);
                if (!ok)
                  return toast.error(
                    `You can only pick ${pocketLimit} template(s) for this Pocket Magazine.`,
                  );
                toast.success(already ? `${label} removed` : `${label} selected`);
              }}
              onRandomize={() => {
                const n = randomizePocketTemplates(unit.uid);
                if (n > 0) toast.success(`Randomised ${n} template${n === 1 ? "" : "s"} ✨`);
              }}
              onOpen={(index) => setOpenUnitCtx({ uid: unit.uid, index })}
            />
            {incomplete && (
              <ScrollHint
                text={`Pick your ${pocketLimit} template${pocketLimit === 1 ? "" : "s"} for Pocket Magazine${pocketUnits.length > 1 ? ` #${i + 1}` : ""}`}
                targetId={anchorId}
              />
            )}
          </div>
        );
      })}

      <TemplateDetailModal
        open={!!openUnitCtx}
        item={openUnitItem}
        templateIndex={openUnitCtx?.index ?? -1}
        active={!!openUnitItem && !!openUnit?.templateIds.includes(openUnitItem.id)}
        limit={pocketLimit}
        eyebrow="Pocket Magazine Spread"
        limitErrorSuffix="for this Pocket Magazine"
        onToggle={(id) => (openUnitCtx ? togglePocketTemplate(openUnitCtx.uid, id) : false)}
        onClose={() => setOpenUnitCtx(null)}
      />
    </>
  );
}
