import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/prep/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — PrepMaster" },
      { name: "description", content: "Create a free PrepMaster account to access study materials and CBTs." },
      { property: "og:title", content: "Create account — PrepMaster" },
      { property: "og:description", content: "Create a free PrepMaster account to access study materials and CBTs." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Create your account" subtitle="It's free — unlock paid items only when you need them." footer={<>Already have an account? <Link to="/login" className="font-medium text-primary">Sign in</Link></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/" }); }}>
        <div className="space-y-1.5"><Label>Full name</Label><Input placeholder="Ada Obi" /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="you@school.edu" /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" placeholder="At least 8 characters" /></div>
        <Button type="submit" className="w-full">Create account</Button>
      </form>
    </AuthLayout>
  );
}
