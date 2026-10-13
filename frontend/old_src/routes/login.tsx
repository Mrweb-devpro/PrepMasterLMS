import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/prep/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — PrepMaster" },
      { name: "description", content: "Sign in to your PrepMaster account." },
      { property: "og:title", content: "Sign in — PrepMaster" },
      { property: "og:description", content: "Sign in to your PrepMaster account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue studying." footer={<>New here? <Link to="/signup" className="font-medium text-primary">Create an account</Link></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/" }); }}>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="you@school.edu" /></div>
        <div className="space-y-1.5">
          <div className="flex justify-between"><Label>Password</Label><button type="button" className="text-xs text-primary">Forgot?</button></div>
          <Input type="password" placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </AuthLayout>
  );
}
