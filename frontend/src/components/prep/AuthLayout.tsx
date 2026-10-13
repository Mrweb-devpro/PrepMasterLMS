import { Link } from "@tanstack/react-router";
import { GraduationCap, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  heroTitle = "Every note, past question and mock exam — in one place.",
  heroText = "Join thousands of students preparing smarter with timed CBTs and organised course drives.",
  brand = "PrepMaster",
  icon: Icon = GraduationCap,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  heroTitle?: string;
  heroText?: string;
  brand?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink-gradient p-12 text-ink-foreground lg:flex lg:flex-col">
        <div className="dot-grid absolute inset-0 opacity-50" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary">
            <Icon className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">{brand}</span>
        </Link>
        <div className="relative mt-auto">
          <h2 className="max-w-md text-[44px] font-semibold leading-[1.05]">{heroTitle}</h2>
          <p className="mt-4 max-w-sm text-ink-muted">{heroText}</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in py-10">
          {title && <h1 className="text-3xl font-semibold">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
          <div className={title ? "mt-8" : ""}>{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-text-secondary">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
