import { Link } from "@tanstack/react-router";
import {
  Box,
  BookMarked,
  FolderClosed,
  History,
  Home,
  MonitorCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppFrame, Brand, type NavGroup } from "@/components/layout/AppSidebar";
import { useMainAppGuard } from "@/features/auth/hooks/useGuards";
import { useSession } from "@/features/auth/session";
import { fullName } from "@/features/auth/utils/profile";
import { ProfileAvatar } from "@/features/auth/components/ProfileAvatar";
import { WarningNoticeDialog } from "./WarningNoticeDialog";

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
        <ProfileAvatar user={user} />
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

  if (!ready) return null;

  return (
    <AppFrame
      brand={<Brand name="PrepMaster" to="/" />}
      groups={groups}
      footer={footer}
    >
      {children}
      <WarningNoticeDialog key={user?.id} />
    </AppFrame>
  );
}
