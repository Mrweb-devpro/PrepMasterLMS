"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8a9.56 9.56 0 012.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
    </svg>
  );
}
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.56-.05-1.1-.14-1.62H12v3.06h5.92a5.06 5.06 0 01-2.2 3.3v2.75h3.56c2.08-1.92 3.28-4.74 3.28-8.49z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-1 7.28-2.66l-3.56-2.75c-.99.67-2.26 1.07-3.72 1.07-2.86 0-5.29-1.93-6.16-4.53H1.14v2.85A10 10 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.13A6.98 6.98 0 015.48 12c0-.74.13-1.45.36-2.13V7.02H1.14A10 10 0 000 12c0 1.6.38 3.1 1.05 4.43l4.79-2.3z" />
      <path fill="#EA4335" d="M12 5.38A5.91 5.91 0 0116.15 7.3l2.66-2.66A10 10 0 0012 1 10 10 0 001.05 7.02l4.79 2.85C6.71 7.27 9.14 5.38 12 5.38z" />
    </svg>
  );
}

type Track = { id: string; name: string; type: string };
type Faculty = { id: string; name: string };
type Department = { id: string; faculty_id: string; name: string };
type Level = {
  id: string;
  track_id: string;
  name: string;
  is_active: boolean;
  registration_type: string;
};
type Semester = { id: string; name: string; order: number };

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trackId, setTrackId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [signingOut, setSigningOut] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const selectedTrack = useMemo(
    () => tracks.find((t) => t.id === trackId),
    [tracks, trackId]
  );

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [
        { data: t },
        { data: f },
        { data: d },
        { data: l },
        { data: s },
      ] = await Promise.all([
        supabase.from("tracks").select("*").order("name"),
        supabase
          .from("faculties")
          .select("*")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("departments")
          .select("*")
          .eq("is_active", true)
          .order("name"),
        supabase.from("levels").select("*"),
        supabase.from("semesters").select("*").order("order"),
      ]);
      if (t) setTracks(t);
      if (f) setFaculties(f);
      if (d) setDepartments(d);
      if (l) setLevels(l);
      if (s) setSemesters(s);
    }
    load();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setShowOverlay(true);
    });
  }, []);

  useEffect(() => {
    if (!showOverlay) return;
    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [showOverlay, countdown, router]);

  const isUniversity = selectedTrack?.type === "university";
  const availableLevels = levels.filter(
    (l) => l.track_id === trackId && l.is_active
  );
  const departmentOptions = departments.filter(
    (d) => d.faculty_id === facultyId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          track_id: trackId,
          faculty_id: isUniversity ? facultyId : null,
          department_id: isUniversity ? departmentId : null,
          level_id: levelId,
          semester_id: isUniversity ? semesterId : null,
        },
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/register/complete");
  }

  async function handleOverlaySignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowOverlay(false);
    setCountdown(5);
    setSigningOut(false);
    router.refresh();
  }

  async function handleGithub() {
    setGithubLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGithubLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  const overlayMessage =
    countdown >= 4
      ? "We are taking you to the dashboard"
      : countdown >= 2
        ? "almost there"
        : countdown === 1
          ? "let go"
          : "Redirecting...";

  return (
    <>
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-sm">
              {countdown > 0 ? countdown : "✓"}
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight">{overlayMessage}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re already signed in. We&apos;ll redirect you automatically in {countdown > 0 ? `${countdown}s` : "a moment"}.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => router.push("/dashboard")} size="lg" className="w-full">
                Go to dashboard now
              </Button>
              <Button
                variant="outline"
                onClick={handleOverlaySignOut}
                disabled={signingOut}
                className="w-full"
              >
                {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign out to use another account
              </Button>
            </div>
          </div>
        </div>
      )}

    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>

        {/* Stepper */}
        <div className="mb-6 flex items-center justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "h-px w-10",
                    step > s ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your journey with Prepmaster.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="mt-6 space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Continue
                </Button>
              </form>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-3">
                <Button variant="outline" className="w-full" onClick={handleGithub} disabled={githubLoading || googleLoading}>
                  {githubLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GithubIcon className="mr-2 h-4 w-4" />}
                  Continue with GitHub
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading || githubLoading}>
                  {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                  Continue with Google
                </Button>
              </div>
              {error && (
                <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                Choose your track
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything will be scoped to this option.
              </p>
              <div className="mt-6 space-y-3">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      setTrackId(track.id);
                      setFacultyId("");
                      setDepartmentId("");
                      setLevelId("");
                    }}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-colors",
                      trackId === track.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:border-primary/40"
                    )}
                  >
                    <div className="font-semibold">{track.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {track.type === "secondary"
                        ? "Senior secondary science (SS1 – SS3)"
                        : "University (engineering, science, architecture)"}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!trackId}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                {isUniversity ? "Your university details" : "Your class level"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isUniversity
                  ? "Select your faculty, department, level and semester."
                  : "Select your current level."}
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {isUniversity && (
                  <>
                    <div className="space-y-2">
                      <Label>Faculty</Label>
                      <div className="relative">
                        <select
                          value={facultyId}
                          onChange={(e) => {
                            setFacultyId(e.target.value);
                            setDepartmentId("");
                          }}
                          className="flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          required
                        >
                          <option value="">Select faculty</option>
                          {faculties.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <div className="relative">
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          disabled={!facultyId}
                          className="flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                          required
                        >
                          <option value="">Select department</option>
                          {departmentOptions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Level</Label>
                  <div className="relative">
                    <select
                      value={levelId}
                      onChange={(e) => setLevelId(e.target.value)}
                      className="flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Select level</option>
                      {availableLevels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {isUniversity && (
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <div className="relative">
                      <select
                        value={semesterId}
                        onChange={(e) => setSemesterId(e.target.value)}
                        className="flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                      >
                        <option value="">Select semester</option>
                        {semesters.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    className="flex-1"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </div>
              </form>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-3">
                <Button variant="outline" className="w-full" onClick={handleGithub} disabled={githubLoading || googleLoading}>
                  {githubLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GithubIcon className="mr-2 h-4 w-4" />}
                  Continue with GitHub
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading || githubLoading}>
                  {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                  Continue with Google
                </Button>
              </div>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
