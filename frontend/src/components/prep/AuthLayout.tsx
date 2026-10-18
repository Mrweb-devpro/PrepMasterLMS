import { Link } from "@tanstack/react-router";
import { GraduationCap, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BlueprintCanvas } from "./BlueprintCanvas";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  heroTitle = "Every note, past question and mock exam — in one place.",
  heroText = "Join thousands of students preparing smarter with timed CBTs and organised course drives.",
  brand = "PrepMaster",
  icon: Icon = GraduationCap,
  theme = "default",
  variant = "signup",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  heroTitle?: string;
  heroText?: string;
  brand?: string;
  icon?: LucideIcon;
  theme?: "default" | "sw" | "admin";
  variant?: "signup" | "login" | "solidworks";
}) {
  return (
    <div
      className={cn(
        "grid min-h-screen bg-background lg:grid-cols-2",
        theme === "sw" && "theme-sw",
        theme === "admin" && "theme-admin",
      )}
    >
      <div className="relative hidden justify-between overflow-hidden p-12 text-ink-foreground lg:flex lg:flex-col">
        <BlueprintCanvas variant={variant} />
        <Link to="/" className="relative z-10 flex w-fit items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Icon className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">{brand}</span>
        </Link>
        <div className="relative z-10 mt-auto pt-16">
          <h2 className="max-w-md text-[40px] font-semibold leading-[1.08] tracking-tight text-white drop-shadow-sm">
            {heroTitle}
          </h2>
          <p className="mt-3.5 max-w-sm text-sm leading-relaxed text-zinc-400">{heroText}</p>
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
