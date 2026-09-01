import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function RegisterCompletePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <Logo />
      <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">
        Check your email
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        We&apos;ve sent a confirmation link to your email. Click it to verify
        your account, then set up your profile and start practicing.
      </p>
      <div className="mt-8">
        <Button asChild variant="outline">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    </div>
  );
}
