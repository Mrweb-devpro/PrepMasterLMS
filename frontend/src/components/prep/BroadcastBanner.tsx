import { Link } from "@tanstack/react-router";
import { Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BroadcastBanner({
  id,
  title,
  subtitle,
  prize,
  actionText,
  actionTo,
  onDismiss,
}: {
  id: string;
  title: string;
  subtitle?: string;
  prize?: string;
  actionText: string;
  actionTo: string;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(`dismissed_banner_${id}`) === "true");
  }, [id]);

  if (dismissed) return null;
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary-soft px-4 py-3 shadow-sm sm:flex-row sm:items-center">
      <Trophy className="size-5 shrink-0 text-gold-text" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
      </div>
      {prize && <span className="text-xs font-semibold text-gold-text">{prize}</span>}
      <Link to={actionTo as never} className="text-sm font-medium text-primary hover:underline">
        {actionText}
      </Link>
      <button
        type="button"
        aria-label="Dismiss announcement"
        className={cn("rounded-sm p-1 text-text-muted transition-colors hover:bg-surface hover:text-foreground")}
        onClick={() => {
          window.localStorage.setItem(`dismissed_banner_${id}`, "true");
          setDismissed(true);
          onDismiss?.();
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
