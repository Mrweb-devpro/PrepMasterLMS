import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, Lightbulb, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session";
import { cn } from "@/lib/utils";
import { cppChapters, type CalloutTone } from "../cpp-book.content";
import { useCppBookProgress, type ReaderFontSize } from "../cpp-book.store";
import { ChapterNav } from "../components/ChapterNav";
import { CppBookShell } from "../components/CppBookShell";
import { CppCodeBlock } from "../components/CppCodeBlock";

const proseSize: Record<ReaderFontSize, string> = { sm: "text-sm leading-7", base: "text-base leading-8", lg: "text-lg leading-9" };
const calloutStyle: Record<CalloutTone, { icon: typeof Lightbulb; className: string }> = {
  tip: { icon: Lightbulb, className: "border-primary/25 bg-primary-soft" },
  warning: { icon: TriangleAlert, className: "border-error/25 bg-error-bg" },
  memory: { icon: BookOpen, className: "border-border bg-surface-subtle" },
};

function ReaderChapters({ activeChapterId, completedChapterIds, selectChapter }: { activeChapterId: string; completedChapterIds: string[]; selectChapter: (id: string) => void }) {
  return <ChapterNav chapters={cppChapters} activeChapterId={activeChapterId} completedChapterIds={completedChapterIds} onSelect={selectChapter} />;
}

export function CppBookPage() {
  const { user } = useSession();
  const { progress, update } = useCppBookProgress(user?.id);
  const activeIndex = Math.max(0, cppChapters.findIndex((chapter) => chapter.id === progress.activeChapterId));
  const chapter = cppChapters[activeIndex];
  const readPercent = Math.round((progress.completedChapterIds.length / cppChapters.length) * 100);
  const bookmarked = progress.bookmarkedChapterIds.includes(chapter.id);
  const nextChapter = cppChapters[activeIndex + 1];
  const previousChapter = cppChapters[activeIndex - 1];
  const completeLabel = nextChapter ? "Mark as complete & continue" : "Mark book complete";

  const selectChapter = (chapterId: string) => {
    update((current) => ({ ...current, activeChapterId: chapterId }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeFont = (delta: -1 | 1) => {
    const sizes: ReaderFontSize[] = ["sm", "base", "lg"];
    const index = sizes.indexOf(progress.fontSizePreference);
    update((current) => ({ ...current, fontSizePreference: sizes[Math.min(2, Math.max(0, index + delta))] }));
  };
  const toggleBookmark = () => update((current) => ({
    ...current,
    bookmarkedChapterIds: current.bookmarkedChapterIds.includes(chapter.id)
      ? current.bookmarkedChapterIds.filter((id) => id !== chapter.id)
      : [...current.bookmarkedChapterIds, chapter.id],
  }));
  const completeAndContinue = () => {
    update((current) => ({
      ...current,
      completedChapterIds: current.completedChapterIds.includes(chapter.id) ? current.completedChapterIds : [...current.completedChapterIds, chapter.id],
      activeChapterId: nextChapter?.id ?? chapter.id,
    }));
    toast.success(nextChapter ? "Chapter complete — next chapter ready." : "You’ve completed the C++ foundations book!");
    if (nextChapter) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderChapterNav = (closeNavigation: () => void) => <ReaderChapters activeChapterId={chapter.id} completedChapterIds={progress.completedChapterIds} selectChapter={(chapterId) => { selectChapter(chapterId); closeNavigation(); }} />;

  return <CppBookShell renderChapterNav={renderChapterNav}><div className="min-h-[calc(100vh-3.5rem)]">
    <div className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6 md:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-foreground">{chapter.title}</p>
          <p className="hidden text-2xs text-text-muted sm:block">{readPercent}% complete</p>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="font-display" onClick={() => changeFont(-1)} disabled={progress.fontSizePreference === "sm"} aria-label="Decrease text size">A−</Button>
          <Button type="button" variant="ghost" size="sm" className="font-display" onClick={() => changeFont(1)} disabled={progress.fontSizePreference === "lg"} aria-label="Increase text size">A+</Button>
          <Button type="button" variant={bookmarked ? "secondary" : "ghost"} size="icon" onClick={toggleBookmark} aria-label={bookmarked ? "Remove bookmark" : "Bookmark chapter"}><Bookmark className={cn(bookmarked && "fill-current text-primary")} /></Button>
        </div>
      </div>
      <div className="h-0.5 bg-surface-subtle"><div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${readPercent}%` }} /></div>
    </div>

    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{chapter.module}</p>
        <div className="mt-3"><h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{chapter.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">{chapter.intro}</p></div>
        <div className="mt-10 space-y-10">
          {chapter.sections.map((section) => <section key={section.heading}>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{section.heading}</h2>
            <div className={cn("mt-3 space-y-4 text-text-secondary", proseSize[progress.fontSizePreference])}>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            {section.diagram && <pre className="mt-5 overflow-x-auto rounded-lg border border-border bg-surface-subtle p-4 font-mono text-xs leading-6 text-text-secondary sm:text-sm">{section.diagram}</pre>}
            {section.code && <CppCodeBlock {...section.code} />}
            {section.callout && (() => { const { icon: Icon, className } = calloutStyle[section.callout.tone]; return <div className={cn("mt-5 flex gap-3 rounded-lg border p-4 text-sm leading-6 text-text-secondary", className)}><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><p><span className="font-semibold text-foreground">{section.callout.title}: </span>{section.callout.body}</p></div>; })()}
          </section>)}
        </div>
        <footer className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {previousChapter ? <Button type="button" variant="outline" className="h-auto min-h-14 justify-start whitespace-normal text-left" onClick={() => selectChapter(previousChapter.id)}><ArrowLeft /><span><span className="block text-2xs text-text-muted">Previous chapter</span>{previousChapter.title}</span></Button> : <div />}
          {nextChapter ? <Button type="button" variant="outline" className="h-auto min-h-14 justify-end whitespace-normal text-right" onClick={() => selectChapter(nextChapter.id)}><span><span className="block text-2xs text-text-muted">Next chapter</span>{nextChapter.title}</span><ArrowRight /></Button> : <Link to="/" className="inline-flex min-h-14 items-center justify-end gap-2 rounded-md border border-border px-4 text-sm font-medium text-primary hover:bg-surface-hover">Back to dashboard <ArrowRight className="size-4" /></Link>}
        </footer>
        <div className="mt-5 flex justify-end"><Button type="button" onClick={completeAndContinue}>{progress.completedChapterIds.includes(chapter.id) ? <Check /> : <BookOpen />}{completeLabel}</Button></div>
      </article>
    </div>
  </div></CppBookShell>;
}
