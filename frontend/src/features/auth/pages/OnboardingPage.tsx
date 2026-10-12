import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/prep/AuthLayout";
import {
  DobField,
  HeardField,
  NameFields,
  StudyFields,
  type ProfileDraft,
} from "../components/fields";
import { StepCard } from "../components/StepCard";
import { useSession } from "../session";
import { isMainProfileComplete } from "../utils/profile";
import { checks } from "../utils/validate";

type StepKey = "names" | "study" | "heard";

/**
 * "Finish setting up your account" — required before the main dashboard.
 * Only asks what's missing (e.g. after Google sign-up, or a SolidWorks-only freelancer).
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const { hydrated, user, update, signOut } = useSession();
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [i, setI] = useState(0);

  // Decide steps once, from what the user had when they arrived.
  const steps = useMemo<StepKey[]>(() => {
    if (!user) return [];
    const s: StepKey[] = [];
    if (!user.firstName || !user.lastName) s.push("names");
    if (!user.faculty || !user.course || !user.level) s.push("study");
    if (!user.heard) s.push("heard");
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (isMainProfileComplete(user) && steps.length === 0)
      navigate({ to: "/", replace: true });
  }, [hydrated, user, steps.length, navigate]);

  useEffect(() => {
    if (user) setDraft({ ...user });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!hydrated || !user || steps.length === 0) return null;

  const patch = (p: ProfileDraft) => setDraft((d) => ({ ...d, ...p }));
  const key = steps[i];
  const last = i === steps.length - 1;

  const advance = (check?: (d: ProfileDraft) => string | null) => () => {
    const err = check?.(draft);
    if (err) {
      toast.error(err);
      return;
    }
    if (!last) {
      setI(i + 1);
      return;
    }
    const { password: _pw, ...profile } = draft;
    update(profile);
    toast.success("You're all set", { description: "Your account setup is complete." });
    navigate({ to: "/" });
  };

  const common = {
    step: i,
    total: steps.length,
    ...(i > 0 ? { onBack: () => setI(i - 1) } : {}),
    nextLabel: last ? "Finish setup" : "Continue",
  };

  return (
    <AuthLayout
      heroTitle="Almost there."
      heroText="A few details and your dashboard is ready. You can't skip this — it helps us show you the right materials."
      footer={
        <button
          className="text-text-muted hover:text-foreground"
          onClick={() => {
            signOut();
            navigate({ to: "/login" });
          }}
        >
          Not you? Sign out
        </button>
      }
    >
      <p className="mb-5 rounded-md border border-border bg-surface-subtle px-3 py-2 text-xs text-text-secondary">
        Signed in as <span className="font-medium text-foreground">{user.email}</span>. Finish
        setting up your account to continue.
      </p>
      {key === "names" && (
        <StepCard {...common} title="About you" onNext={advance(checks.names)}>
          <NameFields value={draft} onChange={patch} />
          <DobField value={draft} onChange={patch} />
        </StepCard>
      )}
      {key === "study" && (
        <StepCard
          {...common}
          title="Your studies"
          subtitle="PrepMaster is organised by faculty and department."
          onNext={advance(checks.study)}
        >
          <StudyFields value={draft} onChange={patch} />
        </StepCard>
      )}
      {key === "heard" && (
        <StepCard
          {...common}
          title="Where did you hear about us?"
          subtitle="Optional."
          onNext={advance()}
          aside={
            <Button type="button" variant="ghost" onClick={advance()}>
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
