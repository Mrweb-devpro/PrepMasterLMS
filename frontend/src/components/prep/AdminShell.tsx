import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Box,
  ClipboardList,
  FileCheck2,
  MessageCircleQuestion,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  MonitorCheck,
  Plus,
  Trophy,
  Users,
} from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { useAdminGuard } from "@/features/auth/hooks/useGuards";
import { PageLoading } from "@/features/solidworks/components/bits";
import { AppFrame, Brand, type NavGroup, useSidebarCollapsed } from "@/components/layout/AppSidebar";
import { useAdmin } from "@/lib/admin-store";
import { isAttemptableLiveCbt } from "@/features/cbt/utils/cbt-lifecycle";
import { cn } from "@/lib/utils";

function AdminFooter() {
  const collapsed = useSidebarCollapsed();

  return (
    <Link
      to="/"
      title={collapsed ? "Back to student view" : undefined}
      className={cn(
        "flex h-9 items-center rounded-md text-sm text-sidebar-muted transition-colors hover:bg-surface-hover hover:text-sidebar-foreground",
        collapsed ? "justify-center px-0" : "gap-2 px-2.5",
      )}
    >
      <ArrowLeft className="size-4 shrink-0" />
      {!collapsed && <span>Back to student view</span>}
    </Link>
  );
}

export function AdminShell({
  title,
  description,
  actions,
  back,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { to: string; label: string; params?: Record<string, string> };
  children: ReactNode;
}) {
  const admin = useAdmin();
  const ready = useAdminGuard();
  const hasLiveCbt = admin.cbts.some(isAttemptableLiveCbt);
  const groups: NavGroup[] = [
    {
      items: [
        { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/admin/courses", label: "Courses", icon: FolderKanban, badge: admin.courses.length },
        {
          to: "/admin/cbts",
          label: "CBTs",
          icon: MonitorCheck,
          badge: admin.cbts.length,
          liveIndicator: hasLiveCbt,
        },
        { to: "/admin/students", label: "Students", icon: Users },
        { to: "/admin/payments", label: "Payments", icon: CreditCard },
        { to: "/admin/competitions", label: "Competitions", icon: Trophy },
      ],
    },
    {
      label: "SolidWorks",
      items: [
        { to: "/admin/sw-users", label: "SW users", icon: Box },
        { to: "/admin/sw-tasks", label: "SW tasks", icon: ClipboardList },
        { to: "/admin/sw-submissions", label: "SW submissions", icon: FileCheck2 },
        { to: "/admin/sw-questions", label: "SW questions", icon: MessageCircleQuestion },
      ],
    },
    {
      label: "Create",
      items: [
        { to: "/admin/courses/new", label: "New course", icon: Plus, exact: true },
        { to: "/admin/cbts/new", label: "New CBT", icon: Plus, exact: true },
        { to: "/admin/competitions/new", label: "New competition", icon: Plus, exact: true },
      ],
    },
  ];

  const topbar = (
    <div className="flex w-full items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-2xs font-medium text-primary">
        <span className="size-1.5 rounded-full bg-primary" />
        Admin mode
      </span>
    </div>
  );

  if (!ready) return null;

  return (
    <div className="theme-admin">
      <AppFrame
        themeClass="theme-admin"
        brand={<Brand name="PrepMaster" sub="Admin console" to="/admin" />}
        groups={groups}
        footer={<AdminFooter />}
        topbar={topbar}
      >
        {back && (
          <Link
            to={back.to}
            params={back.params as never}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {back.label}
          </Link>
        )}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        <Suspense fallback={<PageLoading />}>{children}</Suspense>
      </AppFrame>
    </div>
  );
}
