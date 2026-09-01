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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [signingOut, setSigningOut] = useState(false);

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
