import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  isNotFound,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PrepProvider } from "../lib/prep-store";
import { AdminProvider } from "../lib/admin-store";
import { Toaster } from "../components/ui/sonner";
import { ThemeProvider, themeInitScript } from "../lib/theme";
import { SessionProvider } from "../features/auth/session";
import { ConfirmProvider } from "../components/common/ConfirmDialog";
import { DemoSwitcher } from "../features/auth/components/DemoSwitcher";
import { NotFoundIllustration } from "@/components/common/NotFoundIllustration";
import { hasInvalidAuthLink } from "@/features/auth/utils/auth-link";

function AuthLinkErrorRedirect() {
  useEffect(() => {
    if (!hasInvalidAuthLink()) return;
    const path = window.location.pathname;
    if (path === "/login" || path === "/reset-password") return;
    window.location.replace("/login?authLink=invalid");
  }, []);
  return null;
}

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <Link
        to="/"
        className="absolute left-4 top-6 inline-flex items-center transition-opacity hover:opacity-85 sm:left-8"
        aria-label="PrepMaster home"
      >
        <img
          src="/brand/prepmaster-horizontal.png"
          alt="PrepMaster"
          className="h-8 w-auto object-contain dark:hidden md:h-9"
        />
        <img
          src="/brand/prepmaster-horizontal-dark.png"
          alt="PrepMaster"
          className="hidden h-8 w-auto object-contain dark:block md:h-9"
        />
      </Link>
      <NotFoundIllustration className="mb-6" />
      <div className="max-w-md">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Looks like this page was eaten or moved to another universe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <LayoutDashboard className="size-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const errorDetails = error as { status?: number; statusCode?: number; message?: string };
  const is404 =
    isNotFound(error) ||
    errorDetails.status === 404 ||
    errorDetails.statusCode === 404 ||
    /not found/i.test(errorDetails.message ?? "");

  if (is404) {
    return <NotFoundComponent />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PrepMaster" },
      {
        name: "description",
        content:
          "PrepMaster gives students course materials, practice CBTs and live exams in one place.",
      },
      { property: "og:title", content: "PrepMaster" },
      {
        property: "og:description",
        content: "Study materials, practice CBTs and live exams for students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "shortcut icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthLinkErrorRedirect />
        <SessionProvider>
          <ConfirmProvider>
            <PrepProvider>
              <AdminProvider>
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
                <Toaster position="top-right" richColors closeButton />
                <DemoSwitcher />
                <Analytics />
              </AdminProvider>
            </PrepProvider>
          </ConfirmProvider>
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
