"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [signingOut, setSigningOut] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleOverlaySignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowOverlay(false);
    setCountdown(5);
    setSigningOut(false);
    router.refresh();
  }

  const overlayMessage =
    countdown >= 4
      ? "We are taking you to the dashboard"
      : countdown >= 2
        ? "almost there"
        : countdown === 1
          ? "let go"
          : "Redirecting...";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
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
              <Button variant="outline" onClick={handleOverlaySignOut} disabled={signingOut} className="w-full">
                {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign out to use another account
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to continue practicing.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Log in"
              )}
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
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
