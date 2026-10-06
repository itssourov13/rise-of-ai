import { chapters } from "./chapters";

/**
 * RISE-02 (The Machine) copy. Server-safe. PROVISIONAL copy; deliberately contains no dated or numeric claims
 * (the chapter is tagged "fact": add sourced facts in a content pass, not here).
 */
const total = String(chapters.length).padStart(2, "0");
const next = chapters[2];

export const machineContent = {
  chapterIndex: `02 / ${total}`,
  chapterTitle: chapters[1].title,
  subtitle: chapters[1].subtitle,
  next: { index: `03 / ${total}`, title: next.title },
  beats: [
    { id: "physical", text: "Computation is physical." },
    { id: "racks", text: "Silicon in racks, cooled and connected by cable." },
    { id: "energy", text: "Every calculation is energy moving through matter." },
    { id: "circuit", text: "Down at the circuit, structure becomes signal." },
  ],
} as const;
