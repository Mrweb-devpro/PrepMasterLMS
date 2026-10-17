import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/prep/bits";
import { useSession } from "../session";
import { formatWarningDate } from "../utils/warning-views";

export function AccountModerationCard() {
  const { user } = useSession();
  const warnings = [...(user?.warnings ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  return (
    <Card className={warnings.length ? "border-destructive/30" : ""}>
      <h2 className="text-lg font-semibold">Account Status &amp; Moderation</h2>
      {warnings.length === 0 ? (
        <div className="mt-4">
          <p className="flex items-center gap-2 font-medium text-success">
            <ShieldCheck className="size-5" aria-hidden="true" /> Account in Good Standing
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            You have no warnings or disciplinary marks.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {warnings.map((warning) => (
              <li
                key={warning.id}
                className="rounded-md border border-warning/30 bg-warning-bg p-3"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-semibold">
                    {warning.reason}
                  </p>
                </div>
                <time dateTime={warning.created_at} className="mt-2 block text-xs text-text-muted">
                  Issued {formatWarningDate(warning.created_at)}
                </time>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-text-secondary">
            If you believe this warning was issued in error, please{" "}
            <a
              href="mailto:prepmaster.app@gmail.com?subject=Warning%20review%20request"
              className="font-medium text-primary underline-offset-2 hover:text-primary-hover hover:underline"
            >
              contact admin support
            </a>
            .
          </p>
        </>
      )}
    </Card>
  );
}
