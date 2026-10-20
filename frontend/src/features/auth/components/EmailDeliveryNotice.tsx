import { useState } from "react";
import { AlertTriangle, Mail, X } from "lucide-react";

export function EmailDeliveryNotice({ verification = false }: { verification?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const Icon = verification ? AlertTriangle : Mail;

  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-bg p-3 text-left text-xs text-foreground">
      <Icon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-relaxed">
        {verification ? (
          <>Don't see the email? Be sure to check your <strong>Spam</strong> or <strong>Junk</strong> folder, or give it up to 2 minutes to arrive.</>
        ) : (
          <><strong>Can't find the email?</strong> Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. Automated recovery emails sometimes get filtered there.</>
        )}
      </p>
      <button
        type="button"
        aria-label="Dismiss email guidance"
        className="shrink-0 rounded-md p-1 text-text-muted hover:bg-warning/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
