import { Link } from "@tanstack/react-router";
import {
  Bell,
  Box,
  BookMarked,
  FolderClosed,
  GraduationCap,
  History,
  Home,
  MonitorCheck,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { AppFrame, Brand, type NavGroup } from "@/components/layout/AppSidebar";
import { useMainAppGuard } from "@/features/auth/hooks/useGuards";
import { useSession } from "@/features/auth/session";
import { fullName, initials } from "@/features/auth/utils/profile";

export function StudentShell({ children }: { children: ReactNode }) {
  const ready = useMainAppGuard();
  const { user } = useSession();
  const groups: NavGroup[] = [
    {
      items: [
        { to: "/", label: "Home", icon: Home, exact: true },
        { to: "/drive", label: "Drive", icon: FolderClosed },
        { to: "/cbts", label: "CBTs", icon: MonitorCheck },
        { to: "/attempts", label: "My attempts", icon: History },
        { to: "/library", label: "My Library", icon: BookMarked },
      ],
    },
    { label: "Programs", items: [{ to: "/learn-solidworks", label: "SolidWorks", icon: Box }] },
    { label: "Account", items: [{ to: "/account", label: "Settings", icon: UserRound }] },
  ];

  const footer = (
    <div className="space-y-1">
      <Link
        to="/account"
        className="flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-surface-hover"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-2xs font-semibold text-primary-foreground">
          {user ? initials(user) : ""}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user ? fullName(user) : ""}</span>
          <span className="block truncate text-2xs text-sidebar-muted">{user?.email}</span>
        </span>
      </Link>
      {user?.role === "admin" && (
        <Link
          to="/admin"
          className="flex h-8 items-center gap-2 rounded-md px-2 text-xs text-sidebar-muted transition-colors hover:bg-surface-hover hover:text-sidebar-foreground"
        >
          <ShieldCheck className="size-3.5" />
          Switch to admin
        </Link>
      )}
    </div>
  );

  const topbar = (
    <>
      <Link
        to="/drive"
        className="flex h-9 w-full min-w-0 max-w-[11rem] items-center gap-2 rounded-md border sm:max-w-sm border-border bg-surface px-3 text-sm text-text-muted transition-colors hover:border-border-strong"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search materials…</span>
        <kbd className="ml-auto hidden rounded-xs border border-border px-1.5 text-2xs sm:block">
          ⌘K
        </kbd>
      </Link>
      <button
        onClick={() => toast("You're all caught up", { description: "No new notifications." })}
        className="relative ml-auto hidden size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition-colors hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
      </button>
    </>
  );

  if (!ready) return null;

  return (
    <AppFrame
      brand={<Brand icon={GraduationCap} name="PrepMaster" to="/" />}
      groups={groups}
      footer={footer}
      topbar={topbar}
    >
      {children}
    </AppFrame>
  );
}
