import { useState } from "react";
import type { Profile } from "../types";
import { cn } from "@/lib/utils";

export function ProfileAvatar({ user, size = "sm" }: {
  user: Partial<Profile> | null;
  size?: "sm" | "lg";
}) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Your avatar";
  const dimensions = size === "lg" ? "size-24 text-2xl" : "size-8 text-2xs";
  if (user?.avatarUrl && failedUrl !== user.avatarUrl) {
    return <img src={user.avatarUrl} alt={name} referrerPolicy="no-referrer"
      onError={() => setFailedUrl(user.avatarUrl)}
      className={cn("shrink-0 rounded-full border border-border bg-surface-subtle object-cover", dimensions)} />;
  }
  return (
    <span role="img" aria-label={name} className={cn(
      "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground", dimensions,
    )}>
      {`${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "?"}
    </span>
  );
}
