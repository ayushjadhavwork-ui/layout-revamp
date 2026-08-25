import type { DetailedHTMLProps, HTMLAttributes } from "react";

// Minimal ambient declaration for Google's <model-viewer> web component.
// The project loads the real element via a client-only dynamic import
// (see friendship-section.tsx) rather than a React wrapper package, so this
// just teaches JSX the tag and the handful of kebab-case DOM attributes we
// actually use — the real behavior lives entirely in the custom element
// itself once @google/model-viewer registers it.
type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  poster?: string;
  "auto-rotate"?: boolean | "";
  "auto-rotate-delay"?: number | string;
  "rotation-per-second"?: string;
  "camera-controls"?: boolean | "";
  "camera-orbit"?: string;
  "field-of-view"?: string;
  "disable-zoom"?: boolean | "";
  "interaction-prompt"?: "auto" | "when-focused" | "none";
  "shadow-intensity"?: number | string;
  "shadow-softness"?: number | string;
  exposure?: number | string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "interaction" | "manual";
};

// With the automatic JSX runtime ("jsx": "react-jsx"), TS resolves
// JSX.IntrinsicElements from react/jsx-runtime's re-exported JSX namespace
// (React.JSX), not the classic global JSX namespace — so the augmentation
// has to target the "react" module directly.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

export {};
