import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, Clock3, Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PythonIcon } from "@/components/common/PythonIcon";
import { Button } from "@/components/ui/button";
import { usePythonWaitlist } from "../hooks/usePythonWaitlist";

const pillars = [
  ["One lesson at a time", "Learn one small idea before moving on to the next one."],
  ["Simple words", "Everything is explained clearly, like a friend is teaching you."],
  ["Start from the beginning", "We begin with the basics and do not skip important steps."],
  ["Code you can copy", "Every example is short, tested, and ready to try yourself."],
  ["Easy to read", "Read comfortably on your phone or computer without distractions."],
] as const;

const curriculum = [
  ["Ch 1", "Getting Started & First Steps", "Installing Python, how scripts run, and print() statements.", "In review", "primary"],
  ["Ch 2", "Variables & Data Types", "Strings, integers, floats, booleans, and naming rules.", "Drafting", "primary"],
  ["Ch 3", "Operators & Math", "Arithmetic operations, comparisons (==, !=), and logical operators.", "Upcoming", "neutral"],
  ["Ch 4", "If-Else Statements", "Use if, elif, and else to tell Python what to do in different situations.", "Upcoming", "neutral"],
  ["Ch 5", "Loops", "Repeat tasks with for loops, while loops, and range().", "Upcoming", "neutral"],
  ["Ch 6", "Functions", "Create functions with def, give them information, and get answers back.", "Upcoming", "neutral"],
  ["Ch 7", "Lists, Tuples, Dictionaries & Sets", "Use lists, tuples, dictionaries, and sets to keep information neat.", "Upcoming", "neutral"],
  ["Ch 8", "Working with Files", "Read and write files, then build your first useful little program.", "Upcoming", "neutral"],
] as const;

export function PythonWebBookPage() {
  const { joined, join } = usePythonWaitlist();

  const handleJoinWaitlist = () => {
    join.mutate(undefined, {
      onSuccess: (result) => {
        if (result.alreadyJoined) {
          toast.info("You’re already on the waitlist!");
          return;
        }
        toast.success("You’re on the list!", {
          description: "We’ll notify you as soon as Chapter 1 drops.",
        });
      },
      onError: (error: Error) => toast.error(error.message || "Couldn’t join the waitlist. Please try again."),
    });
  };

  return (
    <div className="mx-auto max-w-5xl pb-4">
      <section className="border-b border-border pb-10 pt-2 sm:pb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-subtle px-3 py-1.5 text-xs font-medium text-text-secondary">
          <PythonIcon className="size-4" />
          Python Web Book · Coming soon
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The Python Web Book
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Learn Python from scratch with short, easy-to-follow lessons that make each idea clear. No university math,
          no confusing jargon.
        </p>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-secondary">
          <BookOpen className="size-4 text-primary" />
          Reader preview
        </div>
        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-subtle px-4 py-3 sm:px-6">
            <p className="text-sm font-medium text-foreground">
              <span className="text-text-secondary">Python Web Book / </span>
              Chapter 2: Variables &amp; Data Types
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-text-secondary">
              <Clock3 className="size-3.5" />
              4 min read · Beginner
            </span>
          </div>

          <div className="p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Chapter 2</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What is a Variable?
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              A variable is a container used to store a value, such as a name, number, or answer. When you use the
              variable&apos;s name, Python gives you the value stored inside it.
            </p>

            <pre className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface-subtle p-4 text-sm leading-7 text-foreground sm:p-5">
              <code>
                <span className="text-primary">student_name</span> = <span className="text-text-secondary">&quot;Dane&quot;</span>{"    "}
                <span className="text-text-muted"># Text (String)</span>{"\n"}
                <span className="text-primary">exam_score</span>   = <span className="text-text-secondary">95</span>{"        "}
                <span className="text-text-muted"># Number (Integer)</span>{"\n"}
                <span className="text-primary">is_passed</span>    = <span className="text-text-secondary">True</span>{"      "}
                <span className="text-text-muted"># Decision (Boolean)</span>{"\n\n"}
                <span className="text-primary">print</span>(student_name, <span className="text-text-secondary">&quot;scored&quot;</span>, exam_score)
              </code>
            </pre>

            <div className="mt-5 flex gap-3 rounded-lg border border-primary/25 bg-secondary p-4 text-sm leading-6 text-text-secondary">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                <span className="font-semibold text-foreground">Rule: </span>
                <code className="font-mono text-foreground">&quot;Dane&quot;</code> is the value;{" "}
                <code className="font-mono text-foreground">student_name</code> is the variable that stores it.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-text-muted" aria-label="More chapter content">
              <span className="size-1.5 rounded-full bg-current" />
              <span className="size-1.5 rounded-full bg-current" />
              <span className="size-1.5 rounded-full bg-current" />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="inline-flex items-center gap-1.5 text-text-secondary">
              <ArrowLeft className="size-4" /> Previous: Chapter 1
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-primary">
              Next: Chapter 3 <ArrowRight className="size-4" />
            </span>
          </div>
        </article>
      </section>

      <section className="border-t border-border py-10 sm:py-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Made for beginners</h2>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {pillars.map(([title, description], index) => (
            <div key={title} className="grid gap-2 py-5 sm:grid-cols-[3.5rem_1fr] sm:gap-5">
              <span className="font-display text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Curriculum roadmap</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              See how you can go from your first line of Python code to building useful things.
            </p>
          </div>
          <span className="text-xs font-medium text-text-secondary">8 chapters planned</span>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          {curriculum.map(([chapter, title, description, status, tone], index) => (
            <div
              key={chapter}
              className="grid gap-3 border-b border-border p-4 last:border-b-0 sm:grid-cols-[4rem_1fr_auto] sm:items-center sm:gap-5 sm:px-5"
            >
              <span className="font-display text-sm font-semibold text-primary">{chapter}</span>
              <div>
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
              <span
                className={
                  tone === "primary"
                    ? "w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary"
                    : "w-fit rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-secondary"
                }
              >
                {index === 0 ? "Drafting · " : ""}{status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Button
          disabled={joined || join.isPending}
          onClick={handleJoinWaitlist}
        >
          {join.isPending ? <Loader2 className="size-4 animate-spin" /> : joined ? <Check className="size-4" /> : <Bookmark className="size-4" />}
          {join.isPending ? "Joining waitlist..." : joined ? "On the Waitlist" : "Get early access"}
        </Button>
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </section>
    </div>
  );
}
