import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LIVE } from "@/lib/api/config";
import { authService } from "../services/auth.service";
import type { Profile } from "../types";

/**
 * Shown after email/password sign-up. LIVE: "I've verified" signs in once the
 * email link has been clicked. Demo: it simulates clicking the link.
 */
export function VerifyEmail({
  email,
  onVerified,
}: {
  email: string;
  onVerified: (profile?: Profile) => void;
}) {
  const [busy, setBusy] = useState(false);

  const verified = async () => {
    setBusy(true);
    try {
      const p = await authService.completeVerification();
      onVerified(p ?? undefined);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await authService.resendVerification(email);
      toast.success("Link sent again", { description: email });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="animate-fade-in text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <MailCheck className="size-6" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold">Verify your email</h1>
      <p className="mt-2 text-sm text-text-secondary">
        We sent a link to <span className="font-medium text-foreground">{email}</span>. Open it to
        activate your account.
      </p>
      <div className="mt-6 space-y-2">
        <Button className="w-full" onClick={verified} disabled={busy}>
          {busy ? "Checking…" : "I've verified my email"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={resend}>
          Resend link
        </Button>
      </div>
      {!LIVE && <p className="mt-4 text-2xs text-text-muted">Demo: no email is actually sent.</p>}
    </div>
  );
}
