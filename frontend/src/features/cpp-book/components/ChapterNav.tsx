import { Check, Clock3 } from "lucide-react";
import type { CppChapter } from "../cpp-book.content";
import { cn } from "@/lib/utils";

export function ChapterNav({
  chapters,
  activeChapterId,
  completedChapterIds,
  onSelect,
}: {
  chapters: CppChapter[];
  activeChapterId: string;
  completedChapterIds: string[];
  onSelect: (chapterId: string) => void;
}) {
  return (
    <nav aria-label="C++ book chapters" className="space-y-4">
      {Array.from(new Map(chapters.map((chapter) => [chapter.module, chapter.module])).keys()).map((module) => (
        <section key={module}>
          <p className="mb-1.5 px-2 text-2xs font-semibold uppercase tracking-wider text-text-muted">{module}</p>
          <div className="space-y-0.5">
            {chapters.filter((chapter) => chapter.module === module).map((chapter) => {
              const active = chapter.id === activeChapterId;
              const complete = completedChapterIds.includes(chapter.id);
              return <button
                type="button"
                key={chapter.id}
                onClick={() => onSelect(chapter.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                  active ? "bg-primary-soft font-medium text-primary" : "text-text-secondary hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border text-2xs", complete ? "border-success/30 bg-success/10 text-success" : "border-border text-text-muted")}>
                  {complete ? <Check className="size-3" /> : chapter.id.split("-").at(-1)}
                </span>
                <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-2xs text-text-muted"><Clock3 className="size-3" />{chapter.minutes}m</span>
              </button>;
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}
