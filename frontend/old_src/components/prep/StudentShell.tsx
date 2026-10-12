import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookMarked,
  FolderClosed,
  GraduationCap,
  Home,
  MonitorCheck,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePrep } from "@/lib/prep-store";

const nav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/drive", label: "Drive", icon: FolderClosed, exact: false },
  { to: "/cbts", label: "CBTs", icon: MonitorCheck, exact: false },
  { to: "/library", label: "My Library", icon: BookMarked, exact: false },
] as const;

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prep = usePrep();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const itemClass = (active: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all",
      active
        ? "bg-ink-foreground/10 text-ink-foreground font-medium shadow-[inset_3px_0_0_var(--primary)]"
        : "text-ink-muted hover:bg-ink-foreground/5 hover:text-ink-foreground",
    );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink px-4 py-6 text-ink-foreground lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-2.5 px-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">PrepMaster</span>
        </Link>

        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-widest text-ink-muted">Study</p>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className={itemClass(isActive(item.to, item.exact))}>
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <Link to="/account" className={itemClass(isActive("/account"))}>
            <UserRound className="size-4" />
            Account
          </Link>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="dot-grid rounded-lg bg-ink-soft p-4">
            <p className="font-display text-sm font-semibold">Exam season is here</p>
            <p className="mt-1 text-xs text-ink-muted">Practice with timed CBTs built from past questions.</p>
            <Link
              to="/cbts"
              className="mt-3 inline-flex rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Start practising
            </Link>
          </div>
          <Link
            to="/account"
            className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-ink-foreground/5"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold">
              {prep.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{prep.name}</span>
              <span className="block truncate text-xs text-ink-muted">{prep.email}</span>
            </span>
          </Link>
          <Link
            to="/admin"
            className="flex items-center gap-2 px-2 text-xs text-ink-muted hover:text-ink-foreground"
          >
            <ShieldCheck className="size-3.5" />
            Switch to admin mode
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur md:px-10">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-md bg-ink text-ink-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="font-display font-semibold">PrepMaster</span>
          </Link>
          <Link
            to="/drive"
            className="hidden w-full max-w-sm items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted transition-colors hover:border-border-strong md:flex"
          >
            <Search className="size-4" />
            Search materials, courses…
            <kbd className="ml-auto rounded-sm border border-border px-1.5 text-[10px]">⌘K</kbd>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => toast("No new notifications", { description: "You're all caught up." })}
              className="relative flex size-9 items-center justify-center rounded-md border border-border bg-surface text-text-secondary hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </button>
            <Link
              to="/account"
              className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-ink-foreground lg:hidden"
            >
              {prep.initials}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-28 pt-8 animate-fade-in md:px-10 md:pt-10 lg:pb-12">
          {children}
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-lg bg-ink p-1.5 shadow-lg lg:hidden">
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-md py-2 text-[11px]",
                  active ? "bg-ink-foreground/10 text-ink-foreground" : "text-ink-muted",
                )}
              >
                <item.icon className="size-4" />
                {item.label.replace("My ", "")}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
