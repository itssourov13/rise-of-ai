import { ExperienceMount } from "./ExperienceMount";
import { InterfaceOverlay } from "./InterfaceOverlay";
import { SemanticNarrative } from "./SemanticNarrative";

/**
 * Server component. Server-rendered narrative + client-only interactive layer:
 *   <ExperienceMount/>  client boundary, mounts the single persistent Canvas (fixed, behind content)
 *   <InterfaceOverlay/> header landmark + chapter nav
 *   <main>              semantic narrative / scrollable space
 */
export function ExperienceShell() {
  return (
    <>
      <a className="skip-link" href="#narrative">
        Skip to content
      </a>
      <ExperienceMount />
      <InterfaceOverlay />
      <main id="narrative" tabIndex={-1}>
        <SemanticNarrative />
      </main>
    </>
  );
}
