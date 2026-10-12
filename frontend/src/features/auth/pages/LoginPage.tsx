import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/prep/AuthLayout";
import { Field } from "@/features/admin/components/parts";
import { GoogleButton, OrDivider } from "../components/fields";
import { useAuthActions } from "../hooks/useAuthActions";

export function LoginPage({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const { emailSignIn, google } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const go = (role: string) =>
    navigate({ to: role === "admin" && !redirect ? "/admin" : (redirect ?? "/") });

  return (
    <AuthLayout
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
      <GoogleButton onClick={() => google.mutate(undefined, { onSuccess: (p) => go(p.role) })} />
      <OrDivider />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email) {
            toast.error("Enter your email");
            return;
          }
          emailSignIn.mutate({ email, password }, { onSuccess: (p) => go(p.role) });
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
            <button
              type="button"
              className="text-xs text-primary"
              onClick={() => toast("Reset link sent", { description: "Demo: no email is sent." })}
            >
              Forgot?
            </button>
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
        <p className="text-center text-2xs text-text-muted">
          Demo: any email with “admin” in it opens the admin console.
        </p>
      </form>
    </AuthLayout>
  );
}
