import { HeroSection } from "@/components/hero/HeroSection";
import { SceneSection } from "@/components/scene-section/SceneSection";
import { MachineSection } from "@/components/machine/MachineSection";
import { chapters } from "@/content/chapters";

/**
 * Server component. The narrative exists in the DOM regardless of WebGL.
 * Phase 05: chapter 02 is MachineSection (RISE-02 scroll region, id="machine").
 * Phase 04: the intro/Hero is HeroSection (RISE-01 scroll region, id="intro"). Chapter 01's own section is
 * therefore not repeated here; chapter navigation (#awakening) targets the Hero region via the anchor below.
 */
export function SemanticNarrative() {
  return (
    <>
      <span id="awakening" className="hero-anchor" />
      <HeroSection />
      <MachineSection />
      {chapters.slice(2).map((chapter) => (
        <SceneSection key={chapter.id} chapterId={chapter.id} />
      ))}
    </>
  );
}
