import { chapters } from "./chapters";

/**
 * DOM copy for scenes 03-11 (server-safe, PROVISIONAL). Statements are conceptual on purpose: chapters tagged "fact"
 * need a sourced content pass before publication (no dates, figures or named claims are asserted here).
 * `length`: scroll region height in svh while the 3D layer is live (placeholder; tune in hardening).
 */
export interface SceneCopy {
  chapterId: string;
  length: number;
  beats: readonly { id: string; text: string }[];
  closing?: readonly string[];
}

export const sceneCopy: readonly SceneCopy[] = [
  { chapterId: "computation", length: 560, beats: [
    { id: "numbers", text: "At first, only numbers." },
    { id: "noise", text: "Noise, until structure appears." },
    { id: "pattern", text: "Patterns are what repeated arithmetic leaves behind." },
  ] },
  { chapterId: "perception", length: 560, beats: [
    { id: "sense", text: "A machine meets the world through measurements." },
    { id: "depth", text: "Distance becomes colour; surfaces become points." },
    { id: "layers", text: "Raw signal is passed upward, layer by layer." },
  ] },
  { chapterId: "learning", length: 600, beats: [
    { id: "layers", text: "Layers of simple units, joined by weights." },
    { id: "signal", text: "Input flows forward; error flows back." },
    { id: "model", text: "Repeated adjustment turns patterns into a model." },
  ] },
  { chapterId: "language", length: 560, beats: [
    { id: "tokens", text: "Text is cut into tokens." },
    { id: "meaning", text: "Tokens with similar use drift together." },
    { id: "word", text: "Language becomes geometry the machine can follow." },
  ] },
  { chapterId: "generation", length: 560, beats: [
    { id: "noise", text: "Start from noise." },
    { id: "steps", text: "Remove a little of it, step after step." },
    { id: "form", text: "Something new takes shape." },
  ] },
  { chapterId: "reasoning", length: 520, beats: [
    { id: "slow", text: "Now, slower." },
    { id: "branches", text: "Many possible next steps." },
    { id: "path", text: "One chain of steps is followed through." },
  ] },
  { chapterId: "agency", length: 560, beats: [
    { id: "hub", text: "A model can call tools." },
    { id: "reach", text: "It reads, searches and acts outside itself." },
    { id: "fabric", text: "Systems begin to link into a larger fabric." },
  ] },
  { chapterId: "intelligence", length: 600, beats: [
    { id: "many", text: "Many systems, interconnected." },
    { id: "scale", text: "Activity at a scale no single part holds." },
    { id: "thin", text: "And then, quieter." },
  ] },
  { chapterId: "unknown", length: 420, beats: [
    { id: "open", text: "What comes next is not written." },
  ], closing: ["The future remains open.", "RISE OF AI — FROM MACHINE TO INTELLIGENCE"] },
];

export const getSceneCopy = (chapterId: string): SceneCopy | undefined => sceneCopy.find((s) => s.chapterId === chapterId);
export const chapterNumber = (chapterId: string): string => {
  const i = chapters.findIndex((c) => c.id === chapterId);
  return `${String(i + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
};
export const nextChapterOf = (chapterId: string) => {
  const i = chapters.findIndex((c) => c.id === chapterId);
  return chapters[i + 1] ? { index: chapterNumber(chapters[i + 1].id), title: chapters[i + 1].title } : null;
};
