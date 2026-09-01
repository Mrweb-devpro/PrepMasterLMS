"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Database,
  FileQuestion,
  FileText,
  Layers,
  Users,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};
type NavGroup = { section: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const nav: NavEntry[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  {
    section: "Content",
    items: [
      { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
      { href: "/admin/courses", label: "Courses", icon: GraduationCap },
      { href: "/admin/materials", label: "Materials", icon: FileText },
    ],
  },
  {
    section: "Exams",
    items: [
      { href: "/admin/exams", label: "CBTs & Exams", icon: FileText },
      { href: "/admin/question-banks", label: "Question Banks", icon: Database },
      {
        href: "/admin/past-papers",
        label: "Past Papers",
        icon: FileQuestion,
      },
    ],
  },
  {
    section: "Structure",
    items: [
      { href: "/admin/levels", label: "Levels", icon: Layers },
      { href: "/admin/faculties", label: "Faculties & Depts", icon: Settings },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    section: "Billing",
    items: [{ href: "/admin/packages", label: "Packages", icon: CreditCard }],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/admin">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-4">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive("/admin")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
          {nav
            .filter((n) => "section" in n)
            .map((group) => (
              <div key={group.section}>
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.section}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <Link href="/admin">
            <Logo />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="border-b bg-card p-4 lg:hidden">
            <nav className="space-y-1">
              <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium">
                Overview
              </Link>
              {nav
                .filter((n) => "section" in n)
                .map((group) => (
                  <div key={group.section} className="mt-3">
                    <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                      {group.section}
                    </p>
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
