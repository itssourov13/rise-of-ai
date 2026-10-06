import { machineContent } from "@/content/machine";

/**
 * Server component: RISE-02 DOM layer. Same rules as the Hero: everything is semantic and visible without WebGL
 * (the choreography only animates opacity/transform when the 3D layer is live, via [data-live]).
 */
export function MachineSection() {
  return (
    <section id="machine" className="machine-region" aria-labelledby="machine-title" data-scene-id="RISE-02-MACHINE" data-narrative="fact">
      <div className="machine-pin">
        <p className="machine-chapter t-micro" data-machine="chapter">
          <span>{machineContent.chapterIndex}</span> <span>{machineContent.chapterTitle}</span>
        </p>
        <div className="machine-titlecard" data-machine="title">
          <h2 id="machine-title" className="t-headline">
            {machineContent.chapterTitle}
          </h2>
          <p className="t-subheadline">{machineContent.subtitle}</p>
        </div>
        <ol className="machine-beats" aria-label="The Machine">
          {machineContent.beats.map((beat) => (
            <li key={beat.id} className="machine-beat t-subheadline" data-machine-beat={beat.id}>
              {beat.text}
            </li>
          ))}
        </ol>
        <p className="machine-next t-micro" data-machine="next">
          {machineContent.next.index} · {machineContent.next.title}
        </p>
      </div>
    </section>
  );
}
