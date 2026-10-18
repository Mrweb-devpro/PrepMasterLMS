import { Link, useNavigate } from "@tanstack/react-router";
import { Box } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/prep/AuthLayout";
import { Choice } from "@/features/admin/components/parts";
import {
  DobField,
  EmailPasswordFields,
  GoogleButton,
  HeardField,
  NameFields,
  OrDivider,
  StudyFields,
  type ProfileDraft,
} from "@/features/auth/components/fields";
import { StepCard } from "@/features/auth/components/StepCard";
import { VerifyEmail } from "@/features/auth/components/VerifyEmail";
import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { useSession } from "@/features/auth/session";
import { authService } from "@/features/auth/services/auth.service";
import type { Profile } from "@/features/auth/types";
import { fullName } from "@/features/auth/utils/profile";
import { checks } from "@/features/auth/utils/validate";
import { useRegisterSw } from "../hooks/mutations";

type Step = "account" | "names" | "type" | "study" | "heard";

const HERO = {
  heroTitle: "Draw it. Submit it. Get it graded.",
  heroText:
    "Do the task from each MrPrepMaster video, upload your SolidWorks files and get real feedback.",
  brand: "PrepMaster SolidWorks",
  icon: Box,
};

/**
 * /solidworks/register — new visitors get the full sign-up (plus student/freelancer);
 * signed-in PrepMaster users only answer "where did you hear about us".
 */
export function RegisterPage({ heard }: { heard?: string }) {
  const navigate = useNavigate();
  const { hydrated, user, signIn, update } = useSession();
  const { google, emailSignUp } = useAuthActions();
  const register = useRegisterSw();
  const [draft, setDraft] = useState<ProfileDraft>({ ...(heard ? { heard } : {}) });
  const [step, setStep] = useState<Step>("account");
  const [verifying, setVerifying] = useState<Profile | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const patch = (p: ProfileDraft) => setDraft((d) => ({ ...d, ...p }));

  useEffect(() => {
    if (hydrated && user?.swRegistered) navigate({ to: "/solidworks", replace: true });
  }, [hydrated, user, navigate]);

  if (!hydrated || user?.swRegistered) return null;

  /** Finalise: save the reference row, tag the user, open the dashboard. */
  const complete = (p: Profile, extra: Partial<Profile>) => {
    const merged = { ...p, ...extra, swRegistered: true };
    register.mutate(
      {
        userId: merged.id,
        name: fullName(merged),
        email: merged.email,
        userType: merged.userType ?? "student",
        ...(merged.heard ? { heard: merged.heard } : {}),
      },
      {
        onSuccess: async () => {
          if (user) {
            try {
              await update(
                extra.heard ? { heard: extra.heard, swRegistered: true } : { swRegistered: true },
              );
            } catch {
              return;
            }
          } else signIn(merged);
          navigate({ to: "/solidworks" });
        },
      },
    );
  };

  // Existing PrepMaster user: one question only.
  if (user) {
    return (
      <AuthLayout {...HERO} theme="sw" variant="solidworks">
        <StepCard
          step={0}
          total={1}
          title={`Join SolidWorks, ${user.firstName}`}
          subtitle="You already have a PrepMaster account — just one quick question."
          onNext={() => complete(user, draft.heard ? { heard: draft.heard } : {})}
          nextLabel="Complete registration"
          busy={register.isPending}
        >
          <p className="text-sm font-medium">Where did you hear about us?</p>
          <HeardField value={draft.heard} onChange={(v) => patch({ heard: v })} />
        </StepCard>
      </AuthLayout>
    );
  }

  if (verifying) {
    return (
      <AuthLayout {...HERO} theme="sw" variant="solidworks">
        <VerifyEmail
          email={verifying.email}
          onVerified={(live) => complete({ ...(live ?? verifying), emailVerified: true }, {})}
        />
      </AuthLayout>
    );
  }

  const order: Step[] = [
    "account",
    "names",
    "type",
    ...(draft.userType === "student" ? (["study"] as Step[]) : []),
    "heard",
  ];
  const i = order.indexOf(step);
  const go = (check?: (d: ProfileDraft) => string | null) => () => {
    const err = check?.(draft);
    if (err) {
      toast.error(err);
      return;
    }
    const nextStep = order[i + 1];
    if (nextStep) setStep(nextStep);
  };
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
      setStep("names");
    } catch (error) {
      toast.error((error as Error).message || "Unable to verify email availability. Please try again.");
    } finally {
      setCheckingEmail(false);
    }
  };
  const common = {
    step: i,
    total: order.length,
    ...(i > 0 ? { onBack: () => setStep(order[i - 1] as Step) } : {}),
  };

  const finishEmail = () => emailSignUp.mutate(draft, { onSuccess: (p) => setVerifying(p) });

  return (
    <AuthLayout
      {...HERO}
      theme="sw"
      variant="solidworks"
      footer={
        <>
          Already on PrepMaster?{" "}
          <Link
            to="/login"
            search={{
              redirect: heard ? `/solidworks/register?heard=${heard}` : "/solidworks/register",
            }}
            className="font-medium text-primary"
          >
            Sign in
          </Link>
        </>
      }
    >
      {step === "account" && (
        <StepCard
          {...common}
          title="Create your account"
          subtitle="One account works for SolidWorks and the PrepMaster study app."
          onNext={handleAccountNext}
          busy={checkingEmail}
        >
          <GoogleButton
            label="Sign up with Google"
            onClick={() =>
              google.mutate(undefined, {
                onSuccess: () =>
                  navigate({ to: "/solidworks/register", search: heard ? { heard } : {} }),
              })
            }
          />
          <OrDivider />
          <EmailPasswordFields value={draft} onChange={patch} />
        </StepCard>
      )}
      {step === "names" && (
        <StepCard {...common} title="About you" onNext={go(checks.names)}>
          <NameFields value={draft} onChange={patch} />
          <DobField value={draft} onChange={patch} />
        </StepCard>
      )}
      {step === "type" && (
        <StepCard
          {...common}
          title="Are you a student or a freelancer?"
          onNext={go(checks.userType)}
        >
          <Choice
            value={draft.userType ?? ""}
            onChange={(v) => patch({ userType: v as "student" | "freelancer" })}
            options={[
              { value: "student", label: "Student", hint: "I'm in school or university" },
              { value: "freelancer", label: "Freelancer", hint: "I work or learn on my own" },
            ]}
          />
        </StepCard>
      )}
      {step === "study" && (
        <StepCard {...common} title="Your studies" onNext={go(checks.study)}>
          <StudyFields value={draft} onChange={patch} />
        </StepCard>
      )}
      {step === "heard" && (
        <StepCard
          {...common}
          title="Where did you hear about us?"
          subtitle={heard ? "We filled this in from your link — change it if needed." : "Optional."}
          onNext={finishEmail}
          nextLabel="Create account"
          busy={emailSignUp.isPending}
        >
          <HeardField value={draft.heard} onChange={(v) => patch({ heard: v })} />
        </StepCard>
      )}
    </AuthLayout>
  );
}
