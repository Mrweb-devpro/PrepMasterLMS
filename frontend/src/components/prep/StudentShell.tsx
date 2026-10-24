import { Link } from "@tanstack/react-router";
import {
  Box,
  BookMarked,
  FolderClosed,
  History,
  Home,
  MonitorCheck,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppFrame, Brand, type NavGroup, useSidebarCollapsed } from "@/components/layout/AppSidebar";
import { PythonIcon } from "@/components/common/PythonIcon";
import { useMainAppGuard } from "@/features/auth/hooks/useGuards";
import { useSession } from "@/features/auth/session";
import { fullName } from "@/features/auth/utils/profile";
import { ProfileAvatar } from "@/features/auth/components/ProfileAvatar";
import { useCatalog } from "@/features/catalog/useCatalog";
import { isAttemptableLiveCbt } from "@/features/cbt/utils/cbt-lifecycle";
import { cn } from "@/lib/utils";
import { WarningNoticeDialog } from "./WarningNoticeDialog";

function StudentFooter() {
  const { user } = useSession();
  const collapsed = useSidebarCollapsed();

  return (
    <div className="space-y-1">
      <Link
        to="/account"
        title={collapsed ? (user ? fullName(user) : "Account") : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md transition-colors hover:bg-surface-hover",
          collapsed ? "justify-center p-1.5" : "p-1.5",
        )}
      >
        <ProfileAvatar user={user} />
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user ? fullName(user) : ""}</span>
            <span className="block truncate text-2xs text-sidebar-muted">{user?.email}</span>
          </span>
        )}
      </Link>
      {user?.role === "admin" && (
        <Link
          to="/admin"
          title={collapsed ? "Switch to admin" : undefined}
          className={cn(
            "flex h-8 items-center rounded-md text-xs text-sidebar-muted transition-colors hover:bg-surface-hover hover:text-sidebar-foreground",
            collapsed ? "justify-center px-0" : "gap-2 px-2",
          )}
        >
          <ShieldCheck className="size-3.5 shrink-0" />
          {!collapsed && <span>Switch to admin</span>}
        </Link>
      )}
    </div>
  );
}

export function StudentShell({ children }: { children: ReactNode }) {
  const ready = useMainAppGuard();
  const { user } = useSession();
  const { cbts } = useCatalog();
  const isSwRegistered = Boolean(user?.swRegistered);
  const hasLiveCbt = cbts.some(isAttemptableLiveCbt);
  const groups: NavGroup[] = [
    {
      items: [
        { to: "/", label: "Home", icon: Home, exact: true },
        { to: "/drive", label: "Drive", icon: FolderClosed },
        { to: "/cbts", label: "CBTs", icon: MonitorCheck, liveIndicator: hasLiveCbt },
        { to: "/attempts", label: "My attempts", icon: History },
        { to: "/library", label: "My Library", icon: BookMarked },
      ],
    },
    {
      label: "Programs",
      items: [
        { to: isSwRegistered ? "/solidworks" : "/learn-solidworks", label: "SolidWorks", icon: Box },
        { to: "/python", label: "Python Web Book", icon: PythonIcon, badge: "Soon" },
      ],
    },
    { label: "Account", items: [{ to: "/account", label: "Settings", icon: Settings }] },
  ];

  if (!ready) return null;

  return (
    <AppFrame
      brand={<Brand name="PrepMaster" to="/" />}
      groups={groups}
      footer={<StudentFooter />}
    >
      {children}
      <WarningNoticeDialog key={user?.id} />
    </AppFrame>
  );
}
