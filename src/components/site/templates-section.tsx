import { useState } from "react";
import { BookOpen } from "lucide-react";

import { toast } from "sonner";
import { CATALOG } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { TemplateGrid, TemplateDetailModal } from "./template-picker";

// The normal (Standard/Mini) magazine's template picker. The Pocket
// Magazine has its own independent picker(s) — one per unit — embedded
// directly in pocket-section.tsx, since each Pocket Magazine bought needs
// its own template selection (see store.ts's pocketUnits).
export function TemplatesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedIds = useStore((s) => s.selectedTemplateIds);
  const limit = useStore((s) => s.templateLimit());
  const toggleTemplate = useStore((s) => s.toggleTemplate);
  const randomizeTemplates = useStore((s) => s.randomizeTemplates);

  const items = CATALOG.templates;

  if (!selectedSizeId) {
    return (
      <div className="mt-6 rounded-3xl p-10 bg-rose-wine text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-pink-mist">
          Pick a page package above to unlock templates.
        </p>
      </div>
    );
  }

  const item = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <TemplateGrid
        icon={<BookOpen className="h-5 w-5" />}
        heading="RIGHT – LEFT SIDE TEMPLATES"
        statusLabel={`${selectedIds.length} of ${limit} selected`}
        items={items}
        selectedIds={selectedIds}
        limit={limit}
        onToggle={(id, label) => {
          const already = selectedIds.includes(id);
          const ok = toggleTemplate(id);
          if (!ok) return toast.error(`You can only pick ${limit} template(s) for this package.`);
          toast.success(already ? `${label} removed` : `${label} selected`);
        }}
        onRandomize={() => {
          const n = randomizeTemplates();
          if (n > 0) toast.success(`Randomised ${n} template${n === 1 ? "" : "s"} ✨`);
        }}
        onOpen={(index) => setOpenIndex(index)}
      />

      <TemplateDetailModal
        open={openIndex !== null}
        item={item}
        templateIndex={openIndex ?? -1}
        active={!!item && selectedIds.includes(item.id)}
        limit={limit}
        eyebrow="Magazine Spread"
        limitErrorSuffix="for this package"
        onToggle={toggleTemplate}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
