import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string | number;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** True when the desktop sidebar is collapsed to icons only. */
export const SidebarCollapsedContext = createContext(false);
export const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);
const COLLAPSE_KEY = "prep-sidebar-collapsed";

export function useIsActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string, exact?: boolean) =>
    exact
      ? pathname === to || pathname === `${to}/`
      : pathname === to || pathname.startsWith(`${to}/`);
}

function NavLinks({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const isActive = useIsActive();
  const collapsed = useSidebarCollapsed();
  return (
    <div className="space-y-6">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && !collapsed && (
            <p className="mb-1.5 px-2.5 text-2xs font-medium uppercase tracking-wider text-sidebar-muted">
              {g.label}
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-active font-medium text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border"
                      : "text-sidebar-muted hover:bg-surface-hover hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <span className="ml-auto rounded-full bg-primary-soft px-1.5 text-2xs font-medium text-primary">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function SidebarPanel({
  brand,
  groups,
  footer,
  onNavigate,
}: {
  brand: ReactNode;
  groups: NavGroup[];
  footer?: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-3 pb-4 pt-4">{brand}</div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <NavLinks groups={groups} {...(onNavigate ? { onNavigate } : {})} />
      </div>
      {footer && <div className="shrink-0 border-t border-sidebar-border p-3">{footer}</div>}
    </div>
  );
}

export function AppFrame({
  brand,
  groups,
  footer,
  topbar,
  themeClass,
  children,
}: {
  brand: ReactNode;
  groups: NavGroup[];
  footer?: ReactNode;
  topbar?: ReactNode;
  /** Theme class re-applied to the mobile drawer (it renders outside the shell). */
  themeClass?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "group/aside sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarCollapsedContext.Provider value={collapsed}>
          <SidebarPanel brand={brand} groups={groups} footer={collapsed ? undefined : footer} />
        </SidebarCollapsedContext.Provider>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-1.5 top-0 h-full w-3 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-transparent after:transition-colors hover:after:bg-primary/60"
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="flex size-9 items-center justify-center rounded-md border border-border bg-surface text-text-secondary lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className={cn("w-72 border-sidebar-border bg-sidebar p-0", themeClass)}
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarPanel
                brand={brand}
                groups={groups}
                footer={footer}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden size-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground lg:flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
          <div className="flex min-w-0 flex-1 items-center">{topbar}</div>
          <ThemeToggle className="hidden shrink-0 sm:inline-flex" />
          <ThemeToggle compact className="shrink-0 sm:hidden" />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 animate-fade-in sm:px-6 md:px-8 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function Brand({
  logoSrc = "/brand/prepmaster-logo.png",
  logoDarkSrc = "/brand/prepmaster-horizontal-dark.png",
  markSrc = "/brand/prepmaster-mark.png",
  markDarkSrc = "/brand/prepmaster-mark-dark.png",
  name = "PrepMaster",
  sub,
  to,
}: {
  logoSrc?: string;
  logoDarkSrc?: string;
  markSrc?: string;
  markDarkSrc?: string;
  name?: string;
  sub?: string;
  to: string;
}) {
  const collapsed = useSidebarCollapsed();
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-md px-1.5 py-1 transition-opacity hover:opacity-90",
        collapsed && "justify-center px-0",
      )}
    >
      {collapsed ? (
        <div className="flex size-8 shrink-0 items-center justify-center">
          <img
            src={markSrc}
            alt={name}
            className="size-7 object-contain transition-transform group-hover:scale-105 dark:hidden"
          />
          <img src={markDarkSrc} alt={name} className="hidden size-7 object-contain dark:block" />
        </div>
      ) : sub ? (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center">
            <img src={markSrc} alt="" className="size-7 object-contain dark:hidden" />
            <img src={markDarkSrc} alt="" className="hidden size-7 object-contain dark:block" />
          </div>
          <div className="min-w-0">
            <span className="block font-display text-base font-bold leading-tight tracking-tight text-sidebar-foreground">
              {name}
            </span>
            <span className="block text-2xs font-medium text-sidebar-muted">{sub}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <img
            src={logoSrc}
            alt={name}
            className="h-8 w-auto max-w-[170px] object-contain dark:hidden"
          />
          <img
            src={logoDarkSrc}
            alt={name}
            className="hidden h-8 w-auto max-w-[170px] object-contain dark:block"
          />
        </div>
      )}
    </Link>
  );
}
