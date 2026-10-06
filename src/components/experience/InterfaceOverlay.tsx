import { AudioToggle } from "@/components/audio/AudioToggle";
import { chapters } from "@/content/chapters";
import { siteConfig } from "@/lib/config/site";

/** Server component. Minimal landmark + keyboard-accessible chapter navigation (plain anchors). */
export function InterfaceOverlay() {
  return (
    <header className="interface-overlay">
      <a href="#intro" className="t-micro overlay-brand">
        {siteConfig.name}
      </a>
      <nav aria-label="Chapters">
        <ol className="chapter-nav t-technical">
          {chapters.map((chapter, i) => (
            <li key={chapter.id}>
              <a href={`#${chapter.id}`} aria-label={chapter.title}>
                {String(i + 1).padStart(2, "0")}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <AudioToggle />
    </header>
  );
}
