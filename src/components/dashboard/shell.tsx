"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Settings,
  CreditCard,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

const secondaryNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/practice", label: "Practice & CBTs", icon: FileText },
  { href: "/dashboard/packages", label: "Packages", icon: CreditCard },
];

const universityNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/practice", label: "Practice & CBTs", icon: FileText },
  { href: "/dashboard/packages", label: "Packages", icon: CreditCard },
];

export function DashboardShell({
  children,
  trackType,
}: {
  children: React.ReactNode;
  trackType?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav =
    trackType === "university" ? universityNav : secondaryNav;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <User className="h-4 w-4" />
            Profile
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
        {/* Top bar (mobile) */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
          <Link href="/dashboard">
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
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </nav>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
