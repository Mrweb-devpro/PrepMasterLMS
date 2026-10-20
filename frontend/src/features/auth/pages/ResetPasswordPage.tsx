import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/prep/AuthLayout";
import { Field } from "@/features/admin/components/parts";
import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LIVE } from "@/lib/api/config";
import { supabase } from "@/lib/api/supabase";
import { isMainProfileComplete } from "@/features/auth/utils/profile";
import { EmailDeliveryNotice } from "../components/EmailDeliveryNotice";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState(!LIVE);
  const [checking, setChecking] = useState(LIVE);
  const [submitting, setSubmitting] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const { updatePassword, refreshSession } = useAuthActions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!LIVE) return;
    let active = true;
    const auth = supabase().auth;
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setHasRecoverySession(true);
        setChecking(false);
      }
      if (event === "SIGNED_OUT") setHasRecoverySession(false);
    });

    void auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error(error.message);
        if (data.session) setHasRecoverySession(true);
      })
      .catch((error: Error) => {
        if (active) toast.error(error.message);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || checking || !hasRecoverySession) return;
    if (!passwordUpdated && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!passwordUpdated && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      if (!passwordUpdated) {
        await updatePassword.mutateAsync(password);
        setPasswordUpdated(true);
        toast.success("Password updated successfully!");
      }
      const profile = await refreshSession.mutateAsync();
      await navigate({ to: isMainProfileComplete(profile) ? "/" : "/onboarding", replace: true });
    } catch {
      // Mutation errors are toasted; keep the recovery session for a retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Please enter a secure password for your account."
      footer={
        <span className="text-center text-xs text-text-muted">
          Already updated?{" "}
          <Link to="/login" className="font-medium text-text underline">
            Sign in
          </Link>
        </span>
      }
    >
      {checking ? (
        <div>
          <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Verifying recovery link...
          </div>
          <p className="text-center text-sm text-text-muted">Still waiting? You can request a fresh link.</p>
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link to="/forgot-password">Request new password link</Link>
          </Button>
        </div>
      ) : !hasRecoverySession ? (
        <div role="alert" className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-foreground">
          <p>This reset link has expired or was already used. Please request a new one.</p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Request new password link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="New password">
            <Input
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              disabled={submitting || passwordUpdated}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              required
              autoComplete="new-password"
              disabled={submitting || passwordUpdated}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {passwordUpdated ? "Continue to your account" : "Update password"}
          </Button>
        </form>
      )}
      <EmailDeliveryNotice />
    </AuthLayout>
  );
}
