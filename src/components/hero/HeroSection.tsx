import { heroContent } from "@/content/hero";
import { siteConfig } from "@/lib/config/site";

/**
 * Server component. Hero DOM layer: ALL important content is semantic and present without WebGL:
 * h1 + subtitle, chapter label, narrative beats, next-chapter hint. The choreography (client) only animates
 * opacity/transform on these nodes and ONLY when the 3D layer is live (data-live); without it every element
 * is visible and the region is a normal section.
 *
 * Structure (pinned viewport via CSS sticky; the sticky element itself is never animated):
 *   section#intro.hero-region  (tall scroll region; the ScrollTrigger trigger)
 *     div.hero-pin  (sticky 100svh viewport)
 *       content (animated children)
 */
export function HeroSection() {
  return (
    <section id="intro" className="hero-region" aria-labelledby="intro-title" data-scene-id="RISE-01-AWAKENING">
      <div className="hero-pin">
        <p className="hero-chapter t-micro" data-hero="chapter">
          <span>{heroContent.chapterIndex}</span> <span className="hero-chapter-name">{heroContent.chapterTitle}</span>
        </p>

        <ol className="hero-beats" aria-label="Opening">
          {heroContent.beats.map((beat) => (
            <li key={beat.id} className="hero-beat t-subheadline" data-hero-beat={beat.id}>
              {beat.text}
            </li>
          ))}
        </ol>

        <div className="hero-titlecard">
          <p className="hero-system t-micro" data-hero="system">
            {heroContent.systemLabel}
          </p>
          <h1 id="intro-title" className="hero-title t-display" data-hero="title">
            {heroContent.title}
          </h1>
          <p className="hero-subtitle t-micro" data-hero="subtitle">
            {heroContent.subtitle}
          </p>
          <p className="visually-hidden">{siteConfig.description}</p>
        </div>

        <dl className="hero-readout t-micro" data-hero="readout" aria-hidden="true">
          <div>
            <dt>System status</dt>
            <dd data-hero-readout="status">Offline</dd>
          </div>
          <div>
            <dt>Power</dt>
            <dd data-hero-readout="power">00%</dd>
          </div>
          <div>
            <dt>Core</dt>
            <dd data-hero-readout="core">Inactive</dd>
          </div>
        </dl>

        <p className="hero-scroll-cue t-micro" data-hero="scroll-cue">
          {heroContent.scrollCue}
        </p>
        <p className="hero-next t-micro" data-hero="next">
          {heroContent.next.index} · {heroContent.next.title}
        </p>
      </div>
    </section>
  );
}
