import type { CSSProperties } from "react";
import { chapters } from "@/content/chapters";
import { chapterNumber, getSceneCopy, nextChapterOf } from "@/content/scenes";

/**
 * Generic server component for chapters 03-11. Semantic and fully visible without WebGL; the choreography animates
 * opacity/transform only while the 3D layer is live ([data-live]). Contract used by lib/choreography/scene-factory.ts.
 */
export function SceneSection({ chapterId }: { chapterId: string }) {
  const chapter = chapters.find((c) => c.id === chapterId);
  const copy = getSceneCopy(chapterId);
  if (!chapter || !copy) return null;
  const next = nextChapterOf(chapterId);
  return (
    <section
      id={chapter.id}
      className="scene-region"
      aria-labelledby={`${chapter.id}-title`}
      data-scene-id={chapter.sceneId}
      data-narrative={chapter.narrative}
      style={{ "--scene-length": `${copy.length}svh` } as CSSProperties}
    >
      <div className="scene-pin">
        <p className="scene-chapter t-micro">
          <span>{chapterNumber(chapter.id)}</span> <span>{chapter.title}</span>
        </p>
        <div className="scene-titlecard" data-scene="title">
          <h2 id={`${chapter.id}-title`} className="t-headline">
            {chapter.title}
          </h2>
          <p className="t-subheadline">{chapter.subtitle}</p>
        </div>
        <ol className="scene-beats" aria-label={chapter.title}>
          {copy.beats.map((b) => (
            <li key={b.id} className="scene-beat t-subheadline" data-scene-beat={b.id}>
              {b.text}
            </li>
          ))}
        </ol>
        {copy.closing && (
          <div className="scene-closing" data-scene-beat="closing">
            {copy.closing.map((line, i) =>
              i === 0 ? (
                <p key={line} className="t-headline">
                  {line}
                </p>
              ) : (
                <p key={line} className="t-micro">
                  {line}
                </p>
              ),
            )}
          </div>
        )}
        {next && (
          <p className="scene-next t-micro" data-scene="next">
            {next.index} · {next.title}
          </p>
        )}
      </div>
    </section>
  );
}
