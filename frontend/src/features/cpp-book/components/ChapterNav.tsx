import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const modules = useMemo(() => Array.from(new Map(chapters.map((chapter) => [chapter.module, chapter.module])).keys()), [chapters]);
  const activeModule = chapters.find((chapter) => chapter.id === activeChapterId)?.module;
  const [expandedModules, setExpandedModules] = useState<string[]>(() => activeModule ? [activeModule] : []);
  useEffect(() => {
    if (activeModule) setExpandedModules((current) => current.includes(activeModule) ? current : [...current, activeModule]);
  }, [activeModule]);

  return (
    <nav aria-label="C++ book chapters" className="space-y-1">
      <p className="px-2 text-2xs font-semibold uppercase tracking-wider text-text-muted">C++ Tutorial</p>
      {modules.map((module) => (
        <section key={module}>
          <button
            type="button"
            onClick={() => setExpandedModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module])}
            className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-sidebar-foreground hover:bg-surface-hover"
          >
            {module}
            <ChevronDown className={cn("size-4 text-text-muted transition-transform", expandedModules.includes(module) && "rotate-180")} />
          </button>
          {expandedModules.includes(module) && <div className="space-y-0.5 border-l border-border pl-2">
            {chapters.filter((chapter) => chapter.module === module).map((chapter, chapterIndex) => {
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
                  {complete ? <Check className="size-3" /> : chapterIndex + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{chapter.navTitle}</span>
              </button>;
            })}
          </div>}
        </section>
      ))}
    </nav>
  );
}
