import Link from "next/link";
import {
  BookOpenCheck,
  BrainCircuit,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  Timer,
  GraduationCap,
  School,
  ArrowRight,
  Sparkles,
  Clock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { LandingHeader } from "@/components/landing-header";
import { getUser, getProfile, isAdmin } from "@/lib/session";

const features = [
  {
    icon: ClipboardCheck,
    title: "Realistic CBT Experience",
    description:
      "Practice under exam conditions with timers, flagging, navigation and instant scoring — just like the real thing.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Question Bank",
    description:
      "Upload notes or past papers and our AI generates detailed, topic-tagged questions across every corner of the material.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description:
      "Watch your scores improve over time with per-subject and per-course breakdowns and clear analytics.",
  },
  {
    icon: Timer,
    title: "WAEC, JAMB, NECO Prepared",
    description:
      "Subject-centric practice tailored by exam type and year, so you walk in ready for the format you'll face.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Scoped Content",
    description:
      "Every student sees exactly what their level needs — nothing mixed up across classes or courses.",
  },
  {
    icon: BookOpenCheck,
    title: "Materials & Telegram Access",
    description:
      "Download materials and get instant access to your level's Telegram class after registering.",
  },
];

const tracks = [
  {
    icon: School,
    title: "Senior Secondary",
    tagline: "SS1 – SS3 · Science",
    description:
      "Physics, Chemistry, Mathematics and Further Mathematics prep for WAEC and JAMB with past questions and mock exams.",
    items: ["Past questions by exam & year", "Timed CBT & mock exams", "Topic-based practice"],
    cta: "Prepare for SSCE",
  },
  {
    icon: GraduationCap,
    title: "University",
    tagline: "Engineering · Science · Architecture",
    description:
      "Course-centric CBT practice for year 1 shared courses and general engineering (GET) courses by department and semester.",
    items: ["Auto-select your courses", "Department-scoped content", "Course-wise mock exams"],
    cta: "Practice your courses",
  },
];

export default async function LandingPage() {
  const user = await getUser();
  const profile = user ? await getProfile() : null;
  const admin = user ? await isAdmin() : false;
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader user={user} profile={profile} isAdmin={admin} initials={initials} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.12), transparent 40%), radial-gradient(circle at 80% 60%, rgba(59,130,246,0.08), transparent 40%)",
          }}
        />
        <div className="container relative mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Your step-by-step path to exam success
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Crush your{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                CBT &amp; mock exams
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Prepmaster is a smart LMS for secondary school science students and
              university students — practice with realistic timed CBTs, mock exams,
              past questions and AI-generated banks built from your own materials.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start practicing free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#tracks">Explore tracks</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Timed exam simulation
              </span>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Progress analytics
              </span>
            </div>
          </div>

          {/* Hero mockup */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="text-sm font-semibold">GST 112 – CBT</div>
                <div className="rounded-md border border-destructive px-2 py-0.5 text-xs font-medium text-destructive">
                  Time left 0:29:32
                </div>
              </div>
              <div className="flex gap-4 py-5">
                <div className="w-24 shrink-0 text-sm">
                  <div className="font-semibold">Question 15</div>
                  <div className="text-xs text-muted-foreground">
                    Not yet answered
                  </div>
                </div>
                <div className="flex-1 rounded-lg bg-[#E4EFF9] p-4 text-sm dark:bg-accent/30">
                  Which of the following is NOT a programming language?
                  <div className="mt-3 space-y-2 text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground/60">a.</span> Python
                    </div>
                    <div>
                      <span className="text-muted-foreground/60">b.</span> HTML
                    </div>
                    <div>
                      <span className="text-muted-foreground/60">c.</span> Java
                    </div>
                    <div>
                      <span className="text-muted-foreground/60">d.</span> C++
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(
                  (n, i) => (
                    <div
                      key={n}
                      className={`rounded border py-1.5 ${
                        i === 9
                          ? "border-2 border-foreground font-bold"
                          : i > 6
                          ? "bg-primary/10"
                          : "border-border"
                      }`}
                    >
                      {n}
                    </div>
                  )
                )}
              </div>
              <div className="mt-5 flex justify-end">
                <Button size="sm">Next</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to prepare
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete practice environment designed to feel real and built to
              help you improve.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section id="tracks" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Choose your track
            </h2>
            <p className="mt-4 text-muted-foreground">
              Register under the class or course program you're on — everything is
              scoped exactly to your level.
            </p>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {tracks.map((track) => (
              <div
                key={track.title}
                className="flex flex-col rounded-2xl border bg-card p-8 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <track.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {track.tagline}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-bold">{track.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {track.description}
                </p>
                <ul className="mt-6 space-y-2 text-sm">
                  {track.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/register">{track.cta}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How it works
            </h2>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Register with your level",
                desc: "Sign up and pick your track, level, and (for university) faculty, department and semester.",
              },
              {
                step: "02",
                title: "Practice & take CBTs",
                desc: "Attempt timed practice, CBTs, mock exams and past questions scoped to your courses or subjects.",
              },
              {
                step: "03",
                title: "Track & improve",
                desc: "Review your answers, see your progress over time, and re-attempt to push your score higher.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Get started now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row md:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} Prepmaster. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
