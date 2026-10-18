import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/prep/AuthLayout";
import { Field } from "@/features/admin/components/parts";
import { GoogleButton, OrDivider } from "../components/fields";
import { useAuthActions } from "../hooks/useAuthActions";
import { useSession } from "../session";
import { isMainProfileComplete } from "../utils/profile";

export function LoginPage({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const { hydrated, user } = useSession();
  const { emailSignIn, google, resendVerification } = useAuthActions({
    onEmailSignInError: (error, attemptedEmail) => {
      if (("code" in error && error.code === "email_not_confirmed") ||
          error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Email not verified yet", {
          description: "You haven't verified your email yet. Please check your inbox and your Spam folder before signing in.",
          duration: 12000,
          action: {
            label: "Resend Link",
            onClick: () => resendVerification.mutate(attemptedEmail),
          },
        });
        return;
      }
      toast.error(error.message || "Something went wrong");
    },
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!hydrated || !user) return;
    const destination = !isMainProfileComplete(user)
      ? "/onboarding"
      : redirect ?? (user.role === "admin" ? "/admin" : "/");
    void navigate({ to: destination, replace: true });
  }, [hydrated, user, redirect, navigate]);

  return (
    <AuthLayout
      variant="login"
      title="Welcome back"
      subtitle="Sign in to continue. Admins sign in here too."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton onClick={() => google.mutate()} />
      <OrDivider />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) {
            toast.error("Enter your email");
            return;
          }
          emailSignIn.mutate({ email: email.trim(), password });
        }}
      >
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu.ng"
          />
        </Field>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Password</span>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full" disabled={emailSignIn.isPending}>
          {emailSignIn.isPending && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
