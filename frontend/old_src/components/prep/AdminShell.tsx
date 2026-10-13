import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, FolderKanban, LayoutDashboard, MonitorCheck, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/courses", label: "Courses", icon: FolderKanban, exact: false },
  { to: "/admin/cbts", label: "CBTs", icon: MonitorCheck, exact: false },
  { to: "/admin/students", label: "Students", icon: Users, exact: false },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, exact: false },
] as const;

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to || pathname === `${to}/` : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-ink text-ink-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-display font-semibold leading-tight">PrepMaster</p>
            <p className="text-xs text-text-muted">Admin console</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                isActive(item.to, item.exact)
                  ? "bg-ink font-medium text-ink-foreground"
                  : "text-text-secondary hover:bg-surface-subtle hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/"
          className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-subtle"
        >
          <ArrowLeft className="size-4" />
          Back to student view
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-4 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm",
                isActive(item.to, item.exact) ? "bg-ink text-ink-foreground" : "text-text-secondary",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/" className="shrink-0 px-3 py-1.5 text-sm text-text-muted">
            Student view
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-5 py-8 animate-fade-in md:px-10 md:py-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
            </div>
            {actions}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
