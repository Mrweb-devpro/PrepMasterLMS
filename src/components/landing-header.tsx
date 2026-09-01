"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

type Props = {
  user: { email?: string | null } | null;
  profile: { full_name: string | null } | null;
  isAdmin: boolean;
  initials: string;
};

export function LandingHeader({ user, profile, isAdmin, initials }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#tracks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Tracks
          </Link>
          <Link href="#how" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="/dashboard/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm ring-2 ring-primary/20 transition-colors hover:bg-primary/90"
                title={profile?.full_name ?? user.email ?? "Profile"}
              >
                {initials}
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-card md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            <Link href="#features" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
              Features
            </Link>
            <Link href="#tracks" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
              Tracks
            </Link>
            <Link href="#how" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
              How it works
            </Link>
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                  Dashboard
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials}
                  </span>
                  {profile?.full_name ?? user.email ?? "Profile"}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
