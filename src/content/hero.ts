import { chapters } from "./chapters";

/**
 * Hero (RISE-01-AWAKENING) copy. Server-safe, plain data. Provisional copy, not final.
 * The title/subtitle live in semantic DOM (HeroSection); the canvas never carries them.
 */
const next = chapters[1];

export const heroContent = {
  title: "RISE OF AI",
  subtitle: "FROM MACHINE TO INTELLIGENCE",
  systemLabel: "System 01 — Awakening",
  chapterIndex: `01 / ${String(chapters.length).padStart(2, "0")}`,
  chapterTitle: chapters[0].title,
  scrollCue: "Scroll",
  next: { index: `02 / ${String(chapters.length).padStart(2, "0")}`, title: next.title },
  /** Narrative beats shown one at a time while scrubbing; ALL remain in the DOM (and are all visible without the 3D layer). */
  beats: [
    { id: "void", text: "Nothing is awake yet." },
    { id: "signal", text: "A signal, faint and far away." },
    { id: "structure", text: "Something vast takes shape in the dark." },
    { id: "power", text: "Power finds its way through the system." },
    { id: "awakening", text: "What was an object becomes a presence." },
  ],
} as const;
