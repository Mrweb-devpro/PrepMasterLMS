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

  return (
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
  );
}
