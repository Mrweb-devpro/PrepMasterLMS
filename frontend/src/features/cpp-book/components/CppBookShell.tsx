import { Link } from "@tanstack/react-router";
import { ArrowLeft, Code2, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ProfileAvatar } from "@/features/auth/components/ProfileAvatar";
import { useMainAppGuard } from "@/features/auth/hooks/useGuards";
import { useSession } from "@/features/auth/session";
import { fullName } from "@/features/auth/utils/profile";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/** A focused program shell for the C++ reader, separate from the student dashboard. */
export function CppBookShell({ children, renderChapterNav }: { children: ReactNode; renderChapterNav: (closeNavigation: () => void) => ReactNode }) {
  const ready = useMainAppGuard();
  const { user } = useSession();
  const [navigationOpen, setNavigationOpen] = useState(false);

  if (!ready) return null;

  const navigation = <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">{renderChapterNav(() => setNavigationOpen(false))}</div>;

  return <div className="flex min-h-screen w-full bg-background">
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="border-b border-sidebar-border px-3 py-4">
        <Link to="/" className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-sidebar-muted transition-colors hover:bg-surface-hover hover:text-sidebar-foreground">
          <ArrowLeft className="size-4" /> Go back to PrepMaster
        </Link>
      </div>
      <div className="flex items-center gap-2 px-5 pt-5"><Code2 className="size-4 text-primary" /><span className="font-display text-sm font-semibold text-sidebar-foreground">C++ for Engineers</span></div>
      {navigation}
      <div className="border-t border-sidebar-border p-3">
        <Link to="/account" className="flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-surface-hover">
          <ProfileAvatar user={user} />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-sidebar-foreground">{user ? fullName(user) : ""}</span><span className="block truncate text-2xs text-sidebar-muted">{user?.email}</span></span>
        </Link>
      </div>
    </aside>

    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
          <SheetTrigger asChild><button type="button" className="flex size-9 items-center justify-center rounded-md border border-border bg-surface text-text-secondary lg:hidden" aria-label="Open C++ chapters"><Menu className="size-4" /></button></SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">C++ chapters</SheetTitle>
            <div className="border-b border-sidebar-border px-3 py-4 pr-12">
              <Link to="/" onClick={() => setNavigationOpen(false)} className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-sidebar-muted transition-colors hover:bg-surface-hover hover:text-sidebar-foreground"><ArrowLeft className="size-4" /> Go back to PrepMaster</Link>
            </div>
            <div className="flex items-center gap-2 px-5 pt-5"><Code2 className="size-4 text-primary" /><span className="font-display text-sm font-semibold text-sidebar-foreground">C++ for Engineers</span></div>
            {navigation}
            <div className="border-t border-sidebar-border p-3"><Link to="/account" onClick={() => setNavigationOpen(false)} className="flex items-center gap-2.5 rounded-md p-1.5"><ProfileAvatar user={user} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-sidebar-foreground">{user ? fullName(user) : ""}</span><span className="block truncate text-2xs text-sidebar-muted">{user?.email}</span></span></Link></div>
          </SheetContent>
        </Sheet>
        <div className="min-w-0 flex-1"><p className="truncate font-display text-sm font-semibold text-foreground">C++ for Engineers</p><p className="hidden text-2xs text-text-muted sm:block">PrepMaster learning program</p></div>
        <ThemeToggle className="hidden sm:inline-flex" />
        <ThemeToggle compact className="sm:hidden" />
      </header>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>;
}
