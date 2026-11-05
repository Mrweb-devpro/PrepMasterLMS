import { useState } from "react";
import { cn } from "@/lib/utils";

/** A compact public profile image with a graceful initials fallback for competition boards. */
export function CompetitionAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full border border-border bg-surface-subtle object-cover", className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground", className)}
    >
      {initials}
    </span>
  );
}
