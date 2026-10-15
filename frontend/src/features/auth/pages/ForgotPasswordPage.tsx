import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/prep/AuthLayout";
import { Field } from "@/features/admin/components/parts";
import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { EmailDeliveryNotice } from "../components/EmailDeliveryNotice";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { resetPassword } = useAuthActions();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (resetPassword.isPending) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await resetPassword.mutateAsync(trimmed);
      setSubmittedEmail(trimmed);
    } catch {
      // The mutation's onError displays the error toast.
    }
  };

  if (submittedEmail) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`We've sent a password reset link to ${submittedEmail}`}
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
          >
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        }
      >
        <div className="space-y-5 py-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-6" />
          </div>
          <p className="text-sm text-text-muted">
            Click the link inside the email to set a new password.
          </p>
          <EmailDeliveryNotice />
          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resetPassword.isPending}
              onClick={() =>
                resetPassword.mutate(submittedEmail, {
                  onSuccess: () => toast.success("Reset link resent!"),
                })
              }
            >
              {resetPassword.isPending && <Loader2 className="size-4 animate-spin" />}
              Resend email
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/login">Return to sign in</Link>
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a recovery link."
      footer={
        <span className="text-center text-xs text-text-muted">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-text underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address">
          <Input
            type="email"
            autoFocus
            autoComplete="email"
            required
            disabled={resetPassword.isPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu.ng"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
          {resetPassword.isPending && <Loader2 className="size-4 animate-spin" />}
          Send recovery link
        </Button>
      </form>
      {resetPassword.isPending && <EmailDeliveryNotice />}
    </AuthLayout>
  );
}
