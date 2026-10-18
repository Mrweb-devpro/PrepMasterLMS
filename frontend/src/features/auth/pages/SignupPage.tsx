import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/prep/AuthLayout";
import {
  DobField,
  EmailPasswordFields,
  GoogleButton,
  HeardField,
  NameFields,
  OrDivider,
  StudyFields,
  type ProfileDraft,
} from "../components/fields";
import { StepCard } from "../components/StepCard";
import { VerifyEmail } from "../components/VerifyEmail";
import { useAuthActions } from "../hooks/useAuthActions";
import { useSession } from "../session";
import { authService } from "../services/auth.service";
import { checks } from "../utils/validate";

const TOTAL = 4;

export function SignupPage() {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const { google, emailSignUp } = useAuthActions();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [verifying, setVerifying] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const patch = (p: ProfileDraft) => setDraft((d) => ({ ...d, ...p }));

  const next = (check?: (d: ProfileDraft) => string | null) => () => {
    const err = check?.(draft);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => s - 1);

  const handleAccountNext = async () => {
    if (checkingEmail) return;
    const error = checks.account(draft);
    if (error) {
      toast.error(error);
      return;
    }
    setCheckingEmail(true);
    try {
      const available = await authService.checkEmailAvailable(draft.email ?? "");
      if (!available) {
        toast.error("This email is already in use. Please sign in or use a different email.");
        return;
      }
      setStep(1);
    } catch (error) {
      toast.error((error as Error).message || "Unable to verify email availability. Please try again.");
    } finally {
      setCheckingEmail(false);
    }
  };

  const finish = () => emailSignUp.mutate(draft, { onSuccess: () => setVerifying(true) });

  const footer = (
    <>
      Already have an account?{" "}
      <Link to="/login" className="font-medium text-primary">
        Sign in
      </Link>
    </>
  );

  if (verifying) {
    return (
      <AuthLayout>
        <VerifyEmail
          email={draft.email ?? ""}
          onVerified={(live) => {
            const p = live ?? emailSignUp.data;
            if (!p) return;
            signIn({ ...p, emailVerified: true });
            toast.success("Account created", { description: "Welcome to PrepMaster!" });
            navigate({ to: "/" });
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout footer={footer}>
      {step === 0 && (
        <StepCard
          step={0}
          total={TOTAL}
          title="Create your account"
          subtitle="It's free — unlock paid items only when you need them."
          onNext={handleAccountNext}
          busy={checkingEmail}
        >
          <GoogleButton
            label="Sign up with Google"
            onClick={() =>
              google.mutate(undefined, { onSuccess: () => navigate({ to: "/onboarding" }) })
            }
          />
          <OrDivider />
          <EmailPasswordFields value={draft} onChange={patch} />
        </StepCard>
      )}
      {step === 1 && (
        <StepCard
          step={1}
          total={TOTAL}
          title="About you"
          onBack={back}
          onNext={next(checks.names)}
        >
          <NameFields value={draft} onChange={patch} />
          <DobField value={draft} onChange={patch} />
        </StepCard>
      )}
      {step === 2 && (
        <StepCard
          step={2}
          total={TOTAL}
          title="Your studies"
          subtitle="We use this to show the right courses."
          onBack={back}
          onNext={next(checks.study)}
        >
          <StudyFields value={draft} onChange={patch} />
        </StepCard>
      )}
      {step === 3 && (
        <StepCard
          step={3}
          total={TOTAL}
          title="Where did you hear about us?"
          subtitle="Optional — you can skip this."
          onBack={back}
          onNext={finish}
          nextLabel="Create account"
          busy={emailSignUp.isPending}
          aside={
            <Button type="button" variant="ghost" onClick={finish}>
              Skip
            </Button>
          }
        >
          <HeardField value={draft.heard} onChange={(heard) => patch({ heard })} />
        </StepCard>
      )}
    </AuthLayout>
  );
}
