import { Link } from "@tanstack/react-router";
import {
  FileImage,
  FileText,
  FileType2,
  Film,
  Lock,
  Presentation,
  ChevronRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FileType } from "@/lib/mock-data";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{children}</h2>
      {aside}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PaidPill({ paid, owned }: { paid: boolean; owned?: boolean }) {
  if (!paid) {
    return (
      <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
        Free
      </span>
    );
  }
  if (owned) {
    return (
      <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
        Owned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-bg px-2.5 py-0.5 text-xs font-medium text-gold-text">
      <Lock className="size-3" />
      Paid
    </span>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "error" | "neutral" | "primary" | "gold";
  children: ReactNode;
}) {
  const tones = {
    success: "bg-success-bg text-success",
    warning: "bg-warning-bg text-warning",
    error: "bg-error-bg text-error",
    neutral: "bg-surface-subtle text-text-secondary",
    primary: "bg-secondary text-primary",
    gold: "bg-gold-bg text-gold-text",
  } as const;
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-error-bg px-2.5 py-0.5 text-xs font-medium text-error">
      <span className="size-1.5 animate-pulse rounded-full bg-error" />
      Live now
    </span>
  );
}

const iconMap: Record<FileType, typeof FileText> = {
  pdf: FileText,
  doc: FileType2,
  slides: Presentation,
  video: Film,
  image: FileImage,
};

export function FileIcon({ type, className }: { type: FileType; className?: string }) {
  const Icon = iconMap[type];
  return <Icon className={cn("size-4 text-primary", className)} />;
}

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-text-secondary">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 text-text-muted" />}
          {item.to ? (
            <Link to={item.to} params={item.params as never} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border-strong bg-surface-subtle px-6 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: typeof FileText;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-primary">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
