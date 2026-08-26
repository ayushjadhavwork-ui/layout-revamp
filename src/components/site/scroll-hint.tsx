import { ChevronDown } from "lucide-react";

// A small nudge shown right after a customer picks a magazine package (or a
// Pocket Magazine) prompting them to scroll down and pick its templates —
// the "pick templates" step lives further down the page and is easy to miss
// otherwise. Purely a click-to-scroll convenience; it disappears on its own
// once the caller's own completion condition (all templates picked) is met.
export function ScrollHint({ text, targetId }: { text: string; targetId: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      className="mx-auto mt-4 flex items-center gap-2 rounded-full bg-off-white/15 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-off-white ring-1 ring-off-white/40 transition hover:bg-off-white/25"
    >
      {text}
      <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
    </button>
  );
}
