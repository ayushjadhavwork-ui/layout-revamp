import { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { CATALOG, fmt } from "@/lib/catalog";
import { comboSteps } from "@/lib/combo-guide";
import { OCCASIONS, RECIPIENTS, recommendCombo, type Occasion, type Recipient, type Recommendation } from "@/lib/combo-recommender";
import { SITE } from "@/lib/site-content";
import { useStore } from "@/lib/store";
import { ModalShell } from "./shop";

// Opens the Keepsake Matchmaker: three questions, then one recommended combo
// the customer can load straight into Guided Combo Mode. "banner" sits above
// the Combos grid; "pill" is the compact header button.
export function KeepsakeMatchmaker({ variant = "banner" }: { variant?: "banner" | "pill" }) {
  const [open, setOpen] = useState(false);
  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blush-rose to-rose-wine px-3 py-1 font-medium text-off-white shadow-sm transition hover:opacity-90"
        >
          <Sparkles className="h-3.5 w-3.5" /> Find your combo
        </button>
        {open && <MatchmakerModal onClose={() => setOpen(false)} />}
      </>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mx-auto mt-6 flex w-full max-w-xl items-center gap-3 rounded-full bg-off-white/90 px-4 py-3 text-left shadow-lg ring-1 ring-pink-mist transition hover:bg-off-white sm:px-6"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush-rose to-rose-wine text-off-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-tight text-rose-wine sm:text-xl">✨ Keepsake Matchmaker</span>
          <span className="block text-xs text-dusty-rose">Not sure which combo? Answer 3 quick questions to find your perfect one.</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-rose-wine transition group-hover:translate-x-1" />
      </button>
      {open && <MatchmakerModal onClose={() => setOpen(false)} />}
    </>
  );
}

const STEP_TITLES = ["What's the occasion?", "Who is it for?", "Tell us about your memories"];

function MatchmakerModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<Recommendation | null>(null);
  const selectCombo = useStore((s) => s.selectCombo);

  const findMatch = () => {
    if (!occasion || !recipient) return;
    setResult(recommendCombo(occasion, recipient, notes));
  };

  const choose = (comboId: string) => {
    const combo = CATALOG.combos.find((c) => c.id === comboId);
    if (!combo) return;
    selectCombo(combo);
    toast.success(`${combo.name} added ✨`, { description: "We'll walk you through the picks it needs." });
    onClose();
    // Guided Combo Mode re-renders the page around the combo first, so wait a
    // beat before scrolling to its first pick.
    const first = comboSteps(comboId, [])[0]?.section ?? "combos";
    setTimeout(() => document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active ? "border-rose-wine bg-rose-wine text-off-white shadow" : "border-rose-wine/25 bg-white/70 text-rose-wine hover:border-rose-wine/50"
      }`}
    >
      {label}
    </button>
  );

  if (result) {
    const combo = CATALOG.combos.find((c) => c.id === result.comboId)!;
    const info = SITE.comboInfo[combo.id];
    const hero = SITE.productImages[combo.id]?.[0];
    return (
      <ModalShell onClose={onClose} maxW="max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blush-rose">
          <Sparkles className="h-4 w-4" /> Your match
        </p>
        <h3 className="mt-2 pr-10 font-display text-3xl leading-tight text-rose-wine md:text-4xl">{result.headline}</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {hero && <img src={hero} alt={info.name} className="w-full rounded-2xl object-cover shadow" />}
          <div className="min-w-0">
            <p className="font-display text-2xl text-rose-wine">
              {info.name} <span className="ml-1 text-base text-blush-rose">{fmt(combo.price)}</span>
              {info.originalValue > combo.price && <span className="ml-2 text-sm text-dusty-rose line-through">{fmt(info.originalValue)}</span>}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {result.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="text-blush-rose">♡</span><span>{reason}</span></li>)}
            </ul>
            {result.polaroidTip && (
              <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                <Camera className="h-4 w-4 shrink-0" /> {result.polaroidTip}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={() => setResult(null)} className="pill-btn pill-btn-hover sm:w-auto">
            <ArrowLeft className="h-4 w-4" /> Change answers
          </button>
          <button type="button" onClick={() => choose(combo.id)} className="pill-btn pill-btn-hover pill-primary flex-1">
            Select This Combo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </ModalShell>
    );
  }

  const canNext = step === 0 ? !!occasion : step === 1 ? !!recipient : true;

  return (
    <ModalShell onClose={onClose} maxW="max-w-xl">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blush-rose">
        <Sparkles className="h-4 w-4" /> Keepsake Matchmaker · {step + 1} of 3
      </p>
      <div className="mt-3 flex gap-1" aria-hidden>
        {STEP_TITLES.map((title, i) => <span key={title} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-rose-wine" : "bg-rose-wine/15"}`} />)}
      </div>
      <h3 className="mt-5 font-display text-3xl text-rose-wine">{STEP_TITLES[step]}</h3>

      {step === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => chip(o, occasion === o, () => { setOccasion(o); setStep(1); }))}
        </div>
      )}
      {step === 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {RECIPIENTS.map((r) => chip(r, recipient === r, () => { setRecipient(r); setStep(2); }))}
        </div>
      )}
      {step === 2 && (
        <div className="mt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="e.g. We have 15 travel photos and 5 cute selfies, want something heartfelt with a letter"
            className="w-full rounded-2xl border border-rose-wine/20 bg-white/80 p-3 text-sm text-neutral-800 outline-none focus:border-rose-wine/50"
          />
          <p className="mt-1 text-xs text-dusty-rose">Optional — mention how many photos you have and anything you'd love (a letter, a magazine, something small…).</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="pill-btn pill-btn-hover">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        {step < 2 ? (
          <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="pill-btn pill-btn-hover pill-primary ml-auto disabled:opacity-50">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={findMatch} className="pill-btn pill-btn-hover pill-primary ml-auto">
            <Sparkles className="h-4 w-4" /> Find my combo
          </button>
        )}
      </div>
    </ModalShell>
  );
}
