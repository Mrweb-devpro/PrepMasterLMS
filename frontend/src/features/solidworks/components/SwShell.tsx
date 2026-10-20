import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Box,
  ClipboardList,
  FolderCheck,
  LayoutDashboard,
  MessageCircleQuestion,
  Settings,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { AppFrame, Brand, type NavGroup, useSidebarCollapsed } from "@/components/layout/AppSidebar";
import { useSession } from "@/features/auth/session";
import { fullName } from "@/features/auth/utils/profile";
import { ProfileAvatar } from "@/features/auth/components/ProfileAvatar";
import { cn } from "@/lib/utils";
import { PageLoading } from "./bits";

const groups: NavGroup[] = [
  {
    items: [
      { to: "/solidworks", label: "Overview", icon: LayoutDashboard, exact: true },
      { to: "/solidworks/submit", label: "Submit work", icon: Upload },
      { to: "/solidworks/tasks", label: "View tasks", icon: ClipboardList },
      { to: "/solidworks/works", label: "My works", icon: FolderCheck },
      { to: "/solidworks/questions", label: "Ask a question", icon: MessageCircleQuestion },
    ],
  },
  { label: "Account", items: [{ to: "/solidworks/settings", label: "Settings", icon: Settings }] },
];

function SwFooter({ showPremium, onDismissPremium }: { showPremium: boolean; onDismissPremium: () => void }) {
  const { user } = useSession();
  const collapsed = useSidebarCollapsed();

  return (
    <div className="space-y-2">
      {!collapsed && showPremium && (
        <div className="relative">
          <button
            type="button"
            onClick={onDismissPremium}
            aria-label="Hide Go Premium"
            className="absolute right-1.5 top-1.5 z-10 flex size-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
          <Link
            to="/solidworks/premium"
            className="block rounded-md border border-gold/40 bg-gold-bg p-3 pr-8 transition-colors hover:border-gold"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gold-text">
              <Sparkles className="size-3.5 text-gold" /> Go Premium
            </span>
            <span className="mt-0.5 block text-2xs text-text-secondary">
              1-on-1 sessions & priority reviews.
            </span>
            <span className="mt-2 inline-block rounded-full bg-surface px-2 py-0.5 text-2xs font-medium text-text-muted">
              Coming soon
            </span>
          </Link>
        </div>
      )}
      {user && (
        <Link
          to="/solidworks/settings"
          title={collapsed ? fullName(user) : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-md transition-colors hover:bg-surface-hover",
            collapsed ? "justify-center p-1.5" : "p-1.5",
          )}
        >
          <ProfileAvatar user={user} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{fullName(user)}</span>
              <span className="block truncate text-2xs text-sidebar-muted">{user.email}</span>
            </span>
          )}
        </Link>
      )}
      <Link
        to="/"
        title={collapsed ? "Open PrepMaster" : undefined}
        className={cn(
          "flex h-8 items-center rounded-md text-xs text-sidebar-muted transition-colors hover:bg-surface-hover hover:text-sidebar-foreground",
          collapsed ? "justify-center px-0" : "gap-2 px-2",
        )}
      >
        <ArrowLeftRight className="size-3.5 shrink-0" />
        {!collapsed && <span>Open PrepMaster</span>}
      </Link>
    </div>
  );
}

/** Third dashboard: SolidWorks (teal accent via .theme-sw). */
export function SwShell({ children }: { children: ReactNode }) {
  const [showPremium, setShowPremium] = useState(false);
  useEffect(() => {
    setShowPremium(localStorage.getItem("sw-premium-dismissed") !== "1");
  }, []);
  const dismissPremium = () => {
    localStorage.setItem("sw-premium-dismissed", "1");
    setShowPremium(false);
  };

  const topbar = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-2xs font-medium text-primary">
      <Box className="size-3" /> SolidWorks with MrPrepMaster
    </span>
  );

  return (
    <div className="theme-sw">
      <AppFrame
        themeClass="theme-sw"
        brand={<Brand name="PrepMaster" sub="SolidWorks" to="/solidworks" />}
        groups={groups}
        footer={<SwFooter showPremium={showPremium} onDismissPremium={dismissPremium} />}
        topbar={topbar}
      >
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </AppFrame>
    </div>
  );
}
